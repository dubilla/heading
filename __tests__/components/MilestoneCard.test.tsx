import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MilestoneCard } from "@/components/MilestoneCard";
import type { Milestone } from "@/lib/db/schema";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: "milestone-1",
    goalId: "goal-1",
    title: "Q2: First draft done",
    description: null,
    dueDate: new Date("2026-06-30T00:00:00"),
    type: "quarterly",
    quarter: 2,
    month: null,
    status: "in_progress",
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-05"),
    ...overrides,
  };
}

describe("MilestoneCard edit flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
  });

  function openEditForm() {
    fireEvent.click(screen.getAllByRole("button")[0]); // kebab menu
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  }

  it("saves edited fields for a quarterly milestone", async () => {
    render(<MilestoneCard milestone={makeMilestone()} />);
    openEditForm();

    fireEvent.change(screen.getByLabelText("Milestone title"), {
      target: { value: "Q2: Full draft shipped" },
    });
    fireEvent.change(screen.getByLabelText("Milestone due date"), {
      target: { value: "2026-06-25" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/milestones/milestone-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            title: "Q2: Full draft shipped",
            description: null,
            dueDate: "2026-06-25",
            type: "quarterly",
            quarter: 2,
            month: null,
          }),
        })
      )
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("switching type to monthly sends a month within the quarter", async () => {
    render(<MilestoneCard milestone={makeMilestone()} />);
    openEditForm();

    fireEvent.change(screen.getByLabelText("Milestone type"), {
      target: { value: "monthly" },
    });
    fireEvent.change(screen.getByLabelText("Milestone month"), {
      target: { value: "5" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/milestones/milestone-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            title: "Q2: First draft done",
            description: null,
            dueDate: "2026-06-30",
            type: "monthly",
            quarter: 2,
            month: 5,
          }),
        })
      )
    );
  });

  it("requires a title before saving", async () => {
    render(<MilestoneCard milestone={makeMilestone()} />);
    openEditForm();

    fireEvent.change(screen.getByLabelText("Milestone title"), {
      target: { value: "  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Title is required"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("cancel restores the read view without saving", async () => {
    render(<MilestoneCard milestone={makeMilestone()} />);
    openEditForm();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Q2: First draft done")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
