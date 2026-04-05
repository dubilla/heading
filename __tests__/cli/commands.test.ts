import { objectivesCommand } from "@/cli/commands/objectives";
import { goalsCommand } from "@/cli/commands/goals";
import { milestonesCommand } from "@/cli/commands/milestones";
import { todosCommand } from "@/cli/commands/todos";
import { dashboardCommand } from "@/cli/commands/dashboard";

// Mock all DB modules to prevent actual DB connections
jest.mock("@/lib/db/objectives", () => ({
  getObjectivesByUserId: jest.fn().mockResolvedValue([]),
  getObjectiveById: jest.fn().mockResolvedValue(undefined),
  getObjectiveWithGoals: jest.fn().mockResolvedValue(null),
  getObjectivesWithGoals: jest.fn().mockResolvedValue([]),
  createObjective: jest.fn().mockResolvedValue({ id: "test-id", title: "Test" }),
  updateObjective: jest.fn().mockResolvedValue(null),
  deleteObjective: jest.fn().mockResolvedValue(false),
  getObjectiveStats: jest
    .fn()
    .mockResolvedValue({ total: 0, completed: 0, inProgress: 0, offTrack: 0 }),
}));

jest.mock("@/lib/db/goals", () => ({
  getGoalsByUserId: jest.fn().mockResolvedValue([]),
  getGoalById: jest.fn().mockResolvedValue(undefined),
  createGoal: jest.fn().mockResolvedValue({ id: "test-id", title: "Test" }),
  updateGoal: jest.fn().mockResolvedValue(null),
  deleteGoal: jest.fn().mockResolvedValue(false),
  getGoalStats: jest
    .fn()
    .mockResolvedValue({ total: 0, completed: 0, inProgress: 0, offTrack: 0 }),
}));

jest.mock("@/lib/db/milestones", () => ({
  getMilestonesByGoalId: jest.fn().mockResolvedValue([]),
  getMilestoneById: jest.fn().mockResolvedValue(undefined),
  createMilestone: jest.fn().mockResolvedValue(null),
  updateMilestone: jest.fn().mockResolvedValue(null),
  deleteMilestone: jest.fn().mockResolvedValue(false),
}));

jest.mock("@/lib/db/todos", () => ({
  getTodosByUserId: jest.fn().mockResolvedValue([]),
  getTodosByGoalId: jest.fn().mockResolvedValue([]),
  getTodoById: jest.fn().mockResolvedValue(undefined),
  createTodo: jest.fn().mockResolvedValue(null),
  updateTodo: jest.fn().mockResolvedValue(null),
  deleteTodo: jest.fn().mockResolvedValue(false),
  getTodoStats: jest.fn().mockResolvedValue({
    total: 0,
    completed: 0,
    pending: 0,
    dueThisWeek: 0,
    overdue: 0,
  }),
}));

describe("CLI command structure", () => {
  describe("objectives command", () => {
    it("has the correct subcommands", () => {
      const names = objectivesCommand.commands.map((c) => c.name());
      expect(names).toContain("list");
      expect(names).toContain("get");
      expect(names).toContain("create");
      expect(names).toContain("update");
      expect(names).toContain("delete");
    });

    it("has the obj alias", () => {
      expect(objectivesCommand.aliases()).toContain("obj");
    });
  });

  describe("goals command", () => {
    it("has the correct subcommands", () => {
      const names = goalsCommand.commands.map((c) => c.name());
      expect(names).toContain("list");
      expect(names).toContain("get");
      expect(names).toContain("create");
      expect(names).toContain("update");
      expect(names).toContain("delete");
    });
  });

  describe("milestones command", () => {
    it("has the correct subcommands", () => {
      const names = milestonesCommand.commands.map((c) => c.name());
      expect(names).toContain("list");
      expect(names).toContain("get");
      expect(names).toContain("create");
      expect(names).toContain("update");
      expect(names).toContain("delete");
    });

    it("has the ms alias", () => {
      expect(milestonesCommand.aliases()).toContain("ms");
    });
  });

  describe("todos command", () => {
    it("has the correct subcommands", () => {
      const names = todosCommand.commands.map((c) => c.name());
      expect(names).toContain("list");
      expect(names).toContain("get");
      expect(names).toContain("create");
      expect(names).toContain("complete");
      expect(names).toContain("update");
      expect(names).toContain("delete");
    });
  });

  describe("dashboard command", () => {
    it("has the dash alias", () => {
      expect(dashboardCommand.aliases()).toContain("dash");
    });
  });

  describe("create command required options", () => {
    it("objectives create has required --title option", () => {
      const create = objectivesCommand.commands.find((c) => c.name() === "create");
      const titleOpt = create?.options.find((o) => o.long === "--title");
      expect(titleOpt).toBeDefined();
      expect(titleOpt?.required).toBe(true);
    });

    it("goals create has required --title and --target-date options", () => {
      const create = goalsCommand.commands.find((c) => c.name() === "create");
      const titleOpt = create?.options.find((o) => o.long === "--title");
      const dateOpt = create?.options.find((o) => o.long === "--target-date");
      expect(titleOpt?.required).toBe(true);
      expect(dateOpt?.required).toBe(true);
    });

    it("milestones create has required --goal-id, --title, --due-date, --type", () => {
      const create = milestonesCommand.commands.find((c) => c.name() === "create");
      const opts = create?.options ?? [];
      const requiredLongs = opts
        .filter((o) => o.required)
        .map((o) => o.long);
      expect(requiredLongs).toContain("--goal-id");
      expect(requiredLongs).toContain("--title");
      expect(requiredLongs).toContain("--due-date");
      expect(requiredLongs).toContain("--type");
    });

    it("todos create has required --goal-id and --title", () => {
      const create = todosCommand.commands.find((c) => c.name() === "create");
      const opts = create?.options ?? [];
      const requiredLongs = opts
        .filter((o) => o.required)
        .map((o) => o.long);
      expect(requiredLongs).toContain("--goal-id");
      expect(requiredLongs).toContain("--title");
    });
  });
});
