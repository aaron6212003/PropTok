"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Trophy, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function BottomNavBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournament');

    const navItems = [
        { label: 'Feed', href: '/', icon: Home },
        { label: 'Tournaments', href: '/tournaments', icon: Trophy },
        { label: 'Bundle', href: '/create', icon: PlusCircle },
        { label: 'Profile', href: '/profile', icon: User },
    ];

    return (
        <nav className="absolute bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/60 backdrop-blur-md pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const href = tournamentId ? `${item.href}?tournament=${tournamentId}` : item.href;

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 p-2 transition-colors duration-200",
                                isActive ? "text-brand" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <motion.div
                                whileTap={{ scale: 0.8, rotate: isActive ? 0 : [0, -10, 10, 0] }}
                                whileHover={{ y: -2 }}
                                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                                onClick={() => {
                                    if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                        navigator.vibrate(5); // Light tap on switch
                                    }
                                }}
                            >
                                <Icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </motion.div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                                isActive ? "opacity-100 translate-y-0" : "opacity-60 translate-y-0.5"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
