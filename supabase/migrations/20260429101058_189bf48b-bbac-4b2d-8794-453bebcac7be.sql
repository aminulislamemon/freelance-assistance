-- Add 'cancelled' to project_status enum
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add description column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description text;