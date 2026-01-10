import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // Removed as requested to stick to Arial/System for now or re-add
import "./globals.css";
import MobileContainer from "@/components/layout/mobile-container";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming for app-like feel
};

export const metadata: Metadata = {
  title: "PropTok",
  description: "Social Sports Predictions",
  manifest: "/manifest.json",
};

import { BetSlipProvider } from "@/lib/context/bet-slip-context";
import { Suspense } from "react";
import ToastProvider from "@/components/layout/toast-provider";
import { Toaster } from "sonner";
import TosModal from "@/components/auth/tos-modal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased selection:bg-brand selection:text-white">
        <Suspense fallback={null}>
          <BetSlipProvider>
            <MobileContainer>
              {children}
            </MobileContainer>
            <ToastProvider />
          </BetSlipProvider>
          <Toaster />
          <TosModal />
        </Suspense>
      </body>
    </html>
  );
}
