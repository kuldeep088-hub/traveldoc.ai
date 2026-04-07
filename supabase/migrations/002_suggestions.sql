-- Suggestions table for user-submitted doctors
CREATE TABLE IF NOT EXISTS public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow anyone to insert suggestions (public form)
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit suggestions" ON public.suggestions;
CREATE POLICY "Anyone can submit suggestions"
  ON public.suggestions FOR INSERT
  WITH CHECK (true);
