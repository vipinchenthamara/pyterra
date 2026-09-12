import * as repo from "@/db/repos";

export async function GET() {
  const data = repo.exportAll();
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="architect-online-export-${data.exportedAt.slice(0, 10)}.json"` },
  });
}
