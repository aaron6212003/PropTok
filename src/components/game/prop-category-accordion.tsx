
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import PropRow from "./prop-row";

interface PropCategoryAccordionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export default function PropCategoryAccordion({
    title,
    icon,
    children,
    defaultExpanded = false
}: PropCategoryAccordionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="mb-4 border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-brand">{icon}</span>}
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">
                        {title}
                    </h3>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-zinc-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                )}
            </button>
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="p-4 pt-0 space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface PlayerPropGroupProps {
    playerName: string;
    subCategory: string;
    props: any[];
}

export function PlayerPropGroup({ playerName, subCategory, props }: PlayerPropGroupProps) {
    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-[2px] w-4 bg-brand/30" />
                <h4 className="text-[10px] font-bold text-brand uppercase tracking-wider">
                    {playerName} • {subCategory}
                </h4>
            </div>
            <div className="grid gap-2">
                {props.map((p) => (
                    <PropRow
                        key={p.id}
                        id={p.id}
                        question={p.question}
                        yesMultiplier={p.yesMultiplier}
                        noMultiplier={p.noMultiplier}
                        yesPercent={p.yesPercent}
                        category={p.category}
                    />
                ))}
            </div>
        </div>
    );
}
