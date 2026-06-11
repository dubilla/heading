import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { updateSession } from "@/lib/auth";
import { updateUserProfile } from "@/lib/db/users";
import { updateSettingsSchema } from "@/lib/validations/settings";

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await updateUserProfile(userId, parsed.data);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (parsed.data.name !== undefined) {
      // Refresh the JWT so the navbar shows the new name immediately.
      await updateSession({ user: { name: parsed.data.name } });
    }

    return NextResponse.json({
      data: { name: user.name, checkInDay: user.checkInDay },
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
