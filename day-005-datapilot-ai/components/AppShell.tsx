"use client";

import Link from "next/link";
import { ReactNode } from "react";

export default function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <Link href="/" className="text-3xl font-bold">
            🚀 DataPilot AI
          </Link>

          <nav className="flex gap-8 text-gray-600">
            <Link href="/datasets">Catalog</Link>
            <Link href="/copilot">Copilot</Link>
            <Link href="/missions">Missions</Link>
            <Link href="/learn">Learn</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-10">
        {children}
      </main>
    </div>
  );
}