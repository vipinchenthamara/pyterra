export function relativeTime(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "never";
  const diff = now.getTime() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;
  const m = Math.round(abs / 60_000);
  const fmt = (n: number, u: string) => `${n}${u}`;
  let s: string;
  if (m < 1) s = "now";
  else if (m < 60) s = fmt(m, "m");
  else if (m < 60 * 24) s = fmt(Math.round(m / 60), "h");
  else if (m < 60 * 24 * 30) s = fmt(Math.round(m / (60 * 24)), "d");
  else s = fmt(Math.round(m / (60 * 24 * 30)), "mo");
  if (s === "now") return future ? "soon" : "just now";
  return future ? `in ${s}` : `${s} ago`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
