-- Checklists de Turno (Apertura / Cierre)
CREATE TABLE IF NOT EXISTS public.checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    shift TEXT NOT NULL CHECK (shift IN ('apertura', 'cierre')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    items JSONB NOT NULL DEFAULT '[]',
    completed_by UUID REFERENCES auth.users(id),
    completion_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business checklists"
    ON public.checklists FOR SELECT
    USING (business_id = public.get_auth_business_id());

CREATE POLICY "Users can insert their business checklists"
    ON public.checklists FOR INSERT
    WITH CHECK (business_id = public.get_auth_business_id());

CREATE POLICY "Users can update their business checklists"
    ON public.checklists FOR UPDATE
    USING (business_id = public.get_auth_business_id());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_checklists_business_date ON public.checklists(business_id, date DESC);
