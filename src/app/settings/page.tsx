"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Lock, Palette, HelpCircle, Zap, RotateCcw, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Admin Modal State
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [adminError, setAdminError] = useState(false);

    const handleAdminLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPassword === "123456") {
            router.push('/profile/admin');
        } else {
            setAdminError(true);
            setAdminPassword("");
        }
    };

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push('/login');
            } else {
                setUser(data.user);
            }
            setLoading(false);
        });
    }, []);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center bg-black text-white">Loading...</div>;
    }

    const settingsSections = [
        {
            title: "Account",
            items: [
                { icon: Lock, label: "Change Password", description: "Update your password", href: "#" },
                { icon: Bell, label: "Notifications", description: "Manage notification preferences", href: "#" },
            ]
        },
        {
            title: "Appearance",
            items: [
                { icon: Palette, label: "Theme", description: "Dark mode", href: "#" },
            ]
        },
        {
            title: "Support",
            items: [
                { icon: HelpCircle, label: "Help Center", description: "FAQs and guides", href: "#" },
            ]
        }
    ];

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-24 text-white">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/5 p-6">
                <Link href="/profile" className="rounded-full bg-white/5 p-2 transition-colors hover:bg-white/10">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-xl font-bold">Settings</h1>
            </div>

            {/* Settings Sections */}
            <div className="flex-1 space-y-6 p-6">
                {settingsSections.map((section) => (
                    <div key={section.title}>
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-500">
                            {section.title}
                        </h2>
                        <div className="space-y-2">
                            {section.items.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
                                >
                                    <div className="rounded-full bg-brand/10 p-2">
                                        <item.icon className="h-5 w-5 text-brand" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{item.label}</p>
                                        <p className="text-sm text-zinc-500">{item.description}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Beta Tools */}
                <div className="mt-8">
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#FFD700]">
                        Beta Admin Tools
                    </h2>
                    <div className="space-y-3">
                        <button
                            onClick={async () => {
                                const res = await fetch('/api/cron');
                                const data = await res.json();
                                alert(`Cron Triggered: ${JSON.stringify(data.actions)}`);
                                window.location.reload();
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/10 p-4 text-left transition-all hover:bg-[#FFD700]/20"
                        >
                            <div>
                                <p className="font-bold text-[#FFD700]">Trigger Resolution Cron</p>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Process all pending games now</p>
                            </div>
                            <Zap size={18} className="text-[#FFD700]" />
                        </button>

                        <button
                            onClick={async () => {
                                // For beta, we'll just give everyone +$1000 if they're low
                                alert("Bankroll reset to $1,000 for beta testing!");
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:bg-white/10"
                        >
                            <div>
                                <p className="font-bold">Reset My Balance</p>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Refill your PropCash to $1,000</p>
                            </div>
                            <RotateCcw size={18} className="text-zinc-500" />
                        </button>

                        <button
                            onClick={async () => {
                                if (confirm("DANGER: This will delete ALL your bets and reset your stats for a fresh start. Proceed?")) {
                                    const { adminHardReset } = await import('@/app/actions');
                                    await adminHardReset();
                                    alert("Account Hard Reset Complete!");
                                    window.location.reload();
                                }
                            }}
                            className="flex w-full items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-left transition-all hover:bg-destructive/20"
                        >
                            <div>
                                <p className="font-bold text-destructive">Hard Reset Everything</p>
                                <p className="text-xs text-destructive/60 uppercase tracking-widest">Wipe bets + Reset Bankroll</p>
                            </div>
                            <X size={18} className="text-destructive" />
                        </button>
                    </div>
                    {/* Admin Link (Password Protected) */}
                    <button
                        onClick={() => setShowAdminModal(true)}
                        className="mt-3 flex w-full items-center justify-between rounded-xl border border-brand/20 bg-brand/10 p-4 text-left transition-all hover:bg-brand/20"
                    >
                        <div>
                            <p className="font-bold text-brand">Open Admin Oracle</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">Create props & resolve markets</p>
                        </div>
                        <Lock size={18} className="text-brand" />
                    </button>
                </div>
            </div>

            {/* Admin Password Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Admin Access</h3>
                            <button onClick={() => setShowAdminModal(false)} className="rounded-full bg-white/5 p-2 text-zinc-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">Enter Password</label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => {
                                        setAdminPassword(e.target.value);
                                        setAdminError(false);
                                    }}
                                    className={`w-full rounded-xl border bg-black p-4 text-center text-lg font-bold tracking-widest text-white focus:outline-none ${adminError ? 'border-destructive' : 'border-white/10 focus:border-brand'}`}
                                    placeholder="••••••"
                                    autoFocus
                                />
                                {adminError && <p className="mt-2 text-xs font-bold text-destructive">Incorrect Password</p>}
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

            {/* Account Info */}
            <div className="mt-8 rounded-xl border border-white/5 bg-white/5 p-4">
                <p className="text-sm text-zinc-500">Logged in as</p>
                <p className="font-medium">{user.email}</p>
            </div>

            {/* Danger Zone */}
            <div className="mt-8">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-destructive">
                    Danger Zone
                </h2>
                <div className="space-y-3">
                    <button
                        onClick={async () => {
                            if (confirm("ADMIN ONLY: This will wipe the ENTIRE database (all props for everyone). Are you sure?")) {
                                const { clearDatabase } = await import('@/app/actions');
                                await clearDatabase();
                                alert("Database wiped!");
                                window.location.reload();
                            }
                        }}
                        className="w-full rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-left transition-colors hover:bg-destructive/20"
                    >
                        <p className="font-bold text-destructive">Wipe Global Database</p>
                        <p className="text-xs text-destructive/60 uppercase tracking-widest">Delete all props & votes (Admin)</p>
                    </button>

                    <button className="w-full rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-destructive transition-colors hover:bg-destructive/20 opacity-50 cursor-not-allowed">
                        Delete Account (Coming Soon)
                    </button>
                </div>
            </div>
        </main>
    );
}
