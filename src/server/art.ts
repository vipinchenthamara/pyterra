import fs from "node:fs";
import path from "node:path";

export interface WorldArt {
  /** Stage image URLs: [unbuilt, half built, operational]. */
  stages: string[];
}

let cache: Record<string, string[]> | null = null;
let cacheAt = 0;

/** Reads public/art/manifest.json (written by scripts/generate-art.mjs). Cached for 10 s so new art appears without a restart. */
export function artForWorld(worldId: string): WorldArt | null {
  const now = Date.now();
  if (!cache || now - cacheAt > 10_000) {
    try {
      cache = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "public/art/manifest.json"), "utf8"));
    } catch {
      cache = {};
    }
    cacheAt = now;
  }
  const stages = cache?.[worldId];
  return stages && stages.length === 3 ? { stages } : null;
}
