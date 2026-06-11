import { filterGoalsNeedingUpdate } from "@/lib/db/goals";
import type { GoalWithLatestUpdate } from "@/lib/db/goals";

jest.mock("@/lib/db", () => ({
  db: { query: {} },
}));

const weekStart = new Date("2026-06-07T00:00:00");
const beforeWeek = new Date("2026-06-01T12:00:00");
const duringWeek = new Date("2026-06-09T12:00:00");

function makeGoal(
  overrides: Partial<GoalWithLatestUpdate> = {}
): GoalWithLatestUpdate {
  return {
    id: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    objectiveId: null,
    title: "Read 12 novels",
    description: null,
    targetDate: new Date("2026-12-31"),
    category: null,
    status: "in_progress",
    startValue: 0,
    targetValue: 12,
    unit: "novels",
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-05"),
    latestProgressUpdate: null,
    ...overrides,
  };
}

function makeUpdate(occurredAt: Date) {
  return {
    id: crypto.randomUUID(),
    goalId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    value: 3,
    note: null,
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

describe("filterGoalsNeedingUpdate", () => {
  it("includes goals never updated", () => {
    const goal = makeGoal({ latestProgressUpdate: null });
    expect(filterGoalsNeedingUpdate([goal], weekStart)).toEqual([goal]);
  });

  it("includes goals last updated before the week started", () => {
    const goal = makeGoal({ latestProgressUpdate: makeUpdate(beforeWeek) });
    expect(filterGoalsNeedingUpdate([goal], weekStart)).toEqual([goal]);
  });

  it("excludes goals updated during the current week", () => {
    const goal = makeGoal({ latestProgressUpdate: makeUpdate(duringWeek) });
    expect(filterGoalsNeedingUpdate([goal], weekStart)).toEqual([]);
  });

  it("excludes completed goals even when stale", () => {
    const goal = makeGoal({ status: "completed", latestProgressUpdate: null });
    expect(filterGoalsNeedingUpdate([goal], weekStart)).toEqual([]);
  });

  it("excludes goals created during the current week", () => {
    const goal = makeGoal({ createdAt: duringWeek });
    expect(filterGoalsNeedingUpdate([goal], weekStart)).toEqual([]);
  });

  it("keeps stale goals while dropping fresh ones in a mixed list", () => {
    const stale = makeGoal({ latestProgressUpdate: makeUpdate(beforeWeek) });
    const fresh = makeGoal({ latestProgressUpdate: makeUpdate(duringWeek) });
    expect(filterGoalsNeedingUpdate([stale, fresh], weekStart)).toEqual([
      stale,
    ]);
  });
});
