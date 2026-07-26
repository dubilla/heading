import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { getObjectiveStats } from "@/lib/db/objectives";
import { getGoalStats } from "@/lib/db/goals";
import { getTodoStats } from "@/lib/db/todos";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [objectives, goals, todos] = await Promise.all([
      getObjectiveStats(userId),
      getGoalStats(userId),
      getTodoStats(userId),
    ]);

    return NextResponse.json({ data: { objectives, goals, todos } });
  } catch (error) {
    console.error("Error building dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
