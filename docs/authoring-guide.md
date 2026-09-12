# Mission authoring guide

Read before writing any mission. Missions are data (`content/worlds/<world>/missions/<id>.ts`), validated by
`content/schema.ts` and executed by `public/py/harness.py`. `content/worlds/data-vault/missions/duplicate-incident.ts`
is the canonical example — copy its structure.

## Learner
An experienced enterprise architect (security, cloud, M365, APIs) learning Python from zero to become a Forward
Deployed Engineer. Frame every example in security / cloud / ops / AI terms. Never fruit baskets, never "foo".

## Voice (PRD Appendix B)
- Problem first. A briefing never opens with a definition. The learner discovers the need for the concept.
- Measurable, world-framed language. "Forty identical alerts should collapse to one", not "Great job".
- Professional command-center tone, subtle narrative flavour, no long story text.

## Mission fields that matter most
- `briefing`: 2–5 sentences of world problem. `objective`: a precise contract (function name, args, return type,
  or which variables must exist and what must be printed).
- `starterCode`: must load without SyntaxError and must NOT already pass the tests. Contains a clear `# TODO`.
  For fix-bug missions the starter code may raise at runtime — that is the point.
- `referenceSolution`: must pass every test. Never sent to the browser; used by the tutor at hint level 6.
- `tests.visible` / `tests.hidden`: Python source defining `test_*` functions. Namespace provides:
  - `solution` — the learner's module (`solution.unique_alerts(...)`, `solution.population`)
  - `check(cond, message)` — raise a failure with a BEHAVIOUR message. Messages must never state the literal
    expected value ("should equal 42"). Say what behaviour is expected ("utilisation should be a percentage between 0 and 100").
  - `solution_stdout` — everything the learner's top-level code printed. Use it for print-based missions.
  - Docstring on a visible test = its display name. Hidden tests show only pass count + first failure message.
  - Learner code runs BEFORE tests are injected; tests cannot be tampered with, and test code may call learner
    functions many times. Do not rely on the learner's top-level variables inside functions unless the objective says so.
- `hints`: exactly 6, progressively revealing: (1) conceptual nudge, (2) name the concept/data structure,
  (3) tiny unrelated example, (4) shape/pseudocode, (5) partial code, (6) full walkthrough. Each > 20 chars.
- `errorExplanations`: regex `match` against traceback text, plus plain-language `explanation` tied to this mission.
  Cover the 2–3 most likely mistakes.
- `anchors`: skill ids whose one-line anchors show in the Concept card.
- `explainWhy` (optional, recommended for build missions): a 3–4 option "why does this work" question.
- `onComplete`: layer deltas (ids/maxLevel from the world's `scene.layers`) and optional stat deltas.
  Stats used by dashboards: `structures`, `systems_online`, `data_integrity`, `power`, `security`, `citizens`.
- `artifacts`: only ids declared on the world whose `unlockedBy` contains this mission id.
- `estimatedMinutes`: 5–15 for missions, 15–25 for a boss. `weight`: 1 for missions, 3 for the boss.
- `kind`: build | fix-bug | predict | fill-gap | choose-tool | refactor | boss. Boss = multi-concept, minimal
  scaffolding, `difficulty` 4–5, hints still 6 but the first three stay conceptual.

## Python level
Only use what the world (and earlier worlds) teach. World 1 has no lists, no loops, no functions, no if.
World 2 may use everything from World 1 plus lists/sets/dicts/tuples, `len`, `in`, `sorted`, `.count()`,
`.items()`, `min`/`max`, and simple `for` loops ONLY where unavoidable in tests (never required of the learner —
loops are World 4). Missions in World 2 that need iteration should be written so `in`, `set()`, `dict` lookups,
`len`, `sorted` and slicing suffice for the learner.

## Verify
`npx vitest run content/worlds/<world>` runs the pack test: schema, references, starter/solution execution in
real Pyodide. All green before you finish.
