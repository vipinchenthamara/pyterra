"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export function EnterDistrictButton({ worldId, href, label = "Enter the district" }: { worldId: string; href: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/arrive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ worldId }) });
        } finally {
          router.push(href);
        }
      }}
    >
      {label} <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
