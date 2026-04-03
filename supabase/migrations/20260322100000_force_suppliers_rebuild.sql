-- Reconstrucción Maestra de la Tabla de Proveedores (Fix Schema Cache & RLS)
-- 1. Demolición controlada
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- 2. Reconstrucción con blindaje de Arquitectura Doctoral (Multi-tenant)
CREATE TABLE public.suppliers (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    name text not null,
    contact_name text,
    email text,
    phone text,
    address text,
    tax_id text,
    category text,
    payment_terms text,
    notes text,
    total_purchases numeric(12,2) default 0,
    balance numeric(12,2) default 0,
    created_at timestamptz default now()
);

-- 3. Habilitación de Defensas RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 4. Reposición de Políticas Multi-Sede (Tenant)
CREATE POLICY "Users can view their business suppliers"
ON public.suppliers FOR SELECT
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert their business suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their business suppliers"
ON public.suppliers FOR UPDATE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their business suppliers"
ON public.suppliers FOR DELETE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 5. Impacto Forzado a la Memoria Caché del Servidor REST (PostgREST)
NOTIFY pgrst, 'reload schema';
