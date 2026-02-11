/*
  # [FEATURE] Add Barcode Payment Option
  This migration adds a new column `barcode_image_url` to the `products` table to support a new QR code-based payment method.

  ## Query Description:
  - This operation adds a new `barcode_image_url` column to the `products` table.
  - The column is of type `text` and is nullable, meaning existing products will not be affected.
  - This change is non-destructive and fully reversible. No data is at risk.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table Modified: `products`
  - Column Added: `barcode_image_url` (TEXT)

  ## Security Implications:
  - RLS Status: Unchanged
  - Policy Changes: No
  - Auth Requirements: None

  ## Performance Impact:
  - Indexes: None added
  - Triggers: None added
  - Estimated Impact: Negligible. The new column is nullable and will not impact query performance on existing data.
*/
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS barcode_image_url TEXT;
