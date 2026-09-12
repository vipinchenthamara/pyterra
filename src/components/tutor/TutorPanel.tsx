"use client";

import { X } from "lucide-react";
import { ClaudeMark } from "./ClaudeMark";

/** Placeholder until Phase 5 replaces it with the full chat + modes panel. */
export function TutorPanel({ onClose }: { onClose: () => void }) {
  return (
    <aside className="panel hud fixed bottom-24 right-6 z-40 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col p-4" aria-label="Teaching assistant">
      <div className="mb-3 flex items-center gap-2">
        <ClaudeMark className="h-6 w-6" />
        <div className="font-display text-[14px] font-semibold">Claude · Teaching assistant</div>
        <button onClick={onClose} className="ml-auto rounded p-1 text-fg-3 hover:text-fg" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[13px] text-fg-2">The assistant comes online in the tutor phase.</p>
    </aside>
  );
}
