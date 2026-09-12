# Pyterra — Design Spec (Milestone 1)

## Context

Vipin is training to become a Forward Deployed Engineer and needs Python fluency, starting from zero. He does not want a conventional LMS (read → example → progress bar). He wrote a PRD (`~/Downloads/Architect_Online_Product_Requirements_Document.docx`) and mockups for **Pyterra**: a personal, game-based learning site where each Python module is a *world* that starts as empty land and is physically built up by the code he writes. A Claude-branded teaching assistant sits in the bottom-right corner, tracks what he's doing, and answers doubts without spoiling solutions.

This is a greenfield project for personal use. Decisions locked with the user:

| Decision | Choice |
|---|---|
| Milestone 1 scope | Full app shell + learning engine + **Worlds 1–2 fully authored** (Worlds 3–16 visible as locked nodes) + Claude tutor |
| World visuals | **Procedural, layered SVG scenes** that grow/repair per mission — no image generation |
| Persistence | **Local SQLite** via Next.js route handlers (Drizzle + better-sqlite3) |
| Tutor | Provider-abstracted; **mock provider now**, Anthropic goes live when a key lands in `.env.local` |

Project location: `/Users/devanshi/Documents/Claude code/architect-online` (new folder, `git init`).

**Later milestones (not in this plan):** M2 = Worlds 3–5 + export/reset; M3 = Worlds 6–9; M4+ = server-side runner for Worlds 10–16 (FastAPI, Docker, LLM, RAG).

---

## Stack (versions verified Sept 2026)

| Package | Version | Notes |
|---|---|---|
| next | 16.x | App Router, Turbopack default. `serverExternalPackages: ['better-sqlite3']` |
| react / react-dom | 19 | |
| tailwindcss | 4.x | CSS-first config (`@theme` in `globals.css`), no `tailwind.config.js` |
| motion | 13.x | `import { motion } from 'motion/react'` (framer-motion renamed) |
| zustand | 5 | Client session state (runner status, tutor panel, editor) |
| @monaco-editor/react | 4.7 | Python editor; loads monaco from CDN |
| pyodide | 314.x (types only) | Runtime loaded from jsDelivr CDN inside a classic worker in `public/py/` |
| zod | 4.x | Content + API validation |
| drizzle-orm / drizzle-kit | 0.45 / 0.31 | Migrations committed; `migrate()` runs lazily on first `getDb()` |
| better-sqlite3 | 13 | N-API prebuilds → no compile on Node 24. Fallback: `@libsql/client` (same Drizzle schema) |
| @anthropic-ai/sdk | 0.125 | Server-only. Model `claude-opus-5`, adaptive thinking, `fallbacks: "default"` |
| vitest | latest | Engine unit tests + content validation |
| lucide-react | latest | Icons |

---

## Folder structure

