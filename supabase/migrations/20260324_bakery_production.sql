-- Supabase Migration: Bakery Production Module (Recipes & Assembly)
-- Permite a las Panaderías ensamblar productos finales a partir de materias primas.

-- 0. Construcción del Kárdex de Inventario (Si no existe)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    location_id UUID,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'sale', 'adjustment', 'transfer', 'production_in', 'production_out', 'waste')),
    quantity NUMERIC NOT NULL,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own inventory movements" ON public.inventory_movements FOR SELECT USING (business_id = public.get_auth_business_id());
CREATE POLICY "Users can insert their own inventory movements" ON public.inventory_movements FOR INSERT WITH CHECK (business_id = public.get_auth_business_id());

-- Expansión de tipos (por si la tabla ya existía pero con limitantes)
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_type_check;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_type_check CHECK (type IN ('in', 'out', 'sale', 'adjustment', 'transfer', 'production_in', 'production_out', 'waste'));

-- 1. Tablas de Fórmulas Culinarias (Recetas)
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    final_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    yield_quantity NUMERIC NOT NULL DEFAULT 1 CHECK (yield_quantity > 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, final_product_id) -- Un producto solo tiene 1 receta principal
);

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_required NUMERIC NOT NULL CHECK (quantity_required > 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
CREATE POLICY "Users can view their own recipes" 
ON public.recipes FOR SELECT USING (business_id = public.get_auth_business_id());

CREATE POLICY "Users can insert their own recipes" 
ON public.recipes FOR INSERT WITH CHECK (business_id = public.get_auth_business_id());

CREATE POLICY "Users can update their own recipes" 
ON public.recipes FOR UPDATE USING (business_id = public.get_auth_business_id());

CREATE POLICY "Users can delete their own recipes" 
ON public.recipes FOR DELETE USING (business_id = public.get_auth_business_id());

CREATE POLICY "Users can view their recipe ingredients" 
ON public.recipe_ingredients FOR SELECT USING (
    recipe_id IN (SELECT id FROM public.recipes WHERE business_id = public.get_auth_business_id())
);

CREATE POLICY "Users can insert recipe ingredients" 
ON public.recipe_ingredients FOR INSERT WITH CHECK (
    recipe_id IN (SELECT id FROM public.recipes WHERE business_id = public.get_auth_business_id())
);

CREATE POLICY "Users can delete recipe ingredients" 
ON public.recipe_ingredients FOR DELETE USING (
    recipe_id IN (SELECT id FROM public.recipes WHERE business_id = public.get_auth_business_id())
);

-- 2. Motor de Ensamblaje Matemático (RPC)
-- Función Transaccional "Hornear Lote": descuenta insumos y suma producto terminado
CREATE OR REPLACE FUNCTION public.produce_batch(
    p_recipe_id UUID,
    p_batches NUMERIC,
    p_location_id UUID,
    p_staff_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
    v_final_product_id UUID;
    v_yield NUMERIC;
    v_ing RECORD;
    v_cost_total NUMERIC := 0;
BEGIN
    -- Validar que la receta pertenezca al negocio del usuario
    v_business_id := public.get_auth_business_id();
    
    SELECT final_product_id, yield_quantity INTO v_final_product_id, v_yield
    FROM public.recipes 
    WHERE id = p_recipe_id AND business_id = v_business_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receta no encontrada o sin permisos.';
    END IF;

    -- 1. Recorrer ingredientes y descontar stock
    FOR v_ing IN 
        SELECT ingredient_product_id, (quantity_required * p_batches) as total_qty, return_cost_from_product(ingredient_product_id) as unit_cost
        FROM public.recipe_ingredients
        WHERE recipe_id = p_recipe_id
    LOOP
        -- Descontar Insuno
        UPDATE public.products 
        SET stock = stock - v_ing.total_qty, updated_at = now()
        WHERE id = v_ing.ingredient_product_id AND business_id = v_business_id;

        -- Registrar Movimiento de Salida (Merma de Producción)
        INSERT INTO public.inventory_movements (business_id, product_id, location_id, type, quantity, notes, created_by)
        VALUES (v_business_id, v_ing.ingredient_product_id, p_location_id, 'production_out', v_ing.total_qty, 'Consumido en Horneo/Ensamblaje de ' || p_batches || ' lotes', p_staff_id);

        -- Calcular costo acumulado
        v_cost_total := v_cost_total + (v_ing.total_qty * v_ing.unit_cost);
    END LOOP;

    -- 2. Sumar el Producto Final
    UPDATE public.products
    SET stock = stock + (v_yield * p_batches), cost = (v_cost_total / (v_yield * p_batches)), updated_at = now()
    WHERE id = v_final_product_id AND business_id = v_business_id;

    -- Registrar Movimiento de Entrada (Horneo In)
    INSERT INTO public.inventory_movements (business_id, product_id, location_id, type, quantity, notes, created_by)
    VALUES (v_business_id, v_final_product_id, p_location_id, 'production_in', (v_yield * p_batches), 'Acreditado por Horneo/Ensamblaje', p_staff_id);

END;
$$;

-- Función de Utilidad privada para el cálculo de costos dentro del RPC
CREATE OR REPLACE FUNCTION public.return_cost_from_product(p_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_cost NUMERIC;
BEGIN
  SELECT cost INTO v_cost FROM public.products WHERE id = p_id;
  RETURN COALESCE(v_cost, 0);
END;
$$;
