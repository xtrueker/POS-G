-- Add location and staff tracking back to the sales schema 
-- to support the frontend's expanded data architecture.

ALTER TABLE IF EXISTS public.sales
ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS staff_name text;
