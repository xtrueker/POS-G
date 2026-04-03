-- Fix for "role check constraint" error when assigning 'superadmin' or 'supervisor'
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- 1. Find the exact name of the check constraint on the 'role' column in 'profiles'
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%';

    -- 2. Drop the old restrictive constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- 3. Add the new, expanded constraint that supports the modern SaaS roles
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('superadmin', 'owner', 'admin', 'supervisor', 'cashier'));
END $$;
