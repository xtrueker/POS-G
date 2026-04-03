-- Fase 6: Aislamiento Físico de Cajeros (RBAC Location Binding)
-- Esta migración añade la columna `location_id` a los perfiles,
-- permitiendo que un cajero o vendedor esté estrictamente atado a una sede física.

ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
