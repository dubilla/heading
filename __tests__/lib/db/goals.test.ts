import { createGoal, updateGoal } from "@/lib/db/goals";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    query: {
      goals: { findFirst: jest.fn(), findMany: jest.fn() },
      objectives: { findFirst: jest.fn() },
    },
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  query: {
    goals: { findFirst: jest.Mock; findMany: jest.Mock };
    objectives: { findFirst: jest.Mock };
  };
  insert: jest.Mock;
  update: jest.Mock;
};

const userId = crypto.randomUUID();
const objectiveId = crypto.randomUUID();

const baseGoalInput = {
  userId,
  title: "Read 12 novels",
  description: null,
  targetDate: new Date("2026-12-31"),
  category: null,
  startValue: 0,
  targetValue: 12,
  unit: "novels",
  status: "not_started" as const,
};

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
});

describe("createGoal", () => {
  it("rejects an objectiveId that does not belong to the user", async () => {
    mockDb.query.objectives.findFirst.mockResolvedValue(undefined);

    const result = await createGoal({ ...baseGoalInput, objectiveId });

    expect(result).toBeNull();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates the goal when the objective belongs to the user", async () => {
    mockDb.query.objectives.findFirst.mockResolvedValue({
      id: objectiveId,
      userId,
    });
    const goalRow = { id: crypto.randomUUID(), ...baseGoalInput, objectiveId };
    mockInsertReturning(goalRow);

    const result = await createGoal({ ...baseGoalInput, objectiveId });

    expect(result).toEqual(goalRow);
  });

  it("skips the objective check when no objectiveId is given", async () => {
    const goalRow = { id: crypto.randomUUID(), ...baseGoalInput };
    mockInsertReturning(goalRow);

    const result = await createGoal({ ...baseGoalInput, objectiveId: null });

    expect(result).toEqual(goalRow);
    expect(mockDb.query.objectives.findFirst).not.toHaveBeenCalled();
  });
});

describe("updateGoal", () => {
  const goalId = crypto.randomUUID();

  it("rejects an objectiveId that does not belong to the user", async () => {
    mockDb.query.objectives.findFirst.mockResolvedValue(undefined);

    const result = await updateGoal(goalId, userId, { objectiveId });

    expect(result).toBeNull();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("updates the goal when the objective belongs to the user", async () => {
    mockDb.query.objectives.findFirst.mockResolvedValue({
      id: objectiveId,
      userId,
    });
    const goalRow = { id: goalId, ...baseGoalInput, objectiveId };
    mockUpdateReturning(goalRow);

    const result = await updateGoal(goalId, userId, { objectiveId });

    expect(result).toEqual(goalRow);
  });

  it("skips the objective check when objectiveId is not part of the update", async () => {
    const goalRow = { id: goalId, ...baseGoalInput, title: "New title" };
    mockUpdateReturning(goalRow);

    const result = await updateGoal(goalId, userId, { title: "New title" });

    expect(result).toEqual(goalRow);
    expect(mockDb.query.objectives.findFirst).not.toHaveBeenCalled();
  });
});
