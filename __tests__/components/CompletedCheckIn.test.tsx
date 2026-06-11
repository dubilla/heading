import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompletedCheckIn } from "@/components/CompletedCheckIn";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), back: jest.fn() }),
}));

const checkIn = {
  id: "check-in-1",
  accomplishments: "Shipped the weekly loop",
  challenges: "Too many tabs",
  nextWeekPriorities: "Email reminders",
  needsAdjustment: true,
};

describe("CompletedCheckIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) }) as jest.Mock;
  });

  it("shows the completed banner with an Edit button", () => {
    render(<CompletedCheckIn checkIn={checkIn} />);
    expect(
      screen.getByText("Check-in completed for this week!")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("opens the prefilled form and PATCHes the amendment", async () => {
    render(<CompletedCheckIn checkIn={checkIn} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const accomplishments = screen.getByLabelText(
      /What did you accomplish this week/
    );
    expect(accomplishments).toHaveValue("Shipped the weekly loop");
    expect(
      screen.getByLabelText(/I feel my goals need adjustment/)
    ).toBeChecked();

    fireEvent.change(accomplishments, {
      target: { value: "Shipped the weekly loop and amend support" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/check-ins/check-in-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            accomplishments: "Shipped the weekly loop and amend support",
            challenges: "Too many tabs",
            nextWeekPriorities: "Email reminders",
            needsAdjustment: true,
          }),
        })
      )
    );

    // Back to the banner after a successful save.
    await waitFor(() =>
      expect(
        screen.getByText("Check-in completed for this week!")
      ).toBeInTheDocument()
    );
    expect(mockRefresh).toHaveBeenCalled();
  });
});
