// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SetupPage, SETUP_TABS } from "./SetupPage.js";
import { PROJECT_THEME_TABS } from "./setup-examples.js";

describe("SetupPage framework guidance", () => {
  afterEach(() => cleanup());

  it("provides app-wide theme setup for every supported runtime", async () => {
    render(<SetupPage />);
    const section = screen
      .getByRole("heading", { name: "2. 앱 전체에 테마 한 번 적용하기" })
      .closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section!);
    const user = userEvent.setup();

    for (const [label, expected] of [
      ["HTML / CSS", "data-podo-theme"],
      ["React", "applyToDocument"],
      ["Next.js", "app/providers.tsx"],
      ["Hono CSR", "#podo-root"],
      ["Hono SSR", "renderCriticalCss"],
      ["React Native", "getPodoNativeTokens"],
    ] as const) {
      await user.click(scoped.getByRole("tab", { name: label }));
      expect(scoped.getByLabelText(`${label} 예제 코드`).textContent).toContain(expected);
    }
  });

  it("shows global color, spacing, radius, and typography tokens on every platform", async () => {
    render(<SetupPage />);
    const section = screen
      .getByRole("heading", { name: "3. 어디서든 디자인 토큰 사용하기" })
      .closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section!);
    const user = userEvent.setup();

    for (const [label, expected] of [
      ["HTML / CSS", "--podo-typography-body-medium-fontSize"],
      ["React", "--podo-spacing-scale-8"],
      ["Next.js", "--podo-radius-control-md"],
      ["Hono CSR", "--podo-text-basic"],
      ["Hono SSR", "--podo-elevation-basic"],
      ["React Native", "usePodoNativeTokens<AppTokens>"],
    ] as const) {
      await user.click(scoped.getByRole("tab", { name: label }));
      expect(scoped.getByLabelText(`${label} 예제 코드`).textContent).toContain(expected);
    }
  });

  it("separates the first-run instructions for each framework", async () => {
    render(<SetupPage />);
    const section = screen
      .getByRole("heading", { name: "1. 패키지를 설치하고 첫 화면 띄우기" })
      .closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section!);
    const user = userEvent.setup();

    for (const [label, expected] of [
      ["React", "PodoThemeProvider"],
      ["Next.js", "app/providers.tsx"],
      ["Hono CSR", "createRoot(root)"],
      ["Hono SSR", "renderCriticalCss"],
      ["React Native", "podo-ui/native"],
    ] as const) {
      await user.click(scoped.getByRole("tab", { name: label }));
      expect(scoped.getByLabelText(`${label} 예제 코드`).textContent).toContain(expected);
    }
  });

  it("uses real CSS exports and generated paths in HTML and Hono examples", () => {
    const code = [...SETUP_TABS, ...PROJECT_THEME_TABS].map((tab) => tab.code).join("\n");

    expect(code).not.toContain("/assets/podo.css");
    expect(code).not.toContain("/assets/podo-icons.css");
    expect(code).not.toContain("/assets/app.css");
    expect(code).toContain("podo-ui/styles.css?raw");
    expect(code).toContain("./podo/tokens.css?raw");
    expect(code).toContain("./podo/components.css?raw");
    expect(code).toContain("--out-dir public/podo");
    expect(code).toContain('href="/podo/tokens.css"');
  });
});
