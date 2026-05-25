import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoalForm } from "@/components/GoalForm";
import type { Goal } from "@/lib/db/schema";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh, back: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    userId: "user-1",
    objectiveId: null,
    title: "Run a marathon",
    description: "Complete a full marathon",
    targetDate: new Date("2026-12-31"),
    category: "Fitness",
    status: "in_progress",
    startValue: 0,
    targetValue: 100,
    unit: "%",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("GoalForm status field", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: "goal-1" } }),
      }) as jest.Mock;
  });

  it("shows the Status select with the goal's status when editing", () => {
    // Passing objectives avoids the mount-time /api/objectives fetch.
    render(
      <GoalForm goal={makeGoal({ status: "off_track" })} objectives={[]} />
    );

    const select = screen.getByLabelText("Status") as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("off_track");
  });

  it("does not show the Status select when creating", () => {
    render(<GoalForm objectives={[]} />);
    expect(screen.queryByLabelText("Status")).not.toBeInTheDocument();
  });

  it("includes the chosen status in the PATCH when editing", async () => {
    render(<GoalForm goal={makeGoal()} objectives={[]} />);

    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "completed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Goal" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/goals/goal-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toMatchObject({ status: "completed" });
  });
});
