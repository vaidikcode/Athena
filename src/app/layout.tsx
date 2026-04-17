import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Phuko — Life OS",
  description: "Your hourly intelligence layer",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <QueryProvider>
          <Sidebar />
          <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
