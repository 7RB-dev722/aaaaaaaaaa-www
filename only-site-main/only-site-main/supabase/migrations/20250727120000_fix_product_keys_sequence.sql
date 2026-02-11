/*
# [Fix] Correct Product Keys Table ID Sequence
This migration fixes a bug where the `id` column of the `product_keys` table was not auto-incrementing, causing errors when adding new keys. This script creates the necessary sequence and links it to the `id` column.

## Query Description:
This is a non-destructive operation that corrects the table's structure. It ensures that new product keys can be added without errors. There is no risk to existing data in the `product_keys` table.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `product_keys`
- Column: `id`
- Action: Creates a sequence `product_keys_id_seq` and sets it as the default for the `id` column.

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Admin privileges to run migrations.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. This is a standard schema fix.
*/

-- Create the sequence for the primary key if it doesn't exist.
CREATE SEQUENCE IF NOT EXISTS public.product_keys_id_seq;

-- Alter the 'id' column to use the new sequence as its default value.
-- This ensures that new rows get an auto-incrementing ID.
ALTER TABLE public.product_keys ALTER COLUMN id SET DEFAULT nextval('public.product_keys_id_seq');

-- Associate the sequence with the column. This is good practice and ensures
-- that if the column is dropped, the sequence is also dropped.
ALTER SEQUENCE public.product_keys_id_seq OWNED BY public.product_keys.id;
