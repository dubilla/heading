import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { getCurrentWeekCheckIn } from "@/lib/db/check-ins";

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkIn = await getCurrentWeekCheckIn(userId);
    return NextResponse.json({ data: checkIn || null });
  } catch (error) {
    console.error("Error fetching current check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
