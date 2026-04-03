-- Migration: Split Payments support
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_lines JSONB DEFAULT '[]';

-- Add comment for clarity
COMMENT ON COLUMN public.sales.payment_lines IS 'Stores multiple payment methods and amounts for a single sale as an array of objects {method, amount, reference}.';

-- Ensure the 'split' option is valid for payment_method if using check constraints (initial schema used 'mixed', I'll use 'split' in UI but map to 'mixed' or just allow 'split')
ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_payment_method_check CHECK (payment_method IN ('cash', 'card', 'transfer', 'split', 'mixed'));
