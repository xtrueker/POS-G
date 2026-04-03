-- Supabase Migration: SuperAdmin Console Functions

-- 1. View / metrics function to get all businesses across the SaaS (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_global_saas_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
    is_superadmin boolean;
    result json;
BEGIN
    -- Verify caller is a superadmin
    SELECT (role = 'superadmin') INTO is_superadmin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT is_superadmin OR is_superadmin IS NULL THEN
        RAISE EXCEPTION 'Access denied: SuperAdmin role required.';
    END IF;

    -- Aggregate metrics
    SELECT json_build_object(
        'totalBusinesses', (SELECT count(*) FROM public.businesses WHERE id NOT IN (SELECT business_id FROM public.profiles WHERE role = 'superadmin' AND business_id IS NOT NULL)),
        'totalUsers', (SELECT count(*) FROM public.profiles WHERE role != 'superadmin'),
        'totalSalesAmount', (SELECT COALESCE(sum(total), 0) FROM public.sales WHERE is_reversed = false AND business_id NOT IN (SELECT business_id FROM public.profiles WHERE role = 'superadmin' AND business_id IS NOT NULL)),
        'totalLocations', (SELECT count(*) FROM public.locations WHERE business_id NOT IN (SELECT business_id FROM public.profiles WHERE role = 'superadmin' AND business_id IS NOT NULL))
    ) INTO result;

    RETURN result;
END;
$$;


-- 2. Function to list all businesses for the Impersonation dropdown
CREATE OR REPLACE FUNCTION public.get_all_businesses_superadmin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_superadmin boolean;
    result json;
BEGIN
    -- Verify caller is a superadmin
    SELECT (role = 'superadmin') INTO is_superadmin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT is_superadmin OR is_superadmin IS NULL THEN
        RAISE EXCEPTION 'Access denied: SuperAdmin role required.';
    END IF;

    -- Return ALL businesses except the ones that belong to the system (Superadmin)
    SELECT COALESCE(json_agg(b.*), '[]'::json) INTO result
    FROM public.businesses b
    WHERE b.id NOT IN (
        SELECT business_id FROM public.profiles WHERE role = 'superadmin' AND business_id IS NOT NULL
    );

    RETURN result;
END;
$$;


-- 3. Impersonate Business Feature (Swaps the business_id for the superadmin)
CREATE OR REPLACE FUNCTION public.impersonate_business(target_business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_superadmin boolean;
BEGIN
    -- Verify caller is a superadmin
    SELECT (role = 'superadmin') INTO is_superadmin
    FROM public.profiles
    WHERE id = auth.uid();

    IF NOT is_superadmin OR is_superadmin IS NULL THEN
        RAISE EXCEPTION 'Access denied: SuperAdmin role required.';
    END IF;

    -- Verify target business exists
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = target_business_id) THEN
        RAISE EXCEPTION 'Business not found.';
    END IF;

    -- Update the superadmin's business_id in the profiles table.
    -- Because get_auth_business_id() reads from profiles, this single change 
    -- instantly logs the superadmin into the target business ecosystem.
    UPDATE public.profiles
    SET business_id = target_business_id
    WHERE id = auth.uid();

    -- Return success
    RETURN true;
END;
$$;
