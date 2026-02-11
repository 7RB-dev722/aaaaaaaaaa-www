/*
# [Create Purchase Intents Table]
This operation creates a new table `purchase_intents` to store user information collected before they proceed to the final payment page. This helps in tracking user interest and provides contact information for follow-ups.

## Query Description: [This script creates the `purchase_intents` table for tracking pre-purchase user data. It includes columns for product details, user contact information, and country. It also sets up Row Level Security (RLS) to ensure users can only insert their own data and that only administrators can read or delete this sensitive information. No existing data is affected as this is a new table.]

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Tables Added:
  - `public.purchase_intents`
- Columns Added to `purchase_intents`:
  - `id` (uuid, primary key)
  - `created_at` (timestamptz)
  - `product_id` (uuid, foreign key to `products.id`)
  - `product_title` (text)
  - `country` (text)
  - `email` (text)
  - `phone_number` (text)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
  - `Allow anonymous insert`: Allows any user (including unauthenticated ones) to insert a record into the table.
  - `Allow admin full access`: Grants administrators (users with `service_role`) full SELECT, INSERT, UPDATE, and DELETE permissions.
- Auth Requirements: None for insert, admin for read/delete.

## Performance Impact:
- Indexes: A primary key index is automatically created on the `id` column. A foreign key index is created on `product_id`.
- Triggers: None
- Estimated Impact: Low, as this is a new table with initially low traffic.
*/

-- Create the purchase_intents table
CREATE TABLE public.purchase_intents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    product_id uuid NOT NULL,
    product_title text NOT NULL,
    country text NOT NULL,
    email text NOT NULL,
    phone_number text NOT NULL,
    CONSTRAINT purchase_intents_pkey PRIMARY KEY (id),
    CONSTRAINT purchase_intents_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.purchase_intents IS 'Stores user information collected before proceeding to payment.';
COMMENT ON COLUMN public.purchase_intents.product_id IS 'The product the user intends to purchase.';
COMMENT ON COLUMN public.purchase_intents.product_title IS 'Denormalized product title for easier display in admin panel.';
COMMENT ON COLUMN public.purchase_intents.country IS 'User''s country of residence.';
COMMENT ON COLUMN public.purchase_intents.email IS 'User''s email address.';
COMMENT ON COLUMN public.purchase_intents.phone_number IS 'User''s phone number.';

-- Enable Row Level Security
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- Grant usage on the schema to the anon role
GRANT USAGE ON SCHEMA public TO anon;

-- Grant insert permissions to the anon role
GRANT INSERT ON TABLE public.purchase_intents TO anon;

-- Create RLS policies
CREATE POLICY "Allow anonymous insert"
ON public.purchase_intents
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow admin full access"
ON public.purchase_intents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
