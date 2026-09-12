import Link from "next/link";
import { Boxes, Code2, Cpu } from "lucide-react";
import type { Snapshot } from "@/server/state";
import { Panel, SectionTitle } from "@/components/ui";

export function WhatYouBuilt({ snapshot }: { snapshot: Snapshot }) {
  const { stats } = snapshot;
  const latest = snapshot.artifacts.filter((a) => a.unlocked).sort((a, b) => (b.unlockedAt ?? "").localeCompare(a.unlockedAt ?? ""))[0];
  const rows = [
    { icon: Boxes, value: stats.artifactsBuilt, label: "artifacts built", tone: "text-cyan" },
    { icon: Code2, value: stats.linesOfCode, label: "lines of code", tone: "text-violet-2" },
    { icon: Cpu, value: stats.toolsUnlocked, label: "tools unlocked", tone: "text-emerald-2" },
  ];
  return (
    <Panel>
      <SectionTitle right={<Link href="/builds" className="label hover:text-cyan">Builds →</Link>}>What You Built</SectionTitle>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-md bg-bg-deep ${r.tone}`}><r.icon className="h-4 w-4" /></span>
            <span className={`readout font-display text-[22px] font-semibold leading-none ${r.tone}`}>{r.value}</span>
            <span className="text-[12.5px] text-fg-3">{r.label}</span>
          </li>
        ))}
      </ul>
      <div className="panel-inset mt-4 px-3 py-2.5 text-[12.5px]">
        {latest ? (
          <>
            <span className="label !text-[0.58rem]">Latest build</span>
            <Link href="/builds" className="mt-0.5 block font-medium text-fg hover:text-cyan">{latest.name}</Link>
          </>
        ) : (
          <span className="text-fg-3">Your first artifact arrives with {snapshot.artifacts[0]?.name ?? "the first boss"}.</span>
        )}
      </div>
    </Panel>
  );
}
