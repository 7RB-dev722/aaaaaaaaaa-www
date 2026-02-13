/*
  # [Feature] Add Custom Colors to Invoice Templates
  This migration adds `bg_color` and `text_color` columns to the `invoice_templates` table.
  These colors are used for the generated invoice layout.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table Modified: `public.invoice_templates`
  - Columns Added: `bg_color` (TEXT), `text_color` (TEXT)
*/

ALTER TABLE public.invoice_templates 
ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#f3f4f6',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#111827';

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
