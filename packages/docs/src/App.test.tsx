// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App.js";

describe("docs introduction routing", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the introduction and every contributor on first visit", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "디자인과 코드를하나의 스펙으로." })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "함께 만든 사람들" })).toBeTruthy();
    expect(screen.queryByText("Web Components")).toBeNull();

    for (const name of ["전예진", "권오수", "이은규", "정호성", "장수호"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it("returns to the introduction when the logo is clicked", async () => {
    window.location.hash = "#/button";
    render(<App />);

    expect(screen.getByRole("heading", { name: "버튼 (Button)" })).toBeTruthy();

    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "PODO.UI" }));

    await waitFor(() => {
      expect(window.location.hash).toBe("#/");
      expect(screen.getByRole("heading", { name: "디자인과 코드를하나의 스펙으로." })).toBeTruthy();
    });
  });
});
