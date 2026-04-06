import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { getGoalById } from "@/lib/db/goals";
import { getTodosByGoalId } from "@/lib/db/todos";
import { calculateGoalProgress } from "@/lib/utils/progress";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const goal = await getGoalById(id, userId);

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const todos = await getTodosByGoalId(id, userId);
    const progress = calculateGoalProgress(goal, todos);

    return NextResponse.json({ data: progress });
  } catch (error) {
    console.error("Error calculating goal progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
