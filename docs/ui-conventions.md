# UI conventions

- Tailwind 4 tokens live in `src/app/globals.css` (`@theme`). Colors: `bg`, `bg-deep`, `panel`, `panel-2`, `panel-3`, `line`, `line-2`,
  `fg`, `fg-2`, `fg-3`, `fg-4`, accents `cyan`, `cyan-2`, `violet`, `violet-2`, `amber`, `amber-2`, `emerald`, `emerald-2`, `rose`, `orange`, `sky`.
  Fonts: `font-display` (Chakra Petch — headings, buttons, numbers), `font-sans` (IBM Plex Sans — body), `font-mono` (JetBrains Mono — labels, code, readouts).
  Shadows: `shadow-glow-cyan|violet|amber|emerald`, `shadow-panel`. Animations: `animate-rise`, `animate-pulse-slow`, `animate-flow`, `animate-blink`.
- Utility classes in globals.css: `.panel`, `.panel-inset`, `.label` (mono uppercase tracked section label), `.hud` (corner brackets), `.readout` (tabular numbers), `.glow-cyan`.
- Primitives in `src/components/ui/index.tsx`: `Panel`, `SectionTitle`, `Badge`, `ProgressBar`, `Button`, `Kbd`, `Stat`, `EmptyState`, `toneText`, `toneBar`, type `Tone`.
- Data: server components call `getSnapshot()` from `src/server/state.ts` (types `Snapshot`, `WorldView`, `SkillView`, `ArtifactView`).
  Content lookups from `@content/registry` (server only — it contains reference solutions; never import it in a `"use client"` file).
- Voice: measurable, world-framed, no generic praise (see docs/authoring-guide.md). Section headers in `.label` style: "TODAY'S BRIEFING".
- Accessibility: semantic headings, keyboard reachable controls, visible focus (global), `aria-label` on icon-only buttons.
- Motion: `import { motion } from "motion/react"` for state transitions only. Respect reduced motion (global CSS already does).
- Links: `next/link`. Icons: `lucide-react`.
