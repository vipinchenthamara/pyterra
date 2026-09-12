# Architect Online

A personal, world-based Python learning environment. You do not complete chapters. You restore, expand and
upgrade sixteen districts by writing Python, and a Claude-powered teaching assistant helps without spoiling.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The first run creates `data/architect.db` (SQLite) and vendors the Pyodide runtime
into `public/py/vendor/` so Python runs entirely in your browser, offline, with no server-side code execution.

### Enable the Claude tutor

Copy `.env.local.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Without a key the assistant runs in
offline mode (authored hints only) and every other feature works unchanged.

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

1. **Now:** shell, engine, Worlds 1–2 authored (Foundation District, Data Vault), tutor, review queue.
2. Worlds 3–5 (Logic Gate, Drone Fleet, Automation Factory), variant review tests.
3. Worlds 6–9.
4. Server-side runner for Worlds 10–16 (packages, FastAPI, Docker, LLM, RAG, agents).

## Reset

Profile → Reset all progress, or delete `data/architect.db*` while the server is stopped.
