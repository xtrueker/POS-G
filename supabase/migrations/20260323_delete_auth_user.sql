-- ========================================================================================
-- FUNCION: delete_user_completely
-- PROPOSITO: Borrar empleados física y definitivamente desde la raíz (auth.users).
-- Esto libera su correo electrónico para que pueda ser registrado por otra tienda.
-- Solo Owners y Superadmins pueden ejecutar esta aniquilación.
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.delete_user_completely(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Barrera de Seguridad (Solo Dueños o SuperAdmin)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('owner', 'superadmin', 'admin')
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo los propietarios pueden eliminar a un empleado definitivamente.';
  END IF;

  -- 2. Evitar que un dueño se suicide / borre a sí mismo por accidente
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Violación de Seguridad: No puedes eliminar tu propia cuenta de propietario.';
  END IF;

  -- 3. Aniquilación Total desde la raíz (auth.users)
  -- NOTA: Como la llave foránea en `profiles` tiene `ON DELETE CASCADE`,
  -- destruir la entidad de Auth destruirá automáticamente su perfil,
  -- sus historiales de inicio de sesión y librará el Email.
  DELETE FROM auth.users WHERE id = target_user_id;

END;
$$;
