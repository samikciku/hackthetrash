"use client";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <div>
          &copy; {new Date().getFullYear()} HackTheTrash &middot; Prishtina pilot
        </div>
        <div>
          Powered by{" "}
          <a
            href="https://flossk.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            FLOSSK
          </a>
        </div>
      </div>
    </footer>
  );
}
