import "../styles/globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HackTheTrash 🗑️",
  description: "Crowdsourced reporting of illegal landfills"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-white border-b shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg">🗑️ HackTheTrash</Link>
            <div className="flex gap-4 text-sm">
              <Link href="/map" className="hover:text-primary">🗺️ Map</Link>
              <Link href="/report" className="bg-primary text-white px-3 py-1 rounded hover:opacity-90">📸 Report</Link>
              <Link href="/dashboard" className="hover:text-primary">📊 Dashboard</Link>
            </div>
          </nav>
        </header>
        <main className="min-h-[calc(100vh-60px)]">{children}</main>
      </body>
    </html>
  );
}
