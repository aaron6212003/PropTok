"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefreshTrigger() {
    const router = useRouter();

    useEffect(() => {
        // Wait 2 seconds for the webhook to likely finish, then refresh data
        const timer = setTimeout(() => {
            router.refresh();
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    return null;
}
