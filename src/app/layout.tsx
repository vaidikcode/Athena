import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SignInGate } from "@/components/auth/SignInGate";
import { SetupGate } from "@/components/auth/SetupGate";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Athena — Schedule OS",
  description: "Schedule intelligence, rules, and calendar leverage",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className={`min-h-screen bg-nb-cream text-nb-black antialiased ${nunito.className}`}>
        <QueryProvider>
          <SignInGate>
            <SetupGate>
              <div className="flex h-screen min-h-0">
                <Sidebar />
                <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-nb-cream">{children}</main>
              </div>
            </SetupGate>
          </SignInGate>
        </QueryProvider>
      </body>
    </html>
  );
}
