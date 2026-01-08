"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, X } from 'lucide-react';

export default function AdminAccessButton() {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "123456") {
            router.push('/profile/admin');
        } else {
            setError(true);
            setPassword("");
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="mt-6 flex w-full items-center justify-between rounded-xl border border-white/5 bg-zinc-900/50 p-4 transition-all hover:bg-zinc-900"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                        <Lock size={14} />
                    </div>
                    <span className="text-sm font-bold">Admin Panel</span>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Locked</span>
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Admin Access</h3>
                            <button onClick={() => setShowModal(false)} className="rounded-full bg-white/5 p-2 text-zinc-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Enter Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(false);
                                    }}
                                    className={`w-full rounded-xl border bg-black p-4 text-center text-lg font-bold tracking-widest text-white focus:outline-none ${error ? 'border-destructive' : 'border-white/10 focus:border-brand'}`}
                                    placeholder="••••••"
                                    autoFocus
                                />
                                {error && <p className="mt-2 text-xs font-bold text-destructive">Incorrect Password</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full rounded-xl bg-white py-4 text-sm font-black uppercase tracking-widest text-black transition-transform active:scale-[0.98]"
                            >
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
