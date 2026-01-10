import { getWalletData } from "@/app/actions";
import BottomNavBar from "@/components/layout/bottom-nav";
import { ArrowLeft, DollarSign, Coins, CreditCard, History, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function WalletPage() {
    const data = await getWalletData();

    if (!data) {
        redirect("/login");
    }

    return (
        <main className="flex min-h-screen flex-col bg-black text-white pb-32">
            {/* Header */}
            <div className="p-6">
                <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white">
                    <ArrowLeft size={16} />
                    Back to Profile
                </Link>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter">The Vault</h1>
                <p className="text-sm text-zinc-400">Manage your real cash and game tokens.</p>
            </div>

            <div className="px-6 space-y-6">

                {/* Real Cash Card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                            <DollarSign size={14} className="text-brand" />
                            Real Cash
                        </span>
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-widest">
                            Withdrawable
                        </span>
                    </div>
                    <div className="text-5xl font-black text-white tracking-tighter">
                        ${data.cash_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Link href="/wallet/deposit" className="flex-1 flex items-center justify-center rounded-xl bg-white py-3 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-white/10 transition-transform active:scale-95">
                            Deposit
                        </Link>
                        <button className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-white/20 active:scale-95">
                            Withdraw
                        </button>
                    </div>
                </div>

                {/* Play Token Card */}
                <div className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                            <Coins size={14} className="text-yellow-500" />
                            Prop Tokens
                        </span>
                        <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                            Game Currency
                        </span>
                    </div>
                    <div className="text-3xl font-black text-white tracking-tighter">
                        ${data.play_balance.toLocaleString()}
                    </div>
                    <p className="mt-2 text-[10px] text-zinc-500 uppercase tracking-wide">
                        Used for practice betting and tournaments.
                    </p>
                </div>

                {/* Transaction History */}
                <div>
                    <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                        <History size={14} />
                        Recent Transactions
                    </div>

                    <div className="space-y-2">
                        {data.transactions.length === 0 ? (
                            <div className="rounded-xl bg-white/5 p-6 text-center text-xs text-zinc-500 italic">
                                No transactions yet.
                            </div>
                        ) : (
                            data.transactions.map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-full",
                                            tx.amount > 0 ? "bg-success/20 text-success" : "bg-white/10 text-white"
                                        )}>
                                            {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white uppercase tracking-wide">{tx.type.replace('_', ' ')}</p>
                                            <p className="text-[10px] text-zinc-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "font-mono font-bold",
                                        tx.amount > 0 ? "text-success" : "text-white"
                                    )}>
                                        {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </div>
        </main>
    );
}
