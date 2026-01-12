"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyStripeDeposit } from "@/app/actions";
import { toast } from "sonner";

export default function RefreshTrigger({ sessionId }: { sessionId?: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'idle'>('idle');

    useEffect(() => {
        if (!sessionId || status !== 'idle') return;

        const verify = async () => {
            setStatus('verifying');
            try {
                // Initial delay to let webhook try first
                await new Promise(r => setTimeout(r, 1500));

                const res = await verifyStripeDeposit(sessionId);
                if (res.success) {
                    setStatus('success');
                    toast.success("Balance Updated!");
                    router.refresh();

                    // Clean up URL after a short delay
                    setTimeout(() => {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('deposit_success');
                        url.searchParams.delete('session_id');
                        window.history.replaceState({}, '', url.toString());
                    }, 2000);
                } else {
                    setStatus('failed');
                    console.error("Verification failed:", res.error);
                }
            } catch (e) {
                setStatus('failed');
                console.error("Refresh Trigger Error:", e);
            }
        };

        verify();
    }, [sessionId, status, router]);

    return null;
}
