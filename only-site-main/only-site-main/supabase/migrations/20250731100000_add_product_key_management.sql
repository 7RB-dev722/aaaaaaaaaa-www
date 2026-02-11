/*
          # [Operation Name]
          Create Product Keys Table and Claim Function

          ## Query Description: [This operation adds a new table `product_keys` to manage product license keys and a database function `claim_available_key` to atomically claim an available key for a customer. This is a structural change and does not affect existing data, but it is essential for the new key management feature to work.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Adds table: `public.product_keys`
          - Adds function: `public.claim_available_key(uuid, text, uuid)`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Authenticated users (admins)]
          
          ## Performance Impact:
          - Indexes: [Primary Key, Foreign Keys, Unique Constraint]
          - Triggers: [None]
          - Estimated Impact: [Low. The new table and function will only be used in the admin panel.]
          */
CREATE TABLE public.product_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    product_id uuid NOT NULL,
    key_value text NOT NULL,
    is_used boolean NOT NULL DEFAULT false,
    used_by_email text NULL,
    used_at timestamp with time zone NULL,
    purchase_intent_id uuid NULL,
    CONSTRAINT product_keys_pkey PRIMARY KEY (id),
    CONSTRAINT product_keys_key_value_key UNIQUE (key_value),
    CONSTRAINT product_keys_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
    CONSTRAINT product_keys_purchase_intent_id_fkey FOREIGN KEY (purchase_intent_id) REFERENCES public.purchase_intents(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;

-- Grant usage on the new table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_keys TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_keys_id_seq TO authenticated; -- For older postgres versions if sequence is created

-- Policies for admin access
CREATE POLICY "Allow all access to authenticated users"
ON public.product_keys
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- RPC function to claim a key atomically
CREATE OR REPLACE FUNCTION public.claim_available_key(p_product_id uuid, p_email text, p_intent_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    claimed_key_record RECORD;
    claimed_key_value TEXT;
BEGIN
    -- Find and lock an available key for the given product
    SELECT id, key_value INTO claimed_key_record
    FROM public.product_keys
    WHERE product_id = p_product_id AND NOT is_used
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If no key is found, raise an exception
    IF claimed_key_record.id IS NULL THEN
        RAISE EXCEPTION 'No available keys for this product.';
    END IF;

    -- Mark the key as used
    UPDATE public.product_keys
    SET
        is_used = TRUE,
        used_by_email = p_email,
        used_at = now(),
        purchase_intent_id = p_intent_id
    WHERE id = claimed_key_record.id
    RETURNING key_value INTO claimed_key_value;
    
    RETURN claimed_key_value;
END;
$$;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.claim_available_key(uuid, text, uuid) TO authenticated;
