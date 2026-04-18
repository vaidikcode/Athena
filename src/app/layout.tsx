import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SignInGate } from "@/components/auth/SignInGate";
import { SetupGate } from "@/components/auth/SetupGate";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Athena — Schedule OS",
  description: "Schedule intelligence, rules, and calendar leverage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`min-h-screen bg-surface-base text-ink antialiased ${inter.className}`}>
        <QueryProvider>
          <SignInGate>
            <SetupGate>
              <div className="flex h-screen min-h-0 bg-surface-base">
                <Sidebar />
                <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-base">{children}</main>
              </div>
            </SetupGate>
          </SignInGate>
        </QueryProvider>
      </body>
    </html>
  );
}
