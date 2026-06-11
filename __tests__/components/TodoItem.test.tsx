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

describe("TodoItem edit flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/milestones")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ id: "milestone-1", title: "Q2: First draft" }],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }) as jest.Mock;
  });

  async function openEditForm() {
    fireEvent.click(screen.getByRole("button", { name: "Todo actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Todo title")).toBeInTheDocument()
    );
  }

  it("saves edited title, description, due date, and milestone", async () => {
    render(<TodoItem todo={makeTodo({ dueDate: new Date("2026-06-15") })} />);
    await openEditForm();

    // Milestones for the parent goal were fetched to populate the select.
    await waitFor(() =>
      expect(screen.getByLabelText("Todo milestone")).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText("Todo title"), {
      target: { value: "Write better tests" },
    });
    fireEvent.change(screen.getByLabelText("Todo description"), {
      target: { value: "Cover the edit flow" },
    });
    fireEvent.change(screen.getByLabelText("Todo due date"), {
      target: { value: "2026-06-20" },
    });
    fireEvent.change(screen.getByLabelText("Todo milestone"), {
      target: { value: "milestone-1" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/todos/todo-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            title: "Write better tests",
            description: "Cover the edit flow",
            dueDate: "2026-06-20",
            milestoneId: "milestone-1",
          }),
        })
      )
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("requires a title before saving", async () => {
    render(<TodoItem todo={makeTodo()} />);
    await openEditForm();

    fireEvent.change(screen.getByLabelText("Todo title"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Title is required"
    );
    // Only the milestones fetch fired — no PATCH.
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("cancel restores the read view without saving", async () => {
    render(<TodoItem todo={makeTodo()} />);
    await openEditForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Write tests")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1); // milestones fetch only
  });
});
