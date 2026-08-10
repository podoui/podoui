// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SetupPage } from "./SetupPage.js";

describe("SetupPage framework guidance", () => {
  afterEach(() => cleanup());

  it("provides app-wide theme setup for every supported runtime", async () => {
    render(<SetupPage />);
    const section = screen
      .getByRole("heading", { name: "프로젝트 전체 테마 적용" })
      .closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section!);
    const user = userEvent.setup();

    for (const [label, expected] of [
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

  it("shows semantic color consumption for web, SSR, and native", async () => {
    render(<SetupPage />);
    const section = screen
      .getByRole("heading", { name: "의미 기반 색상 토큰 사용" })
      .closest("section");
    expect(section).not.toBeNull();
    const scoped = within(section!);
    const user = userEvent.setup();

    await user.click(scoped.getByRole("tab", { name: "React" }));
    expect(scoped.getByLabelText("React 예제 코드").textContent).toContain("--podo-text-success");
    await user.click(scoped.getByRole("tab", { name: "Hono SSR" }));
    expect(scoped.getByLabelText("Hono SSR 예제 코드").textContent).toContain(
      "--podo-foreground-danger-light"
    );
    await user.click(scoped.getByRole("tab", { name: "React Native" }));
    expect(scoped.getByLabelText("React Native 예제 코드").textContent).toContain(
      'colors.foreground["success-light"]'
    );
  });
});
