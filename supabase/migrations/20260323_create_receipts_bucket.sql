-- ==========================================
-- FASE 28: Módulo de Reporte de Pagos SaaS (Comprobantes)
-- ==========================================
-- Migración DDL para crear el Bucket 'receipts' en Supabase Storage
-- con políticas RLS (Row Level Security) híbridas.
-- ==========================================

-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar la subida (INSERT) solo para usuarios autenticados (Tenants)
CREATE POLICY "Tenants can upload receipts" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'receipts');

-- 3. Habilitar la lectura (SELECT) para que el SuperAdmin pueda ver la imagen pública
CREATE POLICY "Publicly accessible receipts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts');
