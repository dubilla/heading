import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  StaleGoalUpdates,
  lastUpdatedLabel,
  type StaleGoalSummary,
} from "@/components/StaleGoalUpdates";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function makeGoal(overrides: Partial<StaleGoalSummary> = {}): StaleGoalSummary {
  return {
    id: "goal-1",
    title: "Read 12 novels",
    unit: "novels",
    startValue: 0,
    targetValue: 12,
    latestValue: 3,
    lastUpdatedAt: "2026-05-20T12:00:00.000Z",
    ...overrides,
  };
}

describe("lastUpdatedLabel", () => {
  const now = new Date("2026-06-10T12:00:00");

  it("handles never-updated goals", () => {
    expect(lastUpdatedLabel(null, now)).toBe("Never updated");
  });

  it("formats days and weeks", () => {
    expect(lastUpdatedLabel("2026-06-10T08:00:00", now)).toBe("Updated today");
    expect(lastUpdatedLabel("2026-06-09T08:00:00", now)).toBe(
      "Updated yesterday"
    );
    expect(lastUpdatedLabel("2026-06-05T08:00:00", now)).toBe(
      "Updated 5 days ago"
    );
    expect(lastUpdatedLabel("2026-05-20T08:00:00", now)).toBe(
      "Updated 3 weeks ago"
    );
  });
});

describe("StaleGoalUpdates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
  });

  it("posts a progress update and removes the goal row on save", async () => {
    render(
      <StaleGoalUpdates
        goals={[makeGoal(), makeGoal({ id: "goal-2", title: "Run 500 miles" })]}
      />
    );

    const input = screen.getByLabelText("New value for Read 12 novels");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("Note for Read 12 novels"), {
      target: { value: "Finished two more" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Save" })[0]);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/goals/goal-1/progress-updates",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ value: 5, note: "Finished two more" }),
      })
    );

    await waitFor(() =>
      expect(
        screen.queryByLabelText("New value for Read 12 novels")
      ).not.toBeInTheDocument()
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows the all-caught-up message after the last goal is updated", async () => {
    render(<StaleGoalUpdates goals={[makeGoal()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByText(/All goals are up to date/i)).toBeInTheDocument()
    );
  });

  it("rejects a non-numeric value without calling the API", async () => {
    render(<StaleGoalUpdates goals={[makeGoal()]} />);

    fireEvent.change(screen.getByLabelText("New value for Read 12 novels"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a number"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("surfaces API errors and keeps the row", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Goal not found" }),
    });
    render(<StaleGoalUpdates goals={[makeGoal()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Goal not found"
    );
    expect(
      screen.getByLabelText("New value for Read 12 novels")
    ).toBeInTheDocument();
  });
});
