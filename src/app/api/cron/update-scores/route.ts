
import { NextResponse } from 'next/server';
import { sportsService } from '@/lib/sports-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        console.log("Running scheduled score update...");
        await sportsService.syncLiveScores();
        return NextResponse.json({ success: true, message: "Scores synced." });
    } catch (error: any) {
        console.error("Score sync error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
