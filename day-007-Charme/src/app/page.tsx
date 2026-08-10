import { Suspense } from "react";
import { CharmeApp } from "@/components/charme/CharmeApp";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-charme-muted">
          Opening CHARME…
        </div>
      }
    >
      <CharmeApp />
    </Suspense>
  );
}
