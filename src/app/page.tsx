import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import {
  Brain, Calendar, PlusCircle, MessageSquare, Search,
  ArrowRight, Thermometer, Navigation, Pill, ClipboardList, ScanLine,
  Stethoscope, GitCompare, MapPin,
} from "lucide-react";

const quickActions = [
  { icon: Navigation,    label: "Near Me",      sub: "Closest doctors",    href: "/near-me",          bg: "bg-teal-50",    iconBg: "bg-teal-100",    iconColor: "text-teal-600"    },
  { icon: Search,        label: "Find Doctor",  sub: "Search worldwide",   href: "/search",           bg: "bg-blue-50",    iconBg: "bg-blue-100",    iconColor: "text-blue-600"    },
  { icon: Pill,          label: "Medication",   sub: "Find drugs abroad",  href: "/medication",       bg: "bg-violet-50",  iconBg: "bg-violet-100",  iconColor: "text-violet-600"  },
  { icon: Brain,         label: "AI Recommend", sub: "Best match for you", href: "/recommend",        bg: "bg-purple-50",  iconBg: "bg-purple-100",  iconColor: "text-purple-600"  },
  { icon: MessageSquare, label: "AI Chat",      sub: "Talk to AI doctor",  href: "/conversation",     bg: "bg-green-50",   iconBg: "bg-green-100",   iconColor: "text-green-600"   },
  { icon: Calendar,      label: "Appointments", sub: "Book & manage",      href: "/appointments",     bg: "bg-pink-50",    iconBg: "bg-pink-100",    iconColor: "text-pink-600"    },
  { icon: GitCompare,    label: "Compare",      sub: "AI side-by-side",    href: "/recommend",        bg: "bg-indigo-50",  iconBg: "bg-indigo-100",  iconColor: "text-indigo-600"  },
  { icon: PlusCircle,    label: "Suggest",      sub: "Add a doctor",       href: "/suggest",          bg: "bg-orange-50",  iconBg: "bg-orange-100",  iconColor: "text-orange-600"  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <section className="bg-gradient-to-b from-brand-900 via-brand-700 to-brand-600 text-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">

          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">TravelDoc AI</span>
            <span className="ml-auto text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              50+ countries
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-2">
            Find doctors, read reports<br className="sm:hidden" />{" "}
            &amp; scan medicines — anywhere
          </h1>
          <p className="text-blue-200 text-sm mb-7">
            AI health assistant for travelers · Any language · Free
          </p>

          {/* Emergency CTA */}
          <Link
            href="/symptom-check"
            className="flex items-center gap-3 w-full bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-4 px-5 rounded-2xl text-base shadow-lg transition-all"
          >
            <Thermometer className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">I Feel Sick Right Now</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </Link>
          <p className="text-center text-blue-200 text-xs mt-2">
            AI tells you exactly what to do in 30 seconds
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-2xl mx-auto px-4">

        {/* Search card — floated up */}
        <div className="-mt-7 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Find a doctor by city
            </p>
            <SearchForm />
          </div>
        </div>

        {/* ── NEW: AI Health Tools ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-900">AI Health Tools</h2>
            <span className="text-xs font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">New</span>
          </div>

          <div className="grid grid-cols-2 gap-3">

            {/* Report Reader */}
            <Link
              href="/report-analysis"
              className="relative flex flex-col p-4 bg-sky-50 border border-sky-100 rounded-2xl active:scale-95 transition-all hover:shadow-md"
            >
              <span className="absolute top-3 right-3 text-xs font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded-full">
                New
              </span>
              <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center mb-3">
                <ClipboardList className="w-5 h-5 text-sky-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1.5 pr-8 leading-tight">
                Read My Report
              </p>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">
                Blood test, X-ray, ECG, prescription — AI explains in simple words. Hindi भी।
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-sky-600">
                Upload now <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Medicine Scanner */}
            <Link
              href="/medicine-analysis"
              className="relative flex flex-col p-4 bg-emerald-50 border border-emerald-100 rounded-2xl active:scale-95 transition-all hover:shadow-md"
            >
              <span className="absolute top-3 right-3 text-xs font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                New
              </span>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                <ScanLine className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1.5 pr-8 leading-tight">
                Scan Medicine
              </p>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">
                Photo any medicine — uses, dosage, side effects, warnings. Hindi भी।
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-emerald-600">
                Scan now <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

          </div>
        </div>

        {/* ── Quick Access ── */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center gap-3 px-3.5 py-3.5 rounded-2xl ${a.bg} active:scale-95 transition-all hover:shadow-sm`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.iconBg}`}>
                  <a.icon className={`w-4 h-4 ${a.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{a.label}</p>
                  <p className="text-xs text-gray-400 leading-tight mt-0.5 hidden sm:block">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-gray-100 py-6 text-center space-y-1">
          <p className="text-xs text-gray-400">© 2026 TravelDoc AI · Built for travelers worldwide</p>
          <p className="text-xs text-gray-400">Not a substitute for professional medical advice</p>
        </div>

      </div>
    </div>
  );
}
