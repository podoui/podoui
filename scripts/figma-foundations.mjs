import { nodeId, resolveVectorNodePaths } from "openfig-core";
import svgpath from "svgpath";

export const ICON_COLLECTION_ID = "523:11034";
const IDENTITY = [1, 0, 0, 1, 0, 0];

export function prepareFoundationArtifacts({
  document,
  compatibilityNames,
  codepointSeed,
  expectedSpacingMax = 18,
  expectedIconCount = 138,
  iconCollectionId = ICON_COLLECTION_ID,
  renderIcon = iconSvg,
}) {
  const spacing = readSpacingScale(document, expectedSpacingMax);
  const figmaIcons = readFigmaIcons(document, {
    iconCollectionId,
    expectedIconCount,
    renderIcon,
  });
  const tokenDocument = createSpacingTokenDocument(spacing);
  const { manifest, totalCount } = createIconManifest(
    figmaIcons,
    compatibilityNames,
    codepointSeed
  );
  return { spacing, figmaIcons, tokenDocument, manifest, totalCount };
}

export function readSpacingScale(figmaDocument, expectedMax = 18) {
  const scale = new Map();
  for (const node of figmaDocument.nodes) {
    const match = node.type === "VARIABLE" ? /^spacing\/(\d+)$/.exec(node.name ?? "") : null;
    if (!match) continue;
    const name = Number(match[1]);
    if (scale.has(name)) throw new Error(`Duplicate Figma spacing variable: spacing/${name}.`);
    scale.set(name, resolveFloatVariable(figmaDocument, node, new Set()));
  }

  const expected = Array.from({ length: expectedMax + 1 }, (_, index) => index);
  const missing = expected.filter((name) => !scale.has(name));
  if (missing.length > 0 || scale.size !== expected.length) {
    throw new Error(
      `Expected spacing/0 through spacing/${expectedMax}, found ${scale.size}. Missing: ${missing.join(", ") || "none"}.`
    );
  }
  return new Map(expected.map((name) => [name, scale.get(name)]));
}

export function resolveFloatVariable(figmaDocument, node, seen = new Set()) {
  const id = nodeId(node);
  if (seen.has(id)) throw new Error(`Circular Figma variable alias at ${id}.`);
  seen.add(id);
  const variableData = node.variableDataValues?.entries?.[0]?.variableData;
  const floatValue = variableData?.value?.floatValue;
  if (typeof floatValue === "number") return floatValue;
  const alias = variableData?.value?.alias?.guid;
  if (!alias) throw new Error(`Variable ${node.name ?? id} has no numeric value.`);
  const target = figmaDocument.nodeMap.get(`${alias.sessionID}:${alias.localID}`);
  if (!target) throw new Error(`Variable ${node.name ?? id} refers to a missing alias.`);
  return resolveFloatVariable(figmaDocument, target, seen);
}

export function createSpacingTokenDocument(scale) {
  const scaleTokens = Object.fromEntries(
    [...scale].map(([name, value]) => [
      String(name),
      {
        $type: "spacing",
        $value: `${value}px`,
        $extensions: { podo: { scope: "primitive", roles: ["spacing", "scale"] } },
      },
    ])
  );
  return {
    schemaVersion: "2.0.0",
    kind: "tokens",
    category: "primitive",
    tokens: {
      spacing: {
        scale: scaleTokens,
        component: {
          "field-gap": {
            $type: "spacing",
            $value: "{spacing.scale.4}",
            $extensions: { podo: { scope: "component", roles: ["field", "gap"] } },
          },
        },
      },
    },
  };
}

export function readFigmaIcons(
  figmaDocument,
  { iconCollectionId = ICON_COLLECTION_ID, expectedIconCount = 138, renderIcon = iconSvg } = {}
) {
  const collection = figmaDocument.nodeMap.get(iconCollectionId);
  if (!collection) throw new Error(`Figma icon collection ${iconCollectionId} was not found.`);

  const icons = new Map();
  for (const frame of figmaDocument.childrenMap.get(iconCollectionId) ?? []) {
    const suffix = sanitizeName((frame.name ?? "").replace(/^Icon-/i, ""));
    if (!suffix) continue;
    for (const symbol of descendants(figmaDocument, nodeId(frame))) {
      if (symbol.type !== "SYMBOL") continue;
      const variant = sanitizeName(parseVariantName(symbol.name ?? ""));
      let name = variant && variant !== suffix ? `${suffix}-${variant}` : suffix;
      if (suffix === "blank" || variant === "blank") continue;
      name = sanitizeName(name);
      if (icons.has(name)) throw new Error(`Duplicate Figma icon name: ${name}.`);
      icons.set(name, renderIcon(figmaDocument, symbol));
    }
  }

  if (icons.size !== expectedIconCount) {
    throw new Error(`Expected ${expectedIconCount} non-blank Figma icons, found ${icons.size}.`);
  }
  return new Map([...icons].sort(([left], [right]) => left.localeCompare(right)));
}

