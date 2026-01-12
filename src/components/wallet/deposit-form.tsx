"use client";

import { useState } from 'react';
import { processDeposit } from '@/app/actions'; // We will create this
import { toast } from 'sonner';
import { Loader2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DepositForm({ userId }: { userId: string }) {
    const [amount, setAmount] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDeposit = async () => {
        if (!amount) return;
        setLoading(true);
        try {
            const res = await processDeposit(amount);
            if (res.success) {
                toast.success(`Successfully deposited $${amount}!`);
                router.refresh();
                setAmount(null);
            } else {
                toast.error("Deposit Failed: " + res.error);
            }
        } catch (e) {
            toast.error("Network Error");
        } finally {
            setLoading(false);
        }
    };

    const DENOMS = [10, 25, 50, 100];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold mb-4">Add Funds</h2>
                <div className="grid grid-cols-2 gap-3">
                    {DENOMS.map((val) => (
                        <button
                            key={val}
                            onClick={() => setAmount(val)}
                            className={`p-4 rounded-xl border font-bold text-lg transition-all ${amount === val
                                    ? 'bg-white text-black border-white scale-[1.02]'
                                    : 'bg-transparent text-white border-white/10 hover:border-white/30'
                                }`}
                        >
                            ${val}
                        </button>
                    ))}
                </div>
            </div>

            <button
                disabled={!amount || loading}
                onClick={handleDeposit}
                className="w-full py-4 rounded-xl bg-[#00DC82] text-black font-black text-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : <CreditCard />}
                {amount ? `Pay $${amount}.00` : 'Select Amount'}
            </button>
            <p className="text-center text-xs text-zinc-500">
                This is a secure 256-bit encrypted transaction. <br />
                For the simulation, no real money is charged.
            </p>
        </div>
    );
}
