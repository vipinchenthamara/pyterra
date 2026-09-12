import { BookOpen } from "lucide-react";
import Link from "next/link";

export function ConceptCard({ anchors }: { anchors: { id: string; name: string; anchor: string; description: string }[] }) {
  if (anchors.length === 0) return null;
  return (
    <div className="panel !p-4">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-cyan" />
        <h3 className="font-display text-[14px] font-semibold tracking-wide">Concept</h3>
      </div>
      <ul className="flex flex-col gap-3">
        {anchors.map((a) => (
          <li key={a.id}>
            <Link href={`/library#${a.id}`} className="font-display text-[13.5px] font-semibold text-cyan hover:underline">{a.anchor}</Link>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-3">{a.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
