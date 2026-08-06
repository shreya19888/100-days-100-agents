"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    pathname === href
      ? "text-blue-600 font-semibold"
      : "text-gray-600 hover:text-blue-600 transition";

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        <Link href="/" className="text-2xl font-bold">
          🚀 DataPilot AI
        </Link>

        <div className="flex items-center gap-8">
          <Link href="/datasets" className={linkClass("/datasets")}>
            Catalog
          </Link>

          <Link href="/copilot" className={linkClass("/copilot")}>
            Copilot
          </Link>

          <Link href="/missions" className={linkClass("/missions")}>
            Missions
          </Link>

          <Link href="/learn" className={linkClass("/learn")}>
            Learn
          </Link>
        </div>
      </div>
    </nav>
  );
}