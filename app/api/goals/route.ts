import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoalsByUserId, createGoal } from "@/lib/db/goals";
import { createGoalSchema } from "@/lib/validations/goal";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await getGoalsByUserId(session.user.id);
    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const goal = await createGoal({
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      targetDate: parsed.data.targetDate,
      category: parsed.data.category ?? null,
      objectiveId: parsed.data.objectiveId ?? null,
      status: "not_started",
    });

    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
