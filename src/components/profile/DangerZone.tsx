"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui";

export function DangerZone() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const armed = confirm === "RESET";

  async function reset() {
    if (!armed || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all", confirm: "RESET" }),
      });
      if (!res.ok) throw new Error(`Reset failed (${res.status})`);
      setConfirm("");
      setMessage("All progress reset.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-bg-deep p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-[14px] font-semibold tracking-wide">Export progress</div>
          <p className="text-[12px] text-fg-3">Every attempt, skill state, artifact and note as one JSON file. Yours to keep.</p>
        </div>
        <a
          href="/api/export"
          download
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line-2 bg-panel-2 px-4 py-2 font-display text-[13.5px] font-semibold tracking-wide text-fg transition-all hover:border-cyan/50 hover:text-cyan"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
          Export progress (JSON)
        </a>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-rose/30 bg-rose/5 p-4">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose" strokeWidth={1.75} />
          <div>
            <div className="font-display text-[14px] font-semibold tracking-wide text-rose">Reset all progress</div>
            <p className="text-[12px] text-fg-3">Deletes every attempt, skill state, artifact, review and note. Export first if you want a copy. This cannot be undone.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label htmlFor="reset-confirm" className="sr-only">
            Type RESET to confirm
          </label>
          <input
            id="reset-confirm"
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type RESET to confirm"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-[13px] text-fg placeholder:text-fg-4 focus:border-rose/50 sm:max-w-[260px]"
          />
          <Button type="button" variant="danger" disabled={!armed || busy} onClick={reset}>
            {busy ? "Resetting…" : "Reset all progress"}
          </Button>
          {message && (
            <span className="font-mono text-[11.5px] text-fg-3" aria-live="polite">
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
