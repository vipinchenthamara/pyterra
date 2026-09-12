// Generates three stage paintings per world with Cloudflare Workers AI (Flux Schnell).
// Usage: node scripts/generate-art.mjs [worldId ...] [--force]
// Reads CF_ACCOUNT_ID / CF_API_TOKEN from .env (never committed). Output: public/art/<world>/stage-{0,1,2}.jpg
import fs from "node:fs";
import path from "node:path";

const env = Object.fromEntries(
  fs.existsSync(".env") ? fs.readFileSync(".env", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => l.split("=", 2).map((s) => s.trim())) : [],
);
const { CF_ACCOUNT_ID, CF_API_TOKEN } = env;
if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
  console.error("Missing CF_ACCOUNT_ID / CF_API_TOKEN in .env");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync("scripts/art-prompts.json", "utf8"));
const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

async function gen(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${CF_API_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ prompt, steps: 8 }) });
    const json = await res.json().catch(() => ({}));
    if (json?.success && json.result?.image) return Buffer.from(json.result.image, "base64");
    console.warn(`  attempt ${attempt} failed:`, JSON.stringify(json?.errors ?? res.status).slice(0, 200));
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error("generation failed");
}

const worlds = Object.entries(cfg.worlds).filter(([id]) => only.length === 0 || only.includes(id));
let made = 0;
for (const [id, w] of worlds) {
  const dir = path.join("public/art", id);
  fs.mkdirSync(dir, { recursive: true });
  for (const stage of ["0", "1", "2"]) {
    const file = path.join(dir, `stage-${stage}.jpg`);
    if (fs.existsSync(file) && !force) continue;
    const prompt = `${cfg.style}. ${w.subject}, ${cfg.stages[stage].replaceAll("{accent}", w.accent)}. Dominant light colour: ${w.accent}.`;
    process.stdout.write(`${id} stage ${stage} … `);
    const t = Date.now();
    const buf = await gen(prompt);
    fs.writeFileSync(file, buf);
    made++;
    console.log(`${(buf.length / 1024).toFixed(0)} KB in ${((Date.now() - t) / 1000).toFixed(1)}s`);
  }
}
const manifest = Object.fromEntries(
  Object.keys(cfg.worlds).map((id) => [id, ["0", "1", "2"].map((s) => `/art/${id}/stage-${s}.jpg`).filter((p) => fs.existsSync(path.join("public", p)))]),
);
fs.writeFileSync("public/art/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`done: ${made} new images; manifest written`);
