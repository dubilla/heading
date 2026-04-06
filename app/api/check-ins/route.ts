import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import {
  getCheckInsByUserId,
  createCheckIn,
  getCheckInForWeek,
} from "@/lib/db/check-ins";
import { createCheckInSchema } from "@/lib/validations/check-in";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkIns = await getCheckInsByUserId(userId);
    return NextResponse.json({ data: checkIns });
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if a check-in already exists for this week
    const existing = await getCheckInForWeek(
      userId,
      parsed.data.weekStartDate
    );

    if (existing) {
      return NextResponse.json(
        { error: "A check-in already exists for this week" },
        { status: 400 }
      );
    }

    const checkIn = await createCheckIn({
      userId: userId,
      weekStartDate: parsed.data.weekStartDate,
      accomplishments: parsed.data.accomplishments,
      challenges: parsed.data.challenges,
      nextWeekPriorities: parsed.data.nextWeekPriorities,
      needsAdjustment: parsed.data.needsAdjustment,
    });

    return NextResponse.json({ data: checkIn }, { status: 201 });
  } catch (error) {
    console.error("Error creating check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
