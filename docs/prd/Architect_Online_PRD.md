# Architect Online — Product Requirements Document

> Markdown rendering of `Architect_Online_Product_Requirements_Document.docx` (same folder). The .docx is the source of record; tables were flattened to lists.

- A build-first, world-based Python learning platform for personal mastery
- Product thesis: Do not show learning progress as coursework. Show a world becoming more capable because the learner is becoming more capable.
- Concept direction: dashboard, world page, mission workspace and final build experience.
- Version: 1.0   |   Intended use: Personal learning system   |   Status: Build-ready specification

## 1. Product vision and principles

Architect Online is a personal Python learning environment built around a persistent digital world. The learner does not complete chapters. The learner restores, expands and upgrades a world by writing Python. Every concept is introduced because the world needs a capability, and every completed module leaves behind a functioning system or artifact.

- North star: From first variable to deployed AI application, every lesson should create something visible, usable or memorable.
- Design principles
- Build before explanation
- Present a concrete problem first. Teach the concept only when the learner needs it to make progress.
- Worlds are functional
- A world is not a themed slide deck. Its state changes because of code the learner writes.
- One clear next action
- The platform should remove decision fatigue by recommending the single best next mission.
- Progress equals capability
- Measure what the learner can recall, apply, debug and build, not only what was viewed.
- Failure is instructional
- Errors, broken code and failed tests are learning events, not interruptions.
- Professional, not childish
- The interface should feel like a premium command center with game mechanics, not a children's coding game.
- Persistent evolution
- Skills and world systems should compound. Later worlds reuse code and concepts from earlier ones.
- Short loops, deep mastery
- Most missions take 5 to 15 minutes; boss challenges and builds take longer and integrate multiple skills.

## 2. Goals, outcomes and scope

- Primary product goal
Create a self-learning website that takes one learner from beginner Python to production-oriented Python for AI engineering, using interactive worlds, code-first challenges, spaced recall, guided debugging and a final AI application.

- Learning outcomes
- Comfortably read and write core Python without depending on copied solutions.
- Choose appropriate data structures and explain why a list, set, tuple or dictionary fits a problem.
- Build small programs using conditions, loops, functions, files, JSON and exceptions.
- Use modules, packages, virtual environments, type hints and environment variables.
- Call APIs and build APIs with Pydantic and FastAPI.
- Understand basic async/await, logging and testing.
- Use Git and Docker at a practical beginner level.
- Progress from Python scripts to an LLM-powered application, then to RAG and simple agentic workflows.
- In scope for v1
- Single-user personal profile
- Interactive Python missions
- Browser code execution
- World map and world state
- Adaptive hints
- Mastery and spaced repetition
- Project artifacts
- AI tutor with constrained teaching modes
- Progress persistence
- Responsive desktop-first web experience
- Explicitly out of scope for v1
- Public course marketplace
- Multi-instructor authoring workflow
- Competitive leaderboards
- Social feed
- Real-money purchases
- Complex multiplayer mechanics
- Mobile-native apps
- Arbitrary internet access from learner code
- Unrestricted shell access

## 3. Target learner and learning model

The initial learner is an experienced technology professional who understands enterprise architecture, APIs, security and cloud concepts, but is building Python fluency. Examples should therefore avoid overusing toy domains such as fruit baskets when a real-world security, cloud, AI or automation example can communicate the concept better.

- Learning loop
- 01  SEE a world problem
- 02  PREDICT what the code should do
- 03  TRY a solution
- 04  RUN it
- 05  BREAK or fail safely
- 06  FIX with progressive hints
- 07  BUILD the feature
- 08  RECALL later
- 09  APPLY in a boss challenge
- Rule: A lesson should not begin with a definition if the learner can discover the need for the concept through a problem.

## 4. Information architecture

