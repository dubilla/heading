import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  date,
  pgEnum,
  json,
  primaryKey,
  index,
  unique,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// Enums
export const goalStatusEnum = pgEnum("goal_status", [
  "not_started",
  "in_progress",
  "on_track",
  "off_track",
  "completed",
]);

export const milestoneTypeEnum = pgEnum("milestone_type", [
  "quarterly",
  "monthly",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "not_started",
  "in_progress",
  "completed",
  "off_track",
]);

export const planningSessionStatusEnum = pgEnum("planning_session_status", [
  "active",
  "completed",
  "abandoned",
]);

// Where a todo originated: "heading" todos are created here and pushed to Crew;
// "crew" todos are existing Crew tasks linked into a goal (S2).
export const todoOriginEnum = pgEnum("todo_origin", ["heading", "crew"]);

export const objectiveStatusEnum = pgEnum("objective_status", [
  "not_started",
  "in_progress",
  "on_track",
  "off_track",
  "completed",
]);

// NextAuth tables
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  // 0 = Sunday … 6 = Saturday. Drives the weekly check-in nudge (dashboard
  // label today, reminder delivery later).
  checkInDay: integer("check_in_day").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

export const personalAccessTokens = pgTable(
  "personal_access_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    // Last 4 chars of the plaintext, so a token is identifiable in the UI
    // without ever exposing anything usable.
    last4: text("last4").notNull(),
    // Null means no expiry; the UI requires a choice, so app-created tokens
    // always set one.
    expiresAt: timestamp("expires_at", { mode: "date" }),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("personal_access_tokens_user_id_idx").on(table.userId)]
);

// Application tables
export const objectives = pgTable("objectives", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: objectiveStatusEnum("status").default("not_started").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  objectiveId: uuid("objective_id").references(() => objectives.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: date("target_date", { mode: "date" }).notNull(),
  category: text("category"),
  status: goalStatusEnum("status").default("not_started").notNull(),
  startValue: doublePrecision("start_value").default(0).notNull(),
  targetValue: doublePrecision("target_value").default(100).notNull(),
  unit: text("unit").default("%").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const progressUpdates = pgTable(
  "progress_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    note: text("note"),
    occurredAt: timestamp("occurred_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("progress_updates_goal_occurred_idx").on(
      table.goalId,
      table.occurredAt.desc()
    ),
  ]
);

export const milestones = pgTable("milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date", { mode: "date" }).notNull(),
  type: milestoneTypeEnum("type").notNull(),
  quarter: integer("quarter"),
  month: integer("month"),
  status: milestoneStatusEnum("status").default("not_started").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const todos = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(),
  milestoneId: uuid("milestone_id").references(() => milestones.id, {
    onDelete: "cascade",
  }),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date", { mode: "date" }),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  crewTaskId: text("crew_task_id"),
  origin: todoOriginEnum("origin").default("heading").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const planningSessions = pgTable("planning_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  messages: json("messages")
    .$type<{ role: "user" | "assistant"; content: string }[]>()
    .default([])
    .notNull(),
  status: planningSessionStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStartDate: date("week_start_date", { mode: "date" }).notNull(),
    accomplishments: text("accomplishments").notNull(),
    challenges: text("challenges").notNull(),
    nextWeekPriorities: text("next_week_priorities").notNull(),
    needsAdjustment: boolean("needs_adjustment").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    // One check-in per user per week, enforced at the DB level — the API's
    // existence check alone can't survive concurrent submissions.
    unique("check_ins_user_id_week_start_date_uq").on(
      table.userId,
      table.weekStartDate
    ),
  ]
);

// Fixed-window rate limiting (signup per IP, failed sign-ins per email).
// Postgres-backed so it works across serverless instances without an external
// store; rows are short-lived and cleaned opportunistically on write.
export const rateLimitEvents = pgTable(
  "rate_limit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bucket: text("bucket").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("rate_limit_events_bucket_created_idx").on(
      table.bucket,
      table.createdAt.desc()
    ),
  ]
);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Objective = typeof objectives.$inferSelect;
export type NewObjective = typeof objectives.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type PlanningSession = typeof planningSessions.$inferSelect;
export type NewPlanningSession = typeof planningSessions.$inferInsert;
export type ProgressUpdate = typeof progressUpdates.$inferSelect;
export type NewProgressUpdate = typeof progressUpdates.$inferInsert;
export type CheckIn = typeof checkIns.$inferSelect;
export type NewCheckIn = typeof checkIns.$inferInsert;
export type PersonalAccessToken = typeof personalAccessTokens.$inferSelect;
export type NewPersonalAccessToken = typeof personalAccessTokens.$inferInsert;
