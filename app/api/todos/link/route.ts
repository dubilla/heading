import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { linkExistingCrewTask } from "@/lib/db/todos";
import { linkCrewTaskSchema } from "@/lib/validations/todo";

/**
 * Link an existing Crew task to a goal (S2). Creates a crew-origin todo and
 * adopts the Crew task; on adoption failure nothing is persisted.
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = linkCrewTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const result = await linkExistingCrewTask(
    {
      goalId: parsed.data.goalId,
      milestoneId: parsed.data.milestoneId ?? null,
      crewTaskId: parsed.data.crewTaskId,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ?? null,
    },
    userId
  );

  if (!result.ok) {
    if (result.reason === "goal_not_found") {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    if (result.reason === "conflict") {
      return NextResponse.json(
        { error: "That Crew task is already linked somewhere else." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't reach Crew to link the task. Try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ data: result.todo }, { status: 201 });
}
