
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createAdminClient();

    // 1. Reset all users cash to 0.00
    const { error: updateError } = await supabase
        .from('users')
        .update({ cash_balance: 0.00 })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Safety check, update all real users

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Fix Steelers vs Opponent -> Steelers vs Texans (Data Fix)
    const { error: fixError } = await supabase
        .from('predictions')
        .update({ question: 'Will Steelers win against Texans?' })
        .ilike('question', '%Opponent%');

    return NextResponse.json({
        success: true,
        message: "Cash reset to 0.00 and 'Opponent' naming fixed."
    });
}
