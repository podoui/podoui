import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

describe("Editor color-scheme compatibility styles", () => {
  it("uses the elevation semantic token for light and dark toolbars", () => {
    const declarations = styles.match(
      /--color-bg-elevation: var\(--podo-elevation-gray, #[0-9a-f]{6}\);/g
    );

    expect(declarations).toEqual([
      "--color-bg-elevation: var(--podo-elevation-gray, #f9f9f9);",
      "--color-bg-elevation: var(--podo-elevation-gray, #27272a);",
    ]);
    expect(styles).not.toContain("--color-bg-elevation: var(--podo-foreground-natural, #fafafa);");
  });
});
