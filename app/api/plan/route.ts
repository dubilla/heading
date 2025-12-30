import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoalById } from "@/lib/db/goals";
import {
  getActiveSession,
  getSessionById,
  createSession,
  updateSessionMessages,
} from "@/lib/db/planning-sessions";
import { chat, ChatMessage } from "@/lib/ai/claude";
import { z } from "zod";

const requestSchema = z.object({
  goalId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { goalId, message, sessionId } = parsed.data;

    // Get the goal
    const goal = await getGoalById(goalId, session.user.id);
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Get or create planning session
    let planningSession;
    if (sessionId) {
      planningSession = await getSessionById(sessionId, session.user.id);
      if (!planningSession) {
        return NextResponse.json(
          { error: "Planning session not found" },
          { status: 404 }
        );
      }
    } else {
      planningSession = await getActiveSession(goalId, session.user.id);
      if (!planningSession) {
        planningSession = await createSession(goalId, session.user.id);
        if (!planningSession) {
          return NextResponse.json(
            { error: "Failed to create planning session" },
            { status: 500 }
          );
        }
      }
    }

    // Build message history
    const messages: ChatMessage[] = [
      ...planningSession.messages,
      { role: "user" as const, content: message },
    ];

    // If this is the first message, add an intro prompt
    if (planningSession.messages.length === 0) {
      messages[0] = {
        role: "user" as const,
        content: `I want to plan how to achieve my goal: "${goal.title}". ${message}`,
      };
    }

    // Call Claude
    const response = await chat(
      goal.title,
      goal.description,
      new Date(goal.targetDate).toISOString().split("T")[0],
      messages
    );

    // Update session with new messages
    const updatedMessages = [
      ...planningSession.messages,
      { role: "user" as const, content: message },
      { role: "assistant" as const, content: response.message },
    ];

    await updateSessionMessages(
      planningSession.id,
      session.user.id,
      updatedMessages
    );

    return NextResponse.json({
      data: {
        sessionId: planningSession.id,
        response: response.message,
        suggestedMilestones: response.suggestedMilestones,
        suggestedTodos: response.suggestedTodos,
        phase: response.phase,
        isComplete: response.isComplete,
      },
    });
  } catch (error) {
    console.error("Planning error:", error);
    return NextResponse.json(
      { error: "Failed to process planning request" },
      { status: 500 }
    );
  }
}
