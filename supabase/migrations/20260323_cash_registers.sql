-- Create the cash_registers table
CREATE TABLE IF NOT EXISTS public.cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    expected_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    actual_amount NUMERIC(10, 2),
    difference NUMERIC(10, 2),
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view cash registers belonging to their business
CREATE POLICY "Users can view cash registers of their business"
ON public.cash_registers
FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Policy: Owners and Admins can create/update ANY cash register in their business
-- Cashiers can only create/update their OWN open registers
CREATE POLICY "Users can manage cash registers"
ON public.cash_registers
FOR ALL
TO authenticated
USING (
    business_id IN (
        SELECT p.business_id FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.role IN ('owner', 'admin', 'supervisor') OR (p.role = 'cashier' AND opened_by = auth.uid()))
    )
)
WITH CHECK (
    business_id IN (
        SELECT p.business_id FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.role IN ('owner', 'admin', 'supervisor') OR (p.role = 'cashier' AND opened_by = auth.uid()))
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_business_id ON public.cash_registers(business_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_location_id ON public.cash_registers(location_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_status ON public.cash_registers(status);
CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_by ON public.cash_registers(opened_by);
