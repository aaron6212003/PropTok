import Link from "next/link";
import BottomNavBar from "@/components/layout/bottom-nav";
import PredictionFeed from "@/components/feed/prediction-feed";
import { getPredictions, getUserTournamentEntries } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { Coins, Trophy as TrophyIcon, ChevronDown } from "lucide-react";
import BetSlip from "@/components/feed/bet-slip";
import WalletToggle from "@/components/layout/wallet-toggle";

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  const { tournament: tournamentId } = await searchParams;
  const predictions = await getPredictions(true);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let tournamentStack = null;

  if (user) {
    if (tournamentId) {
      const { data } = await supabase
        .from("tournament_entries")
        .select("current_stack")
        .eq("tournament_id", tournamentId)
        .eq("user_id", user.id)
        .single();
      tournamentStack = data?.current_stack;
    }

    const { data } = await supabase.from("users").select("bankroll").eq("id", user.id).single();
    profile = data;
  }

  const tournamentEntries = user ? await getUserTournamentEntries() : [];
  const activeBankroll = tournamentId ? (tournamentStack || 0) : (profile?.bankroll || 0);

  return (
    <main className="flex min-h-full flex-col bg-black text-white">
      {/* Top Header Layer */}
      <div className="absolute top-0 z-50 flex w-full items-center justify-between px-6 pt-6 pointer-events-none">
        <h1 className="text-xl font-bold tracking-tighter text-white drop-shadow-md pointer-events-auto">
          <span className="text-brand">Prop</span>Tok
        </h1>

        {user && (
          <WalletToggle
            bankroll={profile?.bankroll || 0}
            entries={tournamentEntries || []}
            activeTournamentId={tournamentId || null}
          />
        )}
      </div>

      <PredictionFeed
        initialPredictions={predictions}
        bankroll={activeBankroll}
        tournamentId={tournamentId}
      />

      <BetSlip bankroll={activeBankroll} />

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavBar />
      </div>
    </main>
  );
}
