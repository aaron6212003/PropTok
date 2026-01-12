"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { Coins, Wallet } from "lucide-react";
import Link from 'next/link';

export default function WalletToggle({ cash, chips }: { cash: number, chips: number }) {
    const { currency, setCurrency } = useBetSlip();

    const toggleCurrency = (e: React.MouseEvent) => {
        e.preventDefault();
        setCurrency(currency === 'CASH' ? 'CHIPS' : 'CASH');
    };

    return (
        <div className="pointer-events-auto flex items-center gap-2">
            <Link href="/wallet" className="group flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/60 transition-all">
                {currency === 'CASH' ? (
                    <>
                        <Wallet className="h-4 w-4 text-[#00DC82]" />
                        <span className="font-bold text-[#00DC82]">${cash.toFixed(2)}</span>
                    </>
                ) : (
                    <>
                        <Coins className="h-4 w-4 text-yellow-400" />
                        <span className="font-bold text-yellow-400">{chips.toFixed(0)}</span>
                    </>
                )}
            </Link>

            <button
                onClick={toggleCurrency}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition-colors"
            >
                <div className="text-[10px] font-bold">
                    {currency === 'CASH' ? 'C' : '$'}
                </div>
            </button>
        </div>
    );
}
