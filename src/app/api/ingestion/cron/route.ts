import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// MOCK DATA GENERATOR (Simulating TheRundown / OddsJam)
const NAMES = ["Patrick Mahomes", "Lamar Jackson", "Josh Allen", "T.J. Watt", "Tyreek Hill", "Travis Kelce"];
const PROPS = [
    { type: "player_pass_yds", label: "Passing Yards", line: 265.5 },
    { type: "player_pass_tds", label: "Passing TDs", line: 2.5 },
    { type: "player_rush_yds", label: "Rushing Yards", line: 45.5 },
    { type: "player_sacks", label: "Sacks", line: 0.5 },
    { type: "player_rec_yds", label: "Receiving Yards", line: 75.5 },
];

export async function GET() {
    const supabase = await createClient();
    const created = [];

    // Generate 10 random props
    for (let i = 0; i < 10; i++) {
        const player = NAMES[Math.floor(Math.random() * NAMES.length)];
        const prop = PROPS[Math.floor(Math.random() * PROPS.length)];
        const isOver = Math.random() > 0.5; // Randomly frame it as Over or Under? (Actually usually lines are Over/Under agnostic, but for Question we frame it)

        // In betting, you bet "Over" or "Under".
        // For PropTok, we pose the question: "Will Patrick Mahomes have OVER 265.5 Passing Yards?"
        // YES = Over, NO = Under.

        const question = `Will ${player} have OVER ${prop.line} ${prop.label}?`;

        // Check if exists to avoid spamming
        const { data: existing } = await supabase.from("predictions").select("id").eq("question", question).maybeSingle();

        if (!existing) {
            const { data, error } = await supabase.from("predictions").insert({
                question: question,
                category: "NFL",
                description: `${prop.label} vs Line`,
                oracle_id: `mock-${player.toLowerCase().replace(' ', '-')}-${prop.type}`, // Mock ID
                oracle_type: "player_stat_gt", // Check if greater than
                target_value: prop.line,
                target_slug: prop.type, // Store the stat type (e.g. pass_yds) in slug, or we can use prop_type column
                player_name: player,
                prop_type: prop.type,
                line: prop.line,
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
            }).select().single();

            if (data) created.push(data);
        }
    }

    return NextResponse.json({ success: true, created: created.length, examples: created.slice(0, 2) });
}
