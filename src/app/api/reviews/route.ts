import { getSnapshot } from "@/server/state";

export async function GET() {
  return Response.json(getSnapshot().reviewsDue);
}
