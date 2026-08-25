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
      <TokensManager
        initialTokens={[makeToken({ name: "my-laptop" })]}
        origin="https://heading.test"
      />
    );

    expect(screen.getByText("my-laptop")).toBeInTheDocument();
    expect(screen.getByText("…abcd")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revoke my-laptop" })
    ).toBeInTheDocument();
  });

  it("shows the empty state with no tokens", () => {
    render(<TokensManager initialTokens={[]} origin="https://heading.test" />);
    expect(screen.getByText("No tokens yet.")).toBeInTheDocument();
  });

  it("rejects generating without a name and never calls the API", async () => {
    render(<TokensManager initialTokens={[]} origin="https://heading.test" />);

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

    render(<TokensManager initialTokens={[]} origin="https://heading.test" />);

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

    render(
      <TokensManager
        initialTokens={[makeToken({ name: "kill-me" })]}
        origin="https://heading.test"
      />
    );

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

describe("MCP connect snippets", () => {
  it("shows the connect section with the request origin once a token exists", () => {
    render(
      <TokensManager
        initialTokens={[makeToken()]}
        origin="https://heading.test"
      />
    );

    expect(screen.getByText("Connect an MCP client")).toBeInTheDocument();
    expect(
      screen.getByText(/claude mcp add --transport http heading/)
    ).toHaveTextContent("https://heading.test/mcp");
  });

  it("hides the connect section when there are no tokens", () => {
    render(<TokensManager initialTokens={[]} origin="https://heading.test" />);

    expect(screen.queryByText("Connect an MCP client")).not.toBeInTheDocument();
  });

  it("uses a placeholder rather than a real token in the steady state", () => {
    render(
      <TokensManager
        initialTokens={[makeToken()]}
        origin="https://heading.test"
      />
    );

    expect(
      screen.getByText(/claude mcp add --transport http heading/)
    ).toHaveTextContent("Bearer hd_your_token_here");
  });

  it("embeds the plaintext token in the snippets right after creation", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          token: "hd_the_secret_value",
          record: makeToken({ id: "tok-3", name: "desktop" }),
        },
      }),
    });

    render(<TokensManager initialTokens={[]} origin="https://heading.test" />);

    fireEvent.change(screen.getByLabelText("Token name"), {
      target: { value: "desktop" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate token" }));

    const cli = await screen.findByText(
      /claude mcp add --transport http heading/
    );
    expect(cli).toHaveTextContent("Bearer hd_the_secret_value");
    expect(cli).not.toHaveTextContent("hd_your_token_here");

    // The Claude Desktop config carries the same token.
    expect(screen.getByText(/"mcpServers"/)).toHaveTextContent(
      "Bearer hd_the_secret_value"
    );
  });

  it("copies a snippet to the clipboard", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    const original = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <TokensManager
        initialTokens={[makeToken()]}
        origin="https://heading.test"
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy Claude Code snippet to clipboard",
      })
    );

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("https://heading.test/mcp")
      )
    );

    Object.defineProperty(navigator, "clipboard", {
      value: original,
      configurable: true,
    });
  });

  it("shows only one set of snippets while the new token is revealed", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          token: "hd_the_secret_value",
          record: makeToken({ id: "tok-4", name: "second" }),
        },
      }),
    });

    render(
      <TokensManager
        initialTokens={[makeToken()]}
        origin="https://heading.test"
      />
    );

    expect(screen.getAllByText("Connect an MCP client")).toHaveLength(1);

    fireEvent.change(screen.getByLabelText("Token name"), {
      target: { value: "second" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate token" }));

    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    // The steady-state section is suppressed rather than duplicated.
    expect(screen.getAllByText("Connect an MCP client")).toHaveLength(1);
  });
});
