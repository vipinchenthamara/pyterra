# Architect Online

A personal, world-based Python learning environment. You do not complete chapters. You restore, expand and
upgrade sixteen districts by writing Python, and a Claude-powered teaching assistant helps without spoiling.

## Run it

**Prerequisites:** Node.js 20.19 or newer (24 recommended) and npm. Nothing else: Python runs inside the
browser via WebAssembly, the database is a local SQLite file, and no accounts or cloud services are needed.

```bash
git clone https://github.com/vipinchenthamara/pyterra.git
cd pyterra
npm install
npm run dev
```

Open http://localhost:3000.

What happens on first run:

- `npm install` copies the Pyodide runtime (about 13 MB) from `node_modules` into `public/py/vendor/`, so the
  app works offline and never loads code from a CDN.
- The first request creates `data/architect.db` and applies the migrations. Both `data/` and
  `public/py/vendor/` are git-ignored.
- The first mission you open warms a Python worker in the background; the first Run takes about a second.

### Production build

```bash
npm run build
npm start
```

### Enable the Claude tutor (optional)

```bash
cp .env.local.example .env.local
```

Set `ANTHROPIC_API_KEY` in `.env.local` and restart the dev server. Without a key the assistant runs in
offline mode (authored hints only) and every other feature works unchanged. The key stays on the server;
it is never sent to the browser.

### Reset or export progress

Profile → Export progress downloads a JSON backup. Profile → Reset all progress wipes the database after you
type RESET. You can also stop the server and delete `data/architect.db*`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm test` | Vitest: engine unit tests, content integrity, and every mission's starter + reference solution executed in real Pyodide |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate Drizzle migrations after editing `src/db/schema.ts` |

## Layout

- `content/` — worlds, missions, skills (data only, validated by Zod). See `docs/authoring-guide.md` to add a mission.
- `public/py/` — Pyodide worker and the Python test harness.
- `src/engine/` — pure functions: mastery, spaced review, world state, recommendation, error coach.
- `src/server/` — completion transaction and the dashboard snapshot.
- `src/tutor/` — provider-abstracted tutor (Anthropic or mock), hint-ladder policy.
- `src/app/` — Next.js routes and API handlers. `src/components/` — UI.
- `docs/prd/` — the Product Requirements Document (source `.docx` plus a Markdown rendering).
- `docs/superpowers/specs/` — the design spec for milestone 1.

## Milestones

1. Done: shell, engine, Worlds 1–2 authored (Foundation District, Data Vault), tutor, review queue.
2. Done: Worlds 3–5 (Logic Gate, Drone Fleet, Automation Factory) and fresh-context review variants for every mission.
3. Next: Worlds 6–9 (Resilience Reactor, Archive Core, Network District, Architect Lab).
4. Server-side runner for Worlds 10–16 (packages, FastAPI, Docker, LLM, RAG, agents).

