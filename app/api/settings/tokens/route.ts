import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { createToken, listTokensByUserId } from "@/lib/db/tokens";
import { createTokenSchema } from "@/lib/validations/token";

// Token management is deliberately session-only: the middleware blocks token
// auth from /api/settings, so a leaked token can neither list nor mint tokens.

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tokens = await listTokensByUserId(userId);
    return NextResponse.json({ data: tokens });
  } catch (error) {
    console.error("Error listing tokens:", error);
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
    const parsed = createTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const expiresAt = new Date(
      Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000
    );
    const { token, record } = await createToken({
      userId,
      name: parsed.data.name,
      expiresAt,
    });

    // The plaintext token is returned exactly once, here. It is never stored
    // and cannot be retrieved again.
    return NextResponse.json({ data: { token, record } }, { status: 201 });
  } catch (error) {
    console.error("Error creating token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
