import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getObjectivesByUserId, createObjective } from "@/lib/db/objectives";
import { createObjectiveSchema } from "@/lib/validations/objective";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const objectives = await getObjectivesByUserId(session.user.id);
    return NextResponse.json({ data: objectives });
  } catch (error) {
    console.error("Error fetching objectives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createObjectiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const objective = await createObjective({
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: "not_started",
    });

    return NextResponse.json({ data: objective }, { status: 201 });
  } catch (error) {
    console.error("Error creating objective:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
