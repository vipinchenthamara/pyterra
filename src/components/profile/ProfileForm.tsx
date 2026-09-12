"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface ProfileFormValues {
  displayName: string;
  domain: "security" | "cloud" | "ai" | "general";
  defaultSessionMinutes: 5 | 15 | 0;
  tutorEnabled: boolean;
  dailyTokenBudget: number;
}

const DOMAINS: { value: ProfileFormValues["domain"]; label: string }[] = [
  { value: "security", label: "Security" },
  { value: "cloud", label: "Cloud" },
  { value: "ai", label: "AI" },
  { value: "general", label: "General" },
];

const SESSIONS: { value: ProfileFormValues["defaultSessionMinutes"]; label: string; hint: string }[] = [
  { value: 5, label: "5 min", hint: "one quick mission" },
  { value: 15, label: "15 min", hint: "a focused block" },
  { value: 0, label: "Deep", hint: "no timer" },
];

type SaveState = "idle" | "saving" | "saved" | "error";

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const [form, setForm] = useState<ProfileFormValues>(profile);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (state === "saved") setState("idle");
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          settings: { domain: form.domain, defaultSessionMinutes: form.defaultSessionMinutes, tutorEnabled: form.tutorEnabled, dailyTokenBudget: Math.max(0, Math.floor(form.dailyTokenBudget)) },
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setState("saved");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  const segBtn = (active: boolean) =>
    cn(
      "flex-1 rounded-md px-3 py-1.5 font-display text-[13px] font-semibold tracking-wide transition-colors",
      active ? "bg-cyan/12 text-cyan shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]" : "text-fg-3 hover:text-fg",
    );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="displayName" className="label mb-2 block">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            maxLength={40}
            required
            className="w-full rounded-lg border border-line bg-bg px-3 py-2 font-sans text-[14px] text-fg focus:border-cyan/50"
          />
        </div>
        <div>
          <label htmlFor="dailyTokenBudget" className="label mb-2 block">
            Daily token budget
          </label>
          <input
            id="dailyTokenBudget"
            type="number"
            min={0}
            step={1000}
            value={form.dailyTokenBudget}
            onChange={(e) => set("dailyTokenBudget", Number(e.target.value) || 0)}
            className="readout w-full rounded-lg border border-line bg-bg px-3 py-2 text-[14px] text-fg focus:border-cyan/50"
          />
          <p className="mt-1.5 text-[12px] text-fg-3">Tutor calls stop for the day once this many tokens are spent.</p>
        </div>
      </div>

      <fieldset>
        <legend className="label mb-2">Domain preference</legend>
        <div role="radiogroup" aria-label="Domain preference" className="flex rounded-lg border border-line bg-bg-deep p-1">
          {DOMAINS.map((d) => (
            <button key={d.value} type="button" role="radio" aria-checked={form.domain === d.value} onClick={() => set("domain", d.value)} className={segBtn(form.domain === d.value)}>
              {d.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-fg-3">Shapes which world-framed examples and mission flavour text you see first.</p>
      </fieldset>

      <fieldset>
        <legend className="label mb-2">Default session length</legend>
        <div role="radiogroup" aria-label="Default session length" className="flex rounded-lg border border-line bg-bg-deep p-1">
          {SESSIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={form.defaultSessionMinutes === s.value}
              onClick={() => set("defaultSessionMinutes", s.value)}
              className={segBtn(form.defaultSessionMinutes === s.value)}
              title={s.hint}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-bg-deep px-4 py-3">
        <div>
          <div className="font-display text-[14px] font-semibold tracking-wide">Tutor enabled</div>
          <p className="text-[12px] text-fg-3">Hints, error explanations and the tutor dock. Missions still run without it.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.tutorEnabled}
          aria-label="Tutor enabled"
          onClick={() => set("tutorEnabled", !form.tutorEnabled)}
          className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors", form.tutorEnabled ? "border-cyan/50 bg-cyan/30" : "border-line-2 bg-panel-3")}
        >
          <span className={cn("absolute top-0.5 h-[18px] w-[18px] rounded-full transition-[left]", form.tutorEnabled ? "left-[22px] bg-cyan shadow-glow-cyan" : "left-0.5 bg-fg-3")} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={state === "saving" || form.displayName.trim().length === 0}>
          {state === "saving" ? "Saving…" : "Save profile"}
        </Button>
        <span className="font-mono text-[11.5px]" aria-live="polite">
          {state === "saved" && <span className="text-emerald-2">Saved</span>}
          {state === "error" && <span className="text-rose">{error}</span>}
        </span>
      </div>
    </form>
  );
}
