import { Suspense } from "react";
import { SearchResults } from "./search-results";
import { SearchForm } from "@/components/search-form";

interface SearchPageProps {
  searchParams: Promise<{ city?: string; specialty?: string; language?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Inline search bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
        <SearchForm inline />
      </div>

      {params.city ? (
        <Suspense fallback={null}>
          <SearchResults
            city={params.city}
            specialty={params.specialty ?? ""}
            language={params.language ?? ""}
          />
        </Suspense>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Enter a city above to find doctors
        </div>
      )}
    </div>
  );
}
