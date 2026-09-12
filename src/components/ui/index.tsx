import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({ children, className = "", hud = false, as: Tag = "section" }: { children: ReactNode; className?: string; hud?: boolean; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("panel p-5", hud && "hud", className)}>{children}</Tag>;
}

export function SectionTitle({ children, right, className = "" }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <h2 className="font-display text-[15px] font-semibold tracking-wide text-fg">{children}</h2>
      {right}
    </div>
  );
}

export type Tone = "cyan" | "violet" | "amber" | "emerald" | "rose" | "orange" | "sky" | "neutral";

const TONE_TEXT: Record<Tone, string> = {
  cyan: "text-cyan", violet: "text-violet-2", amber: "text-amber-2", emerald: "text-emerald-2", rose: "text-rose", orange: "text-orange", sky: "text-sky", neutral: "text-fg-2",
};
const TONE_BG: Record<Tone, string> = {
  cyan: "bg-cyan/12 border-cyan/30", violet: "bg-violet/12 border-violet/30", amber: "bg-amber/12 border-amber/30", emerald: "bg-emerald/12 border-emerald/30",
  rose: "bg-rose/12 border-rose/30", orange: "bg-orange/12 border-orange/30", sky: "bg-sky/12 border-sky/30", neutral: "bg-panel-3 border-line-2",
};
const TONE_BAR: Record<Tone, string> = {
  cyan: "bg-cyan", violet: "bg-violet-2", amber: "bg-amber", emerald: "bg-emerald", rose: "bg-rose", orange: "bg-orange", sky: "bg-sky", neutral: "bg-fg-3",
};
export const toneText = (t: Tone) => TONE_TEXT[t];
export const toneBar = (t: Tone) => TONE_BAR[t];

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wider", TONE_BG[tone], TONE_TEXT[tone], className)}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone = "cyan", className = "", height = "h-1.5" }: { value: number; tone?: Tone; className?: string; height?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-line", height, className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", TONE_BAR[tone])} style={{ width: `${v}%`, boxShadow: v > 0 ? `0 0 12px currentColor` : undefined }} />
    </div>
  );
}

export function Button({
  children, variant = "primary", className = "", ...rest
}: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-display text-[13.5px] font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50";
  const v = {
    primary: "bg-cyan text-bg-deep hover:bg-cyan-2 shadow-glow-cyan",
    secondary: "border border-line-2 bg-panel-2 text-fg hover:border-cyan/50 hover:text-cyan",
    ghost: "text-fg-2 hover:bg-panel-3 hover:text-fg",
    danger: "border border-rose/40 bg-rose/10 text-rose hover:bg-rose/20",
  }[variant];
  return (
    <button className={cn(base, v, className)} {...rest}>
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-line-2 bg-bg-deep px-1.5 py-0.5 font-mono text-[10px] text-fg-3">{children}</kbd>;
}

export function Stat({ value, label, tone = "cyan" }: { value: ReactNode; label: string; tone?: Tone }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("readout font-display text-[26px] font-semibold leading-none", TONE_TEXT[tone])}>{value}</span>
      <span className="text-[12px] text-fg-3">{label}</span>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel-inset flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="font-display text-[15px] font-semibold">{title}</div>
      <p className="max-w-sm text-[13px] text-fg-3">{body}</p>
      {action}
    </div>
  );
}
