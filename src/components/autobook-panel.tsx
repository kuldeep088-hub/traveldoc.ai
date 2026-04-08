"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { AutoBookResult } from "@/lib/types";
import {
  MapPin, Navigation, Phone, Star, Clock,
  CheckCircle, CalendarCheck, LocateFixed, AlertCircle, Loader2,
} from "lucide-react";

interface AutoBookPanelProps {
  specialty?: string | null;
}

type State = "idle" | "locating" | "searching" | "ready" | "booking" | "booked" | "error";

function formatSlot(date: string, time: string) {
  const d = new Date(`${date}T${time}`);
  const isToday = date === new Date().toISOString().split("T")[0];
  const dayLabel = isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dayLabel} ${timeLabel}`;
}

export function AutoBookPanel({ specialty }: AutoBookPanelProps) {
  const router = useRouter();
  const geo = useGeolocation();
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<AutoBookResult | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [user, setUser] = useState<{ id: string } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  // When coords become available, auto-search
  useEffect(() => {
    if (geo.coords && state === "locating" && !hasFetched.current) {
      hasFetched.current = true;
      doSearch(geo.coords.lat, geo.coords.lng);
    }
  }, [geo.coords, state]);

  // Handle geolocation error
  useEffect(() => {
    if (geo.error && state === "locating") {
      setState("error");
      setErrorMsg(geo.error);
    }
  }, [geo.error, state]);

  async function doSearch(lat: number, lng: number) {
    setState("searching");
    try {
      const res = await fetch("/api/autobook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, specialty, symptoms: specialty || "general" }),
      });
      const data = await res.json();
      if (!res.ok || !data.best_doctor) {
        setState("error");
        setErrorMsg(data.error || "No doctors found near you.");
        return;
      }
      setResult(data as AutoBookResult);
      setSelectedSlot(data.suggested_slots?.[0] ?? null);
      setState("ready");
    } catch {
      setState("error");
      setErrorMsg("Could not search for doctors. Please try again.");
    }
  }

  function handleLocate() {
    hasFetched.current = false;
    setState("locating");
    geo.request();
  }

  async function handleConfirm() {
    if (!result || !selectedSlot) return;

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setState("booking");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: result.best_doctor.google_place_id,
          doctor_name: result.best_doctor.name,
          date: selectedSlot.date,
          time: selectedSlot.time,
          notes: `Auto-booked via AI. ${result.ai_reason}`,
        }),
      });
      if (res.ok) {
        setState("booked");
      } else {
        const d = await res.json();
        setState("error");
        setErrorMsg(d.error || "Booking failed. Please try again.");
      }
    } catch {
      setState("error");
      setErrorMsg("Booking failed. Please try again.");
    }
  }

  // Idle state — invite user
  if (state === "idle") {
    return (
      <div className="rounded-2xl border-2 border-brand-200 bg-brand-50 p-5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Auto-Book Nearby Doctor</p>
            <p className="text-xs text-gray-500">AI finds best match & books in 1 tap</p>
          </div>
        </div>
        <button
          onClick={handleLocate}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition-colors text-sm"
        >
          <LocateFixed className="w-4 h-4" />
          Find & Book Doctor Near Me
        </button>
      </div>
    );
  }

  // Locating / searching
  if (state === "locating" || state === "searching") {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-5 mt-4 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-brand-600 animate-spin flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {state === "locating" ? "Getting your location..." : "Finding nearest doctors..."}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {state === "locating" ? "Please allow location access" : "AI is selecting the best match"}
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (state === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mt-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{errorMsg}</p>
            <button
              onClick={() => { setState("idle"); hasFetched.current = false; }}
              className="text-xs text-red-600 underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Booked confirmation
  if (state === "booked" && result && selectedSlot) {
    return (
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <p className="text-base font-bold text-green-800">Appointment Requested!</p>
        </div>
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-semibold">{result.best_doctor.name}</span>
        </p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Clock className="w-3.5 h-3.5" />
          {formatSlot(selectedSlot.date, selectedSlot.time)}
        </div>
        <p className="text-xs text-gray-500 mb-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
          Status: <span className="font-semibold text-orange-600">Pending</span> — appointment request sent. Check My Appointments for updates.
        </p>
        <a
          href="/appointments"
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
        >
          View My Appointments
        </a>
      </div>
    );
  }

  // Ready / booking in progress — show best doctor + slot picker
  if ((state === "ready" || state === "booking") && result) {
    const doc = result.best_doctor;
    return (
      <div className="rounded-2xl border-2 border-brand-200 bg-white p-5 mt-4">
        <p className="text-xs font-bold text-brand-700 uppercase tracking-wide mb-3">
          AI picked the best nearby doctor
        </p>

        {/* Doctor card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg flex-shrink-0">
              {doc.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
              <p className="text-xs text-brand-600 mt-0.5">{doc.specialty.join(", ")}</p>
              {doc.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-semibold text-gray-700">{doc.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{doc.address || "Nearby"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Navigation className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium text-brand-600">{doc.distance_km} km away</span>
              </div>
              {doc.phone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                  <Phone className="w-3 h-3 flex-shrink-0 text-green-500" />
                  <a href={`tel:${doc.phone}`} className="text-green-600 hover:underline">{doc.phone}</a>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
            <span className="font-medium">Why this doctor: </span>{result.ai_reason}
          </div>
        </div>

        {/* Slot picker */}
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Choose a time slot</p>
        <div className="flex flex-col gap-2 mb-4">
          {result.suggested_slots.map((slot) => (
            <button
              key={`${slot.date}-${slot.time}`}
              onClick={() => setSelectedSlot(slot)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left ${
                selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {formatSlot(slot.date, slot.time)}
              {selectedSlot?.date === slot.date && selectedSlot?.time === slot.time && (
                <CheckCircle className="w-3.5 h-3.5 text-brand-600 ml-auto" />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 mb-3">
          Slots are appointment requests, not guaranteed bookings. The doctor will confirm.
        </p>

        <button
          onClick={handleConfirm}
          disabled={!selectedSlot || state === "booking"}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {state === "booking" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
          ) : !user ? (
            <><CalendarCheck className="w-4 h-4" /> Sign in to Book</>
          ) : (
            <><CalendarCheck className="w-4 h-4" /> Confirm Booking</>
          )}
        </button>
      </div>
    );
  }

  return null;
}
