import Anthropic from "@anthropic-ai/sdk";
import type { TutorContext, TutorProvider } from "../types";
import { MODE_INSTRUCTION } from "../prompt";

const MODEL = process.env.TUTOR_MODEL || "claude-opus-5";
const MAX_CODE_CHARS = 4000;

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 60_000 });
  return client;
}

export const anthropicProvider: TutorProvider = {
  name: "anthropic",
  async answer(ctx: TutorContext) {
    const c = getClient();
    // Stable-first ordering for caching: system (frozen) → mission block (stable per attempt + hint level) → volatile turn.
    const system: Anthropic.TextBlockParam[] = [{ type: "text", text: ctx.system, cache_control: { type: "ephemeral" } }];
    if (ctx.missionBlock) system.push({ type: "text", text: ctx.missionBlock, cache_control: { type: "ephemeral" } });

    const history: Anthropic.MessageParam[] = ctx.history.slice(-6).map((t) => ({ role: t.role === "user" ? "user" : "assistant", content: t.content }));
    const volatile = [
      ctx.progressBlock,
      ctx.code ? `LEARNER CODE (current editor contents):\n${ctx.code.slice(0, MAX_CODE_CHARS)}${ctx.code.length > MAX_CODE_CHARS ? "\n[truncated]" : ""}` : "LEARNER CODE: (none)",
      ctx.lastError ? `LAST ERROR:\n${ctx.lastError.slice(0, 1500)}` : "LAST ERROR: none",
      ctx.lastTests ? `LAST TEST RESULTS: ${ctx.lastTests.slice(0, 1500)}` : "",
      `MODE: ${ctx.mode}. ${MODE_INSTRUCTION[ctx.mode]}`,
      `LEARNER SAYS: ${ctx.message || "(no message)"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const messages: Anthropic.MessageParam[] = [...history, { role: "user", content: volatile }];

    const response = await c.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      system,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { text: "I can't help with that particular request. Ask me about the mission, your code, or the concept instead.", tokensIn: response.usage.input_tokens, tokensOut: response.usage.output_tokens };
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { text: text || "(no reply)", tokensIn: response.usage.input_tokens + (response.usage.cache_read_input_tokens ?? 0) + (response.usage.cache_creation_input_tokens ?? 0), tokensOut: response.usage.output_tokens };
  },
};
