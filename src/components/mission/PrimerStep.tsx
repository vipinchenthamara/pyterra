"use client";

import { useState } from "react";
import { Play, Check, ArrowRight, BookOpen } from "lucide-react";
import type { Primer } from "@content/schema";
import { getRunner } from "@/engine/runner/pyodideClient";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface PrimerView {
  skillId: string;
  name: string;
  anchor: string;
  primer: Primer;
  isNew: boolean;
}

/** The free "Learn" step: primers for the mission's skills, each note runnable in the same Python runtime. */
export function PrimerStep({ primers, onContinue }: { primers: PrimerView[]; onContinue: () => void }) {
  const [active, setActive] = useState(0);
  const p = primers[active];
  if (!p) return null;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      {primers.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Concepts">
          {primers.map((x, i) => (
            <button key={x.skillId} role="tab" aria-selected={i === active} onClick={() => setActive(i)} className={cn("rounded-md border px-3 py-1.5 font-display text-[13px] font-semibold tracking-wide", i === active ? "border-cyan/50 bg-cyan/10 text-cyan" : "border-line text-fg-3 hover:text-fg")}>
              {x.name} {x.isNew && <span className="ml-1 font-mono text-[9.5px] uppercase text-amber-2">new</span>}
            </button>
          ))}
        </div>
      )}
      <section className="panel hud">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan" />
          <span className="label">Learn · {p.name}</span>
          {p.isNew ? <Badge tone="amber">first time</Badge> : <Badge tone="neutral">refresher</Badge>}
          <span className="ml-auto font-mono text-[10.5px] text-fg-4">free · no hint cost</span>
        </div>
        <h2 className="mt-2 font-display text-[24px] font-semibold tracking-wide">{p.anchor}</h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-fg-2">{p.primer.intro}</p>
      </section>
      <ol className="flex flex-col gap-3">
        {p.primer.notes.map((n, i) => (
          <NoteCard key={`${p.skillId}-${i}`} index={i + 1} title={n.title} body={n.body} code={n.code} expected={n.output} />
        ))}
      </ol>
      <section className="panel !py-4">
        <div className="label mb-1">Say it back</div>
        <p className="font-display text-[15px] text-fg">{p.primer.takeaway}</p>
      </section>
      <div className="flex items-center gap-2">
        {active < primers.length - 1 ? (
          <Button onClick={() => setActive(active + 1)}>
            Next concept: {primers[active + 1].name} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onContinue}>
            Start building <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {active < primers.length - 1 && (
          <Button variant="ghost" onClick={onContinue}>Skip to the mission</Button>
        )}
      </div>
    </div>
  );
}

function NoteCard({ index, title, body, code, expected }: { index: number; title: string; body: string; code: string; expected: string }) {
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await getRunner().run(code, { visible: "", hidden: "" }, 3000);
      setOut(r.stdout.trim() || "(no output)");
      if (r.error) setErr(r.error);
    } finally {
      setBusy(false);
    }
  };
  const matches = out !== null && out === expected.trim();
  return (
    <li className="panel !p-4">
      <div className="flex items-start gap-3">
        <span className="readout mt-0.5 text-[11px] text-cyan">0{index}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold tracking-wide">{title}</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-fg-2">{body}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <pre className="panel-inset overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-fg">{code}</pre>
            <div className="panel-inset flex flex-col px-3 py-2.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="label !text-[0.56rem]">{out === null ? "expected output" : "your output"}</span>
                {matches && <Check className="h-3.5 w-3.5 text-emerald-2" />}
              </div>
              <pre className={cn("flex-1 whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed", out === null ? "text-fg-3" : matches ? "text-emerald-2" : "text-amber-2")}>{out ?? expected}</pre>
              {err && <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] text-rose">{err}</pre>}
            </div>
          </div>
          <button onClick={run} disabled={busy} className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wider text-cyan hover:bg-cyan/20 disabled:opacity-50">
            <Play className="h-3 w-3" /> {busy ? "running" : out === null ? "Run it" : "Run again"}
          </button>
        </div>
      </div>
    </li>
  );
}
