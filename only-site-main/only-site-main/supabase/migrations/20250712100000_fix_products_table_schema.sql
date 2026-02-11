/*
# [Migration] Fix Products Table Schema
This migration script updates the `products` table to align it with the frontend application's requirements. It adds several missing columns and sets up necessary constraints and triggers for data integrity and automatic timestamping.

## Query Description: This operation will alter the structure of the `products` table.
1.  **Impact on Data:** No existing data will be lost. New columns will be added with default values (`is_hidden` will be `false`, `updated_at` will be the current time). The `category_id` will be `NULL` for existing products until manually updated.
2.  **Risks:** Low risk. The changes are additive. However, it's always recommended to back up your database before running structural changes.
3.  **Precautions:** Please back up your `products` table before applying this migration.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: true
- Reversible: false

## Structure Details:
- **Table:** `public.products`
- **Columns Added:**
  - `category_id` (UUID): To link products to categories.
  - `is_hidden` (BOOLEAN): To control product visibility.
  - `video_link` (TEXT): To store a URL for a gameplay video.
  - `updated_at` (TIMESTAMPTZ): To automatically track the last modification time.
- **Constraints Added:**
  - Foreign key on `category_id` referencing `categories(id)`.
- **Triggers Added:**
  - A trigger to automatically update the `updated_at` column on any change to a product.

## Security Implications:
- RLS Status: Unchanged. This migration does not alter Row Level Security policies.
- Policy Changes: No.
- Auth Requirements: Requires database owner or superuser privileges to run `ALTER TABLE`.

## Performance Impact:
- Indexes: A foreign key implicitly creates an index on `category_id`, which will improve join performance with the `categories` table.
- Triggers: Adds a lightweight trigger on `UPDATE` operations for the `products` table. The performance impact is negligible.
- Estimated Impact: Positive. The new index will speed up queries filtering or joining by category.
*/

-- Add missing columns to the 'products' table if they do not exist.
-- This makes the script safe to re-run.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_link TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add a foreign key constraint from 'products.category_id' to 'categories.id'.
-- This ensures data integrity. ON DELETE SET NULL prevents accidental deletion of products.
-- Drop the constraint first in case it exists in a broken state.
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS fk_products_category_id;

ALTER TABLE public.products
ADD CONSTRAINT fk_products_category_id
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL;

-- Create a trigger function to automatically update the 'updated_at' timestamp on any row modification.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the 'products' table.
-- Drop the trigger first to ensure the script can be re-run without errors.
DROP TRIGGER IF EXISTS on_products_update ON public.products;

CREATE TRIGGER on_products_update
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Notify PostgREST to reload the schema cache, which can help resolve the "column not found" error.
NOTIFY pgrst, 'reload schema';
