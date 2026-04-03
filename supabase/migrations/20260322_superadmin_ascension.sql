-- ESTE SCRIPT TE ASCIENDE A SUPERADMINISTRADOR TOTAL
-- Cambia 'TU_CORREO_AQUI' por tu verdadero correo de inicio de sesión de POS-G.

DO $$
DECLARE
  v_user_id uuid;
  v_user_email text := 'andres@example.com'; -- <--- EDITA ESTO POR TU EMAIL REAL REGISTRADO
BEGIN
  -- Buscar tu ID de usuario usando el correo
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;

  IF v_user_id IS NOT NULL THEN
    -- 1. Actualizar tu JWT (El token profundo que lee React: App.tsx y AuthContext)
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"superadmin"'
    )
    WHERE id = v_user_id;

    -- 2. Asegurar que en la tabla visible (profiles) también seas Dios
    UPDATE public.profiles
    SET role = 'superadmin'
    WHERE id = v_user_id;

    RAISE NOTICE '¡Ascenso a SuperAdmin exitoso para el usuario %!', v_user_email;
  ELSE
    RAISE EXCEPTION 'No se encontró el correo. Revisa cómo está escrito en auth.users.';
  END IF;
END $$;
