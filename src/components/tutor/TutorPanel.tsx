"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles } from "lucide-react";
import { ClaudeMark } from "./ClaudeMark";
import { useTutorStore } from "./tutorStore";
import { TUTOR_MODES, type TutorMode, type TutorReply, type TutorTurn } from "@/tutor/types";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

export function TutorPanel({ onClose }: { onClose: () => void }) {
  const ctx = useTutorStore((s) => s.ctx);
  const nudge = useTutorStore((s) => s.nudge);
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [provider, setProvider] = useState<"anthropic" | "mock" | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const onMission = !!ctx.missionId;

  useEffect(() => {
    nudge(null);
    let cancelled = false;
    fetch(`/api/tutor${ctx.attemptId ? `?attemptId=${ctx.attemptId}` : ""}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setProvider(j.provider);
        setTurns(j.history ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ctx.attemptId, nudge]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns, busy]);

  const send = async (mode: TutorMode, message: string) => {
    if (busy) return;
    const def = TUTOR_MODES.find((m) => m.id === mode)!;
    setBusy(true);
    setNote(null);
    setTurns((t) => [...t, { role: "user", content: message || def.label, mode, createdAt: new Date().toISOString() }]);
    setInput("");
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, message, attemptId: ctx.attemptId, missionId: ctx.missionId, code: ctx.code, lastError: ctx.lastError, lastTests: ctx.lastTests, requestHint: def.requestHint }),
      });
      const j = (await res.json()) as TutorReply;
      setProvider(j.provider);
      setTurns((t) => [...t, { role: "tutor", content: j.reply, mode, hintLevel: j.hintLevel, createdAt: new Date().toISOString() }]);
      if (j.note) setNote(j.note);
      if (def.requestHint) window.dispatchEvent(new CustomEvent("architect:hint", { detail: { level: j.hintLevel } }));
    } catch {
      setNote("The assistant could not be reached. Your progress is unaffected.");
    } finally {
      setBusy(false);
    }
  };

  const modes = onMission ? TUTOR_MODES : TUTOR_MODES.filter((m) => m.id === "chat" || m.id === "quiz");

  return (
    <aside className="panel hud fixed bottom-24 right-6 z-40 flex h-[min(640px,calc(100vh-8rem))] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden !p-0 animate-rise" aria-label="Teaching assistant">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <ClaudeMark className="h-6 w-6" />
        <div>
          <div className="font-display text-[14px] font-semibold leading-tight">Claude</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-3">{onMission ? ctx.missionTitle : "Progress assistant"}</div>
        </div>
        <Badge tone={provider === "anthropic" ? "cyan" : "amber"} className="ml-auto">{provider === "anthropic" ? "online" : "offline mode"}</Badge>
        <button onClick={onClose} className="rounded p-1 text-fg-3 hover:text-fg" aria-label="Close teaching assistant">
          <X className="h-4 w-4" />
        </button>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
        {turns.length === 0 && (
          <div className="rounded-lg border border-line bg-bg-deep/60 p-3 text-[13px] leading-relaxed text-fg-2">
            {onMission ? (
              <>I can see your code, the last error and the tests. I won&apos;t hand you the solution; I&apos;ll get you to it. Hints requested here count on the ladder.</>
            ) : (
              <>I track your worlds, skills and repairs. Ask what to do next, or open a mission and I&apos;ll help with the code.</>
            )}
            {provider === "mock" && <div className="mt-2 font-mono text-[10.5px] text-amber-2">Offline mode: authored hints only. Add ANTHROPIC_API_KEY to .env.local to enable Claude.</div>}
          </div>
        )}
        <ul className="flex flex-col gap-2.5">
          {turns.map((t, i) => (
            <li key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-[13px] leading-relaxed", t.role === "user" ? "bg-cyan/10 text-fg" : "border border-line bg-bg-deep/70 text-fg-2")}>
                {t.role === "tutor" && t.hintLevel ? <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-amber-2">hint level {t.hintLevel}</span> : null}
                {t.content}
              </div>
            </li>
          ))}
          {busy && (
            <li className="flex justify-start">
              <div className="rounded-lg border border-line bg-bg-deep/70 px-3 py-2 font-mono text-[11px] text-fg-3">
                thinking<span className="animate-blink">…</span>
              </div>
            </li>
          )}
        </ul>
        {note && <p className="mt-3 font-mono text-[10.5px] text-amber-2">{note}</p>}
      </div>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {modes.map((m) => (
            <button key={m.id} onClick={() => send(m.id, "")} disabled={busy} className={cn("rounded-md border px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider transition-colors disabled:opacity-50", m.requestHint ? "border-amber/40 bg-amber/10 text-amber-2 hover:bg-amber/20" : "border-line text-fg-3 hover:border-cyan/50 hover:text-cyan")}>
              {m.requestHint && <Sparkles className="mr-1 inline h-3 w-3" />}
              {m.label}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) send("chat", input.trim());
          }}
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={onMission ? "Ask about your code…" : "What should I do next?"} className="min-w-0 flex-1 rounded-md border border-line bg-bg-deep px-3 py-2 text-[13px] text-fg placeholder:text-fg-4 focus:border-cyan/50 focus:outline-none" />
          <button type="submit" disabled={busy || !input.trim()} className="rounded-md bg-cyan px-3 text-bg-deep disabled:opacity-40" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
