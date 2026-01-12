"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { Coins, Wallet, Plus } from "lucide-react";
import Link from 'next/link';

// Simplified Wallet Display: Shows Cash & Chips always
export default function WalletToggle({ cash, chips }: { cash: number, chips: number }) {

    return (
        <div className="pointer-events-auto flex items-center gap-3">
            {/* Chips Balance */}
            <div className="flex items-center gap-1.5 px-2">
                <Coins className="h-4 w-4 text-yellow-400" />
                <span className="font-bold text-yellow-400 text-sm">{chips.toLocaleString()}</span>
            </div>

            {/* Cash Balance + Deposit */}
            <Link href="/wallet" className="group flex items-center gap-2 rounded-full bg-[#00DC82]/10 pl-3 pr-1.5 py-1.5 border border-[#00DC82]/20 hover:bg-[#00DC82]/20 transition-all">
                <span className="font-bold text-[#00DC82] text-sm">${cash.toFixed(2)}</span>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00DC82] text-black">
                    <Plus size={12} strokeWidth={4} />
                </span>
            </Link>
        </div>
    );
}
