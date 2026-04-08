"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange?: (rating: number) => void;
  size?: "sm" | "md";
  reviewsCount?: number | null;
}

export function StarRating({ value, onChange, size = "sm", reviewsCount }: StarRatingProps) {
  const isInteractive = !!onChange;
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => onChange?.(star)}
            className={cn(
              "transition-transform",
              isInteractive && "hover:scale-110 cursor-pointer",
              !isInteractive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sz,
                (value ?? 0) >= star
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-200 fill-gray-200"
              )}
            />
          </button>
        ))}
      </div>
      {value != null && value > 0 && (
        <span className={cn("font-semibold text-gray-700", size === "sm" ? "text-xs" : "text-sm")}>
          {value.toFixed(1)}
        </span>
      )}
      {reviewsCount != null && reviewsCount > 0 && (
        <span className="text-xs text-gray-400">({reviewsCount.toLocaleString()})</span>
      )}
    </div>
  );
}
