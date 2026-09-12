import type { NextRequest } from "next/server";
import { getSnapshot } from "@/server/state";

export async function GET(request: NextRequest) {
  const s = request.nextUrl.searchParams.get("session");
  const sessionMinutes = s ? Number(s) || undefined : undefined;
  return Response.json(getSnapshot({ sessionMinutes }));
}
