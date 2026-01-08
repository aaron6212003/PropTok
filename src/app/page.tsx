import Image from "next/image";
import BottomNavBar from "@/components/layout/bottom-nav";
import PredictionFeed from "@/components/feed/prediction-feed";
import { getPredictions } from "./actions";

export default async function Home() {
  const predictions = await getPredictions();

  return (
    <main className="flex min-h-full flex-col bg-black text-white">
      {/* Top Header Layer */}
      <div className="absolute top-0 z-40 flex w-full justify-center pt-4">
        <h1 className="text-xl font-bold tracking-tighter text-white drop-shadow-md">
          <span className="text-brand">Prop</span>Tok
        </h1>
      </div>

      <PredictionFeed initialPredictions={predictions} />

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavBar />
      </div>
    </main>
  );
}
