import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const includeGoals = url.searchParams.get("includeGoals") === "true";

    if (includeGoals) {
      const result = await getObjectiveWithGoals(id, session.user.id);
      if (!result) {
        return NextResponse.json(
          { error: "Objective not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: result });
    }

    const objective = await getObjectiveById(id, session.user.id);
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
    const session = await auth();
    if (!session?.user?.id) {
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

    const existingObjective = await getObjectiveById(id, session.user.id);
    if (!existingObjective) {
      return NextResponse.json(
        { error: "Objective not found" },
        { status: 404 }
      );
    }

    const objective = await updateObjective(id, session.user.id, parsed.data);

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteObjective(id, session.user.id);

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
