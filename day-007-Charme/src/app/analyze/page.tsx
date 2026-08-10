"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/?step=upload");
  }, [router]);
  return null;
}
