-- Fase 6: Parche de Seguridad RLS para Citas y Proveedores
-- Al habilitar RLS sin políticas en la migración primaria, PostgreSQL bloqueó 
-- por defecto todas las operaciones de lectura y escritura (Error 403).

-- 1. Políticas para Citas (Appointments)
DROP POLICY IF EXISTS "Users can view their business appointments" ON public.appointments;
CREATE POLICY "Users can view their business appointments"
ON public.appointments FOR SELECT
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their business appointments" ON public.appointments;
CREATE POLICY "Users can insert their business appointments"
ON public.appointments FOR INSERT
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their business appointments" ON public.appointments;
CREATE POLICY "Users can update their business appointments"
ON public.appointments FOR UPDATE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their business appointments" ON public.appointments;
CREATE POLICY "Users can delete their business appointments"
ON public.appointments FOR DELETE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Políticas para Proveedores (Suppliers)
DROP POLICY IF EXISTS "Users can view their business suppliers" ON public.suppliers;
CREATE POLICY "Users can view their business suppliers"
ON public.suppliers FOR SELECT
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their business suppliers" ON public.suppliers;
CREATE POLICY "Users can insert their business suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their business suppliers" ON public.suppliers;
CREATE POLICY "Users can update their business suppliers"
ON public.suppliers FOR UPDATE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their business suppliers" ON public.suppliers;
CREATE POLICY "Users can delete their business suppliers"
ON public.suppliers FOR DELETE
USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
