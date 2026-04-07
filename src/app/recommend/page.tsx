"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Brain, Loader2, Star, CheckCircle, ArrowRight, RotateCcw } from "lucide-react";
import { DoctorCard } from "@/components/doctor-card";
import { Doctor, LANGUAGES, SPECIALTIES } from "@/lib/types";

type Step = 1 | 2 | 3;

interface RankedDoctor {
  name: string;
  rank: number;
  score: number;
  reasons: string[];
  concerns: string[];
}

interface AIResult {
  summary: string;
  best_match: string;
  ranked_doctors: RankedDoctor[];
}

export default function RecommendPage() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(1);
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") ?? "");
  const [symptoms, setSymptoms] = useState("");
  const [language, setLanguage] = useState("");
  const [urgency, setUrgency] = useState("");
  const [insurance, setInsurance] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!city || !symptoms) return;
    setLoading(true);
    setError("");

    try {
      // Step 1: fetch doctors from Google Places
      const params = new URLSearchParams({ city });
      if (specialty) params.set("specialty", specialty);
      if (language) params.set("language", language);
      const searchRes = await fetch(`/api/doctors/search?${params.toString()}`);
      const searchData = await searchRes.json();
      const fetchedDoctors: Doctor[] = searchData.doctors ?? [];
      setDoctors(fetchedDoctors);

      if (fetchedDoctors.length === 0) {
        setError("No doctors found in this city. Try a different city or specialty.");
        setLoading(false);
        return;
      }

      // Step 2: ask Claude to rank them
      const recRes = await fetch("/api/doctors/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctors: fetchedDoctors.slice(0, 10), // send top 10
          symptoms,
          language,
          urgency,
          insurance,
          city,
        }),
      });
      const recData = await recRes.json();
      if (recData.result) {
        setResult(recData.result);
        setStep(3);
      } else {
        setError("AI recommendation failed. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function getDoctorByName(name: string): Doctor | undefined {
    return doctors.find((d) => d.name.toLowerCase().includes(name.toLowerCase()));
  }

  function reset() {
    setStep(1);
    setResult(null);
    setDoctors([]);
    setError("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-100 mb-4">
          <Brain className="w-6 h-6 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">AI Doctor Recommendation</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Tell us your needs and our AI will find the best doctor for you — anywhere in the world.
        </p>
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step >= s
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Location & specialty */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Where are you?</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Istanbul, Paris, Dubai"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Specialty (optional)
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Let AI decide</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">Any language</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!city}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Needs */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Tell us about your needs</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Describe your symptoms or medical need <span className="text-red-500">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. I have a toothache and need urgent dental care. I'm a tourist..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Not sure</option>
                  <option value="Urgent — today">Urgent — today</option>
                  <option value="Soon — this week">Soon — this week</option>
                  <option value="Routine — no rush">Routine — no rush</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment</label>
                <select
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Not specified</option>
                  <option value="Travel insurance">Travel insurance</option>
                  <option value="Private insurance">Private insurance</option>
                  <option value="Self-pay / cash">Self-pay / cash</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSearch}
                disabled={loading || !symptoms}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing {doctors.length > 0 ? "with AI..." : "doctors..."}
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Get AI Recommendation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div>
          {/* AI Summary */}
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-900 mb-1">AI Analysis</p>
                <p className="text-sm text-brand-800 leading-relaxed">{result.summary}</p>
                <p className="text-xs font-semibold text-brand-600 mt-2">
                  Best match: {result.best_match}
                </p>
              </div>
            </div>
          </div>

          {/* Ranked doctors */}
          <div className="space-y-4">
            {result.ranked_doctors.map((ranked) => {
              const doctor = getDoctorByName(ranked.name);
              return (
                <div key={ranked.name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">
                        {ranked.rank}
                      </span>
                      <span className="font-semibold text-gray-900">{ranked.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-gray-700">{ranked.score}/10</span>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="space-y-1 mb-3">
                    {ranked.reasons.map((r) => (
                      <div key={r} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        {r}
                      </div>
                    ))}
                  </div>

                  {ranked.concerns.length > 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                      Note: {ranked.concerns.join(". ")}
                    </div>
                  )}

                  {doctor && (
                    <DoctorCard doctor={doctor} />
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={reset}
            className="mt-6 w-full flex items-center justify-center gap-2 border border-gray-200 text-sm font-medium text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
