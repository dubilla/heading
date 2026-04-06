import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import {
  getObjectiveById,
  getObjectiveWithGoals,
  updateObjective,
  deleteObjective,
} from "@/lib/db/objectives";
import { updateObjectiveSchema } from "@/lib/validations/objective";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const includeGoals = url.searchParams.get("includeGoals") === "true";

    if (includeGoals) {
      const result = await getObjectiveWithGoals(id, userId);
      if (!result) {
        return NextResponse.json(
          { error: "Objective not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: result });
    }

    const objective = await getObjectiveById(id, userId);
    if (!objective) {
      return NextResponse.json(
        { error: "Objective not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: objective });
  } catch (error) {
    console.error("Error fetching objective:", error);
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

    const { id } = await params;
    const body = await request.json();
    const parsed = updateObjectiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingObjective = await getObjectiveById(id, userId);
    if (!existingObjective) {
      return NextResponse.json(
        { error: "Objective not found" },
        { status: 404 }
      );
    }

    const objective = await updateObjective(id, userId, parsed.data);

    return NextResponse.json({ data: objective });
  } catch (error) {
    console.error("Error updating objective:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteObjective(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Objective not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting objective:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
