"use client";

import { useState } from "react";
import {
  Pill, Search, Copy, Check, Volume2, AlertTriangle,
  Info, Thermometer, ArrowRight, Loader2, MapPin, RefreshCw,
  ShieldCheck, ShieldAlert, Package,
} from "lucide-react";

const COUNTRIES = [
  "Afghanistan", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium",
  "Brazil", "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia",
  "Czech Republic", "Denmark", "Egypt", "Finland", "France", "Germany", "Ghana",
  "Greece", "Hungary", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Japan", "Jordan", "Kenya", "Malaysia", "Mexico", "Morocco",
  "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru",
  "Philippines", "Poland", "Portugal", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden",
  "Switzerland", "Taiwan", "Tanzania", "Thailand", "Turkey", "UAE",
  "Ukraine", "United Kingdom", "United States", "Vietnam", "Zimbabwe",
];

const QUICK_MEDS = [
  "Ibuprofen", "Paracetamol", "Amoxicillin", "Metformin",
  "Aspirin", "Omeprazole", "Lisinopril", "Atorvastatin",
  "Ciprofloxacin", "Cetirizine",
];

interface PharmacyPhrase {
  english: string;
  local: string;
  transliteration: string | null;
  language: string;
}

interface Alternative {
  name: string;
  note: string;
}

interface MedResult {
  generic_name: string;
  brand_names: string[];
  prescription_required: boolean;
  otc_available: boolean;
  approximate_price: string;
  pharmacy_phrase: PharmacyPhrase;
  alternatives: Alternative[];
  warnings: string[];
  storage_tip: string | null;
  found: boolean;
  availability_note: string;
}

function speak(text: string, lang: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  window.speechSynthesis.speak(utt);
}

export default function MedicationPage() {
  const [medication, setMedication] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedResult | null>(null);
  const [error, setError] = useState("");
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);

  async function handleSearch(med?: string, cty?: string) {
    const m = med ?? medication;
    const c = cty ?? country;
    if (!m.trim() || !c) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medication: m.trim(), country: c }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        setResult(data.result);
        if (med) setMedication(med);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, which: "phrase" | "local") {
    navigator.clipboard.writeText(text).then(() => {
      if (which === "phrase") {
        setCopiedPhrase(true);
        setTimeout(() => setCopiedPhrase(false), 2000);
      } else {
        setCopiedLocal(true);
        setTimeout(() => setCopiedLocal(false), 2000);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Pill className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medication Finder</h1>
              <p className="text-sm text-gray-500">Find your medication anywhere in the world</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Search form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="space-y-3">

            {/* Medication input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Medication name
              </label>
              <div className="relative">
                <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. Metformin, Ibuprofen, Amoxicillin..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Country select */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Country you&apos;re traveling to
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white appearance-none"
                >
                  <option value="">Select a country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={!medication.trim() || !country || loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold py-3 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Looking up...</>
              ) : (
                <><Search className="w-4 h-4" /> Find Medication</>
              )}
            </button>
          </div>

          {/* Quick medication chips */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Common medications</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MEDS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMedication(m); }}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">

            {/* Not found warning */}
            {!result.found && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 font-medium">{result.availability_note}</p>
              </div>
            )}

            {/* Main info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Generic name</p>
                  <h2 className="text-xl font-bold text-gray-900 mt-0.5">{result.generic_name}</h2>
                </div>
                <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                  {result.otc_available ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Over-the-Counter
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                      <ShieldAlert className="w-3 h-3" /> Prescription Required
                    </span>
                  )}
                </div>
              </div>

              {/* Brand names */}
              {result.brand_names.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Brand names in {country}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.brand_names.map((name) => (
                      <span
                        key={name}
                        className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-lg"
                      >
                        <Package className="w-3.5 h-3.5" />
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              {result.approximate_price && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2.5">
                  <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span><span className="font-semibold">Approx. price:</span> {result.approximate_price}</span>
                </div>
              )}

              {/* Availability note */}
              {result.found && result.availability_note && (
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">{result.availability_note}</p>
              )}
            </div>

            {/* ★ Pharmacy Phrase Card — the hero feature */}
            <div className="bg-violet-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-violet-200 uppercase tracking-wide">Show this to the pharmacist</p>
                  <p className="text-sm font-semibold">in {result.pharmacy_phrase.language}</p>
                </div>
              </div>

              {/* Local language phrase — BIG */}
              <div className="bg-white/15 rounded-xl p-4 mb-3 border border-white/20">
                <p className="text-lg sm:text-xl font-bold leading-relaxed text-white">
                  {result.pharmacy_phrase.local}
                </p>
                {result.pharmacy_phrase.transliteration && (
                  <p className="text-sm text-violet-200 mt-2 italic">
                    {result.pharmacy_phrase.transliteration}
                  </p>
                )}
              </div>

              {/* English version */}
              <div className="bg-white/10 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs text-violet-200 font-medium mb-0.5">English meaning</p>
                <p className="text-sm text-white">{result.pharmacy_phrase.english}</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => copyText(result.pharmacy_phrase.local, "local")}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-violet-700 font-bold py-2.5 rounded-xl hover:bg-violet-50 transition-colors text-sm"
                >
                  {copiedLocal ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy phrase</>}
                </button>
                <button
                  onClick={() => speak(result.pharmacy_phrase.local, result.pharmacy_phrase.language.toLowerCase())}
                  className="flex items-center justify-center gap-2 bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors text-sm border border-white/30"
                >
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Speak</span>
                </button>
              </div>
            </div>

            {/* Alternatives */}
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-brand-600" />
                  Alternatives if not available
                </h3>
                <div className="space-y-2">
                  {result.alternatives.map((alt, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{alt.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{alt.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Important warnings
                </h3>
                <div className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                      <p className="text-sm text-amber-800">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Storage tip */}
            {result.storage_tip && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Travel storage tip</p>
                  <p className="text-sm text-blue-800">{result.storage_tip}</p>
                </div>
              </div>
            )}

            {/* Find pharmacy CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-1">Need to find a pharmacy?</p>
              <p className="text-xs text-gray-500 mb-3">Use TravelDoc to find the nearest clinic or pharmacy in {country}.</p>
              <a
                href={`/search?city=${encodeURIComponent(country)}&specialty=General+Practitioner`}
                className="flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                Find clinics in {country}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-gray-400 pb-2 leading-relaxed">
              This information is for general guidance only. Always verify with a licensed pharmacist
              or doctor before taking any medication. Drug availability and regulations vary.
            </p>
          </div>
        )}

        {/* Idle state — no search yet */}
        {!result && !loading && !error && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Find any medication worldwide</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Enter your medication and destination country. Get the local brand name,
              a pharmacy phrase in the local language, and alternatives if it&apos;s not available.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
