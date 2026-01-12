
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import PropRow from "./prop-row";

interface GameMarketsViewProps {
    gameLines: any[];
    categorizedProps: Record<string, Record<string, Record<string, any[]>>>;
}

export default function GameMarketsView({ gameLines, categorizedProps }: GameMarketsViewProps) {
    const categories = ["ALL", "LINES", ...Object.keys(categorizedProps)];
    const [activeTab, setActiveTab] = useState("LINES");

    const renderGameLines = () => (
        <section className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-brand mb-4">Game Lines</h2>
            <div className="grid gap-2">
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
        </section>
    );

    const renderCategorizedProps = (catName: string, subCats: Record<string, Record<string, any[]>>) => (
        <div key={catName} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {Object.entries(subCats).map(([subName, players]) => (
                <div key={subName}>
                    <h3 className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-4 pl-2 border-l-2 border-brand/50">
                        {subName}
                    </h3>
                    {Object.entries(players).map(([playerName, props]) => (
                        <div key={playerName} className="mb-4 last:mb-0 bg-white/[0.02] rounded-2xl p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">{playerName}</span>
                            </div>
                            <div className="space-y-1">
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
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Wrapped Tab Bar (No horizontal scroll) */}
            <div className="sticky top-16 z-40 -mx-6 px-6 bg-black/80 backdrop-blur-md border-b border-white/5 py-3">
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                                activeTab === cat
                                    ? "bg-brand text-black border-brand shadow-[0_0_15px_rgba(0,220,130,0.4)]"
                                    : "bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800 hover:border-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="pb-40">
                {activeTab === "ALL" && (
                    <div className="space-y-12">
                        {gameLines.length > 0 && renderGameLines()}
                        {Object.entries(categorizedProps).map(([name, subs]) => renderCategorizedProps(name, subs))}
                    </div>
                )}

                {activeTab === "LINES" && gameLines.length > 0 && renderGameLines()}

                {activeTab !== "ALL" && activeTab !== "LINES" && categorizedProps[activeTab] && (
                    renderCategorizedProps(activeTab, categorizedProps[activeTab])
                )}
            </div>
        </div>
    );
}
