-- Add crypto-specific fields to local_payment_methods
ALTER TABLE local_payment_methods 
ADD COLUMN IF NOT EXISTS is_crypto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS crypto_network TEXT;

-- Update RLS policies to ensure these new fields are accessible
-- (Existing policies usually cover 'all columns', but good to be safe if you had specific column grants)
