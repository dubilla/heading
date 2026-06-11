import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WeekPlanner } from "@/components/WeekPlanner";
import { getWeekEndDate } from "@/lib/utils/week-helpers";
import type { Todo } from "@/lib/db/schema";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function makeTodo(overrides: Partial<Todo> = {}): Todo & {
  goal: { id: string; title: string };
} {
  return {
    id: "todo-1",
    goalId: "goal-1",
    milestoneId: null,
    title: "Write tests",
    description: null,
    dueDate: null,
    completed: false,
    completedAt: null,
    crewTaskId: null,
    origin: "heading",
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
    goal: { id: "goal-1", title: "Ship the feature" },
    ...overrides,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const goals = [{ id: "goal-1", title: "Ship the feature" }];

describe("WeekPlanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
  });

  it("schedules an undated todo for the end of this week", async () => {
    render(
      <WeekPlanner
        overdue={[]}
        thisWeek={[]}
        undated={[makeTodo()]}
        goals={goals}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "This week" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/todos/todo-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          dueDate: toLocalDateString(getWeekEndDate()),
        }),
      })
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("shows overdue todos with a reschedule button", () => {
    render(
      <WeekPlanner
        overdue={[makeTodo({ dueDate: new Date("2026-06-01") })]}
        thisWeek={[]}
        undated={[]}
        goals={goals}
      />
    );

    expect(
      screen.getByText(/Overdue — reschedule or finish/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "This week" })
    ).toBeInTheDocument();
  });

  it("quick-adds a todo against a goal", async () => {
    render(
      <WeekPlanner overdue={[]} thisWeek={[]} undated={[]} goals={goals} />
    );

    fireEvent.change(screen.getByLabelText("New todo title"), {
      target: { value: "Outline chapter two" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/todos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          goalId: "goal-1",
          title: "Outline chapter two",
          dueDate: toLocalDateString(getWeekEndDate()),
        }),
      })
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("does not submit a quick-add without a title", () => {
    render(
      <WeekPlanner overdue={[]} thisWeek={[]} undated={[]} goals={goals} />
    );

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("shows the empty state when there is nothing to plan", () => {
    render(
      <WeekPlanner overdue={[]} thisWeek={[]} undated={[]} goals={goals} />
    );

    expect(screen.getByText(/Nothing scheduled yet/)).toBeInTheDocument();
  });
});
