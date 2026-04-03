-- migration for loyalty system PRO
-- Applied on 2026-03-28

-- 1. Extend customers table with loyalty and CRM fields
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS lifetime_points int DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
ADD COLUMN IF NOT EXISTS total_spent numeric(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_purchases int DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance numeric(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS birthdate date,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS last_purchase_date timestamptz,
ADD COLUMN IF NOT EXISTS preferences text[] DEFAULT '{}';

-- 2. Create loyalty history table for audit
CREATE TABLE IF NOT EXISTS public.loyalty_history (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    points int NOT NULL,
    action_type text CHECK (action_type IN ('earn', 'redeem', 'adjust')),
    reason text,
    created_at timestamptz DEFAULT now()
);

-- 3. RLS (Row Level Security) for history
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loyalty history" ON public.loyalty_history
    FOR SELECT USING (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert loyalty history" ON public.loyalty_history
    FOR INSERT WITH CHECK (business_id IN (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_history_customer ON public.loyalty_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_business ON public.loyalty_history(business_id);
