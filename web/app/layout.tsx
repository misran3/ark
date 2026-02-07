import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import ThreeScene from "@/components/three/ThreeScene";
import CaptainNovaUI from "@/components/ui/CaptainNovaUI";
import ColdBootSequence from "@/components/ui/ColdBootSequence";
import TransactionDetailModal from "@/components/ui/TransactionDetailModal";
import { DevDashboardLoader } from "@/components/dev/DevDashboardLoader";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SynesthesiaPay — Bridge Command",
  description: "Your financial command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          {/* Three.js scene persists across all routes */}
          <ThreeScene />

          {/* Captain Nova UI persists across all routes */}
          <CaptainNovaUI />

          {/* Cold boot sequence overlay */}
          <ColdBootSequence />

          {/* Transaction Detail Modal persists across all routes */}
          <TransactionDetailModal />

          {/* Scanline overlay */}
          <div className="scanlines" />

          {/* Dev Dashboard (development mode only) */}
          <Suspense fallback={null}>
            <DevDashboardLoader />
          </Suspense>

          {/* Page content */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
