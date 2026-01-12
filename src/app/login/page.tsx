"use client";

import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [view, setView] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState(""); // [NEW]
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();
        const redirectUrl = `${window.location.origin}/auth/callback`;

        let error;

        if (view === 'signup') {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: { full_name: username }
                }
            });
            error = signUpError;

            if (!error) {
                if (data.session) {
                    // Verification is off, or auto-confirmed
                    router.push('/');
                    router.refresh();
                } else {
                    // Verification is on
                    setMessage("Check your email to confirm signup!");
                }
            }
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            error = signInError;
            if (!error) {
                router.push('/');
                router.refresh();
            }
        }

        if (error) setMessage(error.message);
        setLoading(false);
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
    };

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-6 text-white">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tighter text-brand">PropTok</h1>
                    <p className="mt-2 text-zinc-400">Sign in to track your streak.</p>
                </div>

                <div className="flex rounded-lg bg-zinc-900 p-1">
                    <button
                        onClick={() => setView('signin')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${view === 'signin' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setView('signup')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${view === 'signup' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {/* [NEW] Username Input (Only for Sign Up) */}
                    {view === 'signup' && (
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-zinc-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                            required
                            minLength={3}
                        />
                    )}

                    <input
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-zinc-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-zinc-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        required
                        minLength={6}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-white transition-all hover:bg-brand/90 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : (view === 'signin' ? "Sign In" : "Create Account")}
                        <ArrowRight size={16} />
                    </button>
                </form>

                {message && (
                    <div className="rounded-lg bg-white/10 p-4 text-center text-sm text-yellow-400">
                        {message}
                    </div>
                )}


            </div>
        </main>
    );
}
