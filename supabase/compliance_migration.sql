-- Add Compliance Fields to Users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ip_address text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS region text DEFAULT NULL;

-- Log functionality for compliance updates
CREATE OR REPLACE FUNCTION public.accept_tos(p_ip text, p_region text)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET 
        tos_accepted_at = now(),
        ip_address = p_ip,
        region = p_region
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
