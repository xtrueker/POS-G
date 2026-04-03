-- Initial Schema for POS-G Colombia (Estatura Olímpica)
-- Multi-tenant architecture using Row Level Security (RLS)

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Businesses (Tenants)
create table if not exists public.businesses (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    legal_name text,
    nit text unique,
    verification_digit int,
    address text,
    city text,
    department text,
    phone text,
    email text,
    regimen text check (regimen in ('simplificado', 'comun')),
    resolution_number text,
    prefix text,
    logo_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Profiles (Users)
create table if not exists public.profiles (
    id uuid primary key references auth.users on delete cascade,
    business_id uuid references public.businesses on delete cascade,
    full_name text,
    role text check (role in ('owner', 'admin', 'cashier')) default 'cashier',
    avatar_url text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Products
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    business_id uuid not null references public.businesses on delete cascade,
    name text not null,
    description text,
    sku text,
    barcode text,
    category text default 'General',
    price numeric(12, 2) not null default 0,
    cost numeric(12, 2) not null default 0,
    stock int not null default 0,
    min_stock int not null default 5,
    unit text default 'unidad',
    image_url text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    unique(business_id, sku),
    unique(business_id, barcode)
);

-- Customers
create table if not exists public.customers (
    id uuid primary key default uuid_generate_v4(),
    business_id uuid not null references public.businesses on delete cascade,
    name text not null,
    email text,
    phone text,
    address text,
    document_type text default 'CC',
    document_number text,
    loyalty_points int default 0,
    created_at timestamptz default now(),
    
    unique(business_id, document_number)
);

-- Sales & Invoices
create table if not exists public.sales (
    id uuid primary key default uuid_generate_v4(),
    business_id uuid not null references public.businesses on delete cascade,
    customer_id uuid references public.customers on delete set null,
    staff_id uuid references public.profiles on delete set null,
    total numeric(12, 2) not null,
    subtotal numeric(12, 2) not null,
    tax numeric(12, 2) not null,
    discount numeric(12, 2) default 0,
    payment_method text check (payment_method in ('cash', 'card', 'transfer', 'mixed')),
    status text check (status in ('completed', 'cancelled', 'refunded')),
    date timestamptz default now()
);

-- Invoice details (DIAN compliance)
create table if not exists public.invoices (
    id uuid primary key references public.sales on delete cascade,
    business_id uuid not null references public.businesses on delete cascade,
    invoice_number text not null,
    cufe text unique,
    dian_status text default 'pending',
    qr_code_url text,
    issue_date timestamptz default now(),
    
    unique(business_id, invoice_number)
);

-- Sale Items
create table if not exists public.sale_items (
    id uuid primary key default uuid_generate_v4(),
    sale_id uuid not null references public.sales on delete cascade,
    product_id uuid references public.products on delete set null,
    quantity int not null,
    price numeric(12, 2) not null,
    cost numeric(12, 2) not null,
    total numeric(12, 2) not null
);

-- Expenses
create table if not exists public.expenses (
    id uuid primary key default uuid_generate_v4(),
    business_id uuid not null references public.businesses on delete cascade,
    description text not null,
    amount numeric(12, 2) not null,
    category text,
    notes text,
    date timestamptz default now(),
    created_at timestamptz default now()
);

-- 3. RLS (Row Level Security)

-- Enable RLS
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.invoices enable row level security;
alter table public.sale_items enable row level security;
alter table public.expenses enable row level security;

-- Policies for Profiles (Users can only see their own profile)
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);

-- Policies for Business Data (Users can see data belonging to their business)
create policy "Users can view products" on public.products
    for all using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Users can view sales" on public.sales
    for all using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Users can view customers" on public.customers
    for all using (business_id in (select business_id from public.profiles where id = auth.uid()));

create policy "Users can view expenses" on public.expenses
    for all using (business_id in (select business_id from public.profiles where id = auth.uid()));

-- 4. FUNCTIONS & TRIGGERS

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_businesses_modtime before update on public.businesses for each row execute procedure update_updated_at_column();
create trigger update_products_modtime before update on public.products for each row execute procedure update_updated_at_column();

-- 5. STORAGE BUCKETS (Metadata only, buckets must be created manually or via API)
-- These inserts help Supabase UI recognize the buckets
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;

-- Storage Policies for Logos
create policy "Business Logo Upload" on storage.objects for insert with check (
  bucket_id = 'logos' AND (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Business Logo View" on storage.objects for select using (bucket_id = 'logos');

-- Storage Policies for Products
create policy "Product Image Upload" on storage.objects for insert with check (
  bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text
);
create policy "Product Image View" on storage.objects for select using (bucket_id = 'products');
