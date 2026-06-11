import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { updateCurrentWeekCheckIn } from "@/lib/db/check-ins";
import { updateCheckInSchema } from "@/lib/validations/check-in";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await updateCurrentWeekCheckIn(id, userId, parsed.data);

    if (result === null) {
      return NextResponse.json(
        { error: "Check-in not found" },
        { status: 404 }
      );
    }
    if (result === "not_current_week") {
      return NextResponse.json(
        { error: "Only the current week's check-in can be edited" },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error updating check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
