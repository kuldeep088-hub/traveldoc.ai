import { DoctorCard } from "@/components/doctor-card";
import { Doctor } from "@/lib/types";
import { Brain } from "lucide-react";
import Link from "next/link";

interface SearchResultsProps {
  city: string;
  specialty: string;
  language: string;
}

async function fetchDoctors(city: string, specialty: string, language: string): Promise<Doctor[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({ city });
  if (specialty) params.set("specialty", specialty);
  if (language) params.set("language", language);

  const res = await fetch(`${base}/api/doctors/search?${params.toString()}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.doctors ?? [];
}

export async function SearchResults({ city, specialty, language }: SearchResultsProps) {
  const doctors = await fetchDoctors(city, specialty, language);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {specialty ? `${specialty} doctors` : "Doctors"} in{" "}
            <span className="text-brand-600">{city}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {doctors.length} results found
            {language ? ` · ${language} speakers` : ""}
          </p>
        </div>

        <Link
          href={`/recommend?city=${encodeURIComponent(city)}${specialty ? `&specialty=${encodeURIComponent(specialty)}` : ""}`}
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
        >
          <Brain className="w-4 h-4" />
          Get AI recommendation
        </Link>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No results found</p>
          <p className="text-sm mb-1">The map data server may be busy. Please try again in a few seconds.</p>
          <p className="text-sm">Or try a different city name (e.g. &quot;Istanbul&quot;, &quot;London&quot;, &quot;Dubai&quot;)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.google_place_id} doctor={doctor} />
          ))}
        </div>
      )}
    </div>
  );
}
