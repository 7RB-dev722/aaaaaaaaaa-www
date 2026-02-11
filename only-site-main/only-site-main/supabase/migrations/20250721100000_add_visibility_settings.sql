/*
  # [Operation Name]
  Add Visibility Controls for Contact Buttons and Editable Note

  ## Query Description: [This operation adds three new settings to your site's configuration. It allows you to control the visibility of WhatsApp and Telegram buttons and customize the 'Important Note' text on product cards directly from the admin panel. This is a safe, non-destructive operation that adds new rows to the 'site_settings' table. No existing data will be altered or lost.]

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Table: site_settings
  - Action: INSERT
  - Columns Added:
    - key: 'show_whatsapp_button', value: 'true'
    - key: 'show_telegram_in_card', value: 'true'
    - key: 'product_card_note', value: 'After purchase, contact us to get your key and product'

  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [No]
  - Auth Requirements: [None for this migration]

  ## Performance Impact:
  - Indexes: [Not Applicable]
  - Triggers: [Not Applicable]
  - Estimated Impact: [None. Adds new configuration rows.]
*/
INSERT INTO public.site_settings (key, value)
VALUES
    ('show_whatsapp_button', 'true'),
    ('show_telegram_in_card', 'true'),
    ('product_card_note', 'After purchase, contact us to get your key and product')
ON CONFLICT (key) DO NOTHING;
