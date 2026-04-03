-- Migración Fix: Reparación del Schema de Profiles
-- Se añaden las columnas requeridas por el StaffRepository para el personal

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS pin text,
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;

-- El StaffRepository enviaba un array de permisos nativo, usaremos jsonb en Postgres para arrays
