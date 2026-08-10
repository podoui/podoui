// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

  it("renders the JSON-backed spacing foundation page", () => {
    window.location.hash = "#/spacing";
    render(<App />);

    expect(screen.getByRole("heading", { name: "간격 (Spacing)" })).toBeTruthy();
    expect(screen.getByText("--podo-spacing-scale-1")).toBeTruthy();
    expect(screen.getByText("--podo-spacing-component-field-gap")).toBeTruthy();
    expect(screen.getAllByText("s(6)")).toHaveLength(2);
  });

  it("renders the responsive legacy grid contract page", () => {
    window.location.hash = "#/grid";
    render(<App />);

    expect(screen.getByRole("heading", { name: "그리드 (Grid)" })).toBeTruthy();
    expect(screen.getByText("12 columns")).toBeTruthy();
    expect(screen.getByText("6 columns")).toBeTruthy();
    expect(screen.getByText("4 columns")).toBeTruthy();
    expect(screen.getByLabelText("반응형 그리드 예제").children).toHaveLength(12);
  });

  it("renders every icon from the generated manifest", () => {
    window.location.hash = "#/icon";
    render(<App />);

    const gallery = screen.getByRole("list", { name: "전체 아이콘 29개" });
    expect(within(gallery).getAllByRole("listitem")).toHaveLength(29);
    expect(within(gallery).getByText("undo")).toBeTruthy();
    expect(within(gallery).getByText("youtube")).toBeTruthy();
  });
});
