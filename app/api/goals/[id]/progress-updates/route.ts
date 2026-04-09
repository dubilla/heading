import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import {
  createProgressUpdate,
  getProgressUpdatesByGoalId,
} from "@/lib/db/progress-updates";
import { createProgressUpdateSchema } from "@/lib/validations/progress-update";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const updates = await getProgressUpdatesByGoalId(id, userId);

    if (updates === null) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updates });
  } catch (error) {
    console.error("Error fetching progress updates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = createProgressUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const update = await createProgressUpdate(
      {
        goalId: id,
        userId,
        value: parsed.data.value,
        note: parsed.data.note ?? null,
        occurredAt: parsed.data.occurredAt ?? new Date(),
      },
      userId
    );

    if (!update) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ data: update }, { status: 201 });
  } catch (error) {
    console.error("Error creating progress update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
