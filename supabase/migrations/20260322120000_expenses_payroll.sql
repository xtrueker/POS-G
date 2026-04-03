-- Integración de Nómina a Módulo de Gastos
-- 1. Añadimos la columna staff_id a la tabla expenses apuntando a perfiles (profiles)
ALTER TABLE IF EXISTS public.expenses
ADD COLUMN IF NOT EXISTS staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Refrescamos caché de esquema para PostgREST
NOTIFY pgrst, 'reload schema';
