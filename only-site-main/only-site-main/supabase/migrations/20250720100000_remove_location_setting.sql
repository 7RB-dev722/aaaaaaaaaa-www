/*
          # [Operation Name]
          Remove Location Requirement Setting

          ## Query Description: [This operation removes the 'require_location_on_payment' setting from the site_settings table. This setting is no longer needed as the location requirement feature has been removed from the application. This is a safe cleanup operation and will not affect any other data.]
          
          ## Metadata:
          - Schema-Category: ["Data"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Table: site_settings
          - Action: Deletes a specific row
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [Admin]
          
          ## Performance Impact:
          - Indexes: [Not Affected]
          - Triggers: [Not Affected]
          - Estimated Impact: [None]
          */

DELETE FROM public.site_settings
WHERE key = 'require_location_on_payment';
