import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import {
  Brain, Calendar, MapPin, LocateFixed, GitCompare,
  Mic, PlusCircle, Map, MessageSquare, Search,
  ArrowRight, CheckCircle, Stethoscope, Globe2, Thermometer,
} from "lucide-react";

const features = [
  {
    icon: Thermometer,
    title: "I Feel Sick Right Now",
    description:
      "Describe your symptoms. AI asks 2–3 questions, then tells you exactly what to do — rest at home, see a doctor today, or go to the ER.",
    href: "/symptom-check",
    cta: "Start symptom check",
    color: "red",
    badge: "Start here",
  },
  {
    icon: Search,
    title: "Find a Doctor",
    description:
      "Search thousands of doctors worldwide by city, specialty, and language. Real-time results from OpenStreetMap.",
    href: "/search",
    cta: "Search now",
    color: "blue",
    badge: null,
  },
  {
    icon: Brain,
    title: "AI Recommendation",
    description:
      "Describe your symptoms, travel context, allergies, and conditions. AI ranks the best doctors for your exact situation.",
    href: "/recommend",
    cta: "Get recommendation",
    color: "purple",
    badge: "Popular",
  },
  {
    icon: MessageSquare,
    title: "AI Conversation",
    description:
      "Chat or speak with your AI medical assistant. Type or use your voice — works in any language, hands-free.",
    href: "/conversation",
    cta: "Start conversation",
    color: "green",
    badge: "New",
  },
  {
    icon: Map,
    title: "Map View",
    description:
      "See all nearby doctors on an interactive map. Click any pin to view their address, phone, and profile.",
    href: "/search",
    cta: "Open map",
    color: "orange",
    badge: null,
  },
  {
    icon: LocateFixed,
    title: "Use My Location",
    description:
      "One tap to detect your city automatically. Instantly finds doctors closest to where you are right now.",
    href: "/search",
    cta: "Find near me",
    color: "teal",
    badge: null,
  },
  {
    icon: GitCompare,
    title: "Doctor Comparison",
    description:
      "Select 2–3 doctors from your results and let AI compare them side-by-side for your specific medical need.",
    href: "/recommend",
    cta: "Compare doctors",
    color: "indigo",
    badge: null,
  },
  {
    icon: Mic,
    title: "Voice Agent",
    description:
      "Press the bot button on any page to start a voice conversation. AI guides you to the right care in your language.",
    href: "/conversation",
    cta: "Try voice",
    color: "rose",
    badge: null,
  },
  {
    icon: Calendar,
    title: "My Appointments",
    description:
      "Book and manage your doctor appointments. Track pending, confirmed, and completed visits all in one place.",
    href: "/appointments",
    cta: "View appointments",
    color: "pink",
    badge: null,
  },
  {
    icon: PlusCircle,
    title: "Suggest a Doctor",
    description:
      "Know a great doctor not in our system? Submit their details and help other travelers find better care.",
    href: "/suggest",
    cta: "Suggest a doctor",
    color: "yellow",
    badge: null,
  },
];

