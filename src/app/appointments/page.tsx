"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import Link from "next/link";
import { Appointment } from "@/lib/types";

const statusConfig = {
  pending: {
    label: "Pending",
    icon: AlertCircle,
    className: "text-amber-600 bg-amber-50",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle,
    className: "text-green-600 bg-green-50",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "text-red-600 bg-red-50",
  },
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          if (d.error === "Unauthorized") {
            setError("Please sign in to view your appointments.");
          } else {
            setError(d.error);
          }
        } else {
          setAppointments(d.appointments ?? []);
        }
      })
      .catch(() => setError("Failed to load appointments."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{appointments.length} total</p>
        </div>
        <Link
          href="/search"
          className="flex items-center gap-2 text-sm font-medium text-brand-600 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50"
        >
          <Search className="w-4 h-4" />
          Find a Doctor
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-40 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-28 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{error}</p>
          {error.includes("sign in") && (
            <Link
              href="/auth/login"
              className="inline-block bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700"
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No appointments yet</p>
          <Link
            href="/search"
            className="inline-block bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-700"
          >
            Find a Doctor
          </Link>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const status = statusConfig[appt.status];
            const StatusIcon = status.icon;
            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {appt.doctor?.name ?? "Doctor"}
                    </h3>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(appt.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {appt.time}
                      </span>
                    </div>
                    {appt.notes && (
                      <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-500">
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{appt.notes}</span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full flex-shrink-0 ${status.className}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
