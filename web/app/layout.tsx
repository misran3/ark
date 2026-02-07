import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import TransactionDetailModal from "@/components/ui/TransactionDetailModal";
import { DevDashboardLoader } from "@/components/dev/DevDashboardLoader";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Ark — Bridge Command",
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
