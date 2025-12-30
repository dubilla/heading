import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMilestone } from "@/lib/db/milestones";
import { createMilestoneSchema } from "@/lib/validations/milestone";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createMilestoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const milestone = await createMilestone(
      {
        goalId: parsed.data.goalId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        dueDate: parsed.data.dueDate,
        type: parsed.data.type,
        quarter: parsed.data.quarter ?? null,
        month: parsed.data.month ?? null,
        status: "not_started",
      },
      session.user.id
    );

    if (!milestone) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ data: milestone }, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
