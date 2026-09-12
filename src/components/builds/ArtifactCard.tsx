"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Boxes, ChevronDown, Code2, Database, Filter, Terminal, Shield, Radar, FileText, Globe2, Cpu, Network, Lock, Workflow, Bot, Layers,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";

const ICONS: Record<string, LucideIcon> = {
  terminal: Terminal, filter: Filter, database: Database, shield: Shield, radar: Radar, "file-text": FileText, globe: Globe2, cpu: Cpu,
  network: Network, lock: Lock, workflow: Workflow, bot: Bot, layers: Layers, code: Code2,
};

export interface ArtifactCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  worldName: string;
  unlocked: boolean;
  builtLabel: string | null;
  code: Record<string, string>;
  architectureNotes?: string;
  missingMissionIds: string[];
}

export function ArtifactCard(a: ArtifactCardProps) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[a.icon] ?? Boxes;
  const missionEntries = Object.entries(a.code);
  const missing = a.missingMissionIds.length;

  if (!a.unlocked) {
    return (
      <article className="flex flex-col gap-3 rounded-[14px] border border-dashed border-line-2 bg-panel/40 p-5 opacity-60" aria-label={`${a.name}, locked`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-2 bg-bg-deep text-fg-3">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <Badge tone="violet">Locked</Badge>
        </div>
        <div>
          <h3 className="font-display text-[16px] font-semibold tracking-wide text-fg-2">{a.name}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-3">{a.description}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-[11.5px] text-fg-3">
          <span>{a.worldName}</span>
          <span className="readout">
            {missing} {missing === 1 ? "mission" : "missions"} away
          </span>
        </div>
        {a.missingMissionIds[0] && (
          <Link href={`/missions/${a.missingMissionIds[0]}`} className="font-display text-[13px] font-semibold tracking-wide text-violet-2 hover:text-cyan">
            Start the next mission →
          </Link>
        )}
      </article>
    );
  }

  return (
    <article className="panel flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan/30 bg-cyan/10 text-cyan shadow-glow-cyan">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <Badge tone="cyan">Built</Badge>
      </div>
      <div>
        <h3 className="font-display text-[16px] font-semibold tracking-wide">{a.name}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{a.description}</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-[11.5px] text-fg-3">
        <span>{a.worldName}</span>
        {a.builtLabel && <span>Built {a.builtLabel}</span>}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`code-${a.id}`}
        className="inline-flex items-center gap-2 self-start rounded-lg border border-line-2 bg-panel-2 px-3 py-1.5 font-display text-[13px] font-semibold tracking-wide text-fg hover:border-cyan/50 hover:text-cyan"
      >
        <Code2 className="h-4 w-4" strokeWidth={1.75} />
        {open ? "Hide code" : "View code"}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} strokeWidth={1.75} />
      </button>
      <div id={`code-${a.id}`} hidden={!open} className="flex flex-col gap-4">
        {missionEntries.length === 0 && <p className="text-[13px] text-fg-3">No code snapshot was captured for this artifact.</p>}
        {missionEntries.map(([missionId, source]) => (
          <div key={missionId}>
            <div className="label mb-2">{missionId}</div>
            <div className="panel-inset overflow-x-auto p-3">
              <pre className="font-mono text-[12px] leading-relaxed text-fg-2">{source}</pre>
            </div>
          </div>
        ))}
        {a.architectureNotes && (
          <div>
            <div className="label mb-2">Architecture</div>
            <p className="text-[13px] leading-relaxed text-fg-2">{a.architectureNotes}</p>
          </div>
        )}
      </div>
    </article>
  );
}
