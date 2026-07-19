import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parsePodoCloneDocument, podoCloneDocumentSchema } from "./podo-clone.js";

const SAMPLE_PATH = fileURLToPath(new URL("../samples/podo-clone.sample.json", import.meta.url));
// The full 12MB export is a local-only artifact (gitignored); the committed
// reduced sample above is the reproducible fixture, the full snapshot an
// extra check on machines that have one.
const SNAPSHOT_PATH = fileURLToPath(
  new URL("../../../figma-plugin/snapshot.json", import.meta.url)
);

function minimalDocument(): Record<string, unknown> {
  return {
    format: "podo-clone",
    version: 1,
    source: { fileName: "PODO Design System", exportedAt: "2026-07-16T06:47:42.411Z" },
    fonts: [{ family: "Pretendard", style: "Bold" }],
    variables: [
      {
        id: "VariableCollectionId:33:4",
        name: "primitive",
        defaultModeId: "33:0",
        modes: [{ modeId: "33:0", name: "Value" }],
        hiddenFromPublishing: false,
        variables: [
          {
            id: "VariableID:82:2",
            name: "color/red/5",
            description: "",
            resolvedType: "COLOR",
            scopes: ["ALL_SCOPES"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: {
              "33:0": { kind: "value", value: { r: 1, g: 0, b: 0, a: 1 } },
            },
          },
        ],
      },
    ],
    styles: { text: [], effect: [], paint: [], grid: [] },
    pages: [
      {
        pageId: "1:1",
        pageName: "Component",
        items: [
          {
            x: 0,
            y: 0,
            node: {
              id: "10:1",
              type: "COMPONENT",
              name: "type=solid",
              props: { layoutMode: "HORIZONTAL" },
              width: 100,
              height: 42,
              relativeTransform: [
                [1, 0, 0],
                [0, 1, 0],
              ],
              fills: [
                {
                  type: "SOLID",
                  color: { r: 0.26, g: 0.42, b: 0.93 },
                  bound: { color: "VariableID:82:2" },
                },
              ],
              component: {
                description: "",
                documentationLinks: [],
                propertyDefs: [
                  {
                    name: "type",
                    type: "VARIANT",
                    defaultValue: "solid",
                    variantOptions: ["solid", "outline"],
                  },
                ],
                key: "abc123",
              },
              children: [
                {
                  id: "10:2",
                  type: "TEXT",
                  name: "label",
                  props: {},
                  width: 40,
                  height: 20,
                  relativeTransform: [
                    [1, 0, 30],
                    [0, 1, 11],
                  ],
                  text: { characters: "Button", segments: [] },
                },
              ],
            },
          },
        ],
      },
    ],
    images: {},
    warnings: [],
  };
}

describe("podo-clone schema", () => {
  it("accepts a minimal valid document", () => {
    const parsed = parsePodoCloneDocument(minimalDocument());
    expect(parsed.variables[0]?.variables[0]?.name).toBe("color/red/5");
    expect(parsed.pages[0]?.items[0]?.node.children?.[0]?.text?.characters).toBe("Button");
  });

  it("rejects a wrong format marker", () => {
    const document = { ...minimalDocument(), format: "figma-export" };
    expect(podoCloneDocumentSchema.safeParse(document).success).toBe(false);
  });

  it("rejects an unsupported version", () => {
    const document = { ...minimalDocument(), version: 2 };
    expect(podoCloneDocumentSchema.safeParse(document).success).toBe(false);
  });

  it("rejects a malformed variable value", () => {
    const document = minimalDocument();
    const collection = (document.variables as Record<string, unknown>[])[0] as {
      variables: { valuesByMode: Record<string, unknown> }[];
    };
    collection.variables[0]!.valuesByMode["33:0"] = { kind: "alias" };
    const result = podoCloneDocumentSchema.safeParse(document);
    expect(result.success).toBe(false);
  });

  it("rejects a node without geometry", () => {
    const document = minimalDocument();
    const page = (document.pages as { items: { node: Record<string, unknown> }[] }[])[0]!;
    delete page.items[0]!.node["width"];
    expect(podoCloneDocumentSchema.safeParse(document).success).toBe(false);
  });

  it("accepts the committed plugin export sample", async () => {
    const raw = JSON.parse(await readFile(SAMPLE_PATH, "utf8")) as unknown;
    const parsed = parsePodoCloneDocument(raw);
    expect(parsed.format).toBe("podo-clone");
    expect(parsed.variables.length).toBeGreaterThan(0);
    expect(parsed.pages.length).toBeGreaterThan(0);
  });

  it.skipIf(!existsSync(SNAPSHOT_PATH))(
    "accepts the full local plugin snapshot when present",
    { timeout: 120_000 },
    async () => {
      const raw = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")) as unknown;
      const parsed = parsePodoCloneDocument(raw);
      expect(parsed.format).toBe("podo-clone");
      expect(parsed.variables.length).toBeGreaterThan(0);
      expect(parsed.pages.length).toBeGreaterThan(0);
    }
  );
});
