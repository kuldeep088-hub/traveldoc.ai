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

// Multiple Overpass mirrors — tries each until one succeeds
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// Race multiple geocoders simultaneously — fastest valid response wins
async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  type Coords = { lat: number; lng: number };

  const nominatim = fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
    { headers: { "User-Agent": "TravelDocAI/1.0" }, cache: "no-store", signal: AbortSignal.timeout(15000) }
  ).then(async (r) => {
    const d = await r.json();
    if (!d.length) throw new Error("no result");
    return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) } as Coords;
  });

  const photon = fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(city)}&limit=1`,
    { cache: "no-store", signal: AbortSignal.timeout(15000) }
  ).then(async (r) => {
    const d = await r.json();
    const c = d.features?.[0]?.geometry?.coordinates;
    if (!c) throw new Error("no result");
    return { lat: c[1], lng: c[0] } as Coords; // Photon returns [lon, lat]
  });

  try {
    // First geocoder to succeed wins
    return await Promise.any([nominatim, photon]);
  } catch {
    console.error("[geocode] all geocoders failed for:", city);
    return null;
  }
}

async function queryOverpass(lat: number, lng: number): Promise<OSMElement[]> {
  const query = `[out:json][timeout:25];(node["amenity"~"^(doctors|clinic|hospital|health_centre)$"](around:10000,${lat},${lng});way["amenity"~"^(doctors|clinic|hospital|health_centre)$"](around:10000,${lat},${lng});node["healthcare"](around:10000,${lat},${lng});way["healthcare"](around:10000,${lat},${lng}););out center;`;
  const body = new URLSearchParams({ data: query }).toString();

  // Race ALL mirrors simultaneously — fastest valid response wins
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
    console.log("[overpass] all mirrors failed");
    return [];
  }
}

// Fallback: Nominatim amenity search when Overpass is unavailable
async function queryNominatim(city: string): Promise<OSMElement[]> {
  const amenities = ["clinic", "hospital", "doctors"];
  const results: OSMElement[] = [];

  await Promise.allSettled(
    amenities.map(async (amenity) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?amenity=${amenity}&city=${encodeURIComponent(city)}&format=json&limit=10&addressdetails=1`;
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

  // Also try Photon as secondary fallback
  if (results.length === 0) {
    try {
      const url = `https://photon.komoot.io/api/?q=hospital+clinic+${encodeURIComponent(city)}&limit=20`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const data = await res.json();
        for (const f of data.features ?? []) {
          if (!f.properties?.name) continue;
          results.push({
            type: "node",
            id: 0,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            tags: {
              name: f.properties.name,
              amenity: f.properties.type ?? "clinic",
              "addr:full": [f.properties.street, f.properties.city].filter(Boolean).join(", "),
              phone: f.properties.phone ?? "",
              website: f.properties.website ?? "",
            },
          });
        }
      }
    } catch { /* skip */ }
  }

  console.log(`[nominatim-fallback] found ${results.length} places for ${city}`);
  return results;
}

function elementToDoctor(el: OSMElement, city: string, specialty: string): Doctor {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;

  const houseNo = tags["addr:housenumber"] ?? "";
  const street = tags["addr:street"] ?? "";
  const addrCity = tags["addr:city"] ?? city;
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

  return {
    id: osmId,
    google_place_id: osmId,
    name: tags.name || tags["name:en"] || "Medical Facility",
    specialty: specialties,
    address,
    city,
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || null,
    rating: null,
    reviews_count: null,
    languages: [],
    photo_url: null,
    lat: lat ?? null,
    lng: lng ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get("city");
  const specialty = searchParams.get("specialty") ?? "";
  const language = searchParams.get("language") ?? "";

  if (!city) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  const coords = await geocodeCity(city);
  if (!coords) {
    return NextResponse.json(
      { error: "City not found. Try a different city name.", doctors: [], total: 0 },
      { status: 404 }
    );
  }

  let elements = await queryOverpass(coords.lat, coords.lng);

  // Fallback to Nominatim when all Overpass mirrors are unreachable
  if (elements.length === 0) {
    console.log("[search] Overpass returned 0 results, trying Nominatim fallback...");
    elements = await queryNominatim(city);
  }

  let doctors: Doctor[] = elements
    .map((el) => elementToDoctor(el, city, specialty));

  // Deduplicate by name + address (use coords as tiebreaker when address is empty)
  const seen = new Set<string>();
  doctors = doctors.filter((d) => {
    const key = d.address
      ? `${d.name}|${d.address}`
      : `${d.name}|${d.lat}|${d.lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (language) {
    doctors = doctors.map((d) => ({ ...d, languages: [language] }));
  }

  return NextResponse.json({ doctors: doctors.slice(0, 20), total: doctors.length });
}
