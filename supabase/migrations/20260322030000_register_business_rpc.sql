-- Fase 4 Fix: Transacción Atómica de Onboarding
-- Esta función se ejecuta en modo SECURITY DEFINER para saltarse las restricciones de RLS (Row Level Security)
-- de lectura inmediata sobre 'businesses', solucionando la condición de carrera "Huevo o la gallina" cuando el
-- tenant no tiene aún un registro de profile activo.

CREATE OR REPLACE FUNCTION public.register_business(
  p_business_name text,
  p_business_email text,
  p_profile_full_name text,
  p_owner_pin text
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
  -- 1. Validar identidad
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado en Supabase Auth';
  END IF;

  -- 2. Insertar tenant (negocio)
  INSERT INTO public.businesses (name, email)
  VALUES (p_business_name, p_business_email)
  RETURNING id INTO v_business_id;

  -- 3. Upsert del perfil propietario
  INSERT INTO public.profiles (id, business_id, full_name, role, pin)
  VALUES (v_user_id, v_business_id, p_profile_full_name, 'owner', p_owner_pin)
  ON CONFLICT (id) DO UPDATE
  SET business_id = EXCLUDED.business_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      pin = EXCLUDED.pin;

  -- 4. Construir respuesta
  v_result := jsonb_build_object(
    'business_id', v_business_id, 
    'profile_id', v_user_id
  );
  
  RETURN v_result;
END;
$$;
