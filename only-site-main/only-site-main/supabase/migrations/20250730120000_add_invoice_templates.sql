/*
  # [Feature] Add Invoice Templates Table
  This migration creates a new table `invoice_templates` to store customizable invoice settings for different brands (e.g., Cheatloop, Sinki). This allows for brand-specific logos, names, and contact details on generated invoices.

  ## Query Description: 
  - Creates the `invoice_templates` table with columns for brand name, logo URL, company name, support contact, and footer notes.
  - The `brand_name` is unique to ensure one template per brand.
  - Enables Row Level Security (RLS) on the new table.
  - Creates RLS policies to allow public read access (for generating invoices) and admin-only write access (for editing templates).

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (Can be reversed by dropping the table and policies)

  ## Structure Details:
  - Table Created: `public.invoice_templates`
  - Columns: `id`, `brand_name`, `logo_url`, `company_name`, `support_contact`, `footer_notes`, `created_at`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: Yes (New policies for `invoice_templates`)
  - Auth Requirements: Admins (`authenticated` role) can manage templates. Anyone can read them.

  ## Performance Impact:
  - Indexes: Primary key and unique index on `brand_name`.
  - Triggers: None
  - Estimated Impact: Negligible.
*/

CREATE TABLE IF NOT EXISTS public.invoice_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    brand_name text NOT NULL,
    logo_url text,
    company_name text,
    support_contact text,
    footer_notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT invoice_templates_pkey PRIMARY KEY (id),
    CONSTRAINT invoice_templates_brand_name_key UNIQUE (brand_name)
);

ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "Allow public read access to invoice templates" ON public.invoice_templates;
DROP POLICY IF EXISTS "Allow admin users to manage invoice templates" ON public.invoice_templates;

-- Policies for invoice_templates
CREATE POLICY "Allow public read access to invoice templates"
ON public.invoice_templates
FOR SELECT
USING (true);

CREATE POLICY "Allow admin users to manage invoice templates"
ON public.invoice_templates
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Seed initial data for the two brands
INSERT INTO public.invoice_templates (brand_name, company_name, support_contact, footer_notes)
VALUES 
    ('cheatloop', 'Cheatloop Team', 'Contact via site', 'Thank you for your purchase!'),
    ('sinki', 'Sinki Team', 'Contact via site', 'Thank you for your purchase!')
ON CONFLICT (brand_name) DO NOTHING;
