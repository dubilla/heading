import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import {
  deleteProgressUpdate,
  getProgressUpdateById,
  updateProgressUpdate,
} from "@/lib/db/progress-updates";
import { updateProgressUpdateSchema } from "@/lib/validations/progress-update";

type RouteParams = {
  params: Promise<{ id: string; updateId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, updateId } = await params;
    const update = await getProgressUpdateById(updateId, userId);

    if (!update || update.goalId !== id) {
      return NextResponse.json(
        { error: "Progress update not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: update });
  } catch (error) {
    console.error("Error fetching progress update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, updateId } = await params;
    const body = await request.json();
    const parsed = updateProgressUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await getProgressUpdateById(updateId, userId);
    if (!existing || existing.goalId !== id) {
      return NextResponse.json(
        { error: "Progress update not found" },
        { status: 404 }
      );
    }

    const update = await updateProgressUpdate(updateId, userId, parsed.data);
    return NextResponse.json({ data: update });
  } catch (error) {
    console.error("Error updating progress update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, updateId } = await params;
    const existing = await getProgressUpdateById(updateId, userId);
    if (!existing || existing.goalId !== id) {
      return NextResponse.json(
        { error: "Progress update not found" },
        { status: 404 }
      );
    }

    const deleted = await deleteProgressUpdate(updateId, userId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Progress update not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting progress update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
