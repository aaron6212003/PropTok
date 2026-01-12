"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ label }: { label?: string }) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="flex items-center gap-2 p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
        >
            <ArrowLeft size={20} />
            {label && <span className="text-xs font-bold uppercase tracking-widest">{label}</span>}
        </button>
    );
}
