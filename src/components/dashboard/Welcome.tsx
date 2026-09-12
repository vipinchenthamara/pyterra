"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Map, Code2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui";

/** First-run walkthrough. Dismissed once; stored in profile settings. */
export function Welcome({ firstWorldId }: { firstWorldId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const dismiss = async (then?: string) => {
    setBusy(true);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: { onboarded: true } }) }).catch(() => {});
    if (then) router.push(then);
    else router.refresh();
  };
  const cards = [
    { icon: Map, title: "Sixteen districts, one world", body: "Each district is a Python topic. It starts as empty land and is built by the code you write. Finish a district's boss to unlock the next one." },
    { icon: Code2, title: "Missions, not lessons", body: "Every mission is a real problem the district has. You get a brief, a free primer when a concept is new, then you build, run, and read the checks. Hints are there when you stall." },
    { icon: Sparkles, title: "Claude is in the corner", body: "The spark in the bottom-right sees your code and your last error. It teaches; it does not hand you the answer. Ask it anything, anywhere." },
  ];
  return (
    <section className="panel hud relative animate-rise">
      <button onClick={() => dismiss()} className="absolute right-3 top-3 rounded p-1 text-fg-3 hover:text-fg" aria-label="Dismiss welcome">
        <X className="h-4 w-4" />
      </button>
      <div className="label mb-1">Welcome, Architect</div>
      <h2 className="font-display text-[22px] font-semibold tracking-wide">Here is how this works.</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="panel-inset p-4">
            <c.icon className="h-5 w-5 text-cyan" />
            <div className="mt-2 font-display text-[14.5px] font-semibold">{c.title}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-3">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button disabled={busy} onClick={() => dismiss(`/worlds/${firstWorldId}/arrive`)}>Enter the first district</Button>
        <Button variant="ghost" disabled={busy} onClick={() => dismiss()}>I know my way around</Button>
      </div>
    </section>
  );
}
