"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
    return (
        <Toaster
            theme="dark"
            position="top-center"
            richColors
            closeButton
            toastOptions={{
                style: {
                    background: 'rgba(24, 24, 27, 0.8)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    color: '#fff',
                },
            }}
        />
    );
}
