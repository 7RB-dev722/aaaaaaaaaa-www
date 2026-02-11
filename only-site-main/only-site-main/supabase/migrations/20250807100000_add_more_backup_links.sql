/*
  # Add More Backup Links
  Adds buy_link_4 and buy_link_5 to products table to support more alternative payment options.

  ## Query Description:
  This operation adds two new text columns to the products table.
  1. Safe operation: Adding nullable columns does not affect existing data.
  2. Reversible: Yes, columns can be dropped.
  3. No backup required for this specific change.

  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: Low
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: products
  - New Columns: buy_link_4 (text), buy_link_5 (text)
*/

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS buy_link_4 text,
ADD COLUMN IF NOT EXISTS buy_link_5 text;