```
architect-online/
  .env.local                 # ANTHROPIC_API_KEY (optional), TUTOR_MODEL
  next.config.ts  drizzle.config.ts  vitest.config.ts
  data/architect.db          # gitignored, auto-created
  drizzle/                   # generated SQL migrations (committed)
  public/py/worker.js        # classic Pyodide worker (plain JS, not bundled)
  public/py/harness.py       # test harness fetched by worker at init
  content/
    schema.ts                # Zod schemas + inferred types (single source of truth)
    registry.ts              # imports all worlds, validates, referential-integrity check, exports lookups
    skills.ts                # skill catalogue with memory anchors
    worlds/
      index.ts               # ordered world list (1–16; 3–16 are metadata-only "locked" entries)
      foundation-district/ { world.ts, index.ts, missions/*.ts }
      data-vault/           { world.ts, index.ts, missions/*.ts }
  src/
    app/
      layout.tsx             # sidebar shell + TutorDock (Claude FAB) on every page
      page.tsx               # Home / command center
      worlds/page.tsx        # world map (full)
      worlds/[worldId]/page.tsx
      missions/[missionId]/page.tsx
      builds/page.tsx  skills/page.tsx  library/page.tsx  profile/page.tsx
      review/[reviewId]/page.tsx
      api/
        state/route.ts       # GET full snapshot (worlds, skills, briefing, next mission, events)
        attempts/route.ts    # POST start attempt
        attempts/[id]/route.ts   # PATCH run result / completion (THE transaction)
        autosave/route.ts    # PUT code
        tutor/route.ts       # POST message
        reviews/route.ts     # GET due, POST result
        profile/route.ts     # GET/PATCH settings
    engine/                  # pure functions, no I/O, unit-tested
      runner/ pyodideClient.ts protocol.ts
      mastery.ts spaced.ts recommend.ts worldState.ts errorCoach.ts
    db/ schema.ts client.ts repos/*.ts
    tutor/ service.ts prompt.ts providers/{anthropic,mock}.ts types.ts
    components/
      shell/ (Sidebar, TopBar, SearchBar)
      dashboard/ (Hero, WorldMap, Briefing, SkillHealth, WhatYouBuilt, SystemEvents, SessionSelector)
      world/ (WorldScene, LayerRenderers/*, MissionPath, MemoryAnchors, BossCard, DistrictStatus)
      mission/ (Editor, Console, TestPanel, HintLadder, ConceptCard, PredictStep, CompletionOverlay)
      tutor/ (TutorDock, TutorPanel, ModeChips, ClaudeMark)
      ui/ (Card, Badge, ProgressBar, Button, Kbd, GlowRing…)
    lib/ (ids, dates, cn)
```

Rules: `content/*` and `src/engine/*` contain no I/O. Route handlers call repos + engine. Adding a mission = one file + one line in the world's `index.ts`.

---

## Design

### 1. Visual language
Dark "premium command center" from the mockup: near-black navy base (`#070B14`), panel surfaces with 1px luminous borders, accent **cyan** (`#22D3EE`) for active/complete, **violet** (`#8B5CF6`) for locked/mystery, **amber** (`#F59E0B`) for unstable/needs repair, **emerald** for stable. Typography: Inter (UI) + JetBrains Mono (code/stats). Subtle grid/scanline backgrounds, glow rings on active nodes, motion for state transitions only (no gratuitous animation). Everything keyboard-navigable with visible focus. Desktop-first; usable at 768px.

### 2. App shell
Left sidebar: logo, Home / Worlds / Builds / Skills / Library / Profile, and a small quote strip at the bottom. Top bar: breadcrumb, global search (worlds, missions, skills, anchors — local fuzzy), streak chip, avatar. **TutorDock** (Claude mark, bottom-right) is mounted in the root layout so it exists on every page.

### 3. Content model (Zod, `content/schema.ts`)
- `Skill { id, name, domain, anchor, description, prerequisites[] }` — anchor = one-line mental model ("Set = uniqueness").
- `World { id, order, name, codename, tagline, arrivalScene, accent, unlockedBy[], skillIds[], scene.layers[], artifacts[], status: 'authored'|'locked-preview' }`.
- `Mission { id, version, worldId, order, title, codename, kind: 'build'|'fix-bug'|'predict'|'fill-gap'|'choose-tool'|'refactor'|'boss', difficulty 1–5, weight, skills[{id, role}], prerequisites[], briefing, objective, predictPrompt?, starterCode, referenceSolution (never sent to client), tests {visible, hidden} (Python source), hints[6], errorExplanations[{pattern, explanation}], anchors[], timeoutMs, onComplete: WorldStateDelta[], artifacts[], estimatedMinutes, explainWhy? }`.
- `WorldStateDelta = {kind:'layer', layer, level} | {kind:'stat', stat, add}`.
- `Artifact { id, name, description, icon, unlockedBy[] }`.
- `registry.ts` parses every world/mission at import and throws readable errors on broken references (skill ids, prerequisites, layer ids, artifact ids). Vitest runs the same check.

