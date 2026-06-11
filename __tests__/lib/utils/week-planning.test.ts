import { groupTodosForWeekPlanning } from "@/lib/utils/week-planning";

// Wednesday, June 10 2026 — week runs Sun Jun 7 through Sat Jun 13.
const now = new Date("2026-06-10T15:00:00");

function makeTodo(dueDate: Date | null, completed = false) {
  return { id: crypto.randomUUID(), dueDate, completed };
}

describe("groupTodosForWeekPlanning", () => {
  it("buckets todos into overdue, this week, and undated", () => {
    const overdue = makeTodo(new Date("2026-06-08T00:00:00"));
    const thisWeek = makeTodo(new Date("2026-06-12T00:00:00"));
    const undated = makeTodo(null);

    const groups = groupTodosForWeekPlanning([overdue, thisWeek, undated], now);

    expect(groups.overdue).toEqual([overdue]);
    expect(groups.thisWeek).toEqual([thisWeek]);
    expect(groups.undated).toEqual([undated]);
  });

  it("treats today as this week, not overdue", () => {
    const today = makeTodo(new Date("2026-06-10T00:00:00"));
    const groups = groupTodosForWeekPlanning([today], now);
    expect(groups.overdue).toEqual([]);
    expect(groups.thisWeek).toEqual([today]);
  });

  it("excludes completed todos from every bucket", () => {
    const groups = groupTodosForWeekPlanning(
      [
        makeTodo(new Date("2026-06-01T00:00:00"), true),
        makeTodo(null, true),
        makeTodo(new Date("2026-06-12T00:00:00"), true),
      ],
      now
    );
    expect(groups).toEqual({ overdue: [], thisWeek: [], undated: [] });
  });

  it("excludes todos due beyond the current week", () => {
    const nextWeek = makeTodo(new Date("2026-06-15T00:00:00"));
    const groups = groupTodosForWeekPlanning([nextWeek], now);
    expect(groups).toEqual({ overdue: [], thisWeek: [], undated: [] });
  });

  it("includes the last day of the week", () => {
    const saturday = makeTodo(new Date("2026-06-13T00:00:00"));
    const groups = groupTodosForWeekPlanning([saturday], now);
    expect(groups.thisWeek).toEqual([saturday]);
  });
});
