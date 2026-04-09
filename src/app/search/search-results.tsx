"use client";

import { useState, useEffect, useRef } from "react";
import { DoctorCard } from "@/components/doctor-card";
import { Doctor } from "@/lib/types";
import { Brain, Map, List, Loader2, Navigation, MapPin } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/components/map-view").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="w-full h-96 bg-gray-100 rounded-2xl animate-pulse" /> }
);

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

function addDistancesAndSort(
  docs: Doctor[],
  lat: number,
  lng: number
): Doctor[] {
  return docs
    .map((d) => ({
      ...d,
      distance_km:
        d.lat != null && d.lng != null
          ? haversineKm(lat, lng, d.lat, d.lng)
          : undefined,
    }))
    .sort((a, b) => {
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
}

interface SearchResultsProps {
  city: string;
  specialty: string;
  language: string;
}

export function SearchResults({ city, specialty, language }: SearchResultsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [locationLoading, setLocationLoading] = useState(false);
  const [sortedByDistance, setSortedByDistance] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Keep coords in a ref so we can use them in the fetch callback without stale closure
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    setSortedByDistance(false);
    setLocationError(false);

    const params = new URLSearchParams({ city });
    if (specialty) params.set("specialty", specialty);
    if (language) params.set("language", language);

    fetch(`/api/doctors/search?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        let fetched: Doctor[] = d.doctors ?? [];
        // If we already have coords from a prior search, apply distances immediately
        if (coordsRef.current && fetched.length > 0) {
          fetched = addDistancesAndSort(fetched, coordsRef.current.lat, coordsRef.current.lng);
          setSortedByDistance(true);
        }
        setDoctors(fetched);
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [city, specialty, language]);

  function requestLocation() {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    setLocationError(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        coordsRef.current = coords;

        setDoctors((prev) => {
          if (!prev.length) return prev;
          return addDistancesAndSort(prev, coords.lat, coords.lng);
        });
        setSortedByDistance(true);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setLocationError(true);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

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
      {/* Header — two rows so controls never overflow on mobile */}
      <div className="mb-4 space-y-3">

        {/* Row 1: title + meta */}
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
            {specialty ? `${specialty} doctors` : "Doctors"} in{" "}
            <span className="text-brand-600">{city}</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-sm text-gray-500">
              {doctors.length} results
              {language ? ` · ${language}` : ""}
            </p>
            {sortedByDistance && (
              <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                <Navigation className="w-3 h-3" />
                Sorted by nearest
              </span>
            )}
            {locationError && (
              <span className="text-xs text-red-500">Location denied</span>
            )}
          </div>
        </div>

        {/* Row 2: action controls — all visible on every screen size */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Sort by nearest */}
          {!sortedByDistance && (
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-2 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-60"
            >
              {locationLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <MapPin className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline sm:inline">
                {locationLoading ? "Locating..." : "Sort by nearest"}
              </span>
              <span className="xs:hidden sm:hidden">
                {locationLoading ? "..." : "Nearest"}
              </span>
            </button>
          )}

          {/* List / Map toggle — visible on all sizes, icon-only on mobile */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === "list" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === "map" ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>

          {/* AI recommendation — icon-only on mobile, full label on desktop */}
          <Link
            href={`/recommend?city=${encodeURIComponent(city)}${specialty ? `&specialty=${encodeURIComponent(specialty)}` : ""}`}
            className="flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
          >
            <Brain className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">AI recommendation</span>
          </Link>
        </div>
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No results found</p>
          <p className="text-sm mb-1">
            The map data server may be busy. Please try again in a few seconds.
          </p>
          <p className="text-sm">
            Or try a different city name (e.g. &quot;Istanbul&quot;, &quot;London&quot;,
            &quot;Dubai&quot;)
          </p>
        </div>
      ) : view === "map" ? (
        <MapView doctors={doctors} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.google_place_id}
              doctor={doctor}
              distanceKm={doctor.distance_km}
            />
          ))}
        </div>
      )}
    </div>
  );
}
