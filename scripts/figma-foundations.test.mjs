import { describe, expect, it } from "vitest";
import {
  compose,
  createIconManifest,
  createSpacingTokenDocument,
  prepareFoundationArtifacts,
  readFigmaIcons,
  readSpacingScale,
  resolveFloatVariable,
} from "./figma-foundations.mjs";

describe("Figma foundation synchronization", () => {
  it("resolves spacing alias chains in numeric order and rejects cycles", () => {
    const zero = variable(1, 1, "spacing/0", floatValue(0));
    const one = variable(1, 2, "spacing/1", aliasValue(2, 1));
    const primitive = variable(2, 1, "number/2", floatValue(2));
    const document = figmaDocument([one, primitive, zero]);

    expect([...readSpacingScale(document, 1)]).toEqual([
      [0, 0],
      [1, 2],
    ]);

    const cycleA = variable(3, 1, "cycle/a", aliasValue(3, 2));
    const cycleB = variable(3, 2, "cycle/b", aliasValue(3, 1));
    const cycleDocument = figmaDocument([cycleA, cycleB]);
    expect(() => resolveFloatVariable(cycleDocument, cycleA)).toThrow(
      "Circular Figma variable alias"
    );
  });

  it("keeps the public 8px field gap while adding the full primitive scale", () => {
    const tokenDocument = createSpacingTokenDocument(
      new Map([
        [0, 0],
        [4, 8],
      ])
    );

    expect(tokenDocument.tokens.spacing.scale["4"].$value).toBe("8px");
    expect(tokenDocument.tokens.spacing.component["field-gap"].$value).toBe("{spacing.scale.4}");
  });

  it("composes nested affine transforms in SVG matrix order", () => {
    expect(compose([2, 0, 0, 2, 10, 20], [1, 0, 0, 1, 3, 4])).toEqual([2, 0, 0, 2, 16, 28]);
  });

  it("filters blank icons, applies converter-compatible names, and sorts output", () => {
    const root = node(10, 1, { type: "FRAME", name: "root" });
    const blankFrame = node(10, 2, { type: "FRAME", name: "Icon-blank" });
    const blank = node(10, 3, { type: "SYMBOL", name: "name=blank" });
    const arrowFrame = node(10, 4, { type: "FRAME", name: "Icon-arrow" });
    const up = node(10, 5, { type: "SYMBOL", name: "name=up" });
    const left = node(10, 6, { type: "SYMBOL", name: "name=left" });
    const document = figmaDocument(
      [root, blankFrame, blank, arrowFrame, up, left],
      new Map([
        [id(root), [blankFrame, arrowFrame]],
        [id(blankFrame), [blank]],
        [id(arrowFrame), [up, left]],
      ])
    );

    const icons = readFigmaIcons(document, {
      iconCollectionId: id(root),
      expectedIconCount: 2,
      renderIcon: (_document, symbol) => `<svg data-name="${symbol.name}"/>`,
    });
    expect([...icons.keys()]).toEqual(["arrow-left", "arrow-up"]);
  });

  it("rejects duplicate names during pure preparation before any files are written", () => {
    const spacingZero = variable(20, 1, "spacing/0", floatValue(0));
    const root = node(20, 2, { type: "FRAME", name: "root" });
    const firstFrame = node(20, 3, { type: "FRAME", name: "Icon-close" });
    const secondFrame = node(20, 4, { type: "FRAME", name: "Icon-close" });
    const first = node(20, 5, { type: "SYMBOL", name: "name=close" });
    const second = node(20, 6, { type: "SYMBOL", name: "name=close" });
    const document = figmaDocument(
      [spacingZero, root, firstFrame, secondFrame, first, second],
      new Map([
        [id(root), [firstFrame, secondFrame]],
        [id(firstFrame), [first]],
        [id(secondFrame), [second]],
      ])
    );

    expect(() =>
      prepareFoundationArtifacts({
        document,
        compatibilityNames: [],
        codepointSeed: new Map(),
        expectedSpacingMax: 0,
        expectedIconCount: 2,
        iconCollectionId: id(root),
        renderIcon: () => "<svg/>",
      })
    ).toThrow("Duplicate Figma icon name: close");
  });

  it("preserves compatibility codepoints and emits a deterministic unique manifest", () => {
    const first = createIconManifest(
      new Map([
        ["zeta", "<svg/>"],
        ["alpha", "<svg/>"],
      ]),
      ["legacy", "alpha"],
      new Map([
        ["alpha", "E007"],
        ["legacy", "E115"],
      ])
    ).manifest;
    const second = createIconManifest(
      new Map([
        ["alpha", "<svg/>"],
        ["zeta", "<svg/>"],
      ]),
      ["alpha", "legacy"],
      new Map([
        ["legacy", "E115"],
        ["alpha", "E007"],
      ])
    ).manifest;

    expect(first).toEqual(second);
    expect(Object.keys(first.icons)).toEqual(["alpha", "legacy", "zeta"]);
    expect(first.codepointLock.alpha).toBe("E007");
    expect(first.codepointLock.legacy).toBe("E115");
    expect(new Set(Object.values(first.codepointLock)).size).toBe(3);
  });
});

function node(sessionID, localID, properties = {}) {
  return { guid: { sessionID, localID }, visible: true, opacity: 1, ...properties };
}

function variable(sessionID, localID, name, variableData) {
  return node(sessionID, localID, {
    type: "VARIABLE",
    name,
    variableDataValues: { entries: [{ variableData }] },
  });
}

function floatValue(value) {
  return { value: { floatValue: value }, dataType: "FLOAT", resolvedDataType: "FLOAT" };
}

function aliasValue(sessionID, localID) {
  return {
    value: { alias: { guid: { sessionID, localID } } },
    dataType: "ALIAS",
    resolvedDataType: "FLOAT",
  };
}

function figmaDocument(nodes, childrenMap = new Map()) {
  return { nodes, nodeMap: new Map(nodes.map((item) => [id(item), item])), childrenMap };
}

function id(item) {
  return `${item.guid.sessionID}:${item.guid.localID}`;
}
