import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TodoItem } from "@/components/TodoItem";
import type { Todo } from "@/lib/db/schema";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function makeTodo(overrides: Partial<Todo> = {}): Todo {
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
    ...overrides,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

describe("TodoItem reschedule menu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
  });

  it("opens reschedule submenu and PATCHes today's date when 'Today' is clicked", async () => {
    render(<TodoItem todo={makeTodo()} />);

    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));

    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = toLocalDateString(today);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/todos/todo-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ dueDate: expected }),
      })
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("PATCHes tomorrow's date when 'Tomorrow' is clicked", async () => {
    render(<TodoItem todo={makeTodo()} />);

    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Tomorrow" }));

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = toLocalDateString(tomorrow);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/todos/todo-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ dueDate: expected }),
        })
      )
    );
  });

  it("PATCHes a date 7 days out when 'Next week' is clicked", async () => {
    render(<TodoItem todo={makeTodo()} />);

    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Next week" }));

    const nextWeek = new Date();
    nextWeek.setHours(0, 0, 0, 0);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const expected = toLocalDateString(nextWeek);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/todos/todo-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ dueDate: expected }),
        })
      )
    );
  });

  it("PATCHes a null dueDate when 'Clear due date' is clicked", async () => {
    render(<TodoItem todo={makeTodo({ dueDate: new Date("2026-06-15") })} />);

    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear due date" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/todos/todo-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ dueDate: null }),
        })
      )
    );
  });

  it("disables 'Clear due date' when the todo has no due date", () => {
    render(<TodoItem todo={makeTodo()} />);

    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));

    expect(
      screen.getByRole("button", { name: "Clear due date" })
    ).toBeDisabled();
  });

  it("PATCHes the chosen custom date from the date picker", async () => {
    render(<TodoItem todo={makeTodo()} />);

    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));

    const dateInput = screen.getByLabelText("Pick a date") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-07-04" } });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/todos/todo-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ dueDate: "2026-07-04" }),
        })
      )
    );
  });

  it("still exposes the Delete action", () => {
    render(<TodoItem todo={makeTodo()} />);
    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
