import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  Calendar,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface PlaceDetail {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  reviews?: {
    authorAttribution?: { displayName: string };
    rating: number;
    text?: { text: string };
    relativePublishTimeDescription?: string;
  }[];
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
}

async function fetchPlaceDetail(placeId: string): Promise<PlaceDetail | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  const fieldMask = [
    "id",
    "displayName",
    "formattedAddress",
    "nationalPhoneNumber",
    "websiteUri",
    "rating",
    "userRatingCount",
    "photos",
    "reviews",
    "regularOpeningHours",
  ].join(",");

  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
  } as any);

  if (!res.ok) return null;
  return res.json();
}

function photoUrl(photoName: string) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= Math.round(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-200 fill-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

interface DoctorPageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorPage({ params }: DoctorPageProps) {
  const { id } = await params;
  const safePlace = await fetchPlaceDetail(id);

  if (!safePlace) notFound();

  const name = safePlace.displayName?.text ?? "Doctor";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const coverPhoto = safePlace.photos?.[0]
    ? photoUrl(safePlace.photos[0].name)
    : null;

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
        {coverPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto} alt={name} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-start gap-4">
            {!coverPhoto && (
              <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              {safePlace.rating && (
                <div className="flex items-center gap-2 mt-1">
                  <StarRow rating={safePlace.rating} />
                  <span className="font-semibold text-gray-800">
                    {safePlace.rating.toFixed(1)}
                  </span>
                  {safePlace.userRatingCount && (
                    <span className="text-sm text-gray-400">
                      ({safePlace.userRatingCount.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}
              {safePlace.regularOpeningHours?.openNow !== undefined && (
                <span
                  className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    safePlace.regularOpeningHours.openNow
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {safePlace.regularOpeningHours.openNow ? "Open now" : "Closed"}
                </span>
              )}
            </div>
          </div>

          {/* Contact details */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {safePlace.formattedAddress && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                {safePlace.formattedAddress}
              </div>
            )}
            {safePlace.nationalPhoneNumber && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a
                  href={`tel:${safePlace.nationalPhoneNumber}`}
                  className="hover:text-brand-600"
                >
                  {safePlace.nationalPhoneNumber}
                </a>
              </div>
            )}
            {safePlace.websiteUri && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a
                  href={safePlace.websiteUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-600 flex items-center gap-1 truncate"
                >
                  {new URL(safePlace.websiteUri).hostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/appointments/new?doctor=${id}&name=${encodeURIComponent(name)}`}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Book Appointment
            </Link>
            {safePlace.nationalPhoneNumber && (
              <a
                href={`tel:${safePlace.nationalPhoneNumber}`}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      {safePlace.regularOpeningHours?.weekdayDescriptions && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Opening Hours</h2>
          <div className="space-y-1.5">
            {safePlace.regularOpeningHours.weekdayDescriptions.map((line) => {
              const [day, ...rest] = line.split(": ");
              return (
                <div key={line} className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">{day}</span>
                  <span className="text-gray-500">{rest.join(": ")}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews */}
      {safePlace.reviews && safePlace.reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Patient Reviews</h2>
          <div className="space-y-4">
            {safePlace.reviews.map((review, i) => (
              <div
                key={i}
                className="pb-4 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm text-gray-800">
                    {review.authorAttribution?.displayName ?? "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {review.relativePublishTimeDescription}
                  </span>
                </div>
                <StarRow rating={review.rating} />
                {review.text?.text && (
                  <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                    {review.text.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
