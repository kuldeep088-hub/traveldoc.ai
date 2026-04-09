"use client";

import { useState, useRef } from "react";
import {
  Camera, Loader2, AlertTriangle, CheckCircle,
  ShieldCheck, ShieldAlert, X, RefreshCw, Package,
  Pill, Info, AlertCircle, Heart, Thermometer, Languages,
  ArrowRight, Zap, ScanLine,
} from "lucide-react";
import Link from "next/link";

interface MedResult {
  brandName: string;
  genericName: string;
  manufacturer: string | null;
  type: string;
  uses: string[];
  dosage: string;
  howItWorks: string;
  sideEffects: string[];
  precautions: string[];
  drugInteractions: string[];
  storage: string;
  prescriptionRequired: boolean;
  pregnancySafe: "safe" | "caution" | "unsafe" | "unknown";
  activeIngredients: string[];
  warnings: string[];
  expiryVisible: string | null;
  found: boolean;
  notFoundReason?: string;
}

const PREGNANCY = {
  safe:    { label: "Safe in Pregnancy",   cls: "text-green-700 bg-green-50 border-green-200" },
  caution: { label: "Use with Caution",    cls: "text-orange-700 bg-orange-50 border-orange-200" },
  unsafe:  { label: "Avoid in Pregnancy",  cls: "text-red-700 bg-red-50 border-red-200" },
  unknown: { label: "Pregnancy: Unknown",  cls: "text-gray-600 bg-gray-50 border-gray-200" },
};