const colorMap: Record<string, { bg: string; icon: string; badge: string; border: string }> = {
  red:    { bg: "bg-red-50",    icon: "text-red-600 bg-red-100",    badge: "bg-red-600 text-white",        border: "hover:border-red-300" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600 bg-blue-100",   badge: "bg-blue-100 text-blue-600",   border: "hover:border-blue-200" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600 bg-purple-100", badge: "bg-purple-100 text-purple-600", border: "hover:border-purple-200" },
  green:  { bg: "bg-green-50",  icon: "text-green-600 bg-green-100",  badge: "bg-green-100 text-green-600",  border: "hover:border-green-200" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600 bg-orange-100", badge: "bg-orange-100 text-orange-600", border: "hover:border-orange-200" },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-600 bg-teal-100",   badge: "bg-teal-100 text-teal-600",   border: "hover:border-teal-200" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600 bg-indigo-100", badge: "bg-indigo-100 text-indigo-600", border: "hover:border-indigo-200" },
  rose:   { bg: "bg-rose-50",   icon: "text-rose-600 bg-rose-100",   badge: "bg-rose-100 text-rose-600",   border: "hover:border-rose-200" },
  pink:   { bg: "bg-pink-50",   icon: "text-pink-600 bg-pink-100",   badge: "bg-pink-100 text-pink-600",   border: "hover:border-pink-200" },
  yellow: { bg: "bg-yellow-50", icon: "text-yellow-600 bg-yellow-100", badge: "bg-yellow-100 text-yellow-600", border: "hover:border-yellow-200" },
};

const stats = [
  { value: "50+", label: "Countries" },
  { value: "10,000+", label: "Doctors" },
  { value: "100+", label: "Languages" },
  { value: "AI", label: "Powered" },
];

const howItWorks = [
  {
    step: "01",
    icon: MapPin,
    title: "Enter your city",
    description: "Type your city or tap 'Use my location' to auto-detect where you are.",
  },
  {
    step: "02",
    icon: Brain,
    title: "Let AI find your match",
    description: "Describe your symptoms and the AI ranks the best doctors for your exact situation.",
  },
  {
    step: "03",
    icon: Calendar,
    title: "Book your appointment",
    description: "View doctor profiles, contact them directly, and save your appointment in the app.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Trusted by travelers in 50+ countries
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-balance">
              Find the Best Doctor{" "}
              <span className="text-blue-200">in Any City</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto text-balance">
              AI-powered doctor search for travelers and new residents. Filter by
              language, specialty, and location — get a personalized match in seconds.
            </p>

            {/* I Feel Sick CTA */}
            <div className="mt-8 mb-2">
              <Link
                href="/symptom-check"
                className="inline-flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold px-7 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all text-base"
              >
                <Thermometer className="w-5 h-5" />
                I feel sick right now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-blue-200 text-xs mt-2">Describe your symptoms — AI tells you what to do in 30 seconds</p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <SearchForm />
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-blue-200 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">How it works</h2>
            <p className="text-gray-500 text-sm mt-2">Find a doctor in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="flex flex-col items-center text-center relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-brand-600" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Stethoscope className="w-3.5 h-3.5" />
              Everything in one place
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              All features — scroll & click to use
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every tool you need to find the right doctor, from AI recommendations
              to voice conversations — all free, all here.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const c = colorMap[f.color];
              return (
                <Link
                  key={f.title}
                  href={f.href}
                  className={`group relative flex flex-col p-6 rounded-2xl bg-white border border-gray-100 ${c.border} hover:shadow-md transition-all duration-200`}
                >
                  {/* Badge */}
                  {f.badge && (
                    <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {f.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${c.icon}`}>
                    <f.icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{f.description}</p>

                  {/* CTA */}
                  <div className="flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-600 group-hover:gap-2.5 transition-all">
                    {f.cta}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why TravelDoc */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Built for travelers, expats & anyone abroad
              </h2>
              <div className="space-y-3">
                {[
                  "Works in 100+ languages — voice and text",
                  "Finds doctors in any city worldwide, instantly",
                  "AI detects emergencies and guides you to the ER",
                  "Free to use — no subscription, no billing",
                  "Doctor comparison and smart questions to ask",
                  "Appointment tracking in one place",
                ].map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {point}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Quick access</p>
              {[
                { label: "I feel sick right now", href: "/symptom-check", icon: Thermometer, red: true },
                { label: "Find doctors near me", href: "/search", icon: MapPin, red: false },
                { label: "AI doctor recommendation", href: "/recommend", icon: Brain, red: false },
                { label: "Chat or speak with AI", href: "/conversation", icon: MessageSquare, red: false },
                { label: "My appointments", href: "/appointments", icon: Calendar, red: false },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors group ${item.red ? "border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300" : "border-gray-100 hover:border-brand-200 hover:bg-brand-50"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.red ? "bg-red-100 group-hover:bg-red-200" : "bg-brand-50 group-hover:bg-brand-100"}`}>
                    <item.icon className={`w-4 h-4 ${item.red ? "text-red-600" : "text-brand-600"}`} />
                  </div>
                  <span className={`text-sm font-medium ${item.red ? "text-red-700 font-semibold" : "text-gray-700"}`}>{item.label}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ml-auto transition-colors ${item.red ? "text-red-300 group-hover:text-red-500" : "text-gray-300 group-hover:text-brand-400"}`} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Globe2 className="w-10 h-10 text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to find your doctor?
          </h2>
          <p className="text-blue-100 mb-8">
            Search for free, in any city, right now. No account needed to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/symptom-check"
              className="inline-flex items-center justify-center gap-2 bg-red-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors"
            >
              <Thermometer className="w-4 h-4" />
              I Feel Sick Right Now
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Find a Doctor
            </Link>
            <Link
              href="/recommend"
              className="inline-flex items-center justify-center gap-2 bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-800 transition-colors border border-blue-400"
            >
              <Brain className="w-4 h-4" />
              AI Recommendation
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">© 2026 TravelDoc AI. Built for travelers worldwide.</p>
          <p className="text-xs text-gray-400">Not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
