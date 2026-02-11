/*
  # [FEATURE] Add Show/Hide for Product Card Note
  This migration adds a new setting to control the visibility of the "Important Note" section on product cards.

  ## Query Description:
  - This operation adds a new row to the `site_settings` table.
  - The new key `show_product_card_note` will have a default value of `true`.
  - This is a non-destructive operation and will not affect existing data.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: `site_settings`
  - Columns Added: N/A (new row added)
  - Key: `show_product_card_note`
  - Default Value: `true`

  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: No
  - Auth Requirements: Admin access to modify settings.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/

INSERT INTO public.site_settings (key, value)
VALUES ('show_product_card_note', 'true')
ON CONFLICT (key) DO NOTHING;
