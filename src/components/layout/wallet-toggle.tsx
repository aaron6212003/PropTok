"use client";

import { useBetSlip } from "@/lib/context/bet-slip-context";
import { Coins, Wallet, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from 'next/link';
import { cn } from "@/lib/utils";

export default function WalletToggle({ cash, chips }: { cash: number, chips: number }) {
    const { currency, setCurrency } = useBetSlip();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (c: 'CASH' | 'CHIPS') => {
        setCurrency(c);
        setIsOpen(false);
    };

    return (
        <div className="pointer-events-auto relative z-50" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md border border-white/10 hover:border-white/20 hover:bg-black/60 transition-all"
            >
                {currency === 'CASH' ? (
                    <>
                        <Wallet className="h-4 w-4 text-[#00DC82]" />
                        <span className="font-bold text-[#00DC82]">${cash.toFixed(2)}</span>
                    </>
                ) : (
                    <>
                        <Coins className="h-4 w-4 text-yellow-400" />
                        <span className="font-bold text-yellow-400">{chips.toLocaleString()}</span>
                    </>
                )}
                <ChevronDown size={14} className={cn("text-zinc-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-xl shadow-black/50">

                    {/* Cash Option */}
                    <button
                        onClick={() => handleSelect('CASH')}
                        className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            currency === 'CASH' ? "bg-white/10" : "hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-[#00DC82]" />
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-white">Real Cash</span>
                                <span className="text-[10px] text-[#00DC82]">${cash.toFixed(2)}</span>
                            </div>
                        </div>
                        {currency === 'CASH' && <Check size={14} className="text-[#00DC82]" />}
                    </button>

                    {/* Chips Option */}
                    <button
                        onClick={() => handleSelect('CHIPS')}
                        className={cn(
                            "mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            currency === 'CHIPS' ? "bg-white/10" : "hover:bg-white/5"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-yellow-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-white">Tournament Cash</span>
                                <span className="text-[10px] text-yellow-500">{chips.toLocaleString()}</span>
                            </div>
                        </div>
                        {currency === 'CHIPS' && <Check size={14} className="text-yellow-500" />}
                    </button>

                    <div className="my-1.5 h-px bg-white/5" />

                    {/* Deposit Link */}
                    <Link
                        href="/wallet?mode=promo"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center rounded-lg bg-[#00DC82]/10 py-2 text-xs font-bold text-[#00DC82] hover:bg-[#00DC82]/20 transition-colors"
                    >
                        Redeem Promo Code
                    </Link>
                </div>
            )}
        </div>
    );
}
