
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DepositForm from "@/components/wallet/deposit-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import BottomNavBar from "@/components/layout/bottom-nav";

const mode = (await searchParams)?.mode;

if (mode === 'promo') {
    return (
        <main className="min-h-screen bg-black text-white pb-24 relative">
            <div className="flex items-center p-6 border-b border-white/10">
                <Link href="/" className="mr-4 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft />
                </Link>
                <h1 className="text-xl font-bold">Account Balance</h1>
            </div>

            <div className="p-6 space-y-8">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 border border-white/10 shadow-xl">
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">$</span>
                        <span className="text-5xl font-black text-white">{cash.toFixed(2)}</span>
                    </div>
                </div>

                {/* Deposit Form */}
                <DepositForm userId={user.id} />
            </div>

            <BottomNavBar />
        </main>
    );
    <main className="min-h-screen bg-black text-white pb-24 relative">
        <div className="flex items-center p-6 border-b border-white/10">
            <Link href="/" className="mr-4 p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft />
            </Link>
            <h1 className="text-xl font-bold">Account Balance</h1>
        </div>

        <div className="p-6 space-y-8">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 border border-white/10 shadow-xl">
                <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Balance</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">$</span>
                    <span className="text-5xl font-black text-white">{cash.toFixed(2)}</span>
                </div>
            </div>

            {/* Deposit Form */}
            <DepositForm userId={user.id} />
        </div>

        <BottomNavBar />
    </main>
);
}