- Primary navigation
- Home
- Living command center. Shows world status, next mission, skill health, builds, events and daily briefing.
- Worlds
- World map, unlocked districts, current world, mission paths and boss challenges.
- Builds
- All completed artifacts and evolving projects, including source code, preview and architecture.
- Skills
- Mastery view by concept: understanding, recall, application and independence.
- Library
- Memory anchors, code patterns, examples, errors explained and personal notes.
- Profile / Settings
- Learning preferences, theme, domain preference, AI provider, session length and reset/export controls.
- Navigation principle
- The learner should be able to reach the recommended next action from any page in one click. Avoid making the user browse a syllabus to find what to do next.

## 5. World and curriculum structure

- Recommended world sequence
- World
- Skills
- What the learner builds
- World 1 - Foundation District
- Variables, primitive types, operators, strings
- Give the world state: name, population, power, security and resources.
- World 2 - Data Vault
- Lists, tuples, sets, dictionaries, basic collection operations
- Build an inventory and data registry; remove duplicates and create fast lookups.
- World 3 - Logic Gate
- Conditions, comparisons, boolean logic
- Build access-control rules and risk decisions.
- World 4 - Drone Fleet
- for loops, while loops, range, break, continue, comprehensions
- Automate repetitive fleet operations and batch processing.
- World 5 - Automation Factory
- Functions, arguments, returns, scope, reusable logic
- Turn repeated actions into reusable machines.
- World 6 - Resilience Reactor
- Exceptions, validation, defensive programming
- Keep the world operating when bad input and failures occur.
- World 7 - Archive Core
- Files, paths, JSON, serialization
- Persist world state and restore it across sessions.
- World 8 - Network District
- HTTP basics, API calls, requests/httpx, headers, status codes
- Connect the world to external systems.
- World 9 - Architect Lab
- Classes, objects, basic OOP, composition, type hints
- Model drones, users and systems as reusable objects.
- World 10 - Runtime Grid
- Packages, pip, virtual environments, environment variables, modules
- Turn scripts into maintainable projects.
- World 11 - Concurrent City
- async, await, I/O concurrency
- Run multiple network-bound tasks efficiently.
- World 12 - Service Hub
- Pydantic, FastAPI, logging, basic testing
- Expose world capabilities through validated APIs.
- World 13 - Deployment Yard
- Git, Docker basics, configuration
- Package and version the application.
- World 14 - Intelligence Core
- LLM APIs, prompts, structured outputs
- Add an AI capability to the system.
- World 15 - Memory Engine
- RAG basics, chunking, embeddings, retrieval, citations
- Give the AI controlled access to world knowledge.
- World 16 - Autonomous Command
- Tool calling, simple agents, evaluation and guardrails
- Build a bounded AI assistant that can reason, use tools and verify actions.
- World anatomy
- Arrival scene - Why this world needs the capability.
- Mission chain - 3 to 6 progressively harder tasks.
- Memory anchors - One-line mental models such as "Set = uniqueness".
- Live world state - Visual systems react to successful code.
- Boss challenge - Integrated problem with limited or no tutorial support.
- World completion - Shows what was built, what skill became available and what the next world unlocks.

## 6. Dashboard and motivation system

- The dashboard is the product's return loop. It should behave like an intelligent mission-control console, not an LMS progress page.
- Dashboard hierarchy
- Hero state: "Architect Online. Your world is X% operational."
- One recommended next mission with estimated effort and explicit unlock.
- Interactive world map showing completed, active, unstable and locked districts.
- Today's Briefing: a short personalized plan based on skill health and available time.
- Skill Health: stable, developing, needs practice, locked.
- What You Built: real artifacts, lines of code, systems unlocked and latest build.
- System Events: meaningful learning events and world changes.
- Quick session selector: 5 minutes, 15 minutes, deep session.
- Motivational language rules
- Avoid generic praise such as "Amazing!" unless tied to evidence.
- Prefer measurable statements: "You solved 4 dictionary challenges without hints."
- Express review needs as world maintenance: "The Data Vault needs a 3-minute repair."
- Use unfinished tension: "One mission unlocks the Automation Factory."
- Show distance in time: "About 8 minutes to unlock Functions."
- Periodically show before-vs-now progress to make growth visible.

