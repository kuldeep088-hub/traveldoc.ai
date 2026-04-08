"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle,
  Send, Thermometer, ShieldAlert, Heart, Clock, Stethoscope,
} from "lucide-react";
import { AutoBookPanel } from "@/components/autobook-panel";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Assessment {
  urgency: "home" | "doctor_today" | "emergency";
  condition: string;
  selfCare: string[];
  warningSigns: string[];
  specialty: string | null;
  message: string;
}

const URGENCY_CONFIG = {
  emergency: {
    bg: "bg-red-50",
    border: "border-red-300",
    badge: "bg-red-600 text-white",
    icon: ShieldAlert,
    iconColor: "text-red-600",
    label: "Go to Emergency Now",
    sub: "This needs immediate medical attention. Go to the nearest emergency room or call emergency services.",
  },
  doctor_today: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-500 text-white",
    icon: Clock,
    iconColor: "text-orange-500",
    label: "See a Doctor Today",
    sub: "You should see a doctor within the next few hours. Don't wait until tomorrow.",
  },
  home: {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-600 text-white",
    icon: Heart,
    iconColor: "text-green-600",
    label: "You Can Manage at Home",
    sub: "Rest and self-care should help. Watch for the warning signs listed below.",
  },
};

export default function SymptomCheckPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, assessment]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setStarted(true);

    const userMessage: Message = { role: "user", content: msg };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const res = await fetch("/api/symptom-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();

      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages([...nextHistory, assistantMessage]);

      if (data.phase === "assessment") {
        setAssessment({
          urgency: data.urgency,
          condition: data.condition,
          selfCare: data.selfCare ?? [],
          warningSigns: data.warningSigns ?? [],
          specialty: data.specialty ?? null,
          message: data.message,
        });
      }
    } catch {
      setMessages([...nextHistory, { role: "assistant", content: "Sorry, I had a connection issue. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function restart() {
    setMessages([]);
    setAssessment(null);
    setStarted(false);
    setInput("");
  }

  const cfg = assessment ? URGENCY_CONFIG[assessment.urgency] : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b shadow-sm ${assessment?.urgency === "emergency" ? "bg-red-600" : "bg-white"}`}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className={`p-1.5 rounded-lg transition-colors ${assessment?.urgency === "emergency" ? "text-red-100 hover:bg-red-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${assessment?.urgency === "emergency" ? "bg-red-500" : "bg-red-50"}`}>
              <Thermometer className={`w-4 h-4 ${assessment?.urgency === "emergency" ? "text-white" : "text-red-500"}`} />
            </div>
            <div>
              <p className={`text-sm font-bold leading-none ${assessment?.urgency === "emergency" ? "text-white" : "text-gray-900"}`}>
                Symptom Check
              </p>
              <p className={`text-xs ${assessment?.urgency === "emergency" ? "text-red-100" : "text-gray-400"}`}>
                AI health triage
              </p>
            </div>
          </div>
          {started && (
            <button
              onClick={restart}
              className={`ml-auto text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${assessment?.urgency === "emergency" ? "bg-red-500 text-white hover:bg-red-400" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              Start over
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4">

        {/* Entry screen — before first message */}
        {!started && (
          <div className="flex flex-col items-center text-center pt-8 pb-4">
            <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-5 shadow-sm">
              <Thermometer className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">How are you feeling?</h1>
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed mb-6">
              Describe what&apos;s wrong. The AI will ask a couple of questions, then tell you exactly what to do — whether that&apos;s rest, see a doctor, or go to the ER.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {["I have a fever", "Stomach pain", "Headache", "I got injured", "Feeling dizzy", "Chest pain"].map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              For life-threatening emergencies, call local emergency services immediately. This tool is for guidance only.
            </p>
          </div>
        )}

        {/* Chat messages */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                    <Stethoscope className="w-3.5 h-3.5 text-red-500" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <Stethoscope className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assessment card */}
        {assessment && cfg && (
          <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 mt-2`}>
            {/* Urgency badge */}
            <div className="flex items-center gap-2 mb-4">
              <cfg.icon className={`w-5 h-5 ${cfg.iconColor}`} />
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{cfg.sub}</p>

            {/* Condition */}
            {assessment.condition && (
              <div className="bg-white rounded-xl px-4 py-3 mb-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Most likely</p>
                <p className="text-sm font-semibold text-gray-800">{assessment.condition}</p>
              </div>
            )}

            {/* Self care */}
            {assessment.selfCare.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">What to do right now</p>
                <div className="space-y-1.5">
                  {assessment.selfCare.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning signs */}
            {assessment.warningSigns.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Watch out for</p>
                <div className="space-y-1.5">
                  {assessment.warningSigns.map((sign, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700">{sign}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-2">
              {assessment.urgency === "emergency" && (
                <a
                  href="tel:112"
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Call Emergency (112)
                </a>
              )}
              {(assessment.urgency === "doctor_today" || assessment.urgency === "emergency") && (
                <Link
                  href={`/search${assessment.specialty ? `?specialty=${encodeURIComponent(assessment.specialty)}` : ""}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors"
                >
                  <Stethoscope className="w-4 h-4" />
                  Find a Doctor
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {assessment.urgency === "home" && (
                <Link
                  href="/search"
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Stethoscope className="w-4 h-4" />
                  Find a Doctor Anyway
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Auto-book panel — only for doctor_today urgency */}
        {assessment && assessment.urgency === "doctor_today" && (
          <AutoBookPanel specialty={assessment.specialty} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={started ? "Reply to continue..." : "Describe your symptoms..."}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-gray-50 disabled:opacity-60 transition"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI guidance only — not a substitute for professional medical advice
          </p>
        </div>
      </div>
    </div>
  );
}
