"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Stethoscope, Menu, X, LogOut, User, Thermometer,
  Navigation, Search, Pill, ClipboardList, ScanLine,
  Brain, Calendar, GitCompare, PlusCircle, MessageSquare,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Desktop nav (shown lg+)
const desktopLinks = [
  { href: "/symptom-check",    label: "I Feel Sick",  highlight: true  },
  { href: "/search",           label: "Find Doctor",  highlight: false },
  { href: "/report-analysis",  label: "Report",       highlight: false, badge: "New" },
  { href: "/medicine-analysis",label: "Scan Med",     highlight: false, badge: "New" },
  { href: "/recommend",        label: "Recommend",    highlight: false },
  { href: "/appointments",     label: "Appointments", highlight: false },
];

// Mobile menu grid
const mobileLinks = [
  { href: "/symptom-check",    label: "I Feel Sick",  icon: Thermometer,   highlight: true,  badge: ""    },
  { href: "/near-me",          label: "Near Me",       icon: Navigation,    highlight: false, badge: ""    },
  { href: "/search",           label: "Find Doctor",  icon: Search,        highlight: false, badge: ""    },
  { href: "/medication",       label: "Medication",   icon: Pill,          highlight: false, badge: ""    },
  { href: "/report-analysis",  label: "Report",       icon: ClipboardList, highlight: false, badge: "New" },
  { href: "/medicine-analysis",label: "Scan Med",     icon: ScanLine,      highlight: false, badge: "New" },
  { href: "/recommend",        label: "Recommend",    icon: Brain,         highlight: false, badge: ""    },
  { href: "/conversation",     label: "AI Chat",      icon: MessageSquare, highlight: false, badge: ""    },
  { href: "/appointments",     label: "Appointments", icon: Calendar,      highlight: false, badge: ""    },
  { href: "/suggest",          label: "Suggest",      icon: PlusCircle,    highlight: false, badge: ""    },
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
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-700">
              <Stethoscope className="w-5 h-5 text-brand-600" />
              TravelDoc AI
            </Link>

            {/* Desktop nav — lg+ only */}
            <nav className="hidden lg:flex items-center gap-1">
              {desktopLinks.map((link) =>
                link.highlight ? (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors",
                      pathname === link.href
                        ? "bg-red-600 text-white"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    )}
                  >
                    <Thermometer className="w-3 h-3" />
                    {link.label}
                  </Link>
                ) : (
                  <div key={link.href} className="relative">
                    <Link
                      href={link.href}
                      className={cn(
                        "text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-100",
                        pathname === link.href
                          ? "text-brand-600 bg-brand-50"
                          : "text-gray-600"
                      )}
                    >
                      {link.label}
                    </Link>
                    {link.badge && (
                      <span className="absolute -top-1.5 -right-1 text-[9px] font-bold bg-brand-600 text-white px-1 rounded-full leading-4">
                        {link.badge}
                      </span>
                    )}
                  </div>
                )
              )}
            </nav>

            {/* Auth — desktop */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate max-w-[120px]">{user.email}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-red-600 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:border-red-200 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className="text-xs font-medium text-gray-600 hover:text-brand-600">
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-xs font-semibold bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger — always visible on mobile/tablet */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — full overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Panel */}
          <div
            className="absolute top-14 left-0 right-0 bg-white shadow-xl rounded-b-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-5">

              {/* App grid */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 px-1 py-3 rounded-2xl transition-colors text-center",
                      link.highlight
                        ? pathname === link.href
                          ? "bg-red-600 text-white"
                          : "bg-red-50 text-red-600"
                        : pathname === link.href
                        ? "bg-brand-50 text-brand-600"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {link.badge && (
                      <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-brand-600 text-white px-1 rounded-full leading-3.5">
                        {link.badge}
                      </span>
                    )}
                    <link.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[10px] font-semibold leading-tight">{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Auth row */}
              <div className="border-t border-gray-100 pt-3">
                {user ? (
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-600" />
                      </div>
                      <span className="truncate max-w-[180px] text-xs">{user.email}</span>
                    </Link>
                    <button
                      onClick={() => { handleLogout(); setOpen(false); }}
                      className="flex items-center gap-1.5 text-xs font-medium border border-red-200 text-red-600 px-3 py-1.5 rounded-lg"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center text-sm font-medium border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center text-sm font-semibold bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700"
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
