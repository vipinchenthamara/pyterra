"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Globe2, Boxes, Radar, Library, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/worlds", label: "Worlds", icon: Globe2 },
  { href: "/builds", label: "Builds", icon: Boxes },
  { href: "/skills", label: "Skills", icon: Radar },
  { href: "/library", label: "Library", icon: Library },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-line bg-panel/60 backdrop-blur md:flex">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <Logo className="h-9 w-9" />
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold tracking-wide">Architect Online</div>
          <div className="label mt-0.5 !text-[0.6rem]">Python · FDE track</div>
        </div>
      </div>
      <nav className="mt-2 flex flex-col gap-1 px-3" aria-label="Primary">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                active ? "bg-cyan/10 text-cyan" : "text-fg-2 hover:bg-panel-3 hover:text-fg",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-cyan shadow-glow-cyan" />}
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-5 pb-6">
        <p className="font-display text-[12px] italic leading-relaxed text-fg-3">“A more capable you, one world at a time.”</p>
      </div>
    </aside>
  );
}
