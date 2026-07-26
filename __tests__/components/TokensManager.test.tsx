import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TokensManager } from "@/components/TokensManager";
import type { TokenSummary } from "@/lib/db/tokens";

function makeToken(overrides: Partial<TokenSummary> = {}): TokenSummary {
  return {
    id: "tok-1",
    userId: "user-1",
    name: "existing",
    last4: "abcd",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    lastUsedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

describe("TokensManager", () => {
  it("renders existing tokens with their last4 and a revoke control", () => {
    render(
      <TokensManager initialTokens={[makeToken({ name: "my-laptop" })]} />
    );

    expect(screen.getByText("my-laptop")).toBeInTheDocument();
    expect(screen.getByText("…abcd")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revoke my-laptop" })
    ).toBeInTheDocument();
  });

  it("shows the empty state with no tokens", () => {
    render(<TokensManager initialTokens={[]} />);
    expect(screen.getByText("No tokens yet.")).toBeInTheDocument();
  });

  it("rejects generating without a name and never calls the API", async () => {
    render(<TokensManager initialTokens={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate token" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name is required"
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("generates a token, reveals the plaintext once, and adds it to the list", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          token: "hd_the_secret_value",
          record: makeToken({ id: "tok-2", name: "ci", last4: "wxyz" }),
        },
      }),
    });

    render(<TokensManager initialTokens={[]} />);

    fireEvent.change(screen.getByLabelText("Token name"), {
      target: { value: "ci" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate token" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/settings/tokens",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "ci", expiresInDays: 30 }),
        })
      )
    );

    // Plaintext shown once, with the one-time warning.
    expect(await screen.findByText("hd_the_secret_value")).toBeInTheDocument();
    expect(
      screen.getByText(/you won't be able to see it again/i)
    ).toBeInTheDocument();
    // And the new token joins the list.
    expect(screen.getByText("ci")).toBeInTheDocument();
  });

  it("revokes a token and removes it from the list", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { success: true } }),
    });

    render(<TokensManager initialTokens={[makeToken({ name: "kill-me" })]} />);

    fireEvent.click(screen.getByRole("button", { name: "Revoke kill-me" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/settings/tokens/tok-1",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    await waitFor(() =>
      expect(screen.queryByText("kill-me")).not.toBeInTheDocument()
    );
  });
});
