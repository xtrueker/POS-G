-- Reconstrucción Maestra de la Tabla de Promociones (Fix Schema Cache)
-- Como la tabla existía previamente en una forma incompleta, el 'IF NOT EXISTS' la ignoró.
-- Este script la demolerá, la reconstruirá con todas las columnas anatómicas y obligará
-- al servidor REST a limpiar su caché para reconocer la nueva estructura.

-- 1. Demolición controlada
DROP TABLE IF EXISTS public.promotions CASCADE;

-- 2. Reconstrucción con blindaje de Arquitectura Doctoral
CREATE TABLE public.promotions (
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

-- 3. Habilitación de Defensas RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- 4. Reposición de Políticas Multi-Sede (Tenant)
CREATE POLICY "Users can view their business promotions"
ON public.promotions FOR SELECT
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their business promotions"
ON public.promotions FOR INSERT
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their business promotions"
ON public.promotions FOR UPDATE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their business promotions"
ON public.promotions FOR DELETE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 5. Impacto Forzado a la Memoria Caché del Servidor REST (PostgREST)
NOTIFY pgrst, 'reload schema';
