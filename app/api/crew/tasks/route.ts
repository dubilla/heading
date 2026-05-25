import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { searchCrewTasks, isCrewEnabled } from "@/lib/integrations/crew";

/**
 * Search proxy: the browser can't hold the Crew token, so Heading's server
 * forwards an authenticated title search to Crew. Used by the "Link existing"
 * mode of the todo form.
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isCrewEnabled()) {
    return NextResponse.json(
      { error: "Crew integration is not configured" },
      { status: 503 }
    );
  }

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const tasks = await searchCrewTasks(query);
  return NextResponse.json({ data: tasks });
}
