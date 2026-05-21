import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eisenhower Matrix",
  description: "Manage tasks with a dynamic Eisenhower Matrix.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="flex min-h-full flex-col">
          <header className="border-b border-black/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
              >
                Eisenhower Matrix
              </Link>
              <nav className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <Link
                  href="/"
                  className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Matrix
                </Link>
                <Link
                  href="/done"
                  className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Done
                </Link>
                <Link
                  href="/history"
                  className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  History
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
