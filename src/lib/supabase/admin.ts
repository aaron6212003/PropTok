import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // FALLBACK: Hardcoded key because Vercel Env Vars are failing to propagate
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zenhxaXZ1ZXBlZ216Z21jYmt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzgzMjg2OCwiZXhwIjoyMDgzNDA4ODY4fQ.SuWcBPYEaZbR4CxHIWvhTwuO2_HurFZJIXw8aqpIz9g";

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Admin Client Creation Failed: Missing Vars", {
            hasUrl: !!supabaseUrl,
            hasKey: !!serviceRoleKey
        });
        return null;
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
