-- Fix: Remove UNIQUE constraint on NIT 
-- The NIT can be empty during initial setup and is not a reliable unique identifier
-- across businesses (multiple businesses might not have a NIT configured yet).

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_nit_key;

-- Also ensure the onboarding columns exist (idempotent)
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS vertical text DEFAULT 'general',
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{"enable_loyalty": false, "enable_bakery": false}'::jsonb;

-- Recreate the register_business RPC with personalization support
CREATE OR REPLACE FUNCTION public.register_business(
  p_business_name text,
  p_business_email text,
  p_profile_full_name text,
  p_owner_pin text,
  p_vertical text DEFAULT 'general',
  p_settings jsonb DEFAULT '{"enable_loyalty": false}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado en Supabase Auth';
  END IF;

  INSERT INTO public.businesses (name, email, vertical, settings)
  VALUES (p_business_name, p_business_email, p_vertical, p_settings)
  RETURNING id INTO v_business_id;

  INSERT INTO public.profiles (id, business_id, full_name, role, pin)
  VALUES (v_user_id, v_business_id, p_profile_full_name, 'owner', p_owner_pin)
  ON CONFLICT (id) DO UPDATE
  SET business_id = EXCLUDED.business_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      pin = EXCLUDED.pin;

  v_result := jsonb_build_object(
    'business_id', v_business_id, 
    'profile_id', v_user_id
  );
  
  RETURN v_result;
END;
$$;
