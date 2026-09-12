"use client";

import { useRef, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

export function NoteEditor({ skillId, skillName, anchor, initialValue }: { skillId: string; skillName: string; anchor: string; initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [state, setState] = useState<SaveState>("idle");
  const lastSaved = useRef(initialValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save() {
    if (value === lastSaved.current) return;
    setState("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { notes: { [skillId]: value } } }),
      });
      if (!res.ok) throw new Error(String(res.status));
      lastSaved.current = value;
      setState("saved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), 2400);
    } catch {
      setState("error");
    }
  }

  const id = `note-${skillId}`;
  return (
    <div className="panel-inset p-4">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="min-w-0">
          <span className="font-display text-[14px] font-semibold tracking-wide">{skillName}</span>
          <span className="ml-2 font-mono text-[11.5px] italic text-fg-3">{anchor}</span>
        </label>
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-fg-4" aria-live="polite">
          {state === "saving" && "Saving…"}
          {state === "saved" && <span className="text-emerald-2">Saved</span>}
          {state === "error" && <span className="text-rose">Not saved</span>}
        </span>
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        rows={3}
        placeholder="What do you want future-you to remember about this?"
        className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 font-sans text-[13px] leading-relaxed text-fg placeholder:text-fg-4 focus:border-cyan/50"
      />
    </div>
  );
}
