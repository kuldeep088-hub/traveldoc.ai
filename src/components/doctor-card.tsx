import Link from "next/link";
import { Star, MapPin, Phone, Globe, Languages } from "lucide-react";
import { Doctor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DoctorCardProps {
  doctor: Doctor;
  rank?: number;
  aiReason?: string;
}

export function DoctorCard({ doctor, rank, aiReason }: DoctorCardProps) {
  const initials = doctor.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-brand-200 transition-all">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {rank && (
            <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center z-10">
              {rank}
            </span>
          )}
          {doctor.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doctor.photo_url}
              alt={doctor.name}
              className="w-14 h-14 rounded-xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">{doctor.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {doctor.specialty.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Rating */}
            {doctor.rating && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-gray-800">
                  {doctor.rating.toFixed(1)}
                </span>
                {doctor.reviews_count && (
                  <span className="text-xs text-gray-400">
                    ({doctor.reviews_count.toLocaleString()})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{doctor.address}</span>
            </div>
            {doctor.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{doctor.phone}</span>
              </div>
            )}
            {doctor.languages.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Languages className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{doctor.languages.join(", ")}</span>
              </div>
            )}
          </div>

          {/* AI reason */}
          {aiReason && (
            <div className="mt-2 text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
              <span className="font-medium">AI insight: </span>
              {aiReason}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
        <Link
          href={`/doctor/${doctor.google_place_id}?name=${encodeURIComponent(doctor.name)}&address=${encodeURIComponent(doctor.address)}&phone=${encodeURIComponent(doctor.phone ?? "")}&website=${encodeURIComponent(doctor.website ?? "")}`}
          className="flex-1 text-center text-sm font-medium text-brand-600 border border-brand-200 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
        >
          View Profile
        </Link>
        <Link
          href={`/appointments/new?doctor=${doctor.google_place_id}&name=${encodeURIComponent(doctor.name)}`}
          className="flex-1 text-center text-sm font-semibold text-white bg-brand-600 px-3 py-2 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-40 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-24 mb-3" />
          <div className="h-3 bg-gray-100 rounded w-full mb-1" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
        <div className="flex-1 h-9 bg-gray-100 rounded-lg" />
        <div className="flex-1 h-9 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}
