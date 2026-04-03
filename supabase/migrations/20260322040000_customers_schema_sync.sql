-- Fase 5 CRM Fix: Sincronización de esquema de Clientes
-- La tabla original 'customers' no contemplaba los parámetros avanzados del módulo de Fidelización (CRM)
-- como 'balance', 'tier', 'lifetime_points', etc. Esta migración expande la tabla para que PostgREST
-- acepte correctamente los payloads del CustomerRepository.

ALTER TABLE IF EXISTS public.customers
ADD COLUMN IF NOT EXISTS lifetime_points int DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS total_spent numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_purchases int DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS last_purchase_date timestamptz,
ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '[]'::jsonb;
