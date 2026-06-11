import { createTodo, updateTodo, linkExistingCrewTask } from "@/lib/db/todos";
import { db } from "@/lib/db";
import { linkCrewTask } from "@/lib/integrations/crew";

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      goals: { findFirst: jest.fn(), findMany: jest.fn() },
      milestones: { findFirst: jest.fn() },
      todos: { findFirst: jest.fn(), findMany: jest.fn() },
    },
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/lib/db/goals", () => ({
  markGoalStarted: jest.fn(),
}));

jest.mock("@/lib/integrations/crew", () => ({
  createCrewTask: jest.fn(async () => null),
  completeCrewTask: jest.fn(async () => undefined),
  linkCrewTask: jest.fn(async () => "ok"),
}));

const mockDb = db as unknown as {
  query: {
    goals: { findFirst: jest.Mock; findMany: jest.Mock };
    milestones: { findFirst: jest.Mock };
    todos: { findFirst: jest.Mock; findMany: jest.Mock };
  };
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

const userId = crypto.randomUUID();
const goalId = crypto.randomUUID();
const milestoneId = crypto.randomUUID();

function mockInsertReturning(row: unknown) {
  mockDb.insert.mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([row]),
    }),
  });
}

function mockUpdateReturning(row: unknown) {
  mockDb.update.mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue(row ? [row] : []),
      }),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // Goal lookup is scoped by userId in the where clause; resolving it means
  // "the goal exists and belongs to this user" in these tests.
  mockDb.query.goals.findFirst.mockResolvedValue({ id: goalId, userId });
});

describe("createTodo", () => {
  const input = {
    goalId,
    milestoneId,
    title: "Draft chapter one",
    description: null,
    dueDate: null,
  };

  it("rejects a milestoneId that does not belong to the goal", async () => {
    mockDb.query.milestones.findFirst.mockResolvedValue(undefined);

    const result = await createTodo(input, userId);

    expect(result).toBeNull();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates the todo when the milestone belongs to the goal", async () => {
    mockDb.query.milestones.findFirst.mockResolvedValue({
      id: milestoneId,
      goalId,
    });
    const todoRow = { id: crypto.randomUUID(), ...input, completed: false };
    mockInsertReturning(todoRow);

    const result = await createTodo(input, userId);

    expect(result).toEqual(todoRow);
  });

  it("skips the milestone check when no milestoneId is given", async () => {
    const todoRow = {
      id: crypto.randomUUID(),
      ...input,
      milestoneId: null,
      completed: false,
    };
    mockInsertReturning(todoRow);

    const result = await createTodo({ ...input, milestoneId: null }, userId);

    expect(result).toEqual(todoRow);
    expect(mockDb.query.milestones.findFirst).not.toHaveBeenCalled();
  });
});

describe("updateTodo", () => {
  const todoId = crypto.randomUUID();
  const existingTodo = {
    id: todoId,
    goalId,
    milestoneId: null,
    title: "Draft chapter one",
    completed: false,
    crewTaskId: null,
  };

  it("rejects moving the todo to a milestone outside its goal", async () => {
    mockDb.query.todos.findFirst.mockResolvedValue(existingTodo);
    mockDb.query.milestones.findFirst.mockResolvedValue(undefined);

    const result = await updateTodo(todoId, userId, { milestoneId });

    expect(result).toBeNull();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("moves the todo when the milestone belongs to its goal", async () => {
    mockDb.query.todos.findFirst.mockResolvedValue(existingTodo);
    mockDb.query.milestones.findFirst.mockResolvedValue({
      id: milestoneId,
      goalId,
    });
    const updatedRow = { ...existingTodo, milestoneId };
    mockUpdateReturning(updatedRow);

    const result = await updateTodo(todoId, userId, { milestoneId });

    expect(result).toEqual(updatedRow);
  });
});

describe("linkExistingCrewTask", () => {
  const input = {
    goalId,
    milestoneId,
    crewTaskId: "crew-task-1",
    title: "Imported from Crew",
    dueDate: null,
  };

  it("rejects a milestoneId that does not belong to the goal", async () => {
    mockDb.query.milestones.findFirst.mockResolvedValue(undefined);

    const result = await linkExistingCrewTask(input, userId);

    expect(result).toEqual({ ok: false, reason: "milestone_not_found" });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(linkCrewTask).not.toHaveBeenCalled();
  });

  it("links the task when the milestone belongs to the goal", async () => {
    mockDb.query.milestones.findFirst.mockResolvedValue({
      id: milestoneId,
      goalId,
    });
    const todoRow = {
      id: crypto.randomUUID(),
      ...input,
      origin: "crew",
      completed: false,
    };
    mockInsertReturning(todoRow);

    const result = await linkExistingCrewTask(input, userId);

    expect(result).toEqual({ ok: true, todo: todoRow });
  });
});
