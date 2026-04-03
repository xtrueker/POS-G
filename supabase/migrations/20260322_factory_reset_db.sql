-- =========================================================
-- 🔥 PROTOCOLO SCORCHED EARTH (FACTORY RESET) 🔥
-- ¡ADVERTENCIA! Esto borrará permanentemente TODO:
-- Usuarios, Empresas, Ventas, Gastos, todo volverá a cero.
-- =========================================================

DO $$
BEGIN
  -- 1. Destruimos absolutamente todos los negocios.
  -- (Al tener reglas ON DELETE CASCADE, esto borrará también
  -- las ventas, inventarios, gastos, promociones y sedes).
  TRUNCATE TABLE public.businesses CASCADE;

  -- 2. Eliminamos las identidades secretas y de autenticación.
  -- (Esto apagará también todos sus 'profiles' gracias a CASCADE).
  DELETE FROM auth.users;
  
  -- 3. Limpiamos cualquier rastro de la caché del servidor
  NOTIFY pgrst, 'reload schema';

  RAISE NOTICE '¡FACTORY RESET COMPLETADO! La base de datos está totalmente virgen.';
END $$;