function* descendants(figmaDocument, parentId) {
  for (const child of figmaDocument.childrenMap.get(parentId) ?? []) {
    yield child;
    yield* descendants(figmaDocument, nodeId(child));
  }
}

export function parseVariantName(name) {
  for (const pair of name.split(",")) {
    const [axis, ...value] = pair.split("=");
    if (axis?.trim() === "name") return value.join("=").trim();
  }
  return name;
}

export function sanitizeName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function iconSvg(figmaDocument, root) {
  const paths = [];
  collectPaths(figmaDocument, root, IDENTITY, true, paths);
  if (paths.length === 0) throw new Error(`Figma icon ${root.name} contains no painted vectors.`);
  const width = root.size?.x ?? 24;
  const height = root.size?.y ?? 24;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${formatNumber(width)} ${formatNumber(height)}">`,
    ...paths.map(
      ({ d, evenodd }) =>
        `  <path fill="currentColor"${evenodd ? ' fill-rule="evenodd"' : ""} d="${d}"/>`
    ),
    "</svg>",
    "",
  ].join("\n");
}

function collectPaths(figmaDocument, node, parentMatrix, isRoot, output) {
  if (node.visible === false || node.opacity === 0) return;
  const matrix = isRoot ? parentMatrix : compose(parentMatrix, fromTransform(node.transform));
  const vectors = resolveVectorNodePaths(figmaDocument, node);
  for (const item of [...vectors.fill, ...vectors.stroke]) {
    if (!item.paints?.some((paint) => paint.visible !== false && (paint.opacity ?? 1) > 0))
      continue;
    output.push({
      d: svgpath(item.svgPath).matrix(matrix).round(4).toString(),
      evenodd: item.windingRule === "EVENODD",
    });
  }
  for (const child of figmaDocument.childrenMap.get(nodeId(node)) ?? []) {
    collectPaths(figmaDocument, child, matrix, false, output);
  }
}

export function fromTransform(transform = {}) {
  return [
    transform.m00 ?? 1,
    transform.m10 ?? 0,
    transform.m01 ?? 0,
    transform.m11 ?? 1,
    transform.m02 ?? 0,
    transform.m12 ?? 0,
  ];
}

export function compose(left, right) {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ];
}

function formatNumber(value) {
  return Number(value.toFixed(4)).toString();
}

export function createIconManifest(figmaIcons, compatibilityNames, initialCodepoints = new Map()) {
  const compatibility = [...new Set(compatibilityNames)].sort();
  const compatibilitySet = new Set(compatibility);
  const allNames = [...new Set([...compatibility, ...figmaIcons.keys()])].sort();
  const codepoints = new Map(
    [...initialCodepoints].map(([name, value]) => [name, String(value).toUpperCase()])
  );
  const selectedExisting = allNames.map((name) => codepoints.get(name)).filter(Boolean);
  if (new Set(selectedExisting).size !== selectedExisting.length) {
    throw new Error("Existing compatibility codepoints must be unique.");
  }
  const used = new Set(codepoints.values());
  let nextCodepoint = 0xe200;
  for (const name of allNames) {
    if (codepoints.has(name)) continue;
    while (used.has(nextCodepoint.toString(16).toUpperCase())) nextCodepoint += 1;
    const codepoint = nextCodepoint.toString(16).toUpperCase();
    codepoints.set(name, codepoint);
    used.add(codepoint);
    nextCodepoint += 1;
  }

  const icons = Object.fromEntries(
    allNames.map((name) => {
      const isFigma = figmaIcons.has(name);
      const tags = [isFigma && "figma", compatibilitySet.has(name) && "compatibility"].filter(
        Boolean
      );
      return [
        name,
        {
          source: isFigma ? `figma/${name}.svg` : `compatibility/${name}.svg`,
          codepoint: codepoints.get(name),
          tags,
        },
      ];
    })
  );
  return {
    totalCount: allNames.length,
    manifest: {
      schemaVersion: "2.0.0",
      kind: "icons",
      fontFamily: "PodoIcons",
      icons,
      groups: { figma: [...figmaIcons.keys()].sort(), compatibility },
      codepointLock: Object.fromEntries(allNames.map((name) => [name, codepoints.get(name)])),
    },
  };
}
