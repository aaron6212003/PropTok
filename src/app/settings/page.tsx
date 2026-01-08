"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Lock, Palette, HelpCircle, Zap, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
                    </div>
                </div>

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
                    <button className="w-full  rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive transition-colors hover:bg-destructive/20">
                        Delete Account
                    </button>
                </div>
            </div>
        </main>
    );
}
