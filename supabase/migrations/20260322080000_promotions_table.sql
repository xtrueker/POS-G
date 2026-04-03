-- Fase 7: Creación del Módulo de Promociones y DDL
-- La interfaz Frontend permitía crear promociones pero la tabla en PostgreSQL jamás existió.
-- Este script crea la tabla, la amarra al ecosistema Multi-tenant (`business_id`) y la blinda con RLS.

CREATE TABLE IF NOT EXISTS public.promotions (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    name text not null,
    type text not null, -- 'percentage' | 'fixed'
    value numeric(12,2) not null,
    min_purchase numeric(12,2),
    max_discount numeric(12,2),
    start_date timestamptz not null,
    end_date timestamptz not null,
    is_active boolean default true,
    applicable_products jsonb default '[]'::jsonb,
    applicable_categories jsonb default '[]'::jsonb,
    code text not null,
    usage_limit int,
    usage_count int default 0,
    requires_pin boolean default false,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz default now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Crear Políticas Estrictas del Tenant (Propietario del Negocio)
DROP POLICY IF EXISTS "Users can view their business promotions" ON public.promotions;
CREATE POLICY "Users can view their business promotions"
ON public.promotions FOR SELECT
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their business promotions" ON public.promotions;
CREATE POLICY "Users can insert their business promotions"
ON public.promotions FOR INSERT
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their business promotions" ON public.promotions;
CREATE POLICY "Users can update their business promotions"
ON public.promotions FOR UPDATE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their business promotions" ON public.promotions;
CREATE POLICY "Users can delete their business promotions"
ON public.promotions FOR DELETE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
