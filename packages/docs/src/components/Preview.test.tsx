// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Preview, type CodeTab } from "./Preview.js";

const TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code: `<Button theme="solid-primary">Save</Button>`,
  },
  {
    target: "hono",
    label: "Hono",
    code: `import { Button } from "podo-ui/hono";\n\n<Button>서버 렌더링</Button>`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Button } from "podo-ui/native";\n\n<Button>Native</Button>`,
  },
];

describe("Preview framework examples", () => {
  afterEach(() => cleanup());

  it("keeps Hono CSR and SSR as separate, complete examples", async () => {
    const { container } = render(<Preview tabs={TABS}>Preview</Preview>);
    const user = userEvent.setup();

    expect(screen.getByRole("tab", { name: "React" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Next.js" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Hono CSR" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Hono SSR" })).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Hono CSR" }));
    expect(screen.getByLabelText("Hono CSR 예제 코드").textContent).toContain(
      `createRoot(root).render(<PodoIsland />);`
    );
    expect(screen.getByLabelText("Hono CSR 예제 코드").textContent).toContain("podo-root");
    expectSequentialLineNumbers(container);

    await user.click(screen.getByRole("tab", { name: "Hono SSR" }));
    expect(screen.getByLabelText("Hono SSR 예제 코드").textContent).toContain("podo-ui/hono");
    expect(screen.getByLabelText("Hono SSR 예제 코드").textContent).not.toContain("createRoot");
    expectSequentialLineNumbers(container);
  });

  it("mounts a named React example as a Hono client island", async () => {
    render(
      <Preview
        tabs={[
          {
            target: "react",
            label: "React",
            code:
              `import { Button } from "podo-ui/react";\n\n` +
              `export function App() {\n  return <Button>Save</Button>;\n}`,
          },
        ]}
      >
        Preview
      </Preview>
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("tab", { name: "Hono CSR" }));
    expect(screen.getByLabelText("Hono CSR 예제 코드").textContent).toContain(
      `createRoot(root).render(<App />);`
    );
  });
});

function expectSequentialLineNumbers(container: HTMLElement): void {
  const numbers = Array.from(container.querySelectorAll(".code-line__number"), (node) =>
    Number(node.textContent)
  );
  expect(numbers).toEqual(Array.from({ length: numbers.length }, (_, index) => index + 1));
}
