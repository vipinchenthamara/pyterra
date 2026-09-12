import { missions, skills, worlds } from "@content/registry";
import type { SearchEntry } from "@/components/shell/SearchPalette";

export async function GET() {
  const entries: SearchEntry[] = [
    ...worlds.map((w) => ({ kind: "world" as const, id: w.id, title: w.name, subtitle: `${w.codename} · ${w.tagline}`, href: `/worlds/${w.id}` })),
    ...missions.map((m) => ({ kind: "mission" as const, id: m.id, title: m.title, subtitle: `${m.codename} · ${worlds.find((w) => w.id === m.worldId)?.name ?? ""}`, href: `/missions/${m.id}` })),
    ...skills.map((s) => ({ kind: "skill" as const, id: s.id, title: s.name, subtitle: s.domain, href: `/skills#${s.id}` })),
    ...skills.map((s) => ({ kind: "anchor" as const, id: `${s.id}-anchor`, title: s.anchor, subtitle: s.name, href: `/library#${s.id}` })),
  ];
  return Response.json(entries);
}
