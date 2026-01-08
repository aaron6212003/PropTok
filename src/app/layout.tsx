import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google"; // Removed as requested to stick to Arial/System for now or re-add
import "./globals.css";
import MobileContainer from "@/components/layout/mobile-container";

export const metadata: Metadata = {
  title: "PropTok",
  description: "Predict. Compete. Rank.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zooming for app-like feel
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased selection:bg-brand selection:text-white">
        <MobileContainer>
          {children}
        </MobileContainer>
      </body>
    </html>
  );
}
