/*
  # Add Currency Symbol to Local Payment Methods
  
  ## Query Description:
  This migration adds a 'currency_symbol' column to the 'local_payment_methods' table.
  This allows specifying the currency code (e.g., IQD, TRY, USD) for each payment method explicitly.
  
  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: Low
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: local_payment_methods
  - Column: currency_symbol (text, nullable)
*/

ALTER TABLE local_payment_methods ADD COLUMN IF NOT EXISTS currency_symbol text;
