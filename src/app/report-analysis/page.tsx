"use client";

import { useState, useRef } from "react";
import {
  FileUp, FileText, Loader2, AlertTriangle, CheckCircle,
  XCircle, Info, ArrowRight, X, RefreshCw, ClipboardList,
  Languages, Stethoscope, ShieldAlert,
} from "lucide-react";
import Link from "next/link";

interface Finding {
  test: string;
  value: string;
  normalRange: string;
  status: "normal" | "attention" | "critical";
  meaning: string;
}

interface ReportResult {
  reportType: string;
  summary: string;
  urgency: "none" | "see_doctor" | "urgent";
  urgency_reason: string;
  findings: Finding[];
  recommendations: string[];
  disclaimer: string;
}

const STATUS = {
  normal:    { label: "Normal",          ring: "border-green-200  bg-green-50",  text: "text-green-800",  badge: "bg-green-100 text-green-700",  Icon: CheckCircle,    iconCls: "text-green-500" },
  attention: { label: "Needs Attention", ring: "border-orange-200 bg-orange-50", text: "text-orange-800", badge: "bg-orange-100 text-orange-700", Icon: AlertTriangle,  iconCls: "text-orange-500" },
  critical:  { label: "Critical",        ring: "border-red-200    bg-red-50",    text: "text-red-800",    badge: "bg-red-100 text-red-700",       Icon: XCircle,        iconCls: "text-red-500" },
} as const;

const URGENCY = {
  none:       { label: "All Clear",         sub: "No immediate action needed.",                          ring: "border-green-200 bg-green-50",   text: "text-green-800",  Icon: CheckCircle,   iconCls: "text-green-600" },
  see_doctor: { label: "See a Doctor Soon", sub: "Some values need medical attention.",                  ring: "border-orange-200 bg-orange-50", text: "text-orange-800", Icon: AlertTriangle, iconCls: "text-orange-600" },
  urgent:     { label: "Seek Urgent Care",  sub: "This report has findings that need immediate care.",   ring: "border-red-200 bg-red-50",       text: "text-red-800",    Icon: ShieldAlert,   iconCls: "text-red-600" },
} as const;

export default function ReportAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setResult(null);
    setError("");
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("language", language);
      const res = await fetch("/api/report-analysis", { method: "POST", body: fd });
      const raw = await res.text();
      let data: { error?: string; result?: ReportResult };
      try {
        data = JSON.parse(raw);
      } catch {
        setError(`Server error (${res.status}). Please try again.`);
        return;
      }
      if (!res.ok || data.error) setError(data.error || "Something went wrong.");
      else if (data.result) setResult(data.result);
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const urgencyKey = (result?.urgency ?? "none") as keyof typeof URGENCY;
  const urg = URGENCY[urgencyKey] ?? URGENCY.none;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Medical Report Reader</h1>
              <p className="text-sm text-gray-500">Upload any report — AI explains it in simple language</p>
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
                      ? "bg-sky-600 text-white border-sky-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
                  }`}
                >
                  {v === "en" ? "English" : "हिंदी"}
                </button>
              ))}
            </div>
          </div>

          {/* Upload area */}
          {!file ? (
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-sky-300 hover:bg-sky-50 transition-colors"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center">
                <FileUp className="w-7 h-7 text-sky-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Upload your medical report</p>
                <p className="text-xs text-gray-400 mt-1">Blood test · X-ray · Prescription · ECG · MRI · any report</p>
                <p className="text-xs text-sky-500 mt-1.5 font-medium">JPG · PNG · PDF &nbsp;·&nbsp; Max 4MB</p>
              </div>
            </label>
          ) : (
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              {preview ? (
                <img src={preview} alt="Report preview" className="w-full max-h-56 object-contain bg-gray-50" />
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">PDF · {(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-100">
                <p className="text-xs text-gray-500 truncate flex-1 mr-2">{file.name}</p>
                <button onClick={reset} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 bg-sky-600 text-white font-semibold py-3 rounded-xl hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your report…</>
            ) : (
              <><ClipboardList className="w-4 h-4" /> Analyze Report</>
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

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Urgency + summary banner */}
            <div className={`rounded-2xl border p-5 ${urg.ring}`}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <urg.Icon className={`w-5 h-5 ${urg.iconCls} flex-shrink-0`} />
                <span className={`font-bold text-base ${urg.text}`}>{urg.label}</span>
                {result.reportType && (
                  <span className="ml-auto text-xs font-semibold text-gray-500 bg-white rounded-full px-2.5 py-0.5 border border-gray-200 flex-shrink-0">
                    {result.reportType}
                  </span>
                )}
              </div>
              <p className={`text-sm leading-relaxed ${urg.text}`}>{result.summary}</p>
              {result.urgency_reason && result.urgency !== "none" && (
                <p className={`text-xs mt-2 opacity-80 ${urg.text}`}>{result.urgency_reason}</p>
              )}
            </div>

            {/* Findings */}
            {result.findings?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-500" />
                  Test Results
                </h3>
                <div className="space-y-3">
                  {result.findings.map((f, i) => {
                    const s = STATUS[f.status as keyof typeof STATUS] ?? STATUS.normal;
                    return (
                      <div key={i} className={`rounded-xl border p-3.5 ${s.ring}`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <s.Icon className={`w-4 h-4 ${s.iconCls} flex-shrink-0`} />
                            <span className={`text-sm font-semibold ${s.text} truncate`}>{f.test}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs pl-6 mb-2">
                          {f.value && <span className={s.text}><span className="font-semibold">Value:</span> {f.value}</span>}
                          {f.normalRange && <span className={s.text}><span className="font-semibold">Normal:</span> {f.normalRange}</span>}
                        </div>
                        <p className={`text-xs pl-6 leading-relaxed ${s.text} opacity-90`}>{f.meaning}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-brand-600" />
                  What to do next
                </h3>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs for non-normal urgency */}
            {(result.urgency === "see_doctor" || result.urgency === "urgent") && (
              <div className="flex flex-col sm:flex-row gap-3">
                {result.urgency === "urgent" && (
                  <a
                    href="tel:112"
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Call Emergency (112)
                  </a>
                )}
                <Link
                  href="/search"
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors text-sm"
                >
                  <Stethoscope className="w-4 h-4" />
                  Find a Doctor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-xs text-gray-400 pb-1 leading-relaxed">
              {result.disclaimer ||
                "This AI analysis is for informational purposes only. Always consult a qualified doctor for medical advice."}
            </p>

            <button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Analyze another report
            </button>
          </div>
        )}

        {/* Idle state */}
        {!result && !loading && !error && !file && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-sky-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">Upload any medical report</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Blood test results, X-ray reports, prescriptions, ECGs, MRIs — AI explains them
              in simple language you can understand. Also supports Hindi.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["Blood Test", "X-Ray", "Prescription", "ECG", "MRI Report", "Urine Test"].map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
