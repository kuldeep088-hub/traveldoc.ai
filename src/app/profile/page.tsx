"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Calendar, Mail, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Appointment } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUser(data.user);
      fetch("/api/appointments")
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((d) => setAppointments(d.appointments ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  const pending = appointments.filter((a) => a.status === "pending").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* User card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-brand-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user?.email}</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Member since{" "}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-4 h-4 text-gray-400" />
          {user?.email}
        </div>
      </div>

      {/* Appointment stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Pending", value: pending, color: "text-amber-600 bg-amber-50" },
          { label: "Confirmed", value: confirmed, color: "text-green-600 bg-green-50" },
          { label: "Cancelled", value: cancelled, color: "text-red-600 bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <div className={`text-2xl font-bold ${stat.color.split(" ")[0]}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-2">
        <Link
          href="/appointments"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">View All Appointments</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-600">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
