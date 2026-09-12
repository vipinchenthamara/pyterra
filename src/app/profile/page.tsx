import { Bot, BotOff } from "lucide-react";
import { DangerZone } from "@/components/profile/DangerZone";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Badge, Panel, SectionTitle, Stat } from "@/components/ui";
import * as repo from "@/db/repos";
import { getSnapshot } from "@/server/state";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string | null | undefined, nowIso: string): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "never";
  const diffMin = Math.round((new Date(nowIso).getTime() - d.getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return formatDate(iso);
}

export default function ProfilePage() {
  const snapshot = getSnapshot();
  const { profile, stats } = snapshot;
  const createdAt = repo.ensureProfile().createdAt;
  const tutorOnline = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 animate-rise">
      <header>
        <h1 className="font-display text-[26px] font-semibold tracking-wide">Profile</h1>
        <p className="mt-1 text-fg-3">
          {profile.displayName} · member since {formatDate(createdAt)}
        </p>
      </header>

      <Panel hud>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <Stat value={profile.xp.toLocaleString("en-GB")} label="XP" />
          <Stat value={profile.streakDays} label="day streak" tone="amber" />
          <Stat value={stats.missionsPassed} label="missions passed" tone="sky" />
          <Stat value={stats.independentSolves} label="zero-hint solves" tone="emerald" />
        </div>
        <div className="mt-5 flex flex-col gap-1 border-t border-line pt-4 font-mono text-[11.5px] text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Streaks are soft. Missing a day never erases progress.</span>
          <span>
            last active {formatDateTime(profile.lastActiveAt, snapshot.now)} · member since {formatDate(createdAt)}
          </span>
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Preferences</SectionTitle>
        <ProfileForm
          profile={{
            displayName: profile.displayName,
            domain: profile.settings.domain,
            defaultSessionMinutes: profile.settings.defaultSessionMinutes,
            tutorEnabled: profile.settings.tutorEnabled,
            dailyTokenBudget: profile.settings.dailyTokenBudget,
          }}
        />
      </Panel>

      <Panel>
        <SectionTitle right={<Badge tone={tutorOnline ? "cyan" : "neutral"}>{tutorOnline ? "Online" : "Offline"}</Badge>}>Tutor</SectionTitle>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-deep px-4 py-3">
          {tutorOnline ? <Bot className="h-5 w-5 shrink-0 text-cyan" strokeWidth={1.75} /> : <BotOff className="h-5 w-5 shrink-0 text-fg-3" strokeWidth={1.75} />}
          <div className="min-w-0">
            <div className="font-display text-[14px] font-semibold tracking-wide">{tutorOnline ? "Tutor provider: Claude (Anthropic)" : "Offline mode — add ANTHROPIC_API_KEY to .env.local to enable Claude"}</div>
            <p className="font-mono text-[11.5px] text-fg-3">
              {tutorOnline ? "Hints, explanations and the tutor dock are live." : "Missions and the error coach work without it."}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Your data</SectionTitle>
        <DangerZone />
      </Panel>
    </div>
  );
}
