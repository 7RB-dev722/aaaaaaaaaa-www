-- Add position column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Create a policy to allow authenticated users to update categories (already exists usually, but ensuring update on position works)
-- This assumes the user has already run previous migrations.

-- Optional: Set initial positions based on creation date to prevent random order initially
WITH ranked_categories AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rnk
  FROM public.categories
)
UPDATE public.categories
SET position = ranked_categories.rnk
FROM ranked_categories
WHERE public.categories.id = ranked_categories.id;