## 7. World page requirements

- ID
- Capability
- Requirement
- Pri.
- Acceptance
- WRLD-01
- World hero
- Show world name, thematic visual, purpose, current district status and core concepts.
- P0
- World purpose is understood in <10 seconds.
- WRLD-02
- Mission path
- Show ordered missions, completion state, estimated time and unlock dependencies.
- P0
- Learner can start next mission in one click.
- WRLD-03
- Live status
- Reflect completed missions in visible world metrics or visual upgrades.
- P0
- Completing a mission visibly changes world state.
- WRLD-04
- Memory anchors
- Display concise concept anchors for skills used in the world.
- P0
- Anchors remain accessible without leaving page.
- WRLD-05
- Boss challenge
- Lock boss challenge until minimum prerequisites are met.
- P0
- Boss unlock rules are deterministic and visible.
- WRLD-06
- Gallery
- Show artifacts, snippets and world evolution snapshots.
- P1
- Learner can revisit previous milestones.
- WRLD-07
- Intro scene
- Optional short animated or illustrated world intro.
- P2
- Can be skipped and does not block learning.

## 8. Mission workspace and code runner

- Recommended layout
- Left: mission objective and contextual world problem.
- Center: code editor with starter code, reset and run controls.
- Right/top: output, tests and runtime feedback.
- Side panel: progressive hints, concept anchor and error explanation.
- Footer/status: mission state, skill gain and world consequence.
- ID
- Capability
- Requirement
- Pri.
- Acceptance
- CODE-01
- Editor
- Provide syntax-highlighted Python editor with line numbers, indentation and basic autocomplete.
- P0
- Code can be edited comfortably on desktop.
- CODE-02
- Run
- Execute supported Python safely and show stdout/stderr.
- P0
- Typical exercise returns result within 2 seconds.
- CODE-03
- Tests
- Run hidden and visible tests against learner code.
- P0
- Pass/fail feedback identifies behavior, not solution.
- CODE-04
- Reset
- Restore starter code without losing mission progress history.
- P0
- Reset is one click with confirmation only if code changed.
- CODE-05
- Diff
- Optionally show learner code vs starter after completion.
- P1
- Learner can inspect what changed.
- CODE-06
- Error coach
- Translate common Python errors into plain language and connect to current concept.
- P0
- At least top beginner errors have tailored explanations.
- CODE-07
- Scratchpad
- Allow free experiment area independent of mission tests.
- P1
- Scratch code cannot corrupt mission state.
- CODE-08
- Auto-save
- Persist code locally/remotely as the learner types.
- P0
- Refresh does not lose work.

## 9. Learning mechanics and memory system

- Challenge types
- Predict the output
- Learner chooses or writes expected output before running code.
- Fix the bug
- Provide realistic broken code and require diagnosis plus correction.
- Fill the gap
- Small syntax or logic completion where one concept is missing.
- Choose the tool
- Ask which data structure or language feature fits a real requirement.
- Refactor it
- Working but repetitive code must be made cleaner using a newly learned concept.
- Build from blank
- Later missions remove scaffolding and require independent construction.
- Explain why
- Learner selects or writes a short reasoning statement after success.
- Boss scenario
- Multi-concept problem with minimal hints and real acceptance tests.
- Memory anchors
- List = sequence
- Set = uniqueness / membership
- Dictionary = lookup
- Condition = decision
- Loop = repetition
- Function = reusable machine
- Exception = controlled failure
- Class = blueprint, object = instance
- API = systems talking
- Async = do useful work while waiting

## 10. AI tutor and adaptive guidance

