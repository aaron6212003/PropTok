"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNavBar() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Feed', href: '/', icon: Home },
        { label: 'Rank', href: '/leaderboard', icon: Trophy },
        { label: 'Bundle', href: '/create', icon: PlusCircle },
        { label: 'Profile', href: '/profile', icon: User },
    ];

    return (
        <nav className="absolute bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/60 backdrop-blur-md pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 transition-colors duration-200",
                                isActive ? "text-brand" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={cn("transition-transform", isActive && "scale-110")}
                            />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
