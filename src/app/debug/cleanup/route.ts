
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabase = createAdminClient();
    if (!supabase) return NextResponse.json({ error: "Admin client missing" }, { status: 500 });

    // Delete matches where odds_source is 'Mock Data' or 'Real Data Seed (Jan 11)'
    // OR just generalized cleanup of NBA props attached to NFL games if possible.
    // For now, targeting the sources I created.

    const { count, error } = await supabase
        .from('predictions')
        .delete({ count: 'exact' })
        .in('odds_source', ['Mock Data', 'Real Data Seed (Jan 11)']);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        success: true,
        message: `Deleted ${count} mock/seed records.`
    });
}
