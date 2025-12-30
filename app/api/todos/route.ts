import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTodosByUserId, createTodo } from "@/lib/db/todos";
import { createTodoSchema } from "@/lib/validations/todo";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get("goalId") || undefined;
    const milestoneId = searchParams.get("milestoneId") || undefined;
    const completedParam = searchParams.get("completed");
    const completed =
      completedParam !== null ? completedParam === "true" : undefined;

    const todos = await getTodosByUserId(session.user.id, {
      goalId,
      milestoneId,
      completed,
    });

    return NextResponse.json({ data: todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
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
    const parsed = createTodoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const todo = await createTodo(
      {
        goalId: parsed.data.goalId,
        milestoneId: parsed.data.milestoneId ?? null,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        dueDate: parsed.data.dueDate ?? null,
      },
      session.user.id
    );

    if (!todo) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ data: todo }, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
