"use client";

import { useState, useEffect, useCallback } from "react";
import { StarRating } from "./star-rating";
import { Review } from "@/lib/types";

interface ReviewListProps {
  doctorOsmId: string;
  refreshKey?: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getInitials(userId: string) {
  return userId.slice(0, 2).toUpperCase();
}

export function ReviewList({ doctorOsmId, refreshKey }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/reviews?doctor_osm_id=${encodeURIComponent(doctorOsmId)}`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data.reviews ?? []);
        setAvgRating(data.avg_rating ?? null);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [doctorOsmId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4">
            <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full mb-1" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        No reviews yet. Be the first to rate this doctor.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {avgRating != null && (
        <div className="flex items-center gap-3 py-3 border-b border-gray-100">
          <span className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
          <div>
            <StarRating value={avgRating} size="md" />
            <p className="text-xs text-gray-400 mt-0.5">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
          </div>
        </div>
      )}

      {/* Individual reviews */}
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
            {getInitials(review.user_id)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StarRating value={review.rating} size="sm" />
              <span className="text-xs text-gray-400">{formatDate(review.created_at)}</span>
            </div>
            {review.review_text && (
              <p className="text-sm text-gray-600 leading-relaxed">{review.review_text}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
