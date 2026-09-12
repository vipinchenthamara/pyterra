/**
 * Dev-only visual check for WorldScene. Renders, per authored world: all ghost, a cumulative
 * mission-by-mission progression (onComplete deltas reduced in mission order) and all max.
 * Plus one locked preview world and one compact thumbnail.
 */
import type { Mission, World } from "@content/schema";
import { getWorld, missionsForWorld } from "@content/registry";
import { WorldScene } from "@/components/world/WorldScene";

interface Step {
  title: string;
  layers: Record<string, number>;
  previous?: Record<string, number>;
}

function zeros(world: World): Record<string, number> {
  return Object.fromEntries(world.scene.layers.map((l) => [l.id, 0]));
}

function maxed(world: World): Record<string, number> {
  return Object.fromEntries(world.scene.layers.map((l) => [l.id, l.maxLevel]));
}

function progression(world: World, missions: Mission[]): Step[] {
  const steps: Step[] = [];
  let current = zeros(world);
  for (const m of missions) {
    const next = { ...current };
    for (const d of m.onComplete) {
      if (d.kind === "layer") next[d.layer] = Math.max(next[d.layer] ?? 0, d.level);
    }
    steps.push({ title: `${m.codename} · ${m.title}`, layers: next, previous: current });
    current = next;
  }
  return steps;
}

function SceneCard({ title, world, step, locked, compact }: { title: string; world: World; step: Step; locked?: boolean; compact?: boolean }) {
  const built = world.scene.layers.filter((l) => (step.layers[l.id] ?? 0) > 0).length;
  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="font-display text-sm font-semibold text-fg">{title}</span>
        <span className="label">{locked ? "locked" : `${built}/${world.scene.layers.length} layers`}</span>
      </figcaption>
      <div className={compact ? "aspect-video w-56 overflow-hidden rounded-lg border border-line" : "aspect-video w-full overflow-hidden rounded-xl border border-line"}>
        <WorldScene world={world} layers={step.layers} previousLayers={step.previous} locked={locked} compact={compact} />
      </div>
      {!compact && (
        <p className="mt-1 font-mono text-[10px] text-fg-3">
          {world.scene.layers.map((l) => `${l.id}=${step.layers[l.id] ?? 0}`).join("  ")}
        </p>
      )}
    </figure>
  );
}

function WorldSection({ worldId }: { worldId: string }) {
  const world = getWorld(worldId);
  if (!world) return <p className="text-rose">Unknown world {worldId}</p>;
  const missions = missionsForWorld(worldId);
  const steps = progression(world, missions);
  return (
    <section className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-fg">
        {world.codename} · {world.name} <span className="ml-2 font-mono text-xs text-fg-3">{world.accent}</span>
      </h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <SceneCard title="All ghost (level 0)" world={world} step={{ layers: zeros(world), title: "" }} />
        <SceneCard title={`After all ${missions.length} missions`} world={world} step={{ layers: steps.at(-1)?.layers ?? zeros(world), title: "" }} />
        <SceneCard title="All max" world={world} step={{ layers: maxed(world), title: "" }} />
      </div>
      <h3 className="label">Mission-by-mission progression</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <SceneCard key={i} title={`${i + 1}. ${s.title}`} world={world} step={s} />
        ))}
      </div>
    </section>
  );
}

export default function Page() {
  const droneFleet = getWorld("drone-fleet");
  const foundation = getWorld("foundation-district");
  const dataVault = getWorld("data-vault");
  return (
    <div className="space-y-14">
      <header>
        <h1 className="font-display text-2xl font-semibold text-fg">World scene check</h1>
        <p className="mt-1 text-sm text-fg-2">Procedural SVG districts. Ghost = not built, level 1 = built, level 2 = upgraded.</p>
      </header>

      <WorldSection worldId="foundation-district" />
      <WorldSection worldId="data-vault" />

      <section className="space-y-6">
        <h2 className="font-display text-xl font-semibold text-fg">Locked preview + compact thumbnails</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {droneFleet && <SceneCard title="W4 · Drone Fleet (locked)" world={droneFleet} step={{ layers: zeros(droneFleet), title: "" }} locked />}
          <div className="space-y-4">
            {foundation && <SceneCard title="Compact · W1 all max" world={foundation} step={{ layers: maxed(foundation), title: "" }} compact />}
            {dataVault && <SceneCard title="Compact · W2 all max" world={dataVault} step={{ layers: maxed(dataVault), title: "" }} compact />}
          </div>
          <div className="space-y-4">
            {foundation && <SceneCard title="Compact · W1 ghost" world={foundation} step={{ layers: zeros(foundation), title: "" }} compact />}
            {droneFleet && <SceneCard title="Compact · W4 locked" world={droneFleet} step={{ layers: zeros(droneFleet), title: "" }} compact locked />}
          </div>
        </div>
      </section>
    </div>
  );
}
