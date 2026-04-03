-- ==========================================
-- FASE 27: Operacionalidad Inteligente (Configuraciones)
-- ==========================================
-- Migración DDL para habilitar Meta-Almacenamiento (JSONB).
-- Evita inflar la tabla con decenas de columnas de ajustes.
-- ==========================================

-- Agregar campo 'settings' a la Empresa Matriz
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Nota: JSONB permite inyectar estructruras dinámicas como:
-- {
--   "payment_info": "Cuenta Bancolombia: 12345",
--   "notifications": {
--       "low_stock": true,
--       "security": false,
--       "weekly_report": true
--   }
-- }
