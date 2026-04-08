"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Stethoscope, Menu, X, LogOut, User, MessageSquare, Thermometer } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navLinks = [
  { href: "/symptom-check", label: "I Feel Sick", highlight: true },
  { href: "/near-me", label: "Near Me", highlight: false },
  { href: "/search", label: "Find a Doctor", highlight: false },
  { href: "/medication", label: "Medication", highlight: false },
  { href: "/recommend", label: "AI Recommend", highlight: false },
  { href: "/conversation", label: "AI Conversation", highlight: false },
  { href: "/appointments", label: "Appointments", highlight: false },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
            <Stethoscope className="w-6 h-6 text-brand-600" />
            TravelDoc AI
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              link.highlight ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors",
                    pathname === link.href
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-600 hover:bg-red-100"
                  )}
                >
                  <Thermometer className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-600",
                    pathname === link.href
                      ? "text-brand-600 border-b-2 border-brand-600 pb-0.5"
                      : "text-gray-600"
                  )}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Auth — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-600 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="truncate max-w-[140px]">{user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-600 hover:text-brand-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-brand-600"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4">
          <nav className="flex flex-col gap-2 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "text-sm font-medium px-3 py-2 rounded-lg transition-colors flex items-center gap-2",
                  link.highlight
                    ? pathname === link.href
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-600 font-semibold"
                    : pathname === link.href
                    ? "bg-brand-50 text-brand-600"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {link.highlight && <Thermometer className="w-3.5 h-3.5" />}
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              {user ? (
                <button
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setOpen(false)}
                    className="flex-1 text-center text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
