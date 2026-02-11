/*
  # [Feature] Add Site Content Settings
  [This migration adds new rows to the `site_settings` table to allow dynamic content management for the homepage from the admin panel. It sets default values based on the current hardcoded content.]

  ## Query Description: [This operation inserts new configuration keys into the `site_settings` table. It is safe to run and will not overwrite existing keys if they are already present. No data will be lost.]

  ## Metadata:
  - Schema-Category: ["Data"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - Table: `site_settings`
  - Columns Affected: `key`, `value`

  ## Security Implications:
  - RLS Status: [Not Applicable]
  - Policy Changes: [No]
  - Auth Requirements: [Admin privileges to run migrations]

  ## Performance Impact:
  - Indexes: [No change]
  - Triggers: [No change]
  - Estimated Impact: [None]
*/

INSERT INTO public.site_settings (key, value)
VALUES
    ('site_name', 'Cheatloop'),
    ('site_logo_url', '/cheatloop copy.png'),
    ('hero_title', 'Dominate the Game'),
    ('hero_subtitle', 'Professional gaming tools for PUBG Mobile & Call of Duty Mobile. Safe, reliable, and designed for competitive players.'),
    ('feature_1_title', '100% Safe'),
    ('feature_1_desc', 'Protected from bans'),
    ('feature_2_title', 'Precision Tools'),
    ('feature_2_desc', 'Advanced aimbot & ESP'),
    ('feature_3_title', 'Instant Access'),
    ('feature_3_desc', 'Download immediately'),
    ('footer_copyright', '© 2025 Cheatloop. All rights reserved. Use responsibly and at your own risk.')
ON CONFLICT (key) DO NOTHING;
