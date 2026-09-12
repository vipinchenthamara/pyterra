// Copies the Pyodide runtime from node_modules into public/py/vendor so the app is
// fully self-hosted (no CDN dependency, works offline). Runs on postinstall and predev/prebuild.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkgDir = path.dirname(require.resolve("pyodide/package.json"));
const version = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8")).version;
const out = path.resolve("public/py/vendor");
const stamp = path.join(out, "VERSION");
if (fs.existsSync(stamp) && fs.readFileSync(stamp, "utf8").trim() === version) process.exit(0);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = ["pyodide.js", "pyodide.mjs", "pyodide.asm.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
for (const f of files) {
  const src = path.join(pkgDir, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(out, f));
}
fs.writeFileSync(stamp, version + "\n");
console.log(`Vendored Pyodide ${version} → public/py/vendor`);
