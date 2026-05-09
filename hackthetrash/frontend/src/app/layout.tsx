import "../styles/globals.css";
import type { Metadata } from "next";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import HtmlLangSync from "@/lib/HtmlLangSync";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "HackTheTrash",
  description: "Crowdsourced reporting of illegal landfills in Pristina"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AuthProvider>
            <HtmlLangSync />
            <Header />
            <main className="min-h-[calc(100vh-60px)]">{children}</main>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
