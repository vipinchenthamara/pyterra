"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

export function PredictStep({ prompt, initial, onCommit }: { prompt: string; initial: string | null; onCommit: (text: string) => void }) {
  const [text, setText] = useState(initial ?? "");
  const [done, setDone] = useState(!!initial);
  return (
    <div className="rounded-[14px] border border-violet/30 bg-violet/5 p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <Eye className="h-4 w-4 text-violet-2" />
        <h3 className="font-display text-[14px] font-semibold tracking-wide">Predict first</h3>
        {done && <span className="label ml-auto !text-[0.58rem] text-violet-2">recorded</span>}
      </div>
      <p className="text-[13px] leading-relaxed text-fg-2">{prompt}</p>
      <div className="mt-2 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your prediction…"
          className="min-w-0 flex-1 rounded-md border border-line bg-bg-deep px-3 py-1.5 text-[13px] text-fg placeholder:text-fg-4 focus:border-violet/60 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onCommit(text.trim());
              setDone(true);
            }
          }}
        />
        <button
          onClick={() => {
            if (!text.trim()) return;
            onCommit(text.trim());
            setDone(true);
          }}
          className="rounded-md border border-violet/40 bg-violet/10 px-3 font-mono text-[10.5px] uppercase tracking-wider text-violet-2 hover:bg-violet/20"
        >
          Commit
        </button>
      </div>
    </div>
  );
}
