"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Stethoscope, Globe, Search, Clock, X, LocateFixed, Loader2 } from "lucide-react";
import { SPECIALTIES, LANGUAGES } from "@/lib/types";

const HISTORY_KEY = "traveldoc_search_history";
const MAX_HISTORY = 5;

interface HistoryItem {
  city: string;
  specialty: string;
}

function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(city: string, specialty: string) {
  const history = getHistory().filter((h) => h.city !== city || h.specialty !== specialty);
  history.unshift({ city, specialty });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function SearchForm({ inline = false }: { inline?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const detectedCity =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "";
          if (detectedCity) {
            setCity(detectedCity);
          } else {
            setLocError("Could not detect city from your location.");
          }
        } catch {
          setLocError("Failed to reverse geocode location.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("Location permission denied. Please allow access and try again.");
        } else {
          setLocError("Unable to retrieve your location.");
        }
      },
      { timeout: 10000 }
    );
  }

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!city.trim()) return;
    saveHistory(city.trim(), specialty);
    setHistory(getHistory());
    setShowHistory(false);
    const params = new URLSearchParams({ city: city.trim() });
    if (specialty) params.set("specialty", specialty);
    if (language) params.set("language", language);
    router.push(`/search?${params.toString()}`);
  }

  function applyHistory(item: HistoryItem) {
    setCity(item.city);
    setSpecialty(item.specialty);
    setShowHistory(false);
  }

  if (inline) {
    return (
      <div className="flex flex-col gap-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Row 1: city input (full width) */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              placeholder="City (e.g. Istanbul, Delhi, Dubai)"
              className="w-full pl-9 pr-28 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              title="Use my current location"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 px-1 py-0.5"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">My location</span>
            </button>
            {showHistory && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {history.map((item, i) => (
                  <button key={i} type="button" onMouseDown={() => applyHistory(item)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left text-sm text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{item.city}{item.specialty ? ` · ${item.specialty}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: specialty + search button side by side */}
          <div className="flex gap-2">
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
              <option value="">All specialties</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="submit"
              className="flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-colors text-sm flex-shrink-0">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </form>
        {locError && <p className="text-xs text-red-600 px-1">{locError}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 border border-white/20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* City with history */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5 ml-1">
            <label className="block text-xs font-medium text-gray-500">City</label>
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors"
            >
              {locating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <LocateFixed className="w-3 h-3" />}
              Use my location
            </button>
          </div>
          {locError && <p className="text-xs text-red-500 mb-1 ml-1">{locError}</p>}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              placeholder="e.g. Istanbul, Paris, Dubai"
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
            {showHistory && history.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-400">Recent searches</span>
                  <button type="button" onMouseDown={() => { clearHistory(); setHistory([]); }}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> Clear
                  </button>
                </div>
                {history.map((item, i) => (
                  <button key={i} type="button" onMouseDown={() => applyHistory(item)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 text-left text-sm text-gray-700">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{item.city}{item.specialty ? ` · ${item.specialty}` : ""}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Specialty */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Specialty</label>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white">
              <option value="">Any specialty</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">Language</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white">
              <option value="">Any language</option>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button type="submit"
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-700 transition-colors text-base shadow-md">
        <Search className="w-5 h-5" />
        Find Doctors
      </button>
    </form>
  );
}
