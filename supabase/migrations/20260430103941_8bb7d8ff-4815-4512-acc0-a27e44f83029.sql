ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS expertise text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;