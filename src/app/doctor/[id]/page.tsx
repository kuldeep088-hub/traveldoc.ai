import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Phone, Globe, Calendar, ArrowLeft,
  ExternalLink, Clock, Navigation, MessageCircle,
  Copy, CheckCircle,
} from "lucide-react";
import CopyPhone from "./copy-phone";
import { ReviewSection } from "./review-section";

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

  const mapsUrl = place.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
    : null;

  const whatsappUrl = place.phone
    ? `https://wa.me/${place.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/search"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to results
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
            <p className="text-sm text-gray-400 mt-1">Medical Facility</p>
            {place.address && (
              <div className="flex items-start gap-1.5 text-sm text-gray-500 mt-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                {place.address}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Contact Information ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-4">Contact Information</h2>

        <div className="space-y-3">
          {/* Phone */}
          {place.phone ? (
            <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Phone</p>
                  <p className="text-sm font-semibold text-gray-800">{place.phone}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <CopyPhone phone={place.phone} />
                <a href={`tel:${place.phone}`}
                  className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                  <Phone className="w-3 h-3" /> Call
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">Phone number not available</p>
            </div>
          )}

          {/* WhatsApp */}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">WhatsApp</p>
                  <p className="text-sm font-semibold text-gray-800">{place.phone}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg group-hover:bg-emerald-200 transition-colors">
                Open Chat
              </span>
            </a>
          )}

          {/* Website */}
          {place.website ? (
            <a href={place.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Website</p>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{websiteHostname}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg group-hover:bg-blue-200 transition-colors">
                Visit <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-400">Website not available</p>
            </div>
          )}

          {/* Directions */}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Address</p>
                  <p className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{place.address || "View on map"}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-lg group-hover:bg-orange-200 transition-colors">
                Directions
              </span>
            </a>
          )}

          {/* Opening hours */}
          {place.openingHours && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Opening Hours</p>
                <p className="text-sm text-gray-700 leading-relaxed">{place.openingHours}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Book Appointment ── */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
        <h2 className="text-base font-bold text-gray-900 mb-1">Book an Appointment</h2>
        <p className="text-sm text-gray-500 mb-4">Save this appointment to your TravelDoc account.</p>
        <Link
          href={`/appointments/new?doctor=${id}&name=${encodeURIComponent(place.name)}`}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Book Appointment
        </Link>
      </div>

      {/* Reviews */}
      <ReviewSection doctorOsmId={id} />

      {/* Data source */}
      <div className="text-center text-xs text-gray-400 mt-6">
        Data sourced from{" "}
        <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer"
          className="hover:text-brand-600 underline">
          OpenStreetMap
        </a>{" "}
        contributors
      </div>
    </div>
  );
}
