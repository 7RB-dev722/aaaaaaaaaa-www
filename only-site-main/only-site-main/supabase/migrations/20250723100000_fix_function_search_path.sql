-- [SECURITY FIX] This migration hardens existing database functions by setting a secure search_path, mitigating the risk of search path hijacking attacks as flagged by the security advisor.

/*
  # [Function Security Update: is_admin]
  [This operation updates the is_admin() function to explicitly set the search_path. This is a security best practice to prevent potential search path hijacking attacks, ensuring the function operates in a predictable and secure environment.]

  ## Query Description: [This operation modifies an existing function to enhance security. It ensures that the function's execution context is properly isolated by setting the search_path. There is no impact on existing data, and this change is considered safe and reversible.]

  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being affected: is_admin()
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF session_user = 'supabase_admin' THEN
    RETURN TRUE;
  END IF;
  IF current_setting('request.jwt.claims', true)::jsonb->>'email' = 'abdulawatban@gmail.com' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

/*
  # [Function Security Update: get_user_id_by_email]
  [This operation updates the get_user_id_by_email() function to explicitly set the search_path. This is a security best practice to prevent potential search path hijacking attacks, ensuring the function operates in a predictable and secure environment.]

  ## Query Description: [This operation modifies an existing function to enhance security. It ensures that the function's execution context is properly isolated by setting the search_path. There is no impact on existing data, and this change is considered safe and reversible.]

  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being affected: get_user_id_by_email(text)
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_text text)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_val UUID;
BEGIN
  SELECT id INTO user_id_val FROM auth.users WHERE email = email_text;
  RETURN user_id_val;
END;
$$;

/*
  # [Function Security Update: delete_user_by_email]
  [This operation updates the delete_user_by_email() function to explicitly set the search_path. This is a security best practice to prevent potential search path hijacking attacks, ensuring the function operates in a predictable and secure environment.]

  ## Query Description: [This operation modifies an existing function to enhance security. It ensures that the function's execution context is properly isolated by setting the search_path. There is no impact on existing data, and this change is considered safe and reversible.]

  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being affected: delete_user_by_email(text)
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.delete_user_by_email(email_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_to_delete UUID;
BEGIN
  user_id_to_delete := public.get_user_id_by_email(email_text);
  IF user_id_to_delete IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = user_id_to_delete;
  END IF;
END;
$$;

/*
  # [Function Security Update: delete_user_and_related_data]
  [This operation updates the delete_user_and_related_data() function to explicitly set the search_path. This is a security best practice to prevent potential search path hijacking attacks, ensuring the function operates in a predictable and secure environment.]

  ## Query Description: [This operation modifies an existing function to enhance security. It ensures that the function's execution context is properly isolated by setting the search_path. There is no impact on existing data, and this change is considered safe and reversible.]

  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being affected: delete_user_and_related_data()
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.delete_user_and_related_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_profiles WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

/*
  # [Function Security Update: handle_new_user]
  [This operation updates the handle_new_user() function to explicitly set the search_path. This is a security best practice to prevent potential search path hijacking attacks, ensuring the function operates in a predictable and secure environment.]

  ## Query Description: [This operation modifies an existing function to enhance security. It ensures that the function's execution context is properly isolated by setting the search_path. There is no impact on existing data, and this change is considered safe and reversible.]

  ## Metadata:
  - Schema-Category: ["Security"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]
  
  ## Structure Details:
  - Function being affected: handle_new_user()
  
  ## Security Implications:
  - RLS Status: [N/A]
  - Policy Changes: [No]
  - Auth Requirements: [N/A]
  
  ## Performance Impact:
  - Indexes: [N/A]
  - Triggers: [N/A]
  - Estimated Impact: [None]
*/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;
