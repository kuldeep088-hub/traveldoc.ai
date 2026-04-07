import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Globe,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Clock,
} from "lucide-react";

interface PlaceDetail {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
}

async function fetchOSMDetail(osmId: string): Promise<PlaceDetail | null> {
  const type = osmId.startsWith("w") ? "way" : "node";
  const id = osmId.slice(1);
  const query = `[out:json];${type}(${id});out;`;
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    const el = data.elements?.[0];
    if (!el) return null;
    const tags = el.tags ?? {};
    const houseNo = tags["addr:housenumber"] ?? "";
    const street = tags["addr:street"] ?? "";
    const addrCity = tags["addr:city"] ?? "";
    const address =
      tags["addr:full"] ||
      [houseNo, street].filter(Boolean).join(" ") +
        (street && addrCity ? `, ${addrCity}` : addrCity);
    return {
      id: osmId,
      name: tags.name || tags["name:en"] || "Medical Facility",
      address,
      phone: tags.phone || tags["contact:phone"] || null,
      website: tags.website || tags["contact:website"] || null,
      openingHours: tags.opening_hours || null,
    };
  } catch {
    return null;
  }
}

interface DoctorPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    name?: string;
    address?: string;
    phone?: string;
    website?: string;
  }>;
}

export default async function DoctorPage({ params, searchParams }: DoctorPageProps) {
  const { id } = await params;
  const sp = await searchParams;

  // Use URL params if available (instant), otherwise fetch from Overpass
  let place: PlaceDetail | null = null;

  if (sp.name) {
    place = {
      id,
      name: sp.name,
      address: sp.address ?? "",
      phone: sp.phone || null,
      website: sp.website || null,
      openingHours: null,
    };
  } else {
    place = await fetchOSMDetail(id);
  }

  if (!place) notFound();

  const initials = place.name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  let websiteHostname: string | null = null;
  try {
    if (place.website) websiteHostname = new URL(place.website).hostname;
  } catch {
    websiteHostname = place.website;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to results
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
              <p className="text-sm text-gray-400 mt-1">Medical Facility</p>
            </div>
          </div>

          {/* Contact details */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {place.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                {place.address}
              </div>
            )}
            {place.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a href={`tel:${place.phone}`} className="hover:text-brand-600">
                  {place.phone}
                </a>
              </div>
            )}
            {place.website && websiteHostname && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600 flex items-center gap-1 truncate"
                >
                  {websiteHostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            {place.openingHours && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                {place.openingHours}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/appointments/new?doctor=${id}&name=${encodeURIComponent(place.name)}`}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </Link>
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Data source note */}
      <div className="text-center text-xs text-gray-400">
        Data sourced from{" "}
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-brand-600 underline"
        >
          OpenStreetMap
        </a>{" "}
        contributors
      </div>
    </div>
  );
}
