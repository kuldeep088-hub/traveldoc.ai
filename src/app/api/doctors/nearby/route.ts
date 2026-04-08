import { NextRequest, NextResponse } from "next/server";
import { Doctor } from "@/lib/types";

interface OSMElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
}

async function queryOverpass(lat: number, lng: number): Promise<OSMElement[]> {
  const query = `[out:json][timeout:25];(node["amenity"~"^(doctors|clinic|hospital|health_centre)$"](around:10000,${lat},${lng});way["amenity"~"^(doctors|clinic|hospital|health_centre)$"](around:10000,${lat},${lng});node["healthcare"](around:10000,${lat},${lng});way["healthcare"](around:10000,${lat},${lng}););out center;`;
  const body = new URLSearchParams({ data: query }).toString();

  const mirrorRace = OVERPASS_ENDPOINTS.map((endpoint) =>
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(22000),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const elements: OSMElement[] = data.elements ?? [];
        if (elements.length === 0) throw new Error("empty");
        return elements;
      })
  );

  try {
    return await Promise.any(mirrorRace);
  } catch {
    return [];
  }
}

async function queryNominatimByCoords(lat: number, lng: number): Promise<OSMElement[]> {
  const results: OSMElement[] = [];
  const amenities = ["clinic", "hospital", "doctors"];

  // Reverse geocode to get city first
  let city = "";
  try {
    const rev = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "TravelDocAI/1.0" }, cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (rev.ok) {
      const data = await rev.json();
      city =
        data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
    }
  } catch { /* use empty city */ }

  if (!city) return [];

  await Promise.allSettled(
    amenities.map(async (amenity) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?amenity=${amenity}&city=${encodeURIComponent(city)}&format=json&limit=10`;
        const res = await fetch(url, {
          headers: { "User-Agent": "TravelDocAI/1.0" },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return;
        const data = await res.json();
        for (const item of data) {
          results.push({
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
      } catch { /* skip */ }
    })
  );

  return results;
}

function elementToDoctor(el: OSMElement, specialty: string, userLat: number, userLng: number): Doctor & { distance_km: number } {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;

  const houseNo = tags["addr:housenumber"] ?? "";
  const street = tags["addr:street"] ?? "";
  const addrCity = tags["addr:city"] ?? "";
  const address =
    tags["addr:full"] ||
    [houseNo, street].filter(Boolean).join(" ") + (street ? `, ${addrCity}` : addrCity);

  const osmSpecialty = tags["healthcare:speciality"] || null;
  const specialties = specialty
    ? [specialty]
    : osmSpecialty
    ? [osmSpecialty]
    : tags.amenity === "hospital"
    ? ["Hospital"]
    : ["General Practitioner"];

  const osmId = `${el.type[0]}${el.id}`;
  const distance_km = lat != null && lng != null ? haversineKm(userLat, userLng, lat, lng) : 999;

  return {
    id: osmId,
    google_place_id: osmId,
    name: tags.name || tags["name:en"] || "Medical Facility",
    specialty: specialties,
    address,
    city: addrCity,
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || null,
    rating: null,
    reviews_count: null,
    languages: [],
    photo_url: null,
    lat: lat ?? null,
    lng: lng ?? null,
    distance_km,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");
  const specialty = searchParams.get("specialty") ?? "";

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  let elements = await queryOverpass(lat, lng);

  if (elements.length === 0) {
    elements = await queryNominatimByCoords(lat, lng);
  }

  let doctors = elements.map((el) => elementToDoctor(el, specialty, lat, lng));

  // Deduplicate by name + address
  const seen = new Set<string>();
  doctors = doctors.filter((d) => {
    const key = `${d.name}|${d.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by distance
  doctors.sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));

  return NextResponse.json({ doctors: doctors.slice(0, 20), total: doctors.length });
}
