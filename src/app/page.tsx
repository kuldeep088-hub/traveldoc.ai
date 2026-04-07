import { SearchForm } from "@/components/search-form";
import { Globe, Star, Brain, Calendar } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Any City, Worldwide",
    description:
      "Search for doctors in any city across the globe. Real-time data from Google Places.",
  },
  {
    icon: Star,
    title: "Verified Ratings",
    description:
      "See real patient ratings and reviews. Filter by specialty, language, and distance.",
  },
  {
    icon: Brain,
    title: "AI-Powered Match",
    description:
      "Describe your symptoms or needs. Our AI analyzes all doctors and finds your best match.",
  },
  {
    icon: Calendar,
    title: "Easy Booking",
    description:
      "Request appointments directly from the app. Get confirmation and reminders.",
  },
];

const stats = [
  { value: "50+", label: "Countries" },
  { value: "10,000+", label: "Doctors" },
  { value: "15+", label: "Languages" },
  { value: "AI", label: "Recommendations" },
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
              language, specialty, and location — get a personalized match in
              seconds.
            </p>
          </div>

          {/* Search form */}
          <div className="max-w-3xl mx-auto">
            <SearchForm />
          </div>

          {/* Stats */}
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

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need when you need it most
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Whether you're traveling abroad or just moved to a new city,
              TravelDoc AI helps you find the right doctor fast.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:border-brand-200 hover:bg-brand-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-50 border-t border-brand-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Not sure which doctor to choose?
          </h2>
          <p className="text-gray-500 mb-6">
            Describe your symptoms and our AI will analyze every doctor in your
            city and recommend the best fit for you.
          </p>
          <a
            href="/recommend"
            className="inline-flex items-center gap-2 bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Brain className="w-4 h-4" />
            Get AI Recommendation
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2026 TravelDoc AI. Built for travelers worldwide.
          </p>
          <p className="text-xs text-gray-400">
            Not a substitute for professional medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