- The AI tutor is constrained to teaching behaviors. It should not default to generating the final solution.
- Tutor modes
- Explain this code
- Explain this error
- Give me a hint
- Show it visually
- Give me a simpler example
- Give me another example
- Quiz me
- Make it harder
- Review my approach
- Why is my solution working?
- Hint ladder
- Conceptual nudge only.
- Point to relevant concept or data structure.
- Show a tiny unrelated example.
- Reveal shape/pseudocode.
- Reveal partial code.
- Reveal complete solution only after explicit confirmation.
- ID
- Capability
- Requirement
- Pri.
- Acceptance
- AI-01
- Context
- Tutor receives current world, mission, learner code, attempts, skill state and prior hints.
- P0
- Responses are contextual to exact task.
- AI-02
- No spoilers
- Default behavior must not reveal full solution before upper hint levels.
- P0
- Hint policy enforced by system prompt/state.
- AI-03
- Error analysis
- Tutor can explain traceback using learner-friendly language.
- P0
- Explanation references actual error and line.
- AI-04
- Personalization
- Examples can use security/cloud/AI domains by preference.
- P1
- Domain preference changes examples consistently.
- AI-05
- Provider abstraction
- Tutor service is decoupled from a single model provider.
- P1
- Provider can be swapped via configuration.

## 11. Progress, mastery and spaced repetition

- Do not model mastery as a single completion percentage. Track at least four dimensions per skill: understanding, recall, application and independence.
- Proposed skill states
- Locked: prerequisite not met.
- Introduced: concept seen but not demonstrated independently.
- Developing: some successful practice with hints or inconsistency.
- Stable: repeated success across time and contexts.
- Mastered: strong recall and application with minimal hints; still eligible for occasional refresh.
- Spaced review behavior
- Generate short review missions after 1 day, 3 days, 7 days, 14 days and later adapt to performance.
- Missed or hint-heavy answers shorten the next review interval.
- Strong independent performance lengthens the interval.
- Review missions should reuse a concept in a new context rather than repeat the same question.
- Dashboard can express decaying recall as world maintenance needs, not as punishment.

## 12. Builds, artifacts and final project

Every major world should contribute at least one persistent artifact to the Builds area. Artifacts are evidence of capability and form the learner's personal portfolio.

- Access Control Engine
- Inventory / Data Registry
- Alert Deduplication Analyzer
- Automation Script
- Resilient File Processor
- API Client
- Object Model
- FastAPI Service
- Async API Worker
- Dockerized Service
- LLM-backed Assistant
- RAG Knowledge Service
- Final AI Security Assistant
- Final project target
The final build should combine Python fundamentals, API design, validation, async calls, logging, LLM interaction and RAG into a bounded AI Security Assistant. The project should be intentionally scoped so that it proves integration ability without requiring a large production platform.


## 13. Gamification and narrative systems

- Gamification should reinforce mastery rather than distract from it.
- World unlocks: new district becomes available only when prerequisite skills are demonstrated.
- World repairs: spaced review appears as a system requiring maintenance.
- XP: optional lightweight indicator tied to meaningful actions such as independent success, debugging and recall.
- Build power: world operational percentage increases as capabilities become stable.
- Boss battles: integrated challenges that validate readiness to leave a world.
- Streaks: soft and non-punitive; never erase progress or shame missed days.
- Artifacts: stronger reward than badges. Show what was built and how it evolved.
- Quotes and narrative: subtle atmospheric flavor, not long story text.

## 14. Content authoring model

- Even for personal use, lessons should be data-driven so new worlds and missions can be created without changing application code.
- Mission schema should support
- ID and world ID
- Title and narrative problem
- Learning objectives
- Prerequisites
- Estimated time
- Starter code
- Visible tests
- Hidden tests
- Expected runtime behavior
- Hint ladder
- Concept anchors
- Error explanations
- World-state changes on completion
- Skills affected and mastery weights
- Optional AI tutor context
- Boss flag / difficulty
- Artifact output definition

## 15. Functional requirements

