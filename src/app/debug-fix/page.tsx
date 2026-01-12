"use strict";
"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function DebugFixPage() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            const { data } = await supabase.from("tournaments").select("*");
            if (data) setTournaments(data);
        };
        load();
    }, []);

    const fixEntry = async (tId: string) => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Try to find existing
            const { data: existing } = await supabase
                .from("tournament_entries")
                .select("*")
                .eq("tournament_id", tId)
                .eq("user_id", user.id)
                .single();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from("tournament_entries")
                    .update({ paid: true })
                    .eq("tournament_id", tId)
                    .eq("user_id", user.id);

                if (error) throw error;
                toast.success("Entry Updated to PAID!");
            } else {
                // Insert
                const { error } = await supabase
                    .from("tournament_entries")
                    .insert({
                        tournament_id: tId,
                        user_id: user.id,
                        paid: true,
                        current_stack: 1000 // Default stack
                    });

                if (error) throw error;
                toast.success("Entry CREATED and PAID!");
            }
        } catch (e: any) {
            toast.error("Failed TO FIX: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 bg-black text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-6">Debug Fix Tool</h1>
            <div className="mb-4">
                User: {user ? user.email : "Not Logged In"}
            </div>

            <div className="space-y-4">
                {tournaments.map(t => (
                    <div key={t.id} className="border p-4 rounded bg-zinc-900 flex justify-between items-center">
                        <div>
                            <div className="font-bold">{t.name}</div>
                            <div className="text-sm text-zinc-400">{t.id}</div>
                        </div>
                        <button
                            onClick={() => fixEntry(t.id)}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
                        >
                            {loading ? "Fixing..." : "FORCE JOIN & PAY"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
