import { render, screen } from "@testing-library/react";
import { GoalCard } from "@/components/GoalCard";
import type { Goal } from "@/lib/db/schema";

// Mock next/link to render a plain anchor
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

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    userId: "user-1",
    objectiveId: null,
    title: "Run a marathon",
    description: "Complete a full marathon by year end",
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

describe("GoalCard milestone indicator", () => {
  it("shows 'No milestones yet' when milestoneCount is 0", () => {
    render(<GoalCard goal={makeGoal()} milestoneCount={0} />);
    expect(screen.getByText("No milestones yet")).toBeInTheDocument();
  });

  it("does not show indicator when milestoneCount is greater than 0", () => {
    render(<GoalCard goal={makeGoal()} milestoneCount={3} />);
    expect(screen.queryByText("No milestones yet")).not.toBeInTheDocument();
  });

  it("does not show indicator when milestoneCount is not provided", () => {
    render(<GoalCard goal={makeGoal()} />);
    expect(screen.queryByText("No milestones yet")).not.toBeInTheDocument();
  });
});
