-- ==========================================
-- FASE 25: Protocolo de Exterminio en Cascada (Account Wipe)
-- ==========================================
-- Función altamente destructiva. 
-- Requiere privilegios de sistema (SECURITY DEFINER)
-- para poder saltar el esquema 'public' e ingresar a 'auth'.
-- ==========================================

CREATE OR REPLACE FUNCTION public.terminate_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
  v_role text;
BEGIN
  -- 1. Extraer Identidad del Comandante (Vigilante)
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Acceso Denegado: Neutralizado por falta de Token de Navegación.';
  END IF;

  -- 2. Localizar Matriz Empresarial y Rango
  SELECT business_id, role INTO v_business_id, v_role
  FROM public.profiles
  WHERE id = v_user_id;

  -- 3. Escudo de Jerarquía (Solo el Dueño puede invocar el Armagedón)
  IF v_role != 'owner' THEN
    RAISE EXCEPTION 'Acceso Denegado: Rango Insuficiente. Solo el Owner puede activar el Exterminio.';
  END IF;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Cancelado: Ninguna Empresa Base anclada a este perfil.';
  END IF;

  -- 4. Detonación Fase 1: Empleados y Cuentas de Acceso (Auth Users)
  -- Al borrar desde auth.users, el ON DELETE CASCADE mata automáticamente a public.profiles
  DELETE FROM auth.users
  WHERE id IN (
    SELECT id FROM public.profiles WHERE business_id = v_business_id
  );

  -- 5. Detonación Fase 2: Empresa Matriz y Daño Colateral (Cascade Delete)
  -- Borrar la matriz pulveriza Inventario, Ventas, Cajas, Proveedores, Facturas, Clientes, etc.
  DELETE FROM public.businesses
  WHERE id = v_business_id;

END;
$$;

-- 6. Habilitar Botón de Pánico a Usuarios Registrados
GRANT EXECUTE ON FUNCTION public.terminate_account() TO authenticated;
