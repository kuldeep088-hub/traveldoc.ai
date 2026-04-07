import { NextRequest, NextResponse } from "next/server";
import { Doctor } from "@/lib/types";

const PLACES_NEW_API = "https://places.googleapis.com/v1/places:searchText";

interface NewPlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  photos?: { name: string }[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: { openNow?: boolean };
}

function buildPhotoUrl(photoName: string, apiKey: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}`;
}

function mapPlaceToDoctor(place: NewPlaceResult, city: string, specialty: string): Doctor {
  return {
    id: place.id,
    google_place_id: place.id,
    name: place.displayName?.text ?? "Unknown",
    specialty: specialty ? [specialty] : ["General Practitioner"],
    address: place.formattedAddress ?? "",
    city,
    phone: place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    rating: place.rating ?? null,
    reviews_count: place.userRatingCount ?? null,
    languages: [],
    photo_url: place.photos?.[0]
      ? buildPhotoUrl(place.photos[0].name, process.env.GOOGLE_PLACES_API_KEY!)
      : null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
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

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key not configured" },
      { status: 500 }
    );
  }

  const query = specialty
    ? `${specialty} doctor in ${city}`
    : `doctor clinic in ${city}`;

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.photos",
    "places.location",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.regularOpeningHours",
  ].join(",");

  try {
    const response = await fetch(PLACES_NEW_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({ textQuery: query }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Places API error:", data);
      return NextResponse.json(
        { error: "Failed to fetch doctors", details: data.error?.message },
        { status: 502 }
      );
    }

    let doctors: Doctor[] = (data.places ?? []).map((place: NewPlaceResult) =>
      mapPlaceToDoctor(place, city, specialty)
    );

    if (language) {
      doctors = doctors.map((d) => ({ ...d, languages: [language] }));
    }

    return NextResponse.json({ doctors, total: doctors.length });
  } catch (err) {
    console.error("Places API fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
