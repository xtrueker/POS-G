-- ==========================================
-- FASE 29: Motor de Suscripciones SaaS
-- ==========================================
-- Migración DDL para habilitar el Paywall y control cronológico
-- de facturación mensual en cada Tenant (Negocio).
-- ==========================================

-- Agregar fecha de corte (por defecto regalamos 14 días de prueba a los nuevos)
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz DEFAULT (now() + interval '14 days');

-- Agregar estado de la suscripción
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' 
CHECK (subscription_status IN ('active', 'past_due', 'canceled'));

-- Función RPC protegida (SECURITY DEFINER) para que solo SuperAdmin pueda extender días
-- Nota: La lógica de seguridad (RLS/Middleware) restringirá quién llama a esto.
CREATE OR REPLACE FUNCTION extend_subscription(target_business_id uuid, days_to_add int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si el que llama es el superadmin (hardcoded para mayor seguridad en el MVP SaaS)
  -- Buscaremos el email de la tabla auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'andresguillen1128@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el SuperAdmin puede modificar fechas de facturación.';
  END IF;

  UPDATE public.businesses
  SET 
    subscription_end_date = GREATEST(now(), subscription_end_date) + (days_to_add || ' days')::interval,
    subscription_status = 'active',
    updated_at = now()
  WHERE id = target_business_id;
END;
$$;

-- Función RPC para suspender (Cortar servicio inmediatamente)
CREATE OR REPLACE FUNCTION suspend_subscription(target_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'andresguillen1128@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el SuperAdmin puede suspender licencias.';
  END IF;

  UPDATE public.businesses
  SET 
    subscription_end_date = now() - interval '1 day',
    subscription_status = 'past_due',
    updated_at = now()
  WHERE id = target_business_id;
END;
$$;
