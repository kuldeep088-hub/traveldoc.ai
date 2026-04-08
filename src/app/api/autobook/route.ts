import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { Doctor } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

async function getNearbyDoctors(lat: number, lng: number): Promise<(Doctor & { distance_km: number })[]> {
  const query = `[out:json][timeout:25];(node["amenity"~"^(doctors|clinic|hospital|health_centre)$"](around:10000,${lat},${lng});way["amenity"~"^(doctors|clinic|hospital|health_centre)$"](around:10000,${lat},${lng});node["healthcare"](around:10000,${lat},${lng}););out center;`;
  const body = new URLSearchParams({ data: query }).toString();

  let elements: OSMElement[] = [];

  try {
    elements = await Promise.any(
      OVERPASS_ENDPOINTS.map((ep) =>
        fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        })
          .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
          .then((d) => { const els = d.elements ?? []; if (!els.length) throw new Error("empty"); return els; })
      )
    );
  } catch {
    // Nominatim fallback via reverse geocode
    try {
      const rev = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "User-Agent": "TravelDocAI/1.0" }, cache: "no-store", signal: AbortSignal.timeout(8000) }
      );
      if (rev.ok) {
        const revData = await rev.json();
        const city = revData.address?.city || revData.address?.town || revData.address?.village || "";
        if (city) {
          for (const amenity of ["clinic", "hospital", "doctors"]) {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/search?amenity=${amenity}&city=${encodeURIComponent(city)}&format=json&limit=8`,
              { headers: { "User-Agent": "TravelDocAI/1.0" }, cache: "no-store", signal: AbortSignal.timeout(8000) }
            );
            if (r.ok) {
              const items = await r.json();
              for (const item of items) {
                elements.push({
                  type: "node",
                  id: parseInt(item.osm_id ?? "0"),
                  lat: parseFloat(item.lat),
                  lon: parseFloat(item.lon),
                  tags: {
                    name: item.display_name?.split(",")[0] ?? "Medical Facility",
                    amenity,
                    "addr:full": item.display_name ?? "",
                  },
                });
              }
            }
          }
        }
      }
    } catch { /* give up */ }
  }

  return elements
    .map((el) => {
      const tags = el.tags ?? {};
      const elLat = el.lat ?? el.center?.lat ?? null;
      const elLng = el.lon ?? el.center?.lon ?? null;
      const osmId = `${el.type[0]}${el.id}`;
      const distance_km = elLat != null && elLng != null ? haversineKm(lat, lng, elLat, elLng) : 999;

      return {
        id: osmId,
        google_place_id: osmId,
        name: tags.name || tags["name:en"] || "Medical Facility",
        specialty: tags["healthcare:speciality"] ? [tags["healthcare:speciality"]] : tags.amenity === "hospital" ? ["Hospital"] : ["General Practitioner"],
        address: tags["addr:full"] || [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || "",
        city: tags["addr:city"] || "",
        phone: tags.phone || tags["contact:phone"] || null,
        website: tags.website || tags["contact:website"] || null,
        rating: null,
        reviews_count: null,
        languages: [],
        photo_url: null,
        lat: elLat ?? null,
        lng: elLng ?? null,
        distance_km,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Doctor & { distance_km: number };
    })
    .filter((d, i, arr) => arr.findIndex((x) => x.name === d.name && x.address === d.address) === i)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 10);
}

function generateSlots(): { date: string; time: string }[] {
  const now = new Date();
  const slots: { date: string; time: string }[] = [];

  const pad = (n: number) => n.toString().padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = fmt(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = fmt(tomorrow);

  // Today: if before 2pm, add a slot today at current hour + 3 (rounded up)
  if (now.getHours() < 14) {
    const slotHour = Math.min(16, Math.max(9, now.getHours() + 3));
    slots.push({ date: todayStr, time: `${pad(slotHour)}:00` });
  }

  // Always add tomorrow morning + afternoon
  slots.push({ date: tomorrowStr, time: "09:00" });
  slots.push({ date: tomorrowStr, time: "11:00" });
  slots.push({ date: tomorrowStr, time: "14:00" });

  return slots.slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, specialty, symptoms } = body;

    if (!lat || !lng) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }

    const doctors = await getNearbyDoctors(parseFloat(lat), parseFloat(lng));

    if (doctors.length === 0) {
      return NextResponse.json({ error: "No doctors found near your location" }, { status: 404 });
    }

    // Ask Groq to pick the single best doctor
    const doctorList = doctors
      .slice(0, 8)
      .map(
        (d, i) =>
          `${i + 1}. ${d.name} | ${d.specialty.join(", ")} | ${d.distance_km} km away${d.phone ? ` | Phone: ${d.phone}` : ""}${d.rating ? ` | Rating: ${d.rating}/5` : ""}`
      )
      .join("\n");

    let bestDoctor = doctors[0];
    let aiReason = `Nearest available ${specialty || "general"} facility, ${doctors[0].distance_km} km from your location.`;

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `A traveler needs a doctor urgently. Symptoms: "${symptoms || "general medical need"}". Specialty needed: "${specialty || "General Practitioner"}".

Nearby doctors:
${doctorList}

Pick the single BEST doctor for this person (consider specialty match, distance, contact availability). Reply ONLY with JSON:
{"best_index": 0, "reason": "One clear sentence why this is the best choice"}

best_index is 0-based array index.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 120,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
      const idx = typeof parsed.best_index === "number" ? parsed.best_index : 0;
      if (doctors[idx]) {
        bestDoctor = doctors[idx];
        aiReason = parsed.reason ?? aiReason;
      }
    } catch {
      // Keep the nearest doctor as fallback
    }

    return NextResponse.json({
      best_doctor: bestDoctor,
      suggested_slots: generateSlots(),
      ai_reason: aiReason,
    });
  } catch (err) {
    console.error("Autobook error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
