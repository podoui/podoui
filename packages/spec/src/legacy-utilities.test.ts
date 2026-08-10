import { describe, expect, it } from "vitest";
import { legacyUtilitiesDocumentSchema, parseLegacyUtilitiesDocument } from "./legacy-utilities.js";

const validDocument = {
  schemaVersion: "2.0.0",
  kind: "legacy-utilities",
  border: { style: "solid", widths: { "0": "0", "1": "1px", "2": "2px", "3": "3px", "4": "4px" } },
  radius: {
    values: {
      "0": "0",
      "1": "2px",
      "2": "4px",
      "3": "6px",
      "4": "8px",
      "5": "12px",
      "6": "20px",
      full: "9999px",
    },
  },
  shadow: {
    values: {
      "1": "0px 6px 18px -3px rgba(50, 50, 50, 0.06)",
      "2": "0px 8px 23px -3px rgba(50, 50, 50, 0.1)",
      "3": "0px 9px 30px -3px rgba(50, 50, 50, 0.12)",
      "4": "0px 9.995px 46px -3px rgba(50, 50, 50, 0.12)",
      "5": "0px 13px 63px -3px rgba(50, 50, 50, 0.14)",
    },
  },
  elevation: {
    values: {
      base: { light: "#fafafa", dark: "#09090b" },
      "1": { light: "#ffffff", dark: "#18181b" },
      "2": { light: "#ffffff", dark: "#242429" },
      "3": { light: "#ffffff", dark: "#2c2c31" },
    },
  },
  visibility: {
    breakpoints: {
      pc: { minWidth: "1280px" },
      tablet: { minWidth: "768px", maxWidth: "1279px" },
      mobile: { maxWidth: "767px" },
    },
  },
} as const;

describe("legacy utilities document", () => {
  it("parses the complete v1 compatibility contract", () => {
    expect(parseLegacyUtilitiesDocument(validDocument)).toEqual(validDocument);
  });

  it("rejects missing fixed scale entries and invalid CSS lengths", () => {
    const missingRadius = structuredClone(validDocument) as Record<string, unknown>;
    delete (missingRadius.radius as { values: Record<string, string> }).values.full;
    expect(legacyUtilitiesDocumentSchema.safeParse(missingRadius).success).toBe(false);

    const invalidBorder = structuredClone(validDocument);
    invalidBorder.border.widths["1"] = "thin";
    expect(legacyUtilitiesDocumentSchema.safeParse(invalidBorder).success).toBe(false);
  });

  it("rejects invalid colors, malformed shadows, and unknown nested contract keys", () => {
    const invalidColor = structuredClone(validDocument);
    invalidColor.elevation.values.base.light = "not-a-color";
    expect(legacyUtilitiesDocumentSchema.safeParse(invalidColor).success).toBe(false);

    const invalidShadow = structuredClone(validDocument);
    invalidShadow.shadow.values["1"] = "0 0 red";
    expect(legacyUtilitiesDocumentSchema.safeParse(invalidShadow).success).toBe(false);

    const unknownElevation = structuredClone(validDocument) as Record<string, unknown>;
    (unknownElevation.elevation as { values: Record<string, unknown> }).values["4"] = {
      light: "#ffffff",
      dark: "#000000",
    };
    expect(legacyUtilitiesDocumentSchema.safeParse(unknownElevation).success).toBe(false);

    const unknownBreakpoint = structuredClone(validDocument) as Record<string, unknown>;
    (
      (unknownBreakpoint.visibility as { breakpoints: Record<string, unknown> }).breakpoints
        .pc as Record<string, unknown>
    ).extra = true;
    expect(legacyUtilitiesDocumentSchema.safeParse(unknownBreakpoint).success).toBe(false);
  });
});
