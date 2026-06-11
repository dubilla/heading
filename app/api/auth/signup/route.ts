import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { signUpSchema } from "@/lib/validations/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  isRateLimited,
  recordRateLimitEvent,
  clientIpFrom,
  AUTH_RATE_LIMIT,
  AUTH_RATE_WINDOW_MS,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIpFrom(request.headers.get("x-forwarded-for"));
    const bucket = `signup:${ip}`;
    if (await isRateLimited(bucket, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW_MS)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Try again in a few minutes." },
        { status: 429 }
      );
    }
    await recordRateLimitEvent(bucket, AUTH_RATE_WINDOW_MS);

    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    return NextResponse.json({ data: newUser }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
