
import { sportsService } from "@/lib/sports-service";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DebugIngestPage() {
    let logs: string[] = [];
    try {
        // Run ingestion and capture logs
        const result = await sportsService.ingestGames();

        // ALSO: Run a targeted Tank01 Fetch to dump structure for debugging
        const { tank01Service } = await import("@/lib/tank01-service");
        const today = new Date().toISOString().split('T')[0];
        const tankDump = await tank01Service.getNBABettingOdds(today);
        if (tankDump && tankDump.length > 0) {
            logs.push("--- TANK01 STRUCTURE DUMP (First Game) ---");
            logs.push(JSON.stringify(tankDump[0], null, 2));
        }

        if (Array.isArray(result)) {
            logs = [...result, ...logs];
        } else {
            logs.push("Ingestion ran, but returned no logs.");
        }
    } catch (e: any) {
        logs.push(`CRITICAL ERROR: ${e.message}`);
    }

    return (
        <div className="bg-black text-white min-h-screen p-10 font-mono text-sm">
            <Link href="/" className="mb-4 inline-block text-brand hover:underline">← Back to Home</Link>
            <h1 className="text-xl text-brand font-bold mb-4">Ingestion Debugger</h1>
            <div className="bg-zinc-900 p-4 rounded border border-white/10 max-h-[80vh] overflow-auto">
                {logs.length === 0 ? (
                    <p className="text-zinc-500">No logs returned.</p>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-white/5 pb-1 whitespace-pre-wrap">{log}</div>
                    ))
                )}
            </div>
        </div>
    );
}
