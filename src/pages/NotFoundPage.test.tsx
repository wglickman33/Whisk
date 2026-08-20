import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NotFoundPage } from "./NotFoundPage";

let signedIn = false;
const toggleTheme = vi.fn();

vi.mock("../store/authStore", () => ({
  useAuthStore: (selector: (s: { isSignedIn: boolean }) => unknown) =>
    selector({ isSignedIn: signedIn }),
}));

vi.mock("../store/settingsStore", () => ({
  useSettingsStore: (
    selector: (s: {
      theme: "light" | "dark" | "auto";
      effectiveTheme: "light" | "dark";
      toggleTheme: () => void;
    }) => unknown
  ) =>
    selector({
      theme: "light",
      effectiveTheme: "light",
      toggleTheme,
    }),
}));

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  toggleTheme.mockReset();
  signedIn = false;
});

describe("NotFoundPage", () => {
  it("shows the Whisk 404 card for guests", () => {
    renderNotFound();
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
    expect(screen.getByText("Whisk")).toBeTruthy();
    expect(screen.getByText(/does not match anything in Whisk/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "How it works" }).getAttribute("href")).toBe(
      "/how-it-works"
    );
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
  });

  it("sends signed-in users back to recipes", () => {
    signedIn = true;
    renderNotFound();
    expect(screen.getByRole("link", { name: "Back to recipes" }).getAttribute("href")).toBe(
      "/recipes"
    );
  });
});
