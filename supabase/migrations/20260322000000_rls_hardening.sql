-- Fase 4: PostgreSQL RLS Hardening & Backend RBAC

-- 1. Create a fast, cacheable function to get the current user's business_id
CREATE OR REPLACE FUNCTION public.get_auth_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Create a function to check user roles efficiently
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = ANY(required_roles)
  );
$$;

-- 3. Drop existing policies safely
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 4. Enable RLS explicitly on all tenant tables
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

-- 5. Policies: Businesses
-- Users can only read their own business
CREATE POLICY "Tenant Isolation: Read Business" ON public.businesses FOR SELECT USING (id = public.get_auth_business_id());
-- Only 'owner' or 'admin' can update business settings
CREATE POLICY "Tenant Isolation: Update Business (Admin)" ON public.businesses FOR UPDATE USING (id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin']));
-- Allow new authenticated users to register their business
CREATE POLICY "Allow Creation of Business" ON public.businesses FOR INSERT TO authenticated WITH CHECK (true);

-- 6. Policies: Profiles
CREATE POLICY "Tenant Isolation: Read Profiles" ON public.profiles FOR SELECT USING (business_id = public.get_auth_business_id() OR id = auth.uid());
CREATE POLICY "Tenant Isolation: Create Own Profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Tenant Isolation: Update Own Profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "RBAC: Manage Profiles (Admin/Owner)" ON public.profiles FOR ALL USING (business_id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin'])) WITH CHECK (business_id = public.get_auth_business_id());

-- 7. Policies: Products
CREATE POLICY "Tenant Isolation: Read Products" ON public.products FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "RBAC: Manage Products" ON public.products FOR ALL USING (business_id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin', 'supervisor'])) WITH CHECK (business_id = public.get_auth_business_id());

-- 8. Policies: Customers
-- All staff can read, update and create customers (cashiers need to create them during checkout)
CREATE POLICY "Tenant Isolation: Read Customers" ON public.customers FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "Tenant Isolation: Manage Customers" ON public.customers FOR ALL USING (business_id = public.get_auth_business_id()) WITH CHECK (business_id = public.get_auth_business_id());

-- 9. Policies: Expenses
CREATE POLICY "Tenant Isolation: Read Expenses" ON public.expenses FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "RBAC: Manage Expenses" ON public.expenses FOR ALL USING (business_id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin', 'supervisor'])) WITH CHECK (business_id = public.get_auth_business_id());

-- 10. Policies: Sales
CREATE POLICY "Tenant Isolation: Read Sales" ON public.sales FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "Tenant Isolation: Create Sales" ON public.sales FOR INSERT WITH CHECK (business_id = public.get_auth_business_id());
CREATE POLICY "RBAC: Update Sales" ON public.sales FOR UPDATE USING (business_id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin', 'supervisor']));
CREATE POLICY "RBAC: Delete Sales" ON public.sales FOR DELETE USING (business_id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin', 'supervisor']));

-- 11. Policies: Sale Items
CREATE POLICY "Tenant Isolation: Read Sale Items" ON public.sale_items FOR SELECT USING (sale_id IN (SELECT id FROM public.sales WHERE business_id = public.get_auth_business_id()));
CREATE POLICY "Tenant Isolation: Create Sale Items" ON public.sale_items FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE business_id = public.get_auth_business_id()));

-- 12. Policies: Invoices
CREATE POLICY "Tenant Isolation: Read Invoices" ON public.invoices FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "Tenant Isolation: Manage Invoices" ON public.invoices FOR ALL USING (business_id = public.get_auth_business_id()) WITH CHECK (business_id = public.get_auth_business_id());

-- 13. Policies: Suppliers
CREATE POLICY "Tenant Isolation: Read Suppliers" ON public.suppliers FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "RBAC: Manage Suppliers" ON public.suppliers FOR ALL USING (business_id = public.get_auth_business_id() AND public.has_any_role(ARRAY['owner', 'admin', 'supervisor'])) WITH CHECK (business_id = public.get_auth_business_id());

-- 14. Policies: Appointments
-- Appointment booking might be done by any staff or customer
CREATE POLICY "Tenant Isolation: Read Appointments" ON public.appointments FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "Tenant Isolation: Manage Appointments" ON public.appointments FOR ALL USING (business_id = public.get_auth_business_id()) WITH CHECK (business_id = public.get_auth_business_id());
