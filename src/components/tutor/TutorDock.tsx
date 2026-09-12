"use client";

import { useState } from "react";
import { ClaudeMark } from "./ClaudeMark";
import { TutorPanel } from "./TutorPanel";
import { useTutorStore } from "./tutorStore";

export function TutorDock() {
  const [open, setOpen] = useState(false);
  const attention = useTutorStore((s) => s.attention);
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close teaching assistant" : "Open teaching assistant"}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-line-2 bg-panel-2 shadow-panel transition-transform hover:scale-105 focus-visible:scale-105"
      >
        <ClaudeMark className="h-8 w-8" glow={!!attention} />
        {attention && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse-slow rounded-full bg-amber shadow-glow-amber" />}
      </button>
      {open && <TutorPanel onClose={() => setOpen(false)} />}
    </>
  );
}
