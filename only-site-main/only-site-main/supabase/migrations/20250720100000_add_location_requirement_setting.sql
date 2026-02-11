/*
# [Operation Name]
Add Location Requirement Setting for Payments

## Query Description: [This operation adds a new configuration option to the site_settings table. This new setting, `require_location_for_payment`, allows administrators to enable or disable the requirement for users to share their location before making a payment. This change is non-destructive and adds new functionality without affecting existing data.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Table: site_settings
- Action: INSERT (if not exists)
- Column: key, value

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [No]
- Auth Requirements: [Admin]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. Adds a single row to a small configuration table.]
*/

INSERT INTO public.site_settings (key, value)
SELECT 'require_location_for_payment', 'true'
WHERE NOT EXISTS (
    SELECT 1 FROM public.site_settings WHERE key = 'require_location_for_payment'
);
