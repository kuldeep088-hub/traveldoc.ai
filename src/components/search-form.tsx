"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Stethoscope, Globe, Search } from "lucide-react";
import { SPECIALTIES, LANGUAGES } from "@/lib/types";

export function SearchForm({ inline = false }: { inline?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    const params = new URLSearchParams({ city: city.trim() });
    if (specialty) params.set("specialty", specialty);
    if (language) params.set("language", language);
    router.push(`/search?${params.toString()}`);
  }

  if (inline) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City (e.g. Istanbul)"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All specialties</option>
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 border border-white/20"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* City */}
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
            City
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Istanbul, Paris, Dubai"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
            Specialty
          </label>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
            >
              <option value="">Any specialty</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
            Language
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
            >
              <option value="">Any language</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 transition-colors text-base shadow-md"
      >
        <Search className="w-5 h-5" />
        Find Doctors
      </button>
    </form>
  );
}
