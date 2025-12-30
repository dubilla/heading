import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { milestones, todos } from "@/lib/db/schema";
import { getSessionById, completeSession } from "@/lib/db/planning-sessions";
import { z } from "zod";

const milestoneSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(["quarterly", "monthly"]),
  quarter: z.number().min(1).max(4).optional(),
  month: z.number().min(1).max(12).optional(),
  dueDate: z.string(),
});

const todoSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  milestoneTitle: z.string().optional(),
  dueDate: z.string().optional(),
});

const requestSchema = z.object({
  milestones: z.array(milestoneSchema).optional(),
  todos: z.array(todoSchema).optional(),
});

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const planningSession = await getSessionById(sessionId, session.user.id);

    if (!planningSession) {
      return NextResponse.json(
        { error: "Planning session not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { milestones: suggestedMilestones, todos: suggestedTodos } =
      parsed.data;

    // Create milestones
    const createdMilestones: { title: string; id: string }[] = [];
    if (suggestedMilestones && suggestedMilestones.length > 0) {
      for (const milestone of suggestedMilestones) {
        const [created] = await db
          .insert(milestones)
          .values({
            goalId: planningSession.goalId,
            title: milestone.title,
            description: milestone.description || null,
            type: milestone.type,
            quarter: milestone.quarter || null,
            month: milestone.month || null,
            dueDate: new Date(milestone.dueDate),
            status: "not_started",
          })
          .returning();
        createdMilestones.push({ title: milestone.title, id: created.id });
      }
    }

    // Create todos
    const createdTodos: string[] = [];
    if (suggestedTodos && suggestedTodos.length > 0) {
      for (const todo of suggestedTodos) {
        // Find matching milestone if specified
        let milestoneId: string | null = null;
        if (todo.milestoneTitle) {
          const match = createdMilestones.find(
            (m) => m.title === todo.milestoneTitle
          );
          if (match) {
            milestoneId = match.id;
          }
        }

        const [created] = await db
          .insert(todos)
          .values({
            goalId: planningSession.goalId,
            milestoneId,
            title: todo.title,
            description: todo.description || null,
            dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
            completed: false,
          })
          .returning();
        createdTodos.push(created.id);
      }
    }

    // Complete the session
    await completeSession(sessionId, session.user.id);

    return NextResponse.json({
      data: {
        milestonesCreated: createdMilestones.length,
        todosCreated: createdTodos.length,
      },
    });
  } catch (error) {
    console.error("Accept plan error:", error);
    return NextResponse.json(
      { error: "Failed to accept plan" },
      { status: 500 }
    );
  }
}
