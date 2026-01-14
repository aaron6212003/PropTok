import { sportsService } from "@/lib/sports-service";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("Triggering manual resolution via Debug Route...");
        const logs = await sportsService.resolveGames();
        return NextResponse.json({
            status: "Executed sportsService.resolveGames()",
            logs
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
