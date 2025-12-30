import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoalById } from "@/lib/db/goals";
import { getTodosByGoalId } from "@/lib/db/todos";
import { calculateGoalProgress } from "@/lib/utils/progress";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const goal = await getGoalById(id, session.user.id);

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const todos = await getTodosByGoalId(id, session.user.id);
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
