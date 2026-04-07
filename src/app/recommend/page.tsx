"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Brain, Loader2, Star, CheckCircle, ArrowRight, RotateCcw,
  AlertTriangle, HelpCircle, Briefcase, GitCompare, PackageCheck,
  XCircle,
} from "lucide-react";
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
  urgency_alert?: string | null;
  questions_to_ask?: string[];
  what_to_bring?: string[];
  ranked_doctors: RankedDoctor[];
}

interface CompareResult {
  summary: string;
  winner: string;
  comparison: { name: string; pros: string[]; cons: string[] }[];
}

export default function RecommendPage() {
  const searchParams = useSearchParams();

  // Step 1 — Location & context
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [specialty, setSpecialty] = useState(searchParams.get("specialty") ?? "");
  const [language, setLanguage] = useState("");
  const [tripDuration, setTripDuration] = useState("");
  const [travelPurpose, setTravelPurpose] = useState("");

  // Step 2 — Medical need
  const [symptoms, setSymptoms] = useState("");
  const [urgency, setUrgency] = useState("");
  const [insurance, setInsurance] = useState("");
  const [allergies, setAllergies] = useState("");
  const [conditions, setConditions] = useState("");

  // UI state
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState("");

  // Doctor comparison
  const [compareNames, setCompareNames] = useState<Set<string>>(new Set());
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  async function handleSearch() {
    if (!city || !symptoms) return;
    setLoading(true);
    setError("");
    setCompareNames(new Set());
    setCompareResult(null);
    setShowCompare(false);

    try {
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

      const recRes = await fetch("/api/doctors/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctors: fetchedDoctors.slice(0, 10),
          symptoms, language, urgency, insurance, city,
          tripDuration, travelPurpose, allergies, conditions,
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

  function toggleCompare(name: string) {
    setCompareNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < 3) {
        next.add(name);
      }
      return next;
    });
    setCompareResult(null);
    setShowCompare(false);
  }

  async function handleCompare() {
    const selected = doctors.filter((d) => compareNames.has(d.name));
    if (selected.length < 2) return;
    setCompareLoading(true);
    setShowCompare(true);
    try {
      const res = await fetch("/api/doctors/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctors: selected, symptoms }),
      });
      const data = await res.json();
      if (data.result) setCompareResult(data.result);
    } catch {
      // silently fail
    } finally {
      setCompareLoading(false);
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
    setCompareNames(new Set());
    setCompareResult(null);
    setShowCompare(false);
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
          Tell us your full situation — AI will find the best doctor for you, anywhere in the world.
        </p>
      </div>

      {/* Step indicator */}
      {step < 3 && (
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {s}
              </div>
              {s < 2 && <div className="w-8 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 1: Location & Travel Context ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Where are you traveling?</h2>
          <p className="text-xs text-gray-400 mb-5">Your travel context helps AI give better recommendations</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialty (optional)</label>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">Let AI decide</option>
                  {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preferred language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">Any language</option>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                  Trip duration
                </label>
                <select value={tripDuration} onChange={(e) => setTripDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">Not specified</option>
                  <option value="1-3 days">1–3 days</option>
                  <option value="4-7 days">4–7 days</option>
                  <option value="2-4 weeks">2–4 weeks</option>
                  <option value="1-3 months">1–3 months</option>
                  <option value="I live here">I live here</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Travel purpose</label>
                <select value={travelPurpose} onChange={(e) => setTravelPurpose(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">Not specified</option>
                  <option value="Tourism / Holiday">Tourism / Holiday</option>
                  <option value="Business trip">Business trip</option>
                  <option value="Medical trip">Medical trip</option>
                  <option value="Study abroad">Study abroad</option>
                  <option value="Relocating">Relocating</option>
                  <option value="Work assignment">Work assignment</option>
                </select>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!city}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Medical Need ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Tell us about your medical need</h2>
          <p className="text-xs text-gray-400 mb-5">The more you share, the better the AI recommendation</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Describe your symptoms or need <span className="text-red-500">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. I have a severe toothache for 2 days. I need urgent dental care. I'm a tourist..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Urgency</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">Not sure</option>
                  <option value="Emergency — right now">Emergency — right now</option>
                  <option value="Urgent — today">Urgent — today</option>
                  <option value="Soon — this week">Soon — this week</option>
                  <option value="Routine — no rush">Routine — no rush</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment</label>
                <select value={insurance} onChange={(e) => setInsurance(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="">Not specified</option>
                  <option value="Travel insurance">Travel insurance</option>
                  <option value="Private insurance">Private insurance</option>
                  <option value="Self-pay / cash">Self-pay / cash</option>
                  <option value="National health card">National health card</option>
                </select>
              </div>
            </div>

            {/* Medical history */}
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medical history (optional)</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Known allergies</label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, latex, ibuprofen..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Chronic conditions</label>
                <input type="text" value={conditions} onChange={(e) => setConditions(e.target.value)}
                  placeholder="e.g. Diabetes type 2, hypertension, asthma..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Back
              </button>
              <button onClick={handleSearch} disabled={loading || !symptoms}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {doctors.length > 0 ? "Analyzing with AI..." : "Finding doctors..."}
                  </>
                ) : (
                  <><Brain className="w-4 h-4" /> Get AI Recommendation</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Results ── */}
      {step === 3 && result && (
        <div>
          {/* Emergency alert */}
          {result.urgency_alert && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700 mb-1">Emergency Warning</p>
                <p className="text-sm text-red-700 leading-relaxed">{result.urgency_alert}</p>
              </div>
            </div>
          )}

          {/* AI Summary */}
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-900 mb-1">AI Analysis</p>
                <p className="text-sm text-brand-800 leading-relaxed">{result.summary}</p>
                <p className="text-xs font-semibold text-brand-600 mt-2">Best match: {result.best_match}</p>
              </div>
            </div>
          </div>

          {/* Comparison bar */}
          {compareNames.size >= 2 && (
            <div className="bg-white border border-brand-100 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-medium text-gray-700">
                  {compareNames.size} doctors selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setCompareNames(new Set()); setCompareResult(null); setShowCompare(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Clear
                </button>
                <button onClick={handleCompare} disabled={compareLoading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors">
                  {compareLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
                  Compare with AI
                </button>
              </div>
            </div>
          )}

          {/* Comparison result */}
          {showCompare && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
              {compareLoading ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                  <span className="text-sm text-gray-500">AI is comparing doctors...</span>
                </div>
              ) : compareResult ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GitCompare className="w-4 h-4 text-brand-600" />
                    <p className="text-sm font-semibold text-gray-900">AI Comparison</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{compareResult.summary}</p>
                  <p className="text-sm font-semibold text-brand-700 bg-brand-50 rounded-lg px-3 py-2 mb-4">
                    Recommendation: {compareResult.winner}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {compareResult.comparison.map((c) => (
                      <div key={c.name} className="border border-gray-100 rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">{c.name}</p>
                        {c.pros.map((p) => (
                          <div key={p} className="flex items-start gap-1.5 text-xs text-green-700 mb-1">
                            <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {p}
                          </div>
                        ))}
                        {c.cons.map((con) => (
                          <div key={con} className="flex items-start gap-1.5 text-xs text-amber-600 mt-1">
                            <span className="font-bold flex-shrink-0">–</span> {con}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Ranked doctors */}
          <div className="space-y-4">
            {result.ranked_doctors.map((ranked) => {
              const doctor = getDoctorByName(ranked.name);
              const isSelected = compareNames.has(ranked.name);
              return (
                <div key={ranked.name} className={`bg-white rounded-2xl border p-5 shadow-sm transition-colors ${isSelected ? "border-brand-300 bg-brand-50/30" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                        {ranked.rank}
                      </span>
                      <span className="font-semibold text-gray-900 truncate">{ranked.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-gray-700">{ranked.score}/10</span>
                      </div>
                      <button
                        onClick={() => toggleCompare(ranked.name)}
                        title={isSelected ? "Remove from comparison" : "Add to comparison"}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors text-xs font-bold ${isSelected ? "bg-brand-600 border-brand-600 text-white" : "border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500"}`}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    {ranked.reasons.map((r) => (
                      <div key={r} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" /> {r}
                      </div>
                    ))}
                  </div>

                  {ranked.concerns.length > 0 && (
                    <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
                      Note: {ranked.concerns.join(". ")}
                    </div>
                  )}

                  {doctor && <DoctorCard doctor={doctor} />}
                </div>
              );
            })}
          </div>

          {/* What to bring */}
          {result.what_to_bring && result.what_to_bring.length > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <PackageCheck className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">What to bring to your appointment</p>
              </div>
              <ul className="space-y-1.5">
                {result.what_to_bring.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-blue-800">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions to ask */}
          {result.questions_to_ask && result.questions_to_ask.length > 0 && (
            <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-900">Questions to ask your doctor</p>
              </div>
              <ul className="space-y-2">
                {result.questions_to_ask.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="font-semibold text-green-500 flex-shrink-0">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={reset}
            className="mt-6 w-full flex items-center justify-center gap-2 border border-gray-200 text-sm font-medium text-gray-600 py-3 rounded-xl hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> Start over
          </button>
        </div>
      )}
    </div>
  );
}
