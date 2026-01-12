import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const supabase = createAdminClient();

    // Get ALL tournaments to test connectivity
    const { data: tournaments, error: tError } = await supabase
        .from('tournaments')
        .select('*');

    // Get all entries for these tournaments
    let entries = [];
    let eError = null;
    if (tournaments && tournaments.length > 0) {
        const tIds = tournaments.map(t => t.id);
        const { data: e, error: err } = await supabase
            .from('tournament_entries')
            .select('*, users(username, email)')
            .in('tournament_id', tIds);
        entries = e || [];
        eError = err;
    }

    // Get latest user to help identify who "I" am contextually if needed
    const { data: failed_users, error: uError } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5);

    return NextResponse.json({
        tournaments,
        tError,
        entries,
        eError,
        recent_users: failed_users,
        uError
    });
}