- ID
- Capability
- Requirement
- Pri.
- Acceptance
- FR-001
- Profile
- Maintain a single learner profile and preferences.
- P0
- State persists across sessions.
- FR-002
- Dashboard
- Generate personalized command-center dashboard.
- P0
- Next action and world status visible immediately.
- FR-003
- World map
- Display progression and locked dependencies visually.
- P0
- Node states match learner data.
- FR-004
- Mission engine
- Load mission definition, code, tests, hints and outcomes.
- P0
- Mission content is data-driven.
- FR-005
- Execution
- Run supported Python code safely.
- P0
- No access to unauthorized host resources.
- FR-006
- Progress
- Record attempts, completions, hints and mastery updates.
- P0
- Refresh or logout does not lose progress.
- FR-007
- Review queue
- Generate due spaced-repetition tasks.
- P0
- Due tasks appear in briefing.
- FR-008
- AI tutor
- Provide contextual hint/explanation modes.
- P1
- Tutor follows hint ladder.
- FR-009
- Artifacts
- Save completed build artifacts and snapshots.
- P0
- Build can be reopened later.
- FR-010
- Search
- Search concepts, worlds, missions and library notes.
- P1
- Relevant result returned within 1 second locally.
- FR-011
- Session mode
- Offer 5m, 15m and deep-session recommendations.
- P1
- Suggested task fits time category.
- FR-012
- Settings
- Configure theme, learning domain and AI provider.
- P1
- Changes apply without data loss.
- FR-013
- Export
- Export learner code, artifacts and progress JSON.
- P2
- Export contains documented schema.
- FR-014
- Reset
- Reset a mission, world or entire learning state with safeguards.
- P2
- Destructive reset requires confirmation.

## 16. Non-functional requirements

- ID
- Capability
- Requirement
- Pri.
- Acceptance
- NFR-01
- Performance
- Dashboard should become interactive quickly on normal broadband.
- P0
- Target <2.5s initial usable render.
- NFR-02
- Code execution
- Typical beginner code should run near-instantly.
- P0
- Target <2s for normal exercises.
- NFR-03
- Reliability
- Progress should never be lost because AI or execution service is unavailable.
- P0
- Progress writes independent of optional services.
- NFR-04
- Security
- Learner code must not access host filesystem, secrets or unrestricted network.
- P0
- Sandbox boundary verified.
- NFR-05
- Privacy
- Personal learning data is private by default.
- P0
- No public profile or sharing unless explicitly enabled.
- NFR-06
- Accessibility
- Keyboard navigation, visible focus, semantic headings, sufficient contrast.
- P1
- Meets practical WCAG 2.1 AA targets.
- NFR-07
- Responsive
- Desktop-first; usable on tablet; phone provides review/light tasks.
- P1
- Core dashboard and review usable at 768px.
- NFR-08
- Maintainability
- Worlds and missions separated from UI logic.
- P0
- New mission can be added through content data.
- NFR-09
- Observability
- Log app errors and failed code-runner operations.
- P1
- Errors have traceable IDs and timestamps.
- NFR-10
- Cost control
- AI usage should be optional and token-limited.
- P1
- Per-session / per-day configurable budget.

## 17. Data model and state

- Core entities
- Entity
- Key fields / purpose
- LearnerProfile
- id, display_name, preferences, created_at, last_active_at
- World
- id, name, order, visual_theme, prerequisites, skill_ids
- Mission
- id, world_id, title, objective, starter_code, tests, hints, estimated_minutes, outputs
- Skill
- id, name, anchor, prerequisites
- SkillState
- learner_id, skill_id, understanding, recall, application, independence, next_review_at
- MissionAttempt
- mission_id, code_snapshot, run_count, hints_used, tests_passed, started_at, completed_at
- WorldState
- world_id, operational_pct, unlocked_features, visual_state
- Artifact
- id, mission_id/world_id, title, code, preview, architecture_notes, created_at
- ReviewItem
- skill_id, prompt_ref, due_at, difficulty, result
- TutorInteraction
- mission_id, mode, hint_level, prompt_metadata, response_metadata

