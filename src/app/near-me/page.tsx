"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { DoctorCard, DoctorCardSkeleton } from "@/components/doctor-card";
import { Doctor } from "@/lib/types";
import {
  LocateFixed, Navigation, AlertCircle, Loader2,
  MapPin, RefreshCw,
} from "lucide-react";

export default function NearMePage() {
  const geo = useGeolocation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [specialty, setSpecialty] = useState("");

  const specialties = [
    "", "General Practitioner", "Dentist", "Cardiologist", "Dermatologist",
    "Pediatrician", "Gynecologist", "Orthopedist", "ENT Specialist",
  ];

  // Auto-fetch when coords arrive
  useEffect(() => {
    if (geo.coords && fetchState === "loading") {
      doFetch(geo.coords.lat, geo.coords.lng);
    }
  }, [geo.coords, fetchState]);

  useEffect(() => {
    if (geo.error && fetchState === "loading") {
      setFetchState("error");
      setErrorMsg(geo.error);
    }
  }, [geo.error, fetchState]);

  function handleFind() {
    setFetchState("loading");
    if (geo.coords) {
      doFetch(geo.coords.lat, geo.coords.lng);
    } else {
      geo.request();
    }
  }

  async function doFetch(lat: number, lng: number) {
    try {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      if (specialty) params.set("specialty", specialty);
      const res = await fetch(`/api/doctors/nearby?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDoctors(data.doctors ?? []);
      setFetchState("done");
    } catch (e: unknown) {
      setFetchState("error");
      setErrorMsg(e instanceof Error ? e.message : "Could not load doctors.");
    }
  }

  function handleRetry() {
    setFetchState("idle");
    setDoctors([]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Best Doctor Near Me</h1>
              <p className="text-sm text-gray-500">Auto-detect location · Find closest doctors · Sort by distance</p>
            </div>
          </div>

          {geo.city && (
            <div className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-3 py-1 mt-3 w-fit">
              <MapPin className="w-3 h-3" />
              Detected: {geo.city}
            </div>
          )}

          {/* Specialty filter */}
          <div className="flex gap-2 mt-4">
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>{s || "Any specialty"}</option>
              ))}
            </select>
            <button
              onClick={handleFind}
              disabled={fetchState === "loading"}
              className="flex items-center gap-2 bg-teal-600 text-white font-semibold px-5 py-2 rounded-xl hover:bg-teal-700 disabled:opacity-60 transition-colors text-sm flex-shrink-0"
            >
              {fetchState === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LocateFixed className="w-4 h-4" />
              )}
              {geo.coords && fetchState !== "loading" ? "Refresh" : "Find Near Me"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

        {/* Idle state */}
        {fetchState === "idle" && (
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-teal-100 flex items-center justify-center mb-5">
              <LocateFixed className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Find Doctors Near You</h2>
            <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
              Allow location access and we&apos;ll instantly find the closest doctors and clinics — sorted by distance.
            </p>
            <button
              onClick={handleFind}
              className="flex items-center gap-2 bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors"
            >
              <LocateFixed className="w-4 h-4" />
              Allow Location & Find Doctors
            </button>
          </div>
        )}

        {/* Loading */}
        {fetchState === "loading" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-teal-600 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {geo.loading ? "Getting your location..." : "Searching nearby doctors..."}
            </div>
            {[1, 2, 3].map((i) => <DoctorCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {fetchState === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-red-700 mb-1">Could not find nearby doctors</p>
            <p className="text-xs text-red-500 mb-4">{errorMsg}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {fetchState === "done" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                {doctors.length > 0 ? `${doctors.length} doctors found nearby` : "No doctors found"}
                {geo.city && <span className="text-gray-400 font-normal"> in {geo.city}</span>}
              </p>
              <button onClick={handleRetry} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal-600 transition-colors">
                <RefreshCw className="w-3 h-3" />
                New search
              </button>
            </div>

            {doctors.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">No doctors found in your area. Try a different specialty or check your connection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.google_place_id}
                    doctor={doctor}
                    distanceKm={doctor.distance_km}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
