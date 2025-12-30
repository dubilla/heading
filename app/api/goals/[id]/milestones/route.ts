import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMilestonesByGoalId } from "@/lib/db/milestones";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const milestones = await getMilestonesByGoalId(id, session.user.id);
    return NextResponse.json({ data: milestones });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
