import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoalActions } from "@/components/GoalActions";

const mockRefresh = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));

jest.mock("next/link", () => {
  function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  MockLink.displayName = "MockLink";
  return MockLink;
});

function openMenu() {
  // The ⋮ trigger is the only button before the menu is opened.
  fireEvent.click(screen.getByRole("button"));
}

describe("GoalActions quick-set status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
  });

  it("PATCHes the goal with the chosen status and refreshes", async () => {
    render(<GoalActions goalId="goal-1" currentStatus="in_progress" />);
    openMenu();

    fireEvent.click(screen.getByRole("button", { name: "On Track" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/goals/goal-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "on_track" }),
      })
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("disables the current status and does not re-PATCH it", () => {
    render(<GoalActions goalId="goal-1" currentStatus="on_track" />);
    openMenu();

    const current = screen.getByRole("button", { name: "On Track" });
    expect(current).toBeDisabled();

    fireEvent.click(current);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("still exposes Edit and Delete actions", () => {
    render(<GoalActions goalId="goal-1" currentStatus="not_started" />);
    openMenu();

    expect(screen.getByText("Edit Goal")).toHaveAttribute(
      "href",
      "/goals/goal-1/edit"
    );
    expect(
      screen.getByRole("button", { name: "Delete Goal" })
    ).toBeInTheDocument();
  });
});
