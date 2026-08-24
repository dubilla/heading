import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  getObjectivesByUserId,
  getObjectiveWithGoals,
  getObjectivesWithGoals,
  createObjective,
  updateObjective,
  deleteObjective,
  getObjectiveStats,
} from "@/lib/db/objectives";
import {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalStats,
} from "@/lib/db/goals";
import {
  getMilestonesByGoalId,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/lib/db/milestones";
import {
  getTodosByUserId,
  getTodosByGoalId,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodoStats,
} from "@/lib/db/todos";
import {
  createProgressUpdate,
  deleteProgressUpdate,
  getLatestProgressUpdateForGoal,
  getProgressUpdatesByGoalId,
  updateProgressUpdate,
} from "@/lib/db/progress-updates";

export function registerTools(server: McpServer, USER_ID: string) {
  // --- Objectives ---

  server.registerTool(
    "list_objectives",
    {
      description:
        "List all objectives for the user. Returns titles, statuses, and IDs.",
    },
    async () => {
      const objs = await getObjectivesByUserId(USER_ID);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(objs, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_objective",
    {
      description: "Get a single objective by ID, including its linked goals.",
      inputSchema: z.object({ id: z.string().describe("Objective UUID") }),
    },
    async ({ id }) => {
      const result = await getObjectiveWithGoals(id, USER_ID);
      if (!result) {
        return {
          content: [{ type: "text" as const, text: "Objective not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "list_objectives_with_goals",
    {
      description:
        "List all objectives with their linked goals. Gives a full hierarchy view.",
    },
    async () => {
      const results = await getObjectivesWithGoals(USER_ID);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "create_objective",
    {
      description: "Create a new objective.",
      inputSchema: z.object({
        title: z.string().min(1).max(200).describe("Objective title"),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("Objective description"),
      }),
    },
    async ({ title, description }) => {
      const obj = await createObjective({
        userId: USER_ID,
        title,
        description: description ?? null,
        status: "not_started",
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(obj, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "update_objective",
    {
      description:
        "Update an existing objective's title, description, or status.",
      inputSchema: z.object({
        id: z.string().describe("Objective UUID"),
        title: z.string().min(1).max(200).optional().describe("New title"),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("New description"),
        status: z
          .enum([
            "not_started",
            "in_progress",
            "on_track",
            "off_track",
            "completed",
          ])
          .optional()
          .describe("New status"),
      }),
    },
    async ({ id, title, description, status }) => {
      const data: Record<string, string> = {};
      if (title) data.title = title;
      if (description !== undefined) data.description = description;
      if (status) data.status = status;

      const obj = await updateObjective(id, USER_ID, data);
      if (!obj) {
        return {
          content: [{ type: "text" as const, text: "Objective not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(obj, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "delete_objective",
    {
      description: "Delete an objective by ID.",
      inputSchema: z.object({ id: z.string().describe("Objective UUID") }),
    },
    async ({ id }) => {
      const deleted = await deleteObjective(id, USER_ID);
      return {
        content: [
          {
            type: "text" as const,
            text: deleted ? "Objective deleted." : "Objective not found.",
          },
        ],
        isError: !deleted,
      };
    }
  );

  // --- Goals ---

  server.registerTool(
    "list_goals",
    {
      description: "List all goals. Optionally filter by objective ID.",
      inputSchema: z.object({
        objectiveId: z.string().optional().describe("Filter by objective UUID"),
      }),
    },
    async ({ objectiveId }) => {
      let userGoals = await getGoalsByUserId(USER_ID);
      if (objectiveId) {
        userGoals = userGoals.filter((g) => g.objectiveId === objectiveId);
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(userGoals, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "get_goal",
    {
      description:
        "Get a single goal by ID with its milestones, todos, and latest progress update.",
      inputSchema: z.object({ id: z.string().describe("Goal UUID") }),
    },
    async ({ id }) => {
      const goal = await getGoalById(id, USER_ID);
      if (!goal) {
        return {
          content: [{ type: "text" as const, text: "Goal not found." }],
          isError: true,
        };
      }
      const [goalMilestones, goalTodos, latestProgressUpdate] =
        await Promise.all([
          getMilestonesByGoalId(id, USER_ID),
          getTodosByGoalId(id, USER_ID),
          getLatestProgressUpdateForGoal(id),
        ]);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                goal,
                milestones: goalMilestones,
                todos: goalTodos,
                latestProgressUpdate,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.registerTool(
    "create_goal",
    {
      description:
        "Create a new goal. Progress tracking defaults to 0 → 100 %, but can be overridden with a numeric start/target and custom unit (e.g. 0 → 3 novels).",
      inputSchema: z.object({
        title: z.string().min(1).max(200).describe("Goal title"),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("Goal description"),
        targetDate: z.string().describe("Target date in YYYY-MM-DD format"),
        category: z.string().max(50).optional().describe("Goal category"),
        objectiveId: z
          .string()
          .optional()
          .describe("Link to an objective UUID"),
        startValue: z
          .number()
          .optional()
          .describe("Starting numeric value for progress tracking (default 0)"),
        targetValue: z
          .number()
          .optional()
          .describe("Target numeric value for progress tracking (default 100)"),
        unit: z
          .string()
          .max(20)
          .optional()
          .describe(
            "Unit label (default '%'). Free text like 'novels', 'lbs'."
          ),
      }),
    },
    async ({
      title,
      description,
      targetDate,
      category,
      objectiveId,
      startValue,
      targetValue,
      unit,
    }) => {
      const goal = await createGoal({
        userId: USER_ID,
        title,
        description: description ?? null,
        targetDate: new Date(targetDate),
        category: category ?? null,
        objectiveId: objectiveId ?? null,
        startValue: startValue ?? 0,
        targetValue: targetValue ?? 100,
        unit: unit ?? "%",
        status: "not_started",
      });
      if (!goal) {
        return {
          content: [{ type: "text" as const, text: "Objective not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(goal, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "update_goal",
    {
      description:
        "Update a goal's title, description, status, target date, category, objective link, or progress tracking range (start/target/unit).",
      inputSchema: z.object({
        id: z.string().describe("Goal UUID"),
        title: z.string().min(1).max(200).optional().describe("New title"),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("New description"),
        targetDate: z
          .string()
          .optional()
          .describe("New target date (YYYY-MM-DD)"),
        category: z.string().max(50).optional().describe("New category"),
        objectiveId: z.string().optional().describe("New objective UUID link"),
        status: z
          .enum([
            "not_started",
            "in_progress",
            "on_track",
            "off_track",
            "completed",
          ])
          .optional()
          .describe("New status"),
        startValue: z.number().optional().describe("New start value"),
        targetValue: z.number().optional().describe("New target value"),
        unit: z.string().max(20).optional().describe("New unit label"),
      }),
    },
    async ({
      id,
      title,
      description,
      targetDate,
      category,
      objectiveId,
      status,
      startValue,
      targetValue,
      unit,
    }) => {
      const data: Record<string, unknown> = {};
      if (title) data.title = title;
      if (description !== undefined) data.description = description;
      if (targetDate) data.targetDate = new Date(targetDate);
      if (category) data.category = category;
      if (objectiveId) data.objectiveId = objectiveId;
      if (status) data.status = status;
      if (startValue !== undefined) data.startValue = startValue;
      if (targetValue !== undefined) data.targetValue = targetValue;
      if (unit !== undefined) data.unit = unit;

      const goal = await updateGoal(id, USER_ID, data);
      if (!goal) {
        return {
          content: [
            { type: "text" as const, text: "Goal or objective not found." },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(goal, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "delete_goal",
    {
      description:
        "Delete a goal by ID. This also deletes its milestones and todos.",
      inputSchema: z.object({ id: z.string().describe("Goal UUID") }),
    },
    async ({ id }) => {
      const deleted = await deleteGoal(id, USER_ID);
      return {
        content: [
          {
            type: "text" as const,
            text: deleted ? "Goal deleted." : "Goal not found.",
          },
        ],
        isError: !deleted,
      };
    }
  );

  // --- Milestones ---

  server.registerTool(
    "list_milestones",
    {
      description: "List milestones for a goal.",
      inputSchema: z.object({ goalId: z.string().describe("Goal UUID") }),
    },
    async ({ goalId }) => {
      const items = await getMilestonesByGoalId(goalId, USER_ID);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(items, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "create_milestone",
    {
      description: "Create a milestone for a goal.",
      inputSchema: z.object({
        goalId: z.string().describe("Goal UUID"),
        title: z.string().min(1).max(200).describe("Milestone title"),
        description: z.string().max(1000).optional().describe("Description"),
        dueDate: z.string().describe("Due date (YYYY-MM-DD)"),
        type: z.enum(["quarterly", "monthly"]).describe("Milestone type"),
        quarter: z.number().min(1).max(4).optional().describe("Quarter (1-4)"),
        month: z.number().min(1).max(12).optional().describe("Month (1-12)"),
      }),
    },
    async ({ goalId, title, description, dueDate, type, quarter, month }) => {
      const milestone = await createMilestone(
        {
          goalId,
          title,
          description: description ?? null,
          dueDate: new Date(dueDate),
          type,
          quarter: quarter ?? null,
          month: month ?? null,
          status: "not_started",
        },
        USER_ID
      );

      if (!milestone) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Failed to create milestone. Check that the goal exists.",
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(milestone, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "update_milestone",
    {
      description:
        "Update a milestone's title, description, status, due date, quarter, or month.",
      inputSchema: z.object({
        id: z.string().describe("Milestone UUID"),
        title: z.string().min(1).max(200).optional().describe("New title"),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("New description"),
        dueDate: z.string().optional().describe("New due date (YYYY-MM-DD)"),
        status: z
          .enum(["not_started", "in_progress", "completed", "off_track"])
          .optional()
          .describe("New status"),
        quarter: z.number().min(1).max(4).optional().describe("New quarter"),
        month: z.number().min(1).max(12).optional().describe("New month"),
      }),
    },
    async ({ id, title, description, dueDate, status, quarter, month }) => {
      const data: Record<string, unknown> = {};
      if (title) data.title = title;
      if (description !== undefined) data.description = description;
      if (dueDate) data.dueDate = new Date(dueDate);
      if (status) data.status = status;
      if (quarter !== undefined) data.quarter = quarter;
      if (month !== undefined) data.month = month;

      const milestone = await updateMilestone(id, USER_ID, data);
      if (!milestone) {
        return {
          content: [{ type: "text" as const, text: "Milestone not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(milestone, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "delete_milestone",
    {
      description: "Delete a milestone by ID.",
      inputSchema: z.object({ id: z.string().describe("Milestone UUID") }),
    },
    async ({ id }) => {
      const deleted = await deleteMilestone(id, USER_ID);
      return {
        content: [
          {
            type: "text" as const,
            text: deleted ? "Milestone deleted." : "Milestone not found.",
          },
        ],
        isError: !deleted,
      };
    }
  );

  // --- Todos ---

  server.registerTool(
    "list_todos",
    {
      description:
        "List todos. Optionally filter by goal, milestone, or completion status.",
      inputSchema: z.object({
        goalId: z.string().optional().describe("Filter by goal UUID"),
        milestoneId: z.string().optional().describe("Filter by milestone UUID"),
        completed: z
          .boolean()
          .optional()
          .describe("Filter by completion status"),
      }),
    },
    async ({ goalId, milestoneId, completed }) => {
      const items = await getTodosByUserId(USER_ID, {
        goalId,
        milestoneId,
        completed,
      });
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(items, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "create_todo",
    {
      description: "Create a todo linked to a goal and optionally a milestone.",
      inputSchema: z.object({
        goalId: z.string().describe("Goal UUID"),
        title: z.string().min(1).max(200).describe("Todo title"),
        description: z.string().max(1000).optional().describe("Description"),
        milestoneId: z.string().optional().describe("Milestone UUID"),
        dueDate: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      }),
    },
    async ({ goalId, title, description, milestoneId, dueDate }) => {
      const todo = await createTodo(
        {
          goalId,
          title,
          description: description ?? null,
          milestoneId: milestoneId ?? null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        USER_ID
      );

      if (!todo) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Failed to create todo. Check that the goal and milestone exist.",
            },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(todo, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "update_todo",
    {
      description:
        "Update a todo's title, description, due date, or completion status.",
      inputSchema: z.object({
        id: z.string().describe("Todo UUID"),
        title: z.string().min(1).max(200).optional().describe("New title"),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("New description"),
        dueDate: z.string().optional().describe("New due date (YYYY-MM-DD)"),
        completed: z.boolean().optional().describe("Mark as completed or not"),
      }),
    },
    async ({ id, title, description, dueDate, completed }) => {
      const data: Record<string, unknown> = {};
      if (title) data.title = title;
      if (description !== undefined) data.description = description;
      if (dueDate) data.dueDate = new Date(dueDate);
      if (completed !== undefined) data.completed = completed;

      const todo = await updateTodo(id, USER_ID, data);
      if (!todo) {
        return {
          content: [{ type: "text" as const, text: "Todo not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(todo, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "delete_todo",
    {
      description: "Delete a todo by ID.",
      inputSchema: z.object({ id: z.string().describe("Todo UUID") }),
    },
    async ({ id }) => {
      const deleted = await deleteTodo(id, USER_ID);
      return {
        content: [
          {
            type: "text" as const,
            text: deleted ? "Todo deleted." : "Todo not found.",
          },
        ],
        isError: !deleted,
      };
    }
  );

  // --- Progress updates ---

  server.registerTool(
    "list_progress_updates",
    {
      description: "List all progress updates for a goal, newest first.",
      inputSchema: z.object({ goalId: z.string().describe("Goal UUID") }),
    },
    async ({ goalId }) => {
      const updates = await getProgressUpdatesByGoalId(goalId, USER_ID);
      if (updates === null) {
        return {
          content: [{ type: "text" as const, text: "Goal not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(updates, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "create_progress_update",
    {
      description:
        "Log a new progress update on a goal. Value is cumulative (e.g. '2' on a 'read 3 novels' goal means 2 so far). occurredAt defaults to today and supports backdating.",
      inputSchema: z.object({
        goalId: z.string().describe("Goal UUID"),
        value: z.number().describe("Numeric value for the update"),
        note: z.string().max(2000).optional().describe("Optional note"),
        occurredAt: z
          .string()
          .optional()
          .describe(
            "When the progress happened (YYYY-MM-DD). Defaults to today."
          ),
      }),
    },
    async ({ goalId, value, note, occurredAt }) => {
      const update = await createProgressUpdate(
        {
          goalId,
          userId: USER_ID,
          value,
          note: note ?? null,
          occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        },
        USER_ID
      );
      if (!update) {
        return {
          content: [{ type: "text" as const, text: "Goal not found." }],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(update, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "update_progress_update",
    {
      description:
        "Edit an existing progress update's value, note, or occurredAt.",
      inputSchema: z.object({
        id: z.string().describe("Progress update UUID"),
        value: z.number().optional().describe("New value"),
        note: z.string().max(2000).optional().describe("New note"),
        occurredAt: z
          .string()
          .optional()
          .describe("New occurred-at (YYYY-MM-DD)"),
      }),
    },
    async ({ id, value, note, occurredAt }) => {
      const data: {
        value?: number;
        note?: string | null;
        occurredAt?: Date;
      } = {};
      if (value !== undefined) data.value = value;
      if (note !== undefined) data.note = note;
      if (occurredAt !== undefined) data.occurredAt = new Date(occurredAt);

      const update = await updateProgressUpdate(id, USER_ID, data);
      if (!update) {
        return {
          content: [
            { type: "text" as const, text: "Progress update not found." },
          ],
          isError: true,
        };
      }
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(update, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "delete_progress_update",
    {
      description: "Delete a progress update by ID.",
      inputSchema: z.object({
        id: z.string().describe("Progress update UUID"),
      }),
    },
    async ({ id }) => {
      const deleted = await deleteProgressUpdate(id, USER_ID);
      return {
        content: [
          {
            type: "text" as const,
            text: deleted
              ? "Progress update deleted."
              : "Progress update not found.",
          },
        ],
        isError: !deleted,
      };
    }
  );

  // --- Dashboard ---

  server.registerTool(
    "get_dashboard",
    {
      description:
        "Get an overview of all objectives, goals, and todo statistics.",
    },
    async () => {
      const [objStats, goalStats, todoStats] = await Promise.all([
        getObjectiveStats(USER_ID),
        getGoalStats(USER_ID),
        getTodoStats(USER_ID),
      ]);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { objectives: objStats, goals: goalStats, todos: todoStats },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
