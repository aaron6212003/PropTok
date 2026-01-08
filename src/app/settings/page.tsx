import Link from 'next/link';
import { ArrowLeft, Bell, Lock, Palette, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
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