const TABS = [
  { key: "uses",        label: "Uses" },
  { key: "dosage",      label: "Dosage" },
  { key: "sideEffects", label: "Side Effects" },
  { key: "precautions", label: "Precautions" },
  { key: "warnings",    label: "Warnings" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function MedicineAnalysisPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MedResult | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabKey>("uses");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP, etc.)");
      return;
    }
    setImage(f);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleAnalyze() {
    if (!image) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", image);
      fd.append("language", language);
      const res = await fetch("/api/medicine-analysis", { method: "POST", body: fd });
      const raw = await res.text();
      let data: { error?: string; result?: MedResult };
      try {
        data = JSON.parse(raw);
      } catch {
        setError(`Server error (${res.status}). Please try again.`);
        return;
      }
      if (!res.ok || data.error) setError(data.error || "Something went wrong.");
      else if (data.result) { setResult(data.result); setTab("uses"); }
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medicine Scanner</h1>
              <p className="text-sm text-gray-500">Photo your medicine — AI tells you everything about it</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Upload card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          {/* Language toggle */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" /> Response language
            </p>
            <div className="flex gap-2">
              {(["en", "hi"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setLanguage(v)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    language === v
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  {v === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>
          </div>

          {/* Upload / preview */}
          {!image ? (
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Camera className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Take a photo or upload</p>
                <p className="text-xs text-gray-400 mt-1">Medicine packet · strip · bottle · label</p>
                <p className="text-xs text-emerald-500 mt-1.5 font-medium">JPG · PNG · WEBP &nbsp;·&nbsp; Max 4MB</p>
              </div>
            </label>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              {preview && (
                <img src={preview} alt="Medicine" className="w-full max-h-56 object-contain bg-gray-50" />
              )}
              <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-100">
                <p className="text-xs text-gray-500 truncate flex-1 mr-2">{image.name}</p>
                <button onClick={reset} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Scanning medicine…</>
            ) : (
              <><Zap className="w-4 h-4" /> Scan Medicine</>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Not found */}
        {result && !result.found && (
          <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-800 mb-1">Medicine not identified</p>
                <p className="text-sm text-yellow-700">
                  {result.notFoundReason ||
                    "The image may be blurry or the label is not visible. Try a clearer, well-lit photo."}
                </p>
                <button
                  onClick={reset}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-yellow-800 hover:text-yellow-900 underline"
                >
                  <RefreshCw className="w-3 h-3" /> Try another photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && result.found && (
          <div className="space-y-4">
            {/* Identity card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 break-words">{result.brandName}</h2>
                  {result.genericName && result.genericName !== result.brandName && (
                    <p className="text-sm text-gray-500 mt-0.5">{result.genericName}</p>
                  )}
                  {result.manufacturer && (
                    <p className="text-xs text-gray-400 mt-0.5">{result.manufacturer}</p>
                  )}
                  {result.expiryVisible && (
                    <p className="text-xs text-orange-600 mt-0.5 font-medium">Expiry: {result.expiryVisible}</p>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {result.type && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize">
                    {result.type}
                  </span>
                )}
                {result.prescriptionRequired ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                    <ShieldAlert className="w-3 h-3" /> Prescription Required
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Over-the-Counter
                  </span>
                )}
                {result.pregnancySafe && PREGNANCY[result.pregnancySafe] && (
                  <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${PREGNANCY[result.pregnancySafe].cls}`}>
                    <Heart className="w-3 h-3" /> {PREGNANCY[result.pregnancySafe].label}
                  </span>
                )}
              </div>

              {/* How it works */}
              {result.howItWorks && (
                <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded-xl px-3 py-2.5 leading-relaxed">
                  <span className="font-semibold text-gray-800">How it works: </span>
                  {result.howItWorks}
                </p>
              )}

              {/* Active ingredients */}
              {result.activeIngredients?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Active ingredients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.activeIngredients.map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex overflow-x-auto border-b border-gray-100">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-shrink-0 px-4 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
                      tab === t.key
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === "uses" && (
                  <div className="space-y-2">
                    {result.uses?.length > 0 ? (
                      result.uses.map((u, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">{u}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No usage information available.</p>
                    )}
                  </div>
                )}

                {tab === "dosage" && (
                  <div className="bg-emerald-50 rounded-xl border border-emerald-100 px-4 py-3">
                    <p className="text-sm font-semibold text-emerald-800">
                      {result.dosage || "Dosage information not available."}
                    </p>
                    <p className="text-xs text-emerald-600 mt-2">
                      Always follow your doctor&apos;s prescription or the package instructions.
                    </p>
                  </div>
                )}

                {tab === "sideEffects" && (
                  <div className="space-y-2">
                    {result.sideEffects?.length > 0 ? (
                      result.sideEffects.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-2" />
                          <p className="text-sm text-gray-700">{s}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No common side effects listed.</p>
                    )}
                  </div>
                )}

                {tab === "precautions" && (
                  <div className="space-y-2">
                    {result.precautions?.length > 0 ? (
                      result.precautions.map((p, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700">{p}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No special precautions listed.</p>
                    )}
                    {result.drugInteractions?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Drug Interactions</p>
                        {result.drugInteractions.map((d, i) => (
                          <div key={i} className="flex items-start gap-2.5 mt-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-700">{d}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "warnings" && (
                  <div className="space-y-2">
                    {result.warnings?.length > 0 ? (
                      result.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2.5 bg-red-50 rounded-xl px-3 py-2.5">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{w}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No critical warnings listed.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Storage */}
            {result.storage && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Storage instructions</p>
                  <p className="text-sm text-blue-800">{result.storage}</p>
                </div>
              </div>
            )}

            {/* Find doctor CTA */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-800 mb-1">Need a prescription or refill?</p>
              <p className="text-xs text-gray-500 mb-3">Find a doctor or clinic nearby to get your medication.</p>
              <Link
                href="/search"
                className="flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm"
              >
                <Package className="w-4 h-4" />
                Find a Doctor
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 pb-1 leading-relaxed">
              AI analysis for informational purposes only. Always consult a licensed pharmacist or doctor before taking any medication.
            </p>

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Scan another medicine
            </button>
          </div>
        )}

        {/* Idle state */}
        {!result && !loading && !error && !image && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Scan any medicine</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Take a photo of any medicine packet, strip, or bottle. AI identifies it and tells
              you uses, dosage, side effects, precautions, and more. Works in Hindi too.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Tablet strips", "Medicine bottles", "Cream tubes", "Syrups", "Injection vials"].map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
