"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./star-rating";
import { Pencil, Trash2, CheckCircle } from "lucide-react";

interface ReviewFormProps {
  doctorOsmId: string;
  onReviewSaved?: () => void;
}

export function ReviewForm({ doctorOsmId, onReviewSaved }: ReviewFormProps) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingReview, setExistingReview] = useState<{ rating: number; review_text: string | null } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/reviews?doctor_osm_id=${encodeURIComponent(doctorOsmId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user_review) {
          setExistingReview(data.user_review);
          setRating(data.user_review.rating);
          setText(data.user_review.review_text ?? "");
        }
      })
      .catch(() => null);
  }, [user, doctorOsmId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctor_osm_id: doctorOsmId, rating, review_text: text.trim() || null }),
      });
      if (res.ok) {
        setSuccess(true);
        setEditing(false);
        setExistingReview({ rating, review_text: text.trim() || null });
        onReviewSaved?.();
        setTimeout(() => setSuccess(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/reviews?doctor_osm_id=${encodeURIComponent(doctorOsmId)}`, { method: "DELETE" });
      setExistingReview(null);
      setRating(0);
      setText("");
      setEditing(false);
      onReviewSaved?.();
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4 text-sm text-gray-400">
        <a href="/auth/login" className="text-brand-600 font-medium hover:underline">Sign in</a> to leave a review
      </div>
    );
  }

  // Show existing review (not editing)
  if (existingReview && !editing) {
    return (
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-brand-700">Your review</p>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-brand-600 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} disabled={loading} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <StarRating value={existingReview.rating} size="sm" />
        {existingReview.review_text && (
          <p className="text-sm text-gray-600 mt-2">{existingReview.review_text}</p>
        )}
        {success && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 mt-2">
            <CheckCircle className="w-3.5 h-3.5" /> Saved!
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2">
          {existingReview ? "Edit your review" : "Rate this doctor"}
        </p>
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience (optional)"
        maxLength={1000}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-gray-50"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!rating || loading}
          className="flex-1 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving..." : success ? "Saved!" : existingReview ? "Update Review" : "Submit Review"}
        </button>
        {editing && (
          <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
