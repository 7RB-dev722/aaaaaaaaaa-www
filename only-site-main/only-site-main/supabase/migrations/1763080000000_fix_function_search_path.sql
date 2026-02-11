/*
# [SECURITY] Set Function Search Path
This migration sets a fixed `search_path` for the `claim_available_key` function. This is a security best practice to prevent potential hijacking attacks by malicious users who might create objects (like tables or functions) with the same names in other schemas.

## Query Description:
- This operation alters the `claim_available_key` function to explicitly set its `search_path` to `public`.
- It is a non-destructive, safe operation that improves security.
- It does not affect existing data or the function's core logic.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by unsetting the search_path)

## Structure Details:
- Function affected: `public.claim_available_key(uuid, text, uuid)`

## Security Implications:
- RLS Status: Not Affected
- Policy Changes: No
- Auth Requirements: None
- Mitigates: Potential search_path hijacking vulnerabilities.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

ALTER FUNCTION public.claim_available_key(uuid, text, uuid) SET search_path = 'public';
