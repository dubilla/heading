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
  // Crew is the system-of-record for task content/execution; we keep a thin
  // local row and cache the linked Crew task id here. Null when the todo
  // hasn't been pushed to Crew (integration off, or push failed — graceful
  // degradation, retried on next write).
  crewTaskId: text("crew_task_id"),
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

export const checkIns = pgTable("check_ins", {
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
});

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
