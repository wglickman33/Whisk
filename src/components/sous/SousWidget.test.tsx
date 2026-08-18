import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SousWidget } from "./SousWidget";
import { FloatingAppsMenu } from "../ui/FloatingAppsMenu";
import { NotificationToastContainer } from "../ui/NotificationToast";
import { useSousStore } from "../../store/sousStore";
import { useToastStore } from "../../store/toastStore";
import type { SousStreamEvent } from "../../api/client";

const chatStream = vi.fn();
const bulkAdd = vi.fn();
const openAuthModal = vi.fn();

vi.mock("../../api/client", () => ({
  sousApi: {
    chatStream: (...args: unknown[]) => chatStream(...args),
  },
  shoppingListsApi: {
    bulkAdd: (...args: unknown[]) => bulkAdd(...args),
  },
}));

vi.mock("../../store/authModalStore", () => ({
  useAuthModalStore: (selector: (s: { openAuthModal: typeof openAuthModal }) => unknown) =>
    selector({ openAuthModal }),
}));


vi.mock("../tools/SafeMarkdown", () => ({
  SafeMarkdown: ({ children }: { children: string }) => <div>{children}</div>,
}));

let signedIn = true;
let loading = false;

vi.mock("../../store/authStore", () => ({
  useAuthStore: (selector: (s: { isSignedIn: boolean; isLoading: boolean }) => unknown) =>
    selector({ isSignedIn: signedIn, isLoading: loading }),
}));

function renderWidget(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/sous" element={<p>Full sous page</p>} />
      </Routes>
      <NotificationToastContainer />
      <FloatingAppsMenu />
      <SousWidget />
    </MemoryRouter>
  );
}

async function mockStream(reply: string, events: SousStreamEvent[] = [{ type: "reply", reply }]) {
  chatStream.mockImplementation(async (_messages: unknown, onEvent?: (event: SousStreamEvent) => void) => {
    for (const event of events) onEvent?.(event);
    return { reply };
  });
}

afterEach(() => {
  cleanup();
  chatStream.mockReset();
  bulkAdd.mockReset();
  openAuthModal.mockReset();
  signedIn = true;
  loading = false;
  useSousStore.getState().resetChat();
  useSousStore.getState().closeWidget();
  useToastStore.setState({ items: [] });
});

describe("SousWidget", () => {
  it("stays closed until opened", () => {
    renderWidget();
    expect(screen.queryByRole("dialog", { name: /sous ai/i })).toBeNull();
  });

  it("opens from the apps bubble without leaving the current page", () => {
    renderWidget();
    fireEvent.click(screen.getByLabelText(/open apps menu/i));
    fireEvent.click(screen.getByRole("button", { name: /open sous ai/i }));

    expect(screen.getByText("Home page")).toBeTruthy();
    expect(screen.queryByText("Full sous page")).toBeNull();
    expect(screen.getByRole("dialog", { name: /sous ai/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open full view/i }).getAttribute("href")).toBe("/sous");
  });

  it("hides on the full Sous page", () => {
    useSousStore.getState().openWidget();
    renderWidget("/sous");
    expect(screen.queryByRole("dialog", { name: /sous ai/i })).toBeNull();
    expect(screen.getByText("Full sous page")).toBeTruthy();
  });

  it("explains the widget is for other pages and can open it on Home", () => {
    renderWidget("/sous");
    fireEvent.click(screen.getByLabelText(/open apps menu/i));
    fireEvent.click(screen.getByRole("button", { name: /open sous ai/i }));

    expect(screen.getByText(/already in the full sous ai view/i)).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: /sous ai/i })).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: /use widget on home/i }));

    expect(screen.getByText("Home page")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: /sous ai/i })).toBeTruthy();
  });

  it("asks guests to sign in", () => {
    signedIn = false;
    useSousStore.getState().openWidget();
    renderWidget();
    expect(screen.getByText(/sign in to chat with sous ai/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(openAuthModal).toHaveBeenCalledWith("login");
    expect(screen.queryByLabelText(/message/i)).toBeNull();
  });

  it("sends a suggested prompt from the widget", async () => {
    await mockStream("Lemon Chicken is in your recipes.");
    useSousStore.getState().openWidget();
    renderWidget();

    fireEvent.click(screen.getByRole("button", { name: /what chicken recipes do i have/i }));

    await waitFor(() => {
      expect(screen.getByText("Lemon Chicken is in your recipes.")).toBeTruthy();
    });
    expect(screen.queryByText("Home page")).toBeTruthy();
  });

  it("closes from the header button", () => {
    useSousStore.getState().openWidget();
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /close sous ai/i }));
    expect(screen.queryByRole("dialog", { name: /sous ai/i })).toBeNull();
  });

  it("clears chat from the widget", async () => {
    await mockStream("Lemon Chicken is in your recipes.");
    useSousStore.getState().openWidget();
    renderWidget();

    fireEvent.click(screen.getByRole("button", { name: /what chicken recipes do i have/i }));

    await waitFor(() => {
      expect(screen.getByText("Lemon Chicken is in your recipes.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /clear chat/i }));

    expect(screen.queryByText("Lemon Chicken is in your recipes.")).toBeNull();
    expect(screen.getByText(/what can i help with/i)).toBeTruthy();
  });
});
