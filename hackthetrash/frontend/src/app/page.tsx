"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import LatestPictures from "@/components/LatestPictures";
import EmailSubscribe from "@/components/EmailSubscribe";

export default function HomePage() {
  const { t } = useI18n();

  const steps = [
    { n: "1", title: t("home.step1"), desc: t("home.step1d") },
    { n: "2", title: t("home.step2"), desc: t("home.step2d") },
    { n: "3", title: t("home.step3"), desc: t("home.step3d") }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <section className="relative overflow-hidden rounded-2xl text-center px-4 py-12 md:py-16">
        {/* Prishtina logo: 80% transparent (20% opacity) so headline stays readable */}
        <div
          className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url(/prishtina-logo.jpg)" }}
          aria-hidden
        />
        <div className="relative z-10">
        <div className="inline-block bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm px-3 py-1 rounded-full mb-6">
          {t("home.pristina")}
        </div>
        <h1 className="text-5xl font-extrabold mb-4">{t("app.tagline")}</h1>
        <p className="text-lg text-gray-600 mb-8">{t("home.subtitle")}</p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/report" className="bg-primary text-white px-6 py-3 rounded-lg shadow hover:opacity-90">
            📸 {t("home.ctaReport")}
          </Link>
          <Link href="/map" className="bg-white border px-6 py-3 rounded-lg shadow hover:bg-gray-50">
            🗺️ {t("home.ctaMap")}
          </Link>
        </div>

        <h2 className="text-2xl font-bold mt-16 mb-6">{t("home.howItWorks")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-4xl mb-2 text-primary font-extrabold">{s.n}</div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* Latest pictures of trash - rotating carousel of the last month */}
      <LatestPictures limit={16} withinDays={30} intervalMs={4000} />

      {/* Phase 2: email subscriptions */}
      <div className="mt-12 max-w-2xl mx-auto">
        <EmailSubscribe />
      </div>
    </div>
  );
}
