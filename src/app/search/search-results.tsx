"use client";

import { useState, useEffect } from "react";
import { DoctorCard } from "@/components/doctor-card";
import { Doctor } from "@/lib/types";
import { Brain, Map, List, Loader2 } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="w-full h-96 bg-gray-100 rounded-2xl animate-pulse" /> }
);

interface SearchResultsProps {
  city: string;
  specialty: string;
  language: string;
}

export function SearchResults({ city, specialty, language }: SearchResultsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ city });
    if (specialty) params.set("specialty", specialty);
    if (language) params.set("language", language);
    fetch(`/api/doctors/search?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors ?? []))
      .finally(() => setLoading(false));
  }, [city, specialty, language]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Searching for doctors in {city}...</p>
      </div>
    );
  }

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

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === "map" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Map className="w-4 h-4" /> Map
            </button>
          </div>

          <Link
            href={`/recommend?city=${encodeURIComponent(city)}${specialty ? `&specialty=${encodeURIComponent(specialty)}` : ""}`}
            className="hidden sm:flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <Brain className="w-4 h-4" />
            AI recommendation
          </Link>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No results found</p>
          <p className="text-sm mb-1">The map data server may be busy. Please try again in a few seconds.</p>
          <p className="text-sm">Or try a different city name (e.g. &quot;Istanbul&quot;, &quot;London&quot;, &quot;Dubai&quot;)</p>
        </div>
      ) : view === "map" ? (
        <MapView doctors={doctors} />
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
