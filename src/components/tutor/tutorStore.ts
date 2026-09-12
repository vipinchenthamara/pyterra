"use client";

import { create } from "zustand";

/** Context the tutor panel reads: which mission/attempt is open, latest code, last error. Set by the mission workspace. */
export interface TutorContext {
  attemptId?: string;
  missionId?: string;
  missionTitle?: string;
  code?: string;
  lastError?: string | null;
  lastTests?: string | null;
  hintsUsed?: number;
}

interface TutorState {
  ctx: TutorContext;
  attention: string | null;
  setCtx: (c: Partial<TutorContext>) => void;
  clearCtx: () => void;
  nudge: (message: string | null) => void;
}

export const useTutorStore = create<TutorState>((set) => ({
  ctx: {},
  attention: null,
  setCtx: (c) => set((s) => ({ ctx: { ...s.ctx, ...c } })),
  clearCtx: () => set({ ctx: {}, attention: null }),
  nudge: (message) => set({ attention: message }),
}));
