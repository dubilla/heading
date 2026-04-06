import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { getMilestoneById } from "@/lib/db/milestones";
import { getTodosByMilestoneId } from "@/lib/db/todos";
import { calculateMilestoneProgress } from "@/lib/utils/progress";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const milestone = await getMilestoneById(id, userId);

    if (!milestone) {
      return NextResponse.json(
        { error: "Milestone not found" },
        { status: 404 }
      );
    }

    const todos = await getTodosByMilestoneId(id, userId);
    const progress = calculateMilestoneProgress(milestone, todos);

    return NextResponse.json({ data: progress });
  } catch (error) {
    console.error("Error calculating milestone progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
