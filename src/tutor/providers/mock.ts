import type { TutorContext, TutorProvider } from "../types";

/** Offline provider: authored hints only. The whole app must work with no API key (PRD launch checklist). */
export const mockProvider: TutorProvider = {
  name: "mock",
  async answer(ctx: TutorContext) {
    const anchor = ctx.anchorLines[0] ?? "the concept for this mission";
    let text: string;
    switch (ctx.mode) {
      case "hint":
        text = ctx.authoredHints.length ? `Hint ${ctx.authoredHints.length}: ${ctx.authoredHints[ctx.authoredHints.length - 1]}` : "No hint level is unlocked yet. Reveal one from the ladder on the right.";
        break;
      case "explain-error":
        text = ctx.lastError ? `Read the last line first:\n${ctx.lastError.trim().split("\n").slice(-1)[0]}\nThat names the error. Then find the line number and read that line slowly. Mental model: ${anchor}.` : "There is no error on record. Run the code first.";
        break;
      case "explain-code":
        text = ctx.code ? `Your code has ${ctx.code.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length} non-comment lines. Read each assignment and ask: what type is on the right-hand side? Mental model: ${anchor}.` : "No code yet.";
        break;
      case "quiz":
        text = ctx.anchorLines.length ? `Quick check: in one sentence, what does "${anchor}" mean in practice for this mission?` : "Open a mission and I will quiz you on the concept in front of you. Your next recommended mission is on the dashboard.";
        break;
      case "why-works":
        text = `It works because you applied "${anchor}". Name one input that could still break it.`;
        break;
      default: {
        const next = ctx.progressBlock.match(/NEXT RECOMMENDED: (.+)/)?.[1];
        const due = ctx.progressBlock.match(/REVIEWS DUE: (.+)/)?.[1];
        text = ctx.anchorLines.length
          ? `Offline mode. Mental model for this mission: ${anchor}. Add an ANTHROPIC_API_KEY to .env.local to talk to Claude.`
          : `Offline mode. ${due && due !== "none" ? `Repairs due: ${due}. ` : ""}Next recommended: ${next ?? "open the dashboard"}. Add an ANTHROPIC_API_KEY to .env.local to talk to Claude.`;
      }
    }
    return { text, tokensIn: 0, tokensOut: 0 };
  },
};
