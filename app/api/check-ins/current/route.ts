import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentWeekCheckIn } from "@/lib/db/check-ins";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checkIn = await getCurrentWeekCheckIn(session.user.id);
    return NextResponse.json({ data: checkIn || null });
  } catch (error) {
    console.error("Error fetching current check-in:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
