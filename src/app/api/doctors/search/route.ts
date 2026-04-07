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
  const query = `[out:json][timeout:20];(node["amenity"~"^(doctors|clinic|hospital)$"](around:5000,${lat},${lng});way["amenity"~"^(doctors|clinic|hospital)$"](around:5000,${lat},${lng}););out center;`;
  const body = new URLSearchParams({ data: query }).toString();

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(22000), // 22s timeout per endpoint
      });
      if (!res.ok) continue; // try next mirror
      const data = await res.json();
      const elements = data.elements ?? [];
      if (elements.length >= 0) return elements; // success
    } catch {
      // endpoint failed, try next
      continue;
    }
  }

  return [];
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

  const elements = await queryOverpass(coords.lat, coords.lng);

  let doctors: Doctor[] = elements
    .filter((el) => el.tags?.name)
    .map((el) => elementToDoctor(el, city, specialty));

  // Deduplicate by name + address
  const seen = new Set<string>();
  doctors = doctors.filter((d) => {
    const key = `${d.name}|${d.address}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (language) {
    doctors = doctors.map((d) => ({ ...d, languages: [language] }));
  }

  return NextResponse.json({ doctors: doctors.slice(0, 20), total: doctors.length });
}
