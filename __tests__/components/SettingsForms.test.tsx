import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  ProfileForm,
  CheckInDayForm,
  PasswordForm,
} from "@/components/SettingsForms";

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: {} }),
  }) as jest.Mock;
});

describe("ProfileForm", () => {
  it("PATCHes the trimmed name and confirms", async () => {
    render(<ProfileForm initialName="Dan" email="dan@example.com" />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "  Dan Ubilla  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Profile" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "Dan Ubilla" }),
        })
      )
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Profile updated"
    );
  });

  it("rejects an empty name without calling the API", async () => {
    render(<ProfileForm initialName="Dan" email="dan@example.com" />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Profile" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("CheckInDayForm", () => {
  it("PATCHes the selected day", async () => {
    render(<CheckInDayForm initialDay={0} />);

    fireEvent.change(screen.getByLabelText("Weekly check-in day"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Preference" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ checkInDay: 5 }),
        })
      )
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Friday");
  });
});

describe("PasswordForm", () => {
  it("POSTs current and new password", async () => {
    render(<PasswordForm hasPassword />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "old-password" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "brand-new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/settings/password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            currentPassword: "old-password",
            newPassword: "brand-new-password",
          }),
        })
      )
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password updated"
    );
  });

  it("surfaces a wrong-password error from the API", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Current password is incorrect" }),
    });
    render(<PasswordForm hasPassword />);

    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "brand-new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Change Password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Current password is incorrect"
    );
  });

  it("explains there is no password for OAuth accounts", () => {
    render(<PasswordForm hasPassword={false} />);
    expect(screen.getByText(/signs in with Google/)).toBeInTheDocument();
  });
});
