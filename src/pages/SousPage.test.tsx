import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SousPage } from "./SousPage";
import type { SousStreamEvent } from "../api/client";
import { useSousStore } from "../store/sousStore";

const chatStream = vi.fn();
const bulkAdd = vi.fn();
const openAuthModal = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("../api/client", () => ({
  sousApi: {
    chatStream: (...args: unknown[]) => chatStream(...args),
  },
  shoppingListsApi: {
    bulkAdd: (...args: unknown[]) => bulkAdd(...args),
  },
}));

vi.mock("../store/authModalStore", () => ({
  useAuthModalStore: (selector: (s: { openAuthModal: typeof openAuthModal }) => unknown) =>
    selector({ openAuthModal }),
}));

vi.mock("../store/toastStore", () => ({
  toastError: (...args: unknown[]) => toastError(...args),
  toastSuccess: (...args: unknown[]) => toastSuccess(...args),
}));

vi.mock("../components/tools/SafeMarkdown", () => ({
  SafeMarkdown: ({ children }: { children: string }) => <div>{children}</div>,
}));

let signedIn = true;
let loading = false;

vi.mock("../store/authStore", () => ({
  useAuthStore: (selector: (s: { isSignedIn: boolean; isLoading: boolean }) => unknown) =>
    selector({ isSignedIn: signedIn, isLoading: loading }),
}));

function renderSous() {
  return render(
    <MemoryRouter>
      <SousPage />
    </MemoryRouter>
  );
}

async function mockStream(events: SousStreamEvent[], reply: string, extra?: object) {
  chatStream.mockImplementation(async (_messages: unknown, onEvent?: (event: SousStreamEvent) => void) => {
    for (const event of events) onEvent?.(event);
    return { reply, ...extra };
  });
}

afterEach(() => {
  cleanup();
  chatStream.mockReset();
  bulkAdd.mockReset();
  openAuthModal.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  signedIn = true;
  loading = false;
  useSousStore.getState().resetChat();
  useSousStore.getState().closeWidget();
});

describe("SousPage", () => {
  it("asks guests to sign in", () => {
    signedIn = false;
    renderSous();
    expect(screen.getByRole("heading", { name: "Sous AI" })).toBeTruthy();
    expect(screen.getByText(/sign in to chat with sous ai/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(openAuthModal).toHaveBeenCalledWith("login");
    expect(screen.queryByLabelText(/message/i)).toBeNull();
  });

  it("sends a message and shows the reply", async () => {
    await mockStream([{ type: "reply", reply: "Use oat milk." }], "Use oat milk.");
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "What can I use instead of milk?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Use oat milk.")).toBeTruthy();
    });
    expect(chatStream).toHaveBeenCalledWith(
      [{ role: "user", content: "What can I use instead of milk?" }],
      expect.any(Function)
    );
  });

  it("sends a suggested prompt", async () => {
    await mockStream(
      [{ type: "reply", reply: "Lemon Chicken is in your recipes." }],
      "Lemon Chicken is in your recipes."
    );
    renderSous();

    fireEvent.click(screen.getByRole("button", { name: /what chicken recipes do i have/i }));

    await waitFor(() => {
      expect(screen.getByText("Lemon Chicken is in your recipes.")).toBeTruthy();
    });
  });

  it("disables send while a reply is pending", () => {
    chatStream.mockImplementation(() => new Promise(() => {}));
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toHaveProperty("disabled", true);
    expect(screen.getByText(/looking that up/i)).toBeTruthy();
    expect(chatStream).toHaveBeenCalledTimes(1);
  });

  it("shows live lookup steps before the reply arrives", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    chatStream.mockImplementation(async (_messages: unknown, onEvent?: (event: SousStreamEvent) => void) => {
      onEvent?.({
        type: "tool.start",
        id: "call_1",
        name: "search_recipes",
        input: { query: "chicken" },
      });
      await gate;
      onEvent?.({
        type: "tool.result",
        id: "call_1",
        name: "search_recipes",
        input: { query: "chicken" },
        output: { count: 1, recipes: [{ title: "Lemon Chicken" }] },
      });
      return { reply: "Lemon Chicken is in your recipes." };
    });
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Any chicken?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Searching recipes")).toBeTruthy();
      expect(screen.getByText("Working...")).toBeTruthy();
    });

    release();

    await waitFor(() => {
      expect(screen.getByText("Found 1 recipe")).toBeTruthy();
      expect(screen.getByText("Lemon Chicken is in your recipes.")).toBeTruthy();
    });
  });

  it("asks before adding shopping list items and only writes on confirm", async () => {
    await mockStream(
      [{ type: "reply", reply: "Coconut cream works. Want it on the list?" }],
      "Coconut cream works. Want it on the list?",
      {
        pendingAction: {
          type: "add_to_shopping_list",
          listId: "770e8400-e29b-41d4-a716-446655440000",
          listName: "Groceries",
          items: [{ name: "coconut cream", quantity: "1 can" }],
        },
      }
    );
    bulkAdd.mockResolvedValue({ items: [] });
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "I'm out of heavy cream" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/add to groceries/i)).toBeTruthy();
    });
    expect(bulkAdd).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /add to list/i }));

    await waitFor(() => {
      expect(bulkAdd).toHaveBeenCalledWith("770e8400-e29b-41d4-a716-446655440000", [
        { name: "coconut cream", quantity: "1 can" },
      ]);
      expect(screen.getByText(/added to groceries/i)).toBeTruthy();
    });
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("does not write when the user dismisses a shopping list proposal", async () => {
    await mockStream(
      [{ type: "reply", reply: "Want me to add garlic?" }],
      "Want me to add garlic?",
      {
        pendingAction: {
          type: "add_to_shopping_list",
          listId: "770e8400-e29b-41d4-a716-446655440000",
          listName: "Groceries",
          items: [{ name: "garlic" }],
        },
      }
    );
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Add garlic" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /not now/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /not now/i }));

    expect(screen.queryByRole("button", { name: /add to list/i })).toBeNull();
    expect(bulkAdd).not.toHaveBeenCalled();
  });

  it("shows a clear error when Sous cannot reply", async () => {
    chatStream.mockRejectedValue(new Error("Sous is busy right now. Try again in a moment."));
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/busy right now/i);
    });
    expect(toastError).toHaveBeenCalled();
    expect(screen.getByLabelText(/message/i)).toHaveProperty("value", "Hello");
  });

  it("clears the conversation and returns to the empty state", async () => {
    await mockStream([{ type: "reply", reply: "Use oat milk." }], "Use oat milk.");
    renderSous();

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "What can I use instead of milk?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Use oat milk.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /clear chat/i }));

    expect(screen.queryByText("Use oat milk.")).toBeNull();
    expect(screen.queryByRole("button", { name: /clear chat/i })).toBeNull();
    expect(screen.getByText(/what can i help with/i)).toBeTruthy();
  });
});
