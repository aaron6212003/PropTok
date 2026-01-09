export default function Loading() {
    return (
        <div className="flex h-screen w-full flex-col bg-black p-6 pb-24">
            {/* Profile Header Skeleton */}
            <div className="mb-10 flex flex-col items-center gap-4">
                <div className="h-24 w-24 animate-pulse rounded-full bg-zinc-900" />
                <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-900" />
                <div className="h-10 w-32 animate-pulse rounded-full bg-zinc-900" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-3 gap-3 mb-10">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-900" />
                ))}
            </div>

            {/* History List Skeleton */}
            <div className="space-y-4">
                <div className="h-6 w-32 animate-pulse rounded bg-zinc-900 mb-4" />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-zinc-900" />
                ))}
            </div>
        </div>
    );
}
