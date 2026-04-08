"use client";

import { useState } from "react";
import { ReviewForm } from "@/components/review-form";
import { ReviewList } from "@/components/review-list";

export function ReviewSection({ doctorOsmId }: { doctorOsmId: string }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
      <h2 className="text-base font-bold text-gray-900 mb-5">Patient Reviews</h2>
      <div className="mb-5 pb-5 border-b border-gray-100">
        <ReviewForm
          doctorOsmId={doctorOsmId}
          onReviewSaved={() => setRefreshKey((k) => k + 1)}
        />
      </div>
      <ReviewList doctorOsmId={doctorOsmId} refreshKey={refreshKey} />
    </div>
  );
}