## 18. Technical architecture

- Recommended v1 architecture for personal use
- Web application
- Next.js / React with TypeScript, Tailwind CSS and a component system. Desktop-first responsive UI.
- Code editor
- Monaco Editor for VS Code-like editing, syntax highlighting and keyboard behavior.
- Python runtime
- Pyodide/WebAssembly in the browser for fundamentals. This avoids server-side arbitrary-code execution for most early worlds.
- Advanced runner
- Optional isolated container runner for packages or behaviors not supported well in Pyodide. Introduce only when needed.
- Backend/API
- Lightweight application API for profile, progress, content, artifacts and AI tutoring. Can use Next.js routes or FastAPI.
- Persistence
- SQLite for fully local personal use, or Supabase/Postgres if cross-device access is desired.
- AI layer
- Provider abstraction with configurable model/API key. Pass only relevant mission context and code snippets.
- Content
- World and mission definitions stored as versioned JSON/MDX/YAML content files or database records.
- Suggested execution strategy by learning stage
- Worlds 1-9: prefer Pyodide in browser for fast, safe, offline-capable Python fundamentals.
- Worlds 10-13: simulated terminal and guided environment steps, with optional real backend runner for packages and FastAPI tasks.
- Worlds 14-16: real API calls should be proxied through backend services so model keys and secrets are never exposed in the browser.

## 19. Security and safe code execution

- Security is a design requirement because the platform intentionally executes learner code.
- Prefer browser-side Pyodide for beginner code, which reduces host exposure.
- If server-side execution is added, use ephemeral isolated containers with CPU, memory and execution-time limits.
- Disable or tightly control outbound network access from arbitrary learner code.
- Never inject production secrets into the learner runtime.
- LLM/provider API keys remain server-side or in secure local configuration.
- Sanitize artifact rendering and prevent arbitrary HTML/script execution.
- Rate-limit run and AI endpoints even for personal use to prevent accidental loops or cost spikes.
- Keep an audit trail of code-runner failures and AI calls for troubleshooting.

## 20. Analytics and success metrics

- Because this is personal, analytics should answer whether the learning design is working, not optimize engagement for its own sake.
- Useful learner metrics
- Time to first successful run
- Missions completed without hints
- Average hints per mission
- Bug-fix success rate
- Recall accuracy after 1/3/7/14 days
- Time from concept introduction to independent build
- Number of artifacts built
- Lines of learner-authored code
- Concepts marked stable/mastered
- Days since last deep build session
- Avoid optimizing for
- Raw time-on-site
- Artificial click counts
- Punitive streak retention
- Badge accumulation without demonstrated skill

## 21. MVP definition and roadmap

- MVP objective: prove that the world-based build-first loop is enjoyable and actually helps concepts stick. Do not attempt all 16 worlds first.
- MVP worlds
- World 1 - Foundation District
- World 2 - Data Vault
- World 3 - Logic Gate
- World 4 - Drone Fleet
- World 5 - Automation Factory
- MVP features
- Dashboard with world map and one next mission
- Five functional worlds
- Monaco editor + Pyodide
- Mission tests and output
- Hints without AI initially
- Skill state and mastery basics
- Spaced review queue
- Persistent code and progress
- Builds gallery
- Boss challenge per world
- Suggested build phases
- Phase
- Indicative duration
- Deliverable
- Phase 0 - Prototype
- 1 week
- Static dashboard + one Data Vault mission. Validate visual and learning feel.
- Phase 1 - Learning engine
- 2-3 weeks
- Content schema, code runner, tests, progress, mission state.
- Phase 2 - Five-world MVP
- 3-5 weeks
- World map, first five worlds, boss challenges, artifacts.
- Phase 3 - Memory system
- 1-2 weeks
- Review queue, mastery dimensions, dashboard briefing.
- Phase 4 - AI tutor
- 1-2 weeks
- Contextual hints, error coach and explanation modes.
- Phase 5 - Production Python worlds
- Ongoing
- Files, APIs, OOP, async, FastAPI, Docker, AI and RAG.

