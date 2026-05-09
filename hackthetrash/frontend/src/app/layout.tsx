import "../styles/globals.css";
import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "HackTheTrash",
  description: "Crowdsourced reporting of illegal landfills"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <Header />
          <main className="min-h-[calc(100vh-60px)]">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
