import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { completeTodoFromCrew } from "@/lib/db/todos";

/**
 * Crew completion webhook. Crew POSTs here when a Heading-origin task is
 * completed; we mirror the completion onto the local todo (which also starts
 * the goal via `markGoalStarted`).
 *
 * Auth is a shared secret in the `X-Heading-Webhook-Secret` header, matching
 * Crew's `HEADING_WEBHOOK_SECRET`. The body is `{ externalId, crewTaskId }`,
 * where `externalId` is the Heading todo id.
 */

const HEADER_NAME = "x-heading-webhook-secret";

const bodySchema = z.object({
  externalId: z.string().uuid(),
  crewTaskId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const secret = process.env.CREW_WEBHOOK_SECRET;
  if (!secret) {
    // Integration not configured on this deployment — reject rather than
    // silently accept unauthenticated writes.
    console.error("Crew webhook received but CREW_WEBHOOK_SECRET is unset");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (request.headers.get(HEADER_NAME) !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const found = await completeTodoFromCrew(parsed.data.externalId);
  if (!found) {
    // Unknown todo: ack anyway so Crew doesn't retry a delivery we can't act on.
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  return NextResponse.json({ status: "completed" });
}
