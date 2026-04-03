-- Migración Fix: Desacoplamiento de Foreign Key en Profiles
-- Permitir crear StaffMembers (Cajeros) que no tengan cuenta real en Auth (Ingreso por PIN)

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Aseguramos que los Owner/Admins puedan insertar en profiles libremente sin fallar la RLS.
-- (La política de RLS ya fue añadida previamente en el hardening, pero garantizamos que el FK no estorbe los UUIDs aleatorios de react)
