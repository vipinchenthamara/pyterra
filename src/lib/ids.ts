export function newId(prefix: string): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
export const nowIso = () => new Date().toISOString();
