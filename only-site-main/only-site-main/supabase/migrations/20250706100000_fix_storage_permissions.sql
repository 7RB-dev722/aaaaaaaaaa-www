/*
  # [Policy] Allow Admin Uploads to site-assets
  [This policy grants authenticated users (admins) permission to upload new files (INSERT) into the 'site-assets' storage bucket. This is necessary for features like changing the site logo.]

  ## Query Description: [This query creates a Row Level Security (RLS) policy on the 'storage.objects' table. It does not modify or delete any existing data. It is a safe, additive security change.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: storage.objects
  - Policy for: INSERT
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [Authenticated Role]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible. RLS policies have a very minor overhead on queries.]
*/
CREATE POLICY "Admin can upload to site-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-assets');

/*
  # [Policy] Allow Admin Updates on site-assets
  [This policy grants authenticated users (admins) permission to update existing files in the 'site-assets' storage bucket. This is used when overwriting files.]

  ## Query Description: [This query creates a Row Level Security (RLS) policy on the 'storage.objects' table. It is a safe, additive security change.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: storage.objects
  - Policy for: UPDATE
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [Authenticated Role]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible.]
*/
CREATE POLICY "Admin can update site-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-assets');

/*
  # [Policy] Allow Admin Deletes from site-assets
  [This policy grants authenticated users (admins) permission to delete files from the 'site-assets' storage bucket.]

  ## Query Description: [This query creates a Row Level Security (RLS) policy on the 'storage.objects' table. It is a safe, additive security change.]
  
  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Table: storage.objects
  - Policy for: DELETE
  
  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [Authenticated Role]
  
  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible.]
*/
CREATE POLICY "Admin can delete from site-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-assets');
