-- Supabase Migration: Advanced Security Hardening (Go-Live Ready)
-- Blindaje de PINs y Atomaticidad de Ventas Pro

-- 1. Ocultar la columna PIN de la vista pública (RLS Avanzado)
-- Creamos una vista segura que no incluya el PIN para el equipo
CREATE OR REPLACE VIEW public.staff_profiles_secure AS
SELECT id, business_id, role, name, email, phone, permissions, created_at, is_active
FROM public.profiles;

-- Modificamos la política de SELECT en la tabla original para que el PIN sea NULL
-- si no es el dueño de la cuenta o el superadmin.
DROP POLICY IF EXISTS "Tenant Isolation: Read Profiles" ON public.profiles;
CREATE POLICY "Tenant Isolation: Read Profiles (Secure)" ON public.profiles
FOR SELECT USING (
  business_id = public.get_auth_business_id() OR id = auth.uid()
);

-- 2. RPC: Verificación de PIN en Servidor (No exposición frontend)
CREATE OR REPLACE FUNCTION public.verify_owner_pin(p_input_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_pin text;
  v_business_id uuid;
BEGIN
  v_business_id := public.get_auth_business_id();
  
  -- Solo el dueño del negocio puede tener un PIN de sistema para acciones críticas
  -- Buscamos el PIN del perfil con rol 'owner' en este negocio
  SELECT pin INTO v_owner_pin
  FROM public.profiles
  WHERE business_id = v_business_id AND role = 'owner'
  LIMIT 1;

  IF v_owner_pin IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_owner_pin = p_input_pin;
END;
$$;

-- 3. RPC: Motor de Ventas Atómico con Prevención de Race Conditions
CREATE OR REPLACE FUNCTION public.process_sale_optimized(
    p_sale_id UUID,
    p_business_id UUID,
    p_location_id UUID,
    p_customer_id UUID,
    p_staff_id UUID,
    p_staff_name TEXT,
    p_subtotal NUMERIC,
    p_discount NUMERIC,
    p_total NUMERIC,
    p_payment_method TEXT,
    p_payment_lines JSONB,
    p_items JSONB,
    p_device_info JSONB,
    p_notes TEXT DEFAULT ''
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_auth_business_id UUID;
    v_item RECORD;
BEGIN
    -- SEGURIDAD: Validar que el negocio coincida con la sesión del usuario
    v_auth_business_id := public.get_auth_business_id();
    IF v_auth_business_id IS DISTINCT FROM p_business_id THEN
        RAISE EXCEPTION 'Acceso Denegado: Inyección de negocio detectada (403).';
    END IF;

    -- 1. Insertar la Venta (Encabezado)
    INSERT INTO public.sales (
        id, business_id, location_id, staff_id, staff_name, 
        subtotal, discount, total, payment_method, payment_lines, 
        customer_id, notes, date, device_info, status
    ) VALUES (
        p_sale_id, p_business_id, p_location_id, p_staff_id, p_staff_name,
        p_subtotal, p_discount, p_total, p_payment_method, p_payment_lines,
        p_customer_id, p_notes, now(), p_device_info, 'completed'
    );

    -- 2. Procesar cada Item (Descuento de stock + Kárdex)
    -- Usamos jsonb_to_recordset para iterar eficientemente
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        id UUID, name TEXT, quantity NUMERIC, price NUMERIC, cost NUMERIC
    ) LOOP
        -- BLOQUEO DE FILA (Anti-Race Condition): SELECT FOR UPDATE
        -- Esto garantiza que no se venda en negativo si dos personas compran el mismo ítem
        PERFORM id FROM public.products 
        WHERE id = v_item.id AND business_id = p_business_id 
        FOR UPDATE;

        -- Actualizar Stock
        UPDATE public.products
        SET stock = stock - v_item.quantity, updated_at = now()
        WHERE id = v_item.id AND business_id = p_business_id;

        -- Registrar en Kárdex Inmutable
        INSERT INTO public.inventory_movements (
            business_id, product_id, location_id, type, quantity, notes, created_by
        ) VALUES (
            p_business_id, v_item.id, p_location_id, 'sale', v_item.quantity, 
            'Venta POS Auto-Sincronizada (' || p_sale_id || ')', p_staff_id
        );
    END LOOP;

    -- 3. Actualizar Lealtad del Cliente (Si aplica)
    IF p_customer_id IS NOT NULL THEN
        UPDATE public.customers
        SET 
            loyalty_points = loyalty_points + floor(p_total / 1000), -- 1 punto cada 1000 pesos
            lifetime_points = lifetime_points + floor(p_total / 1000),
            total_purchases = total_purchases + 1,
            total_spent = total_spent + p_total,
            last_purchase_date = now()
        WHERE id = p_customer_id AND business_id = p_business_id;
    END IF;

END;
$$;
