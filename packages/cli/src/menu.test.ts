import { describe, expect, it } from "vitest";
import { parseArgs } from "./index.js";
import { MENU } from "./menu.js";

describe("podo-ui menu", () => {
  it("maps every menu entry to a real podo command", () => {
    for (const entry of MENU) {
      expect(parseArgs(entry.argv).command, entry.label).toBeDefined();
    }
  });

  it("puts the Figma import first", () => {
    expect(MENU[0]?.argv).toEqual(["import"]);
  });
});
