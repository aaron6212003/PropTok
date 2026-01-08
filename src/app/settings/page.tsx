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

                {/* Version Info */}
                <div className="mt-8">
                    <p className="text-center text-xs text-zinc-600">
                        PropTok Beta v0.9.5
                        <br />
                        Built by Aaron
                    </p>
                </div>
            </div>
        </main>
    );
}
