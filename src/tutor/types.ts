export const TUTOR_MODES = [
  { id: "hint", label: "Give me a hint", requestHint: true },
  { id: "explain-error", label: "Explain this error", requestHint: false },
  { id: "explain-code", label: "Explain this code", requestHint: false },
  { id: "simpler-example", label: "Simpler example", requestHint: false },
  { id: "another-example", label: "Another example", requestHint: false },
  { id: "quiz", label: "Quiz me", requestHint: false },
  { id: "review-approach", label: "Review my approach", requestHint: false },
  { id: "why-works", label: "Why does this work?", requestHint: false },
  { id: "harder", label: "Make it harder", requestHint: false },
  { id: "chat", label: "Ask anything", requestHint: false },
] as const;

export type TutorMode = (typeof TUTOR_MODES)[number]["id"];

export interface TutorRequest {
  mode: TutorMode;
  message: string;
  attemptId?: string;
  missionId?: string;
  code?: string;
  lastError?: string | null;
  lastTests?: string | null;
  requestHint?: boolean;
}

export interface TutorReply {
  reply: string;
  hintLevel: number;
  hintsUsed: number;
  provider: "anthropic" | "mock";
  note?: string;
}

export interface TutorTurn {
  role: "user" | "tutor";
  content: string;
  mode: string;
  hintLevel?: number | null;
  createdAt: string;
}

/** Everything a provider needs. Assembled server-side; never leaves the server. */
export interface TutorContext {
  system: string;
  missionBlock: string | null;
  progressBlock: string;
  code: string | null;
  lastError: string | null;
  lastTests: string | null;
  history: TutorTurn[];
  message: string;
  mode: TutorMode;
  allowedHintLevel: number;
  authoredHints: string[]; // hints[0..allowedHintLevel-1]
  anchorLines: string[];
  domain: string;
}

export interface TutorProvider {
  name: "anthropic" | "mock";
  answer(ctx: TutorContext): Promise<{ text: string; tokensIn: number; tokensOut: number }>;
}