## 22. Acceptance criteria and launch checklist

- MVP acceptance criteria
- Opening the app shows current world state, next recommended mission and time estimate without additional navigation.
- Learner can enter Data Vault, edit Python, run it and receive output/tests within a few seconds.
- Completing a mission updates both skill state and the visual state of the world.
- At least one concept can be learned entirely through problem -> attempt -> hint -> success without reading a long lesson.
- Refreshing or closing the browser does not lose mission code or progress.
- Boss challenge requires use of multiple concepts and does not reveal a full solution by default.
- Review queue resurfaces an older skill and affects Skill Health on the dashboard.
- Builds page contains at least one artifact created from actual learner code.
- No learner code can access host secrets or unrestricted machine resources.
- The interface remains coherent and legible at common laptop resolutions.
- Launch quality checklist
- No dead-end mission states
- No hidden prerequisite surprises
- All starter code executes
- All tests have clear failure messages
- Hints are progressive and non-spoiling
- World changes map to mission outcomes
- Keyboard shortcuts work in editor
- Autosave verified
- Progress backup/export available
- AI disabled state still allows full core learning path

## 23. Future expansion ideas

- Adaptive world events
- Generate optional incidents based on weak concepts so practice feels contextual rather than repetitive.
- Visual debugger
- Animate variable state, loops and function calls as systems inside the world.
- Architecture mode
- Later worlds include drag-and-connect diagrams that must match code behavior.
- Replay mode
- Show how the same project evolved from 5 lines to a full service across the journey.
- Voice tutor
- Ask for explanations or hints conversationally while keeping code on screen.
- Personal error library
- Automatically collect recurring mistakes and create targeted repair missions.
- AI code review gate
- Before completing advanced builds, AI reviews readability, error handling, typing and security.
- Scenario packs
- Security, cloud, finance or general domains can reskin mission data without changing learning objectives.
- Local-first mode
- Run worlds offline with local progress and sync only when explicitly enabled.
- Challenge generator
- Generate new variants of mastered concepts to prevent memorizing exact answers.
Recommended next step: Build one vertical slice before designing all worlds: Dashboard -> Data Vault world -> Duplicate Incident mission -> code run/test -> world update -> dashboard skill update. If that loop feels compelling, the product concept is validated.


## Appendix A - Example vertical slice

- Scenario: Data Vault / Mission 2 - Duplicate Incident
- Learner dashboard reports: "Data Vault 68% operational. One mission unlocks the boss challenge."
- Learner enters Data Vault and sees Mission 2: Remove duplicates.
- Mission explains that repeated alert types are corrupting warehouse records.
- Editor opens with a list containing duplicate alert names.
- Learner predicts expected unique output.
- Learner attempts a solution. If they use list + list or index a set, the error coach explains why it fails.
- Hint 1: "You need a collection that keeps each value only once."
- Learner uses set(alerts), passes tests and sees the duplicate records disappear visually.
- Skill state updates: Sets understanding +10, application +12, independence based on hints used.
- Artifact saves as "Alert Deduplication Analyzer".
- Dashboard event appears: "Data Vault repaired. Dictionary lookup is your next bottleneck."

## Appendix B - Product wording examples

- Pattern
- Avoid
- Preferred voice
- Use
- Generic LMS
- "Lesson 4 complete. 40% of course finished."
- Architect Online
- "Drone Fleet is now 42% operational. One 8-minute mission unlocks reusable functions."
- Generic praise
- "Great job!"
- Architect Online
- "You solved the set challenge without hints. Uniqueness is now marked stable."
- Generic review
- "Review Sets"
- Architect Online
- "The Data Vault is degrading. A 3-minute repair will restore set recall."
- Generic course nav
- "Continue Chapter 6"
- Architect Online
- "Continue Mission: Automate the Drone Scan"
