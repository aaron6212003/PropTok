export default function Loading() {
    return (
        <div className="flex h-[100dvh] w-full flex-col bg-black overflow-hidden">
            {/* Top Header Loading */}
            <div className="absolute top-0 z-50 flex w-full items-center justify-between px-6 pt-6">
                <div className="h-6 w-24 animate-pulse rounded-lg bg-zinc-900" />
                <div className="h-9 w-32 animate-pulse rounded-full bg-zinc-900" />
            </div>

            {/* Sorting Tabs Loading */}
            <div className="fixed top-[72px] left-0 right-0 z-40 flex justify-center">
                <div className="h-10 w-72 animate-pulse rounded-full bg-zinc-900 border border-white/5" />
            </div>

            {/* Main Card Skeleton */}
            <div className="relative flex flex-1 flex-col p-6 pt-40 pb-32">
                <div className="mx-auto flex flex-col items-center gap-6 w-full max-w-lg">
                    <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-900" />
                    <div className="h-16 w-full animate-pulse rounded-2xl bg-zinc-900" />
                    <div className="h-8 w-40 animate-pulse rounded-full bg-zinc-900" />
                </div>

                <div className="mt-auto space-y-6">
                    <div className="flex justify-between px-2">
                        <div className="space-y-2">
                            <div className="h-3 w-32 animate-pulse rounded bg-zinc-900" />
                            <div className="h-2 w-20 animate-pulse rounded bg-zinc-900" />
                        </div>
                        <div className="h-4 w-12 animate-pulse rounded bg-zinc-900" />
                    </div>
                    <div className="h-1.5 w-full animate-pulse rounded-full bg-zinc-900" />
                    <div className="grid grid-cols-2 gap-3">
                        <div className="h-14 animate-pulse rounded-2xl bg-zinc-900" />
                        <div className="h-14 animate-pulse rounded-2xl bg-zinc-900" />
                    </div>
                </div>
            </div>

            {/* Bottom Nav Placeholder */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-black border-t border-white/5 px-6 flex items-center justify-between">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 w-8 animate-pulse rounded-lg bg-zinc-900" />
                ))}
            </div>
        </div>
    );
}
