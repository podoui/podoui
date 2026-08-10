import { describe, expect, it } from "vitest";
import {
  emitLegacyUtilitiesCss,
  emitLegacyUtilitiesScss,
  legacyUtilitiesContract,
} from "./legacy-utilities.js";

describe("legacy utility compatibility", () => {
  it("loads the validated v1 contract from JSON", () => {
    expect(legacyUtilitiesContract.kind).toBe("legacy-utilities");
    expect(Object.keys(legacyUtilitiesContract.border.widths)).toEqual(["0", "1", "2", "3", "4"]);
    expect(Object.keys(legacyUtilitiesContract.radius.values)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "full",
    ]);
  });

  it("emits all v1 CSS selectors, responsive boundaries, and dark elevation behavior", () => {
    const css = emitLegacyUtilitiesCss();

    expect(css).toContain(".border-4 {\n  border: 4px solid;\n}");
    expect(css).toContain(".r-full {\n  border-radius: 9999px;\n}");
    expect(css).toContain(".shadow-5 {\n  box-shadow:");
    expect(css).toContain(".bg-elevation-3");
    expect(css).toContain(".hide {\n  display: none !important;\n}");
    expect(css).toContain("min-width: 1280px");
    expect(css).toContain("min-width: 768px) and (max-width: 1279px");
    expect(css).toContain("max-width: 767px");
    expect(css).toContain("prefers-color-scheme: dark");
    expect(css).toMatchSnapshot();
  });

  it("emits standalone SCSS helpers and classes from the same JSON", () => {
    const scss = emitLegacyUtilitiesScss();

    expect(scss).toContain("@function border($key)");
    expect(scss).toContain("@function r($key)");
    expect(scss).toContain("@function shadow($key)");
    expect(scss).toContain(".hide-pc");
    expect(scss).toMatchSnapshot();
  });
});
