
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createAdminClient();

    if (!supabase) {
        return NextResponse.json({ error: "Failed to initialize Admin Client" }, { status: 500 });
    }

    // 1. Reset all users cash to 0.00
    await supabase.from('users').update({ cash_balance: 0.00 }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Fix Steelers vs Opponent -> Steelers vs Texans (Data Fix)
    // AND FORCE CATEGORY TO NFL
    await supabase
        .from('predictions')
        .update({ question: 'Will Steelers win against Texans?', category: 'NFL' })
        .ilike('question', '%Opponent%');

    // 3. Force fix ANY Steelers game to NFL category if currently NBA/Sports
    await supabase
        .from('predictions')
        .update({ category: 'NFL' })
        .ilike('question', '%Steelers%');

    return NextResponse.json({
        success: true,
        message: "Refined Reset: Cash 0.00, Steelers Force-Fixed to NFL."
    });
}
