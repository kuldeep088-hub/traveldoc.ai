-- TravelDoc AI — Doctor Reviews & Ratings
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_osm_id   text NOT NULL,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating          smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text     text CHECK (char_length(review_text) <= 1000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_osm_id, user_id)
);

ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.doctor_reviews FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews"
  ON public.doctor_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.doctor_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.doctor_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reviews_doctor_osm_id_idx ON public.doctor_reviews (doctor_osm_id);
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON public.doctor_reviews (user_id);