### 4. Worlds 1–2 content (authored in this milestone)
Examples use security/cloud/ops framing (PRD §3), never fruit baskets.

**World 1 — Foundation District** (variables, primitive types, operators, strings). Scene layers: `ground-grid`, `power-core`, `hab-blocks`, `comms-tower`, `district-sign`.
| # | Mission | Kind | Skills | Builds |
|---|---|---|---|---|
| 1 | Power On | build | variables, numeric-types | assign `district_name`, `population`, `power_level` → power core lights |
| 2 | Capacity Math | build | operators | compute surplus, utilisation %, `//` and `%` for shift scheduling → hab blocks appear |
| 3 | Identity Badge | fill-gap | strings, f-strings | format a status banner with `.upper()`, `.strip()`, f-strings → district sign |
| 4 | Signal Parsing | build | string-indexing | parse `"SEC-042-CRIT"` with slicing, `split`, `len` → comms tower |
| 5 | Type Boundary | fix-bug | type-conversion | fix `"Power: " + 42` crash; `int()`/`str()`/`float()` → tower antenna lights |
| B | District Status Report | boss | all above | parse raw telemetry lines, compute metrics, emit formatted report → district 100%, artifact **World State Console** |

**World 2 — Data Vault** (lists, tuples, sets, dicts). Scene layers: `vault-shell`, `storage-racks`, `alert-bus`, `index-spire`, `vault-lights`, `citizen-flow`.
| # | Mission | Kind | Skills | Builds |
|---|---|---|---|---|
| 1 | Store Inventory | build | lists | append/index/slice/len an asset list → storage racks |
| 2 | Duplicate Incident | build | sets | dedupe alert feed with `set()` → alert bus repaired (PRD Appendix A slice) |
| 3 | Build Lookup Logic | build | dicts | asset_id → record map, `.get`, `.keys()`, update → index spire |
| 4 | Immutable Coordinates | choose-tool + build | tuples | fixed sensor records, unpacking, why not a list → vault lights |
| 5 | Vault Query | refactor | collections-ops | list-of-dicts membership, counting, `dict.items()` → citizen flow |
| B | The Corrupted Archive | boss | all above | clean, dedupe, index and summarise a corrupted registry → artifacts **Inventory / Data Registry** + **Alert Deduplication Analyzer** |

Worlds 3–16: `world.ts` with name, codename, tagline, skills, artifact names and scene layer ids only (`status: 'locked-preview'`), so the map and unlock messaging are complete. No missions yet.

Each world also gets a **review variant** for free: a review re-runs a passed mission with emptied starter code and the same tests (PRD §11 "new context" comes in M2 via variant tests).

### 5. Python runner (Pyodide in a Web Worker)
- `public/py/worker.js`: `importScripts` pinned jsDelivr pyodide → `loadPyodide()` → fetch `harness.py` → `ready`.
- `pyodideClient.ts` (singleton in zustand): warms worker A + spare B on app mount. `run(job)` posts `{code, tests, timeoutMs}`; on timeout → `terminate()` A, promote B, spawn new spare, resolve `{timedOut:true}` ("Execution halted after 5s — infinite loop?").
- `harness.py`: exec learner code into an isolated module dict; **tests are injected after** learner code has run (learner code cannot read/modify them); each `test_*` uses `check(cond, "behaviour message")` — messages describe behaviour, never expected values; hidden tests return pass-count + first failure only.
- stdout/stderr captured via `setStdout/setStderr`, 64KB cap.
- Protocol as discriminated unions in `protocol.ts`; result → `{passed, visible[], hidden{passed,total,firstFailure}, stdout, stderr, durationMs, timedOut}`.
- `errorCoach.ts`: regex table for top beginner tracebacks (NameError, TypeError str+int, IndentationError, SyntaxError missing colon, IndexError, KeyError, AttributeError on set indexing, ZeroDivision…) → plain-language explanation tied to current mission's `errorExplanations` first, generic table second. Works with no AI.

