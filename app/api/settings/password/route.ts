import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { changeUserPassword } from "@/lib/db/users";
import { changePasswordSchema } from "@/lib/validations/settings";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await changeUserPassword(
      userId,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );

    if (result === "wrong_password") {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    if (result === "no_password") {
      return NextResponse.json(
        {
          error:
            "This account signs in with Google and has no password to change",
        },
        { status: 400 }
      );
    }
    if (result === "not_found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
