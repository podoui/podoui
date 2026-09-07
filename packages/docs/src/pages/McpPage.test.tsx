// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { McpPage } from "./McpPage.js";
import { findBySlug } from "../nav.js";

afterEach(cleanup);

it("registers the guide and copies runnable client settings", async () => {
  expect(findBySlug("mcp")?.page).toBe(McpPage);
  const user = userEvent.setup();
  render(<McpPage />);
  const section = screen.getByRole("heading", { name: "AI 도구에 한 번 등록" }).closest("section");
  const scoped = within(section!);
  for (const label of ["Claude Code", "Codex", "JSON 설정"]) {
    await user.click(scoped.getByRole("tab", { name: label }));
    const displayed = scoped.getByLabelText(`${label} 예제 코드`);
    await user.click(scoped.getByRole("button", { name: /Copy|Copied/ }));
    const code = await navigator.clipboard.readText();
    expect(displayed.textContent).toContain(code.split("\n")[0]);
    if (label === "JSON 설정") {
      expect(JSON.parse(code!).mcpServers.podo).toEqual({
        command: "npx",
        args: ["-y", "podo-ui", "mcp", "--root", "/absolute/path/to/project"],
      });
    } else {
      expect(code).toContain(
        'mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"'
      );
    }
  }
});
