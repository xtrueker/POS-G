-- Fase 5 Sync Completo: Mega-Migración para Ventas, Gastos, Facturas, Proveedores y Citas
-- Esta migración cierra la brecha de diseño entre el enriquecido frontend interactivo
-- y el restrictivo Backend SQL inicial, previniendo errores HTTP 400 (PGRST204) masivos.

-- 1. Ventas (Sales)
ALTER TABLE IF EXISTS public.sales
ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS device_info jsonb,
ADD COLUMN IF NOT EXISTS is_reversed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reversal_reason text,
ADD COLUMN IF NOT EXISTS reversed_at timestamptz;

-- 2. Proveedores (Suppliers) - Creación de tabla faltante
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses on delete cascade,
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
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;

-- 3. Gastos (Expenses)
ALTER TABLE IF EXISTS public.expenses
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 4. Facturas (Invoices)
ALTER TABLE IF EXISTS public.invoices DROP CONSTRAINT IF EXISTS invoices_id_fkey;
ALTER TABLE IF EXISTS public.invoices
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS due_date timestamptz,
ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_total numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total numeric(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes text;

-- 5. Citas (Appointments) - Creación de tabla faltante
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid primary key default gen_random_uuid(),
    business_id uuid references public.businesses on delete cascade,
    customer_id uuid references public.customers on delete set null,
    customer_name text,
    staff_id uuid references public.profiles on delete set null,
    staff_name text,
    service text,
    date text,
    time text,
    duration int,
    status text,
    notes text,
    price numeric(12,2) default 0,
    created_at timestamptz default now()
);
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;
