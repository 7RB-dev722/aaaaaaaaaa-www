/*
          # [Operation Name]
          Create Purchase Images Table

          ## Query Description: [This operation creates a new table `purchase_images` to store images used for barcode payments. It includes columns for an ID, name, URL, and creation timestamp. This change is non-destructive and adds new functionality for managing payment images.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - tables:
            - purchase_images (new)
          - columns:
            - id (uuid, pk)
            - name (text)
            - image_url (text)
            - created_at (timestamptz)
          
          ## Security Implications:
          - RLS Status: Disabled
          - Policy Changes: No
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: Primary key index on `id`.
          - Triggers: None
          - Estimated Impact: Low, as it's a new, unpopulated table.
          */

CREATE TABLE IF NOT EXISTS purchase_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS purchase_image_id UUID REFERENCES purchase_images(id) ON DELETE SET NULL;
