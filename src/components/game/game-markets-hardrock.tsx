
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import PropRow from "./prop-row";

// Types for the structured data
type PropCategoryMap = Record<string, Record<string, Record<string, any[]>>>;

interface GameMarketsHardrockProps {
    gameLines: any[];
    categorizedProps: PropCategoryMap;
}

export default function GameMarketsHardrock({ gameLines, categorizedProps }: GameMarketsHardrockProps) {
    // 1. Define Main Tabs
    // "POPULAR" will assume Game Lines for now, or a specific subset
    const MAIN_TABS = ["POPULAR", "PLAYER PROPS", "GAME LINES"];

    // 2. State
    const [activeMainTab, setActiveMainTab] = useState("PLAYER PROPS");
    const [activeSubTab, setActiveSubTab] = useState<string | null>(null);

    // 3. Derived Data for Rendering
    // If Player Props is active, what are the sub-tabs? (e.g. TOUCHDOWNS, PASSING)
    const getSubTabs = () => {
        if (activeMainTab === "PLAYER PROPS") {
            // In our data structure, keys of categorizedProps["PLAYER PROPS"] are the sub-tabs
            const propsData = categorizedProps["PLAYER PROPS"];
            return propsData ? Object.keys(propsData) : [];
        }
        return [];
    };

    const subTabs = getSubTabs();

    // Auto-select first sub-tab if none selected and sub-tabs exist
    if (activeMainTab === "PLAYER PROPS" && !activeSubTab && subTabs.length > 0) {
        setActiveSubTab(subTabs[0]);
    }

    // --- RENDERERS ---

    const renderGameLines = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {gameLines.map((p: any) => (
                <PropRow
                    key={p.id}
                    id={p.id}
                    question={p.question}
                    yesMultiplier={p.yes_multiplier}
                    noMultiplier={p.no_multiplier}
                    yesPercent={p.yes_percent || 50}
                    category={p.category}
                />
            ))}
        </div>
    );

    const renderPlayerProps = () => {
        if (!activeSubTab) return <div className="text-zinc-500 text-center py-10">No props available.</div>;

        const playersData = categorizedProps["PLAYER PROPS"]?.[activeSubTab] || {};

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {Object.entries(playersData).map(([playerName, props]) => (
                    <div key={playerName} className="bg-[#1C1C1E] rounded-xl overflow-hidden border border-white/5">
                        <div className="bg-[#2C2C2E] px-4 py-2 flex items-center gap-2 border-b border-white/5">
                            <div className="w-1 h-3 bg-[#8B5CF6] rounded-full" />
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                                {playerName}
                            </h3>
                        </div>
                        <div className="p-2 space-y-1">
                            {props.sort((a: any, b: any) => {
                                const lineA = parseFloat(a.question.match(/[\d.]+/)?.[0] || "0");
                                const lineB = parseFloat(b.question.match(/[\d.]+/)?.[0] || "0");
                                return lineA - lineB;
                            }).map((p: any) => (
                                <PropRow
                                    key={p.id}
                                    id={p.id}
                                    question={p.question}
                                    yesMultiplier={p.yes_multiplier}
                                    noMultiplier={p.no_multiplier}
                                    yesPercent={p.yes_percent || 50}
                                    category={p.category}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen pb-40">
            {/* STICKY HEADER 1: MAIN TABS */}
            <div className="sticky top-16 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 -mx-6 px-6 pt-2">
                <div className="flex w-full">
                    {MAIN_TABS.map((tab) => {
                        const isActive = activeMainTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveMainTab(tab);
                                    setActiveSubTab(null); // Reset sub-tab
                                }}
                                className={cn(
                                    "flex-1 pb-3 text-[11px] font-black uppercase tracking-widest relative transition-colors",
                                    isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {tab}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.6)]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* STICKY HEADER 2: SUB TABS (PILLS) */}
            {activeMainTab === "PLAYER PROPS" && subTabs.length > 0 && (
                <div className="sticky top-[7.5rem] z-30 bg-zinc-950/95 backdrop-blur-md border-b border-white/5 -mx-6 px-6 py-3 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {subTabs.map((sub) => {
                            const isSubActive = activeSubTab === sub;
                            return (
                                <button
                                    key={sub}
                                    onClick={() => setActiveSubTab(sub)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border",
                                        isSubActive
                                            ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                                            : "bg-zinc-900 border-white/10 text-zinc-400 hover:bg-zinc-800"
                                    )}
                                >
                                    {sub}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="mt-6">
                {(activeMainTab === "POPULAR" || activeMainTab === "GAME LINES") && renderGameLines()}
                {activeMainTab === "PLAYER PROPS" && renderPlayerProps()}
            </div>
        </div>
    );
}
