import Link from "next/link";

export default function HomePage() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h1 className="text-5xl font-extrabold mb-4">
        Together, let&apos;s clean up our cities. 🌍
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Spot illegal trash? Snap a photo, drop a pin, change your community.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/report" className="bg-primary text-white px-6 py-3 rounded-lg shadow hover:opacity-90">
          📸 Report Trash
        </Link>
        <Link href="/map" className="bg-white border px-6 py-3 rounded-lg shadow hover:bg-gray-50">
          🗺️ View Map
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { n: "1️⃣", t: "Snap", d: "Photograph the dumped trash" },
          { n: "2️⃣", t: "Locate", d: "Auto-detect or pin GPS" },
          { n: "3️⃣", t: "Submit", d: "Anonymous or signed-in" }
        ].map((s) => (
          <div key={s.t} className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-4xl mb-2">{s.n}</div>
            <h3 className="font-bold text-lg">{s.t}</h3>
            <p className="text-gray-600">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
