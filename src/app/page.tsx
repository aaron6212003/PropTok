import Link from "next/link";
import BottomNavBar from "@/components/layout/bottom-nav";
import PredictionFeed from "@/components/feed/prediction-feed";
import { getPredictions } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { Coins } from "lucide-react";

export default async function Home() {
  const predictions = await getPredictions();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("users").select("bankroll").eq("id", user.id).single();
    profile = data;
  }

  return (
    <main className="flex min-h-full flex-col bg-black text-white">
      {/* Top Header Layer */}
      <div className="absolute top-0 z-50 flex w-full items-center justify-between px-6 pt-6 pointer-events-none">
        <h1 className="text-xl font-bold tracking-tighter text-white drop-shadow-md pointer-events-auto">
          <span className="text-brand">Prop</span>Tok
        </h1>

        {user && (
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-md pointer-events-auto">
            <Coins className="h-4 w-4 text-brand" />
            <span className="text-xs font-black tracking-tight">
              ${(profile?.bankroll || 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <PredictionFeed
        initialPredictions={predictions}
        bankroll={profile?.bankroll || 0}
      />

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavBar />
      </div>
    </main>
  );
}