### 6. Mission workspace (`/missions/[id]`)
Layout per PRD §8: left = objective + world problem + PredictStep (optional, before first run); center = Monaco (Python, dark theme matching app, Cmd/Ctrl+Enter = Run, Reset with confirm-if-changed); right = tabs Output / Tests; side = HintLadder (6 levels, each reveal recorded), ConceptCard (anchor), ErrorCoach card when a traceback occurs. Footer = mission state, skill gain preview, world consequence. Autosave (debounced PUT) on every change; refresh restores. On pass → CompletionOverlay: XP line, measurable statement ("Solved without hints. Sets → developing"), world layer animation, "Continue → next mission".

### 7. Persistence (SQLite / Drizzle)
Tables: `learner_profile`, `mission_attempts`, `code_autosave`, `skill_state` (understanding/recall/application/independence 0–100, health, times_practiced, last_practiced_at), `world_state` (operational_pct, layers JSON, stats JSON — a materialised cache), `artifacts`, `review_items`, `tutor_interactions`, `events` (append-only). All rows carry `learner_id='me'`. `PRAGMA journal_mode=WAL`; `globalThis` singleton for HMR.

**Completion transaction** (`PATCH /api/attempts/[id]` with status passed): in one DB transaction → update attempt → `applyCompletion` to each skill → recompute world state (derived: reduce all passed missions' deltas; never accumulated) → unlock artifacts whose `unlockedBy` are all passed → schedule `review_items` (interval idx 0 = +1 day) → append events. Client never writes state directly.

### 8. Engine (pure, tested)
- **mastery.ts**: `p = clamp(1 − 0.15·hints, 0.1, 1)`; application += 20p; independence += (0 hints: +20, ≤2: +8, ≤4: 0, else −5); understanding += 10p (+5 if runs ≤ 3); secondary skills half deltas; recall only moves via reviews (+15 unaided / +5 hinted / −15 fail), decays 1pt/day after 3 idle days (computed on read via `effectiveSkill()`). `mastery = .3u+.2r+.3a+.2i`. Health: dormant / fragile(<40 or review overdue >7d) / developing / stable(70–85) / mastered(>85 & ≥3 reviews).
- **spaced.ts**: ladder `[1,3,7,14,30]` days; pass ≤1 hint → idx+1, more hints → stay, fail → idx−1; `ease = clamp(1+(mastery−50)/100, .7, 1.5)`.
- **recommend.ts**: `nextMission` = unlocked, prereqs met, not passed; score = .4 skillGap + .3 momentum + .2 difficultyFit + .1 novelty. **Briefing** (≤5 cards): overdue reviews → next mission → one fragile skill + cheapest repair → nearest artifact (one mission away) → streak. Session selector (5m/15m/deep) filters candidates by `estimatedMinutes`.
- **worldState.ts**: `computeWorld(world, passedMissionIds)`; `operational_pct` = weight of passed / total weight; dashboard overall % = weighted mean of unlocked worlds. Locked worlds show "SIGNAL LOST".

### 9. Pages
- **Home**: hero ("Your world is 68% operational" + Continue Mission), interactive **WorldMap** (SVG node graph like the mockup: 16 nodes, complete/active/unstable/locked states, glow + progress %, dotted edges), Today's Briefing, Skill Health, What You Built (artifacts, LOC of learner-authored code, tools unlocked), System Events, session selector.
- **Worlds**: full map + list. **World page**: hero with `WorldScene`, tabs Missions / About / Skills / Gallery, ordered mission cards with state + est. time, Boss card with visible unlock rule, DistrictStatus bars, Memory Anchors panel, quote.
- **Builds**: artifact cards → detail with learner's actual code, "architecture notes", when built, from which mission; final-build slot ("AI Security Assistant — locked, unlocks at World 16").
- **Skills**: per-skill 4-dimension radar/bars, health label, next review time, linked missions.
- **Library**: memory anchors, error explanations, code patterns from passed missions, personal notes (simple textarea per skill, stored in profile settings JSON).
- **Profile**: display name, domain preference (security/cloud/ai/general), session length default, tutor provider status + daily token budget, export JSON (P2 — include since it is ~30 lines), reset with confirmation.

### 10. World scenes (procedural SVG)
`WorldScene` renders one `<svg>` with `LayerRenderer` per `scene.layers[]` entry; kinds: `building`, `light`, `drone`, `dataflow`, `sign`, `ground`. Level 0 = hidden/outlined ghost ("what you will build"); higher levels add windows lit, drones on paths, animated data pulses. Deterministic seeded randomness by layer id. On mission completion the scene diffs prev/next state and animates new layers in (motion). Ghosted future layers are the "what would be built" preview the user asked for.

### 11. Claude tutor
- **TutorDock**: floating Claude mark (spark/asterisk SVG in accent colour, gentle pulse when it has something to say, e.g. after an error or when a review is due). Click → slide-in panel (chat + mode chips: Explain this code · Explain this error · Give me a hint · Simpler example · Another example · Quiz me · Review my approach · Why does this work?). On mission pages the panel is mission-aware; elsewhere it is progress-aware ("You have 2 repairs due; Data Vault is one mission from its boss").
- **`POST /api/tutor`** `{ attemptId?, mode, message, requestHint? }` → `{ reply, hintLevel, hintsUsed, provider }`. Context assembly: stable system prompt (persona: terse ops mentor; hard no-spoiler rule) + mission block (objective, skills, authored hints ≤ allowed level, `referenceSolution` only at level 6) + code (≤4k chars) + last test/error output + last 6 turns + progress snapshot. Server-side gating: `requestHint` bumps `hints_used` **before** calling the provider (penalty is unavoidable); level 6 requires ≥3 runs or 10 min. Free-form questions answered at current level without bumping.
- Providers: `MockProvider` (returns authored hint for allowed level + a canned coaching line; whole app works offline) and `AnthropicProvider` (`@anthropic-ai/sdk`, model from `TUTOR_MODEL` default `claude-opus-5`, adaptive thinking, `max_tokens` 1024, `fallbacks:"default"` beta, prompt caching on system+mission block). Chosen at startup by key presence; UI badge shows "TUTOR: OFFLINE MODE" when mocked. Daily token soft-cap from `tutor_interactions`.
- Read `typescript/claude-api/README.md` from the claude-api skill before writing `providers/anthropic.ts`.

### 12. Motivation voice
Copy follows PRD Appendix B: measurable, world-framed, no generic praise. A small `voice.ts` helper builds these strings from state ("Data Vault is degrading. A 3-minute repair will restore set recall.").

---

## Implementation phases (each ends with a verification step)

**Phase 0 — Spec + scaffold**
1. Write design spec to `architect-online/docs/superpowers/specs/2026-09-12-architect-online-design.md` (this plan's Design section, expanded), `git init`, first commit.
2. `create-next-app` (TS, App Router, Tailwind 4, src dir), add deps, `next.config.ts` with `serverExternalPackages`, `.gitignore` for `data/`, `.env.local.example`.
3. Design tokens in `globals.css` (`@theme`), fonts, base `ui/` components, sidebar shell, TopBar, empty pages, TutorDock placeholder.
✔ `npm run dev` renders shell; navigate all six nav items; dark theme + focus rings visible.

**Phase 1 — Content + engine (TDD with vitest)**
4. `content/schema.ts`, `skills.ts`, `registry.ts` + integrity test.
5. Author Foundation District (5 missions + boss) and Data Vault (5 missions + boss), Worlds 3–16 previews.
6. `engine/mastery.ts`, `spaced.ts`, `worldState.ts`, `recommend.ts`, `errorCoach.ts` with unit tests.
✔ `npx vitest run` green; registry test proves all references resolve.

**Phase 2 — Runner + mission workspace**
7. `public/py/worker.js`, `harness.py`, `pyodideClient.ts`, `protocol.ts`; a Node-side vitest that runs `harness.py` logic against every authored mission's `referenceSolution` (via pyodide npm package in Node) → **all starter code executes, all reference solutions pass all tests**.
8. Monaco editor component, Console, TestPanel, HintLadder, ConceptCard, PredictStep, CompletionOverlay; `/missions/[id]` page wired to runner (local state only at this point).
✔ Browser: open Duplicate Incident, run starter (fails with behaviour messages), paste solution, passes; infinite loop is killed at timeout.

**Phase 3 — Persistence + API**
9. Drizzle schema, migrations, `client.ts`, repos; routes: state, attempts, autosave, reviews, profile, tutor (mock only).
10. Completion transaction; wire mission page to start attempt / autosave / PATCH result.
✔ Complete a mission → refresh → progress, code and world % persist; `sqlite3 data/architect.db` shows rows; events logged.

**Phase 4 — Dashboard, world, builds, skills, library, profile**
11. WorldMap SVG, Hero, Briefing, SkillHealth, WhatYouBuilt, SystemEvents, SessionSelector.
12. WorldScene + LayerRenderers for both authored worlds; World page tabs; Boss gating.
13. Builds, Skills, Library, Profile pages; export JSON; reset with confirm.
✔ Browser walkthrough matching the PRD acceptance list (below).

**Phase 5 — Tutor**
14. `tutor/types.ts`, `prompt.ts`, `service.ts`, mock + Anthropic providers, `/api/tutor` gating, TutorDock/TutorPanel with modes, error-coach hand-off ("Ask Claude why").
✔ With no key: panel works, hint ladder gates correctly, hint bump recorded in DB. With a dummy key set: provider selection switches (call fails gracefully, progress unaffected — NFR-03).

**Phase 6 — Review queue + polish**
15. Review route/page, briefing integration, recall updates, "world maintenance" framing on dashboard.
16. Keyboard shortcuts, 768px pass, empty states, loading states for Pyodide warm-up, README with run instructions.
✔ Full acceptance pass; commit.

---

## Verification (end-to-end, mirrors PRD §22)

Run `npm run dev`, open in the browser preview, and check:
1. Home shows world %, next mission + time estimate with no navigation.
2. Enter Data Vault → Duplicate Incident → edit → run → output/tests within ~2s.
3. Completing a mission updates skill state **and** the world scene/percentage.
4. At least one mission is learnable via problem → attempt → hint → success (no lesson text).
5. Refresh/close browser → code and progress intact.
6. Boss challenge locked until prerequisites; unlock rule visible; no full solution by default.
7. Review item appears in briefing after its due date (test by setting `next_review_at` in the past) and changes Skill Health.
8. Builds page shows an artifact built from actual learner code.
9. Learner code cannot touch host (Pyodide sandbox; no `fetch` bridge exposed); tutor key never in client bundle (`grep` the `.next` output).
10. Layout coherent at 1440px and 768px; keyboard navigation + focus visible.
11. `npx vitest run` green: engine, registry, every reference solution passes its own tests.

---

## Risks and mitigations
- **Pyodide load / bundler interference** → classic worker in `public/`, pinned CDN, warm-up on mount, spare worker for instant respawn, visible loading state.
- **better-sqlite3 native install** → v13 prebuilds; if it fails, swap `db/client.ts` to `@libsql/client` (schema untouched).
- **Hint leakage** → authored hints are the only solution material below level 6; `mission_version` stored on attempts; content tests fail the build on broken references.
- **Tailwind 4 differences** from the v3 the user knows → tokens documented in `globals.css` header comment.
