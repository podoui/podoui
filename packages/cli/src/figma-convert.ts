/**
 * podo-clone → Podo spec conversion.
 *
 * Pure functions: PodoCloneDocument in, `.podo` JSON documents + warnings out.
 * Anything that cannot be mapped is reported as a warning, never a throw —
 * a partial import with an honest report beats a failed one.
 *
 * Mapping rules (plan.md §18.3):
 * - variable collections → token documents; multi-mode collections prepend the
 *   mode as a path segment (light/dark and theme names project at build time)
 *   and emit a mode-less base token aliasing the default mode, so component
 *   bindings like `{text.basic}` stay valid in the unprojected token tree.
 * - text/effect styles → typography/shadow tokens in figma-styles.json.
 * - components/component sets → draft component specs with token bindings
 *   taken from the default-variant node (fills/strokes/radius/text color).
 */

import svgpath from "svgpath";
import {
  parseComponentDocument,
  parseIconManifest,
  parseTokenDocument,
  validateIconManifest,
  PODO_SCHEMA_VERSION,
  type ComponentDocument,
  type IconManifest,
  type DesignToken,
  type PodoCloneCollection,
  type PodoCloneDocument,
  type PodoCloneEffect,
  type PodoCloneNode,
  type PodoClonePaint,
  type PodoCloneTextStyle,
  type PodoCloneVariable,
  type TokenDocument,
  type TokenTree,
} from "@podoui/spec";

export type ConvertedFile =
  | {
      /** Repo-root-relative path, always inside `.podo/`. */
      path: string;
      document: TokenDocument | ComponentDocument | IconManifest;
      contents?: undefined;
    }
  | {
      /** Raw text file (e.g. an extracted icon SVG). */
      path: string;
      contents: string;
      document?: undefined;
    };

export interface ConversionResult {
  files: ConvertedFile[];
  warnings: string[];
}

const KNOWN_COLOR_SCHEMES = new Set(["light", "dark"]);
const KNOWN_THEMES = new Set(["landing", "dashboard", "custom"]);
const TOKEN_CATEGORIES = new Set(["primitive", "semantic", "component", "theme"]);

const FONT_WEIGHTS: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};

export function convertPodoClone(document: PodoCloneDocument): ConversionResult {
  const warnings: string[] = [];
  const files: ConvertedFile[] = [];
  const variableIndex = buildVariableIndex(document, warnings);

  for (const collection of document.variables) {
    const file = convertCollection(collection, variableIndex, warnings);
    if (file) {
      files.push(file);
    }
  }

  const stylesFile = convertStyles(document, warnings);
  if (stylesFile) {
    files.push(stylesFile);
  }

  files.push(...convertComponents(document, variableIndex, warnings));
  files.push(...convertIcons(document, warnings));

  if (Object.keys(document.images).length > 0) {
    warnings.push(
      `${Object.keys(document.images).length} embedded image(s) were not imported (image fills are not part of Podo specs).`
    );
  }
  warnings.push(...document.warnings.map((warning) => `figma export: ${warning}`));

  files.sort((left, right) => left.path.localeCompare(right.path));
  return { files, warnings };
}

// ------------------------------------------------------------------ variables

interface VariableEntry {
  /**
   * Mode-less token path (`color.red.5`). Always valid inside `{alias}`
   * references: single-mode variables emit it directly and multi-mode
   * variables emit a base token at this path aliasing the default mode.
   */
  path: string;
  variable: PodoCloneVariable;
}

type ModeClassification =
  | { kind: "single" }
  | { kind: "scheme" | "theme" | "custom"; segments: Map<string, string> };

function classifyModes(collection: PodoCloneCollection): ModeClassification | undefined {
  if (collection.modes.length === 1) {
    return { kind: "single" };
  }
  const segments = new Map<string, string>();
  for (const mode of collection.modes) {
    const segment = sanitizeSegment(mode.name.toLowerCase());
    if (!segment) {
      return undefined;
    }
    segments.set(mode.modeId, segment);
  }
  const names = [...segments.values()];
  if (names.every((name) => KNOWN_COLOR_SCHEMES.has(name))) {
    return { kind: "scheme", segments };
  }
  if (names.every((name) => KNOWN_THEMES.has(name))) {
    return { kind: "theme", segments };
  }
  return { kind: "custom", segments };
}

function buildVariableIndex(
  document: PodoCloneDocument,
  warnings: string[]
): Map<string, VariableEntry> {
  const index = new Map<string, VariableEntry>();
  const usedPaths = new Map<string, string>();

  for (const collection of document.variables) {
    for (const variable of collection.variables) {
      const path = sanitizePath(variable.name);
      if (!path) {
        warnings.push(
          `Variable "${variable.name}" (${collection.name}) has no usable token path; skipped.`
        );
        continue;
      }
      const owner = usedPaths.get(path);
      if (owner) {
        warnings.push(
          `Variable "${variable.name}" in collection "${collection.name}" collides with the same path from collection "${owner}"; skipped.`
        );
        continue;
      }
      usedPaths.set(path, collection.name);
      index.set(variable.id, { path, variable });
    }
  }

  return index;
}

function convertCollection(
  collection: PodoCloneCollection,
  index: Map<string, VariableEntry>,
  warnings: string[]
): ConvertedFile | undefined {
  const modes = classifyModes(collection);
  if (!modes) {
    warnings.push(`Collection "${collection.name}" has unusable mode names; skipped.`);
    return undefined;
  }
  if (modes.kind === "custom") {
    warnings.push(
      `Collection "${collection.name}" modes (${collection.modes
        .map((mode) => mode.name)
        .join(
          ", "
        )}) are not Podo color schemes or themes; values are emitted under plain mode prefixes and the base token follows the default mode.`
    );
  }
  const defaultModeSegment =
    modes.kind === "single"
      ? undefined
      : (modes.segments.get(collection.defaultModeId) ?? [...modes.segments.values()][0]!);

  const tree: TokenTree = {};
  const reportCollision = (path: string) =>
    warnings.push(
      `Collection "${collection.name}": token path "${path}" was overwritten by a colliding path.`
    );
  let count = 0;
  for (const variable of collection.variables) {
    const entry = index.get(variable.id);
    if (!entry) {
      continue; // skipped during indexing (collision / unusable name)
    }
    const type = tokenTypeFor(variable);
    if (!type) {
      warnings.push(
        `Variable "${variable.name}" (${collection.name}) has type ${variable.resolvedType}, which has no Podo token type; skipped.`
      );
      continue;
    }
    let emittedModes = 0;
    for (const mode of collection.modes) {
      const raw = variable.valuesByMode[mode.modeId];
      if (!raw) {
        warnings.push(`Variable "${variable.name}" has no value for mode "${mode.name}"; skipped.`);
        continue;
      }
      const value = convertVariableValue(raw, type, index, variable, warnings);
      if (value === undefined) {
        continue;
      }
      const segments =
        modes.kind === "single"
          ? entry.path.split(".")
          : [modes.segments.get(mode.modeId)!, ...entry.path.split(".")];
      setToken(tree, segments, { $type: type, $value: value }, reportCollision);
      count += 1;
      emittedModes += 1;
    }
    // Mode-less base token: aliases the default mode so `{path}` references
    // (component bindings, cross-variable aliases) resolve before projection.
    if (defaultModeSegment && emittedModes > 0) {
      setToken(
        tree,
        entry.path.split("."),
        {
          $type: type,
          $value: `{${defaultModeSegment}.${entry.path}}`,
        },
        reportCollision
      );
      count += 1;
    }
  }

  if (count === 0) {
    warnings.push(`Collection "${collection.name}" produced no tokens; skipped.`);
    return undefined;
  }

  const name = sanitizeSegment(collection.name.toLowerCase()) ?? "collection";
  const isTheme = modes.kind === "scheme" || modes.kind === "theme" || name === "theme";
  const category = isTheme
    ? "theme"
    : TOKEN_CATEGORIES.has(name)
      ? (name as TokenDocument["category"])
      : "primitive";
  const directory = isTheme ? ".podo/themes" : ".podo/tokens";
  const document = parseTokenDocument({
    schemaVersion: PODO_SCHEMA_VERSION,
    kind: "tokens",
    category,
    tokens: tree,
  });
  return { path: `${directory}/figma-${name}.json`, document };
}

function tokenTypeFor(variable: PodoCloneVariable): DesignToken["$type"] | undefined {
  const scopes = new Set(variable.scopes);
  switch (variable.resolvedType) {
    case "COLOR":
      return "color";
    case "STRING":
      return scopes.has("FONT_FAMILY") ? "fontFamily" : "string";
    case "FLOAT":
      if (scopes.has("CORNER_RADIUS")) {
        return "radius";
      }
      if (scopes.has("GAP") || scopes.has("PARAGRAPH_SPACING")) {
        return "spacing";
      }
      if (scopes.has("FONT_WEIGHT")) {
        return "fontWeight";
      }
      if (
        ["FONT_SIZE", "LINE_HEIGHT", "LETTER_SPACING", "WIDTH_HEIGHT", "STROKE_FLOAT"].some(
          (scope) => scopes.has(scope)
        )
      ) {
        return "dimension";
      }
      return "number";
    case "BOOLEAN":
      return undefined;
  }
}

function convertVariableValue(
  raw: PodoCloneVariable["valuesByMode"][string],
  type: DesignToken["$type"],
  index: Map<string, VariableEntry>,
  variable: PodoCloneVariable,
  warnings: string[]
): string | number | undefined {
  if (raw.kind === "alias") {
    const target = index.get(raw.id);
    if (!target) {
      warnings.push(
        `Variable "${variable.name}" aliases an unknown or skipped variable (${raw.id}); skipped.`
      );
      return undefined;
    }
    return `{${target.path}}`;
  }
  if (typeof raw.value === "object") {
    return rgbaToCss(raw.value.r, raw.value.g, raw.value.b, raw.value.a);
  }
  if (typeof raw.value === "boolean") {
    return undefined;
  }
  if (typeof raw.value === "number") {
    if (type === "number" || type === "fontWeight") {
      return roundValue(raw.value);
    }
    return px(raw.value);
  }
  return raw.value;
}

// -------------------------------------------------------------------- styles

function convertStyles(document: PodoCloneDocument, warnings: string[]): ConvertedFile | undefined {
  const tree: TokenTree = {};
  const reportCollision = (path: string) =>
    warnings.push(`Styles: token path "${path}" was overwritten by a colliding style name.`);
  let count = 0;

  for (const style of document.styles.text) {
    const token = convertTextStyle(style, warnings);
    const segments = sanitizeSegments(style.name);
    if (!token || segments.length === 0) {
      continue;
    }
    setToken(tree, ["typography", ...segments], token, reportCollision);
    count += 1;
  }

  for (const style of document.styles.effect) {
    const shadows = style.effects.filter((effect) => effect.type === "DROP_SHADOW");
    const skipped = style.effects.length - shadows.length;
    if (skipped > 0) {
      warnings.push(
        `Effect style "${style.name}": ${skipped} non-drop-shadow effect(s) were not imported.`
      );
    }
    if (shadows.length === 0) {
      continue;
    }
    if (shadows.length > 1) {
      warnings.push(
        `Effect style "${style.name}" has ${shadows.length} drop shadows; only the first was imported.`
      );
    }
    const token = convertShadow(shadows[0]!, style.name, warnings);
    const segments = sanitizeSegments(style.name);
    if (!token || segments.length === 0) {
      continue;
    }
    setToken(tree, ["shadow", ...segments], token, reportCollision);
    count += 1;
  }

  if (document.styles.paint.length > 0 || document.styles.grid.length > 0) {
    warnings.push(
      `${document.styles.paint.length + document.styles.grid.length} paint/grid style(s) were not imported.`
    );
  }
  if (count === 0) {
    return undefined;
  }

  const parsed = parseTokenDocument({
    schemaVersion: PODO_SCHEMA_VERSION,
    kind: "tokens",
    category: "semantic",
    tokens: tree,
  });
  return { path: ".podo/tokens/figma-styles.json", document: parsed };
}

function convertTextStyle(style: PodoCloneTextStyle, warnings: string[]): DesignToken | undefined {
  const weightKey = style.fontName.style.toLowerCase().replace(/\s+|italic/g, "");
  const fontWeight = FONT_WEIGHTS[weightKey];
  if (fontWeight === undefined) {
    warnings.push(
      `Text style "${style.name}": unknown font weight "${style.fontName.style}"; defaulted to 400.`
    );
  }

  let lineHeight: string;
  if (style.lineHeight.unit === "PIXELS" && style.lineHeight.value !== undefined) {
    lineHeight = px(style.lineHeight.value);
  } else if (style.lineHeight.unit === "PERCENT" && style.lineHeight.value !== undefined) {
    lineHeight = `${roundValue(style.lineHeight.value)}%`;
  } else {
    warnings.push(`Text style "${style.name}": AUTO line height mapped to 100%.`);
    lineHeight = "100%";
  }

  const letterSpacing =
    style.letterSpacing.unit === "PERCENT"
      ? `${roundValue(style.letterSpacing.value / 100)}em`
      : px(style.letterSpacing.value);

  const value: Record<string, unknown> = {
    fontFamily: style.fontName.family,
    fontSize: px(style.fontSize),
    lineHeight,
    fontWeight: fontWeight ?? 400,
    letterSpacing,
  };
  if (style.paragraphSpacing > 0) {
    value.paragraphSpacing = px(style.paragraphSpacing);
  }
  return { $type: "typography", $value: value };
}

function convertShadow(
  effect: PodoCloneEffect,
  styleName: string,
  warnings: string[]
): DesignToken | undefined {
  const value = effect.value;
  const offset = value.offset as { x?: unknown; y?: unknown } | undefined;
  const color = value.color as { r?: number; g?: number; b?: number; a?: number } | undefined;
  if (
    typeof offset?.x !== "number" ||
    typeof offset.y !== "number" ||
    typeof value.radius !== "number" ||
    typeof color?.r !== "number"
  ) {
    warnings.push(`Effect style "${styleName}": unexpected drop shadow shape; skipped.`);
    return undefined;
  }
  return {
    $type: "shadow",
    $value: {
      x: px(offset.x),
      y: px(offset.y),
      blur: px(value.radius),
      spread: px(typeof value.spread === "number" ? value.spread : 0),
      color: rgbaToCss(color.r, color.g ?? 0, color.b ?? 0, color.a ?? 1),
    },
  };
}

// ---------------------------------------------------------------- components

function convertComponents(
  document: PodoCloneDocument,
  index: Map<string, VariableEntry>,
  warnings: string[]
): ConvertedFile[] {
  const files: ConvertedFile[] = [];
  const usedIds = new Map<string, number>();

  for (const page of document.pages) {
    for (const item of page.items) {
      const node = item.node;
      if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
        continue;
      }
      // Icon-* 세트는 컴포넌트 스펙이 아니라 아이콘 파이프라인(manifest)으로 간다.
      if (ICON_SET_PREFIX.test(node.name)) {
        continue;
      }
      let id = sanitizeIdentifier(node.name);
      if (!id) {
        warnings.push(`Component "${node.name}" has no usable identifier; skipped.`);
        continue;
      }
      const seen = usedIds.get(id) ?? 0;
      usedIds.set(id, seen + 1);
      if (seen > 0) {
        warnings.push(`Duplicate component name "${node.name}"; imported as "${id}-${seen + 1}".`);
        id = `${id}-${seen + 1}`;
      }

      const converted = convertComponent(node, id, index, warnings);
      if (converted) {
        files.push({
          path: `.podo/components/local/${id}.component.json`,
          document: converted,
        });
      }
    }
  }

  return files;
}

function convertComponent(
  node: PodoCloneNode,
  id: string,
  index: Map<string, VariableEntry>,
  warnings: string[]
): ComponentDocument | undefined {
  const meta = node.componentSet ?? node.component;
  const propertyDefs = meta?.propertyDefs ?? [];

  const variants: unknown[] = [];
  const props: unknown[] = [];
  const slots: unknown[] = [];
  const seenNames = new Set<string>();

  for (const def of propertyDefs) {
    const baseName = def.name.split("#")[0] ?? def.name;
    if (def.type === "VARIANT") {
      const axis = sanitizeIdentifier(baseName);
      if (!axis || seenNames.has(axis)) {
        warnings.push(`Component "${node.name}": variant axis "${def.name}" skipped.`);
        continue;
      }
      seenNames.add(axis);
      variants.push({
        name: axis,
        values: def.variantOptions ?? [],
        ...(typeof def.defaultValue === "string" ? { default: def.defaultValue } : {}),
      });
      continue;
    }
    const name = sanitizeIdentifier(baseName);
    if (!name || seenNames.has(name)) {
      warnings.push(`Component "${node.name}": property "${def.name}" skipped.`);
      continue;
    }
    seenNames.add(name);
    if (def.type === "BOOLEAN") {
      props.push({
        name,
        type: { kind: "boolean" },
        ...(typeof def.defaultValue === "boolean" ? { default: def.defaultValue } : {}),
      });
    } else if (def.type === "TEXT") {
      props.push({
        name,
        type: { kind: "string" },
        ...(typeof def.defaultValue === "string" ? { default: def.defaultValue } : {}),
      });
    } else {
      // INSTANCE_SWAP / SLOT: swappable content maps to a slot.
      slots.push({ name, required: false });
    }
  }

  const source = defaultVariantNode(node, propertyDefs);
  const tokens: Record<string, string> = {};
  const label = source ? findText(source) : undefined;
  if (source) {
    const context = (part: string) => ({ componentName: node.name, part, warnings });
    const background = bindingFromPaints(
      source.fills ?? undefined,
      index,
      context("root.background")
    );
    if (background) {
      tokens["root.background"] = background;
    }
    const border = bindingFromPaints(source.strokes, index, context("root.borderColor"));
    if (border) {
      tokens["root.borderColor"] = border;
    }
    const radius = radiusBinding(source, index);
    if (radius) {
      tokens["root.radius"] = radius;
    }
    if (label) {
      const color = bindingFromPaints(label.fills ?? undefined, index, context("label.color"));
      if (color) {
        tokens["label.color"] = color;
      }
    }
  } else {
    warnings.push(`Component "${node.name}": no variant child found; no token bindings derived.`);
  }

  const draft = {
    schemaVersion: PODO_SCHEMA_VERSION,
    kind: "component",
    id,
    name: node.name,
    category: "atom",
    status: "draft",
    ...(meta?.description ? { description: meta.description } : {}),
    anatomy: [{ name: "root" }, ...(label ? [{ name: "label" }] : [])],
    slots,
    props,
    variants,
    states: [],
    tokens,
    targets: {
      web: { supported: true, limitations: [] },
      react: { supported: true, limitations: [] },
      hono: { supported: true, limitations: [] },
      native: { supported: true, limitations: [] },
    },
    accessibility: { aria: [], keyboard: [] },
  };

  try {
    return parseComponentDocument(draft);
  } catch (error) {
    warnings.push(
      `Component "${node.name}" could not be converted to a valid spec; skipped. ${firstIssue(error)}`
    );
    return undefined;
  }
}

/** For a set: the child matching every VARIANT default (else the first child). */
function defaultVariantNode(
  node: PodoCloneNode,
  propertyDefs: { name: string; type: string; defaultValue?: boolean | string | undefined }[]
): PodoCloneNode | undefined {
  if (node.type === "COMPONENT") {
    return node;
  }
  const defaults = new Map(
    propertyDefs
      .filter((def) => def.type === "VARIANT" && typeof def.defaultValue === "string")
      .map((def) => [def.name, def.defaultValue as string])
  );
  const match = node.children?.find((child) => {
    const pairs = new Map(
      child.name.split(",").map((pair) => {
        const [key, ...rest] = pair.split("=");
        return [key?.trim() ?? "", rest.join("=").trim()] as const;
      })
    );
    return [...defaults].every(([axis, value]) => pairs.get(axis) === value);
  });
  return match ?? node.children?.[0];
}

function findText(node: PodoCloneNode): PodoCloneNode | undefined {
  if (node.type === "TEXT") {
    return node;
  }
  for (const child of node.children ?? []) {
    const found = findText(child);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/** Alias binding when the paint has a bound variable, literal color otherwise. */
function bindingFromPaints(
  paints: PodoClonePaint[] | undefined,
  index: Map<string, VariableEntry>,
  context: { componentName: string; part: string; warnings: string[] }
): string | undefined {
  const solid = paints?.find(
    (paint): paint is Extract<PodoClonePaint, { type: "SOLID" }> =>
      paint.type === "SOLID" && paint.visible !== false
  );
  if (!solid) {
    return undefined;
  }
  const boundId = solid.bound?.color;
  const entry = boundId ? index.get(boundId) : undefined;
  if (entry) {
    return `{${entry.path}}`;
  }
  if (boundId) {
    context.warnings.push(
      `Component "${context.componentName}": ${context.part} is bound to an unknown or skipped variable (${boundId}); the literal color was imported instead.`
    );
  }
  const alpha = solid.opacity ?? 1;
  return rgbaToCss(solid.color.r, solid.color.g, solid.color.b, alpha);
}

const RADIUS_BOUND_KEYS = [
  "topLeftRadius",
  "topRightRadius",
  "bottomLeftRadius",
  "bottomRightRadius",
];

function radiusBinding(node: PodoCloneNode, index: Map<string, VariableEntry>): string | undefined {
  const bound = node.bound ?? {};
  const ids = RADIUS_BOUND_KEYS.map((key) => bound[key]).filter(
    (value): value is string => typeof value === "string"
  );
  const [first] = ids;
  if (!first || !ids.every((value) => value === first)) {
    return undefined;
  }
  const entry = index.get(first);
  return entry ? `{${entry.path}}` : undefined;
}

// --------------------------------------------------------------------- icons

const ICON_SET_PREFIX = /^icon-/i;

/**
 * `Icon-*` component sets → inline-SVG icon manifest.
 *
 * Each variant child becomes one icon (axis `name`, e.g. Icon-arrow/name=left
 * → `arrow-left`); a `size` axis contributes only its default value. Vector
 * children serialize via vectorPaths into a currentColor SVG; codepoints are
 * assigned sequentially over the sorted final name list (re-import regenerates
 * manifest + codepointLock together, so the lock stays self-consistent).
 */
function convertIcons(document: PodoCloneDocument, warnings: string[]): ConvertedFile[] {
  const icons = new Map<string, string>();

  for (const page of document.pages) {
    for (const item of page.items) {
      const node = item.node;
      if (
        (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") ||
        !ICON_SET_PREFIX.test(node.name)
      ) {
        continue;
      }
      const suffix = sanitizeIdentifier(node.name.replace(ICON_SET_PREFIX, ""));
      if (!suffix) {
        warnings.push(`Icon set "${node.name}" has no usable icon name; skipped.`);
        continue;
      }
      const defaultSize = defaultVariantValue(node, "size");
      const children = node.type === "COMPONENT_SET" ? (node.children ?? [node]) : [node];
      for (const child of children) {
        const pairs = parseVariantPairs(child.name);
        const size = pairs.get("size");
        if (defaultSize && size && size !== defaultSize) {
          continue;
        }
        const variantValue = pairs.get("name");
        let iconName = suffix;
        if (variantValue) {
          const variant = sanitizeIdentifier(variantValue);
          if (!variant) {
            warnings.push(`Icon "${node.name}/${child.name}": unusable variant name; skipped.`);
            continue;
          }
          if (variant !== suffix) {
            iconName = `${suffix}-${variant}`;
          }
        }
        if (icons.has(iconName)) {
          warnings.push(`Duplicate icon name "${iconName}" (from "${node.name}"); skipped.`);
          continue;
        }
        const svg = iconSvgFromNode(child, `${node.name}/${child.name}`, warnings);
        if (svg) {
          icons.set(iconName, svg);
        }
      }
    }
  }

  if (icons.size === 0) {
    return [];
  }

  const names = [...icons.keys()].sort();
  const manifestIcons: Record<string, unknown> = {};
  const codepointLock: Record<string, string> = {};
  // 인라인 svg manifest는 브라우저 에디터 규칙상 임베디드 폰트를 요구하므로
  // CLI 세계 관례인 파일 기반(source) manifest + svg 파일로 낸다.
  const svgFiles: ConvertedFile[] = names.map((name) => ({
    path: `.podo/icons/svg/figma/${name}.svg`,
    contents: `${icons.get(name)!}\n`,
  }));
  names.forEach((name, index) => {
    const codepoint = (0xe001 + index).toString(16).toUpperCase();
    manifestIcons[name] = { source: `figma/${name}.svg`, codepoint, tags: ["figma"] };
    codepointLock[name] = codepoint;
  });

  let manifest: IconManifest;
  try {
    manifest = parseIconManifest({
      schemaVersion: PODO_SCHEMA_VERSION,
      kind: "icons",
      fontFamily: "PodoIcons",
      icons: manifestIcons,
      groups: { figma: names },
      codepointLock,
    });
  } catch (error) {
    warnings.push(`Icon manifest could not be assembled; icons skipped. ${firstIssue(error)}`);
    return [];
  }
  const issues = validateIconManifest(manifest);
  if (issues.length > 0) {
    warnings.push(
      `Icon manifest failed validation; icons skipped. ${issues
        .slice(0, 3)
        .map((item) => item.message)
        .join(" ")}`
    );
    return [];
  }

  warnings.push(`${names.length} Figma icon component(s) imported into the icon manifest.`);
  return [{ path: ".podo/icons/manifest.json", document: manifest }, ...svgFiles];
}

function parseVariantPairs(name: string): Map<string, string> {
  const pairs = new Map<string, string>();
  if (!name.includes("=")) {
    return pairs;
  }
  for (const pair of name.split(",")) {
    const [key, ...rest] = pair.split("=");
    if (key && rest.length > 0) {
      pairs.set(key.trim(), rest.join("=").trim());
    }
  }
  return pairs;
}

function defaultVariantValue(node: PodoCloneNode, axis: string): string | undefined {
  const defs = (node.componentSet ?? node.component)?.propertyDefs ?? [];
  const def = defs.find((item) => item.type === "VARIANT" && item.name === axis);
  return typeof def?.defaultValue === "string" ? def.defaultValue : undefined;
}

/**
 * Serialize an icon component's vector children into a currentColor SVG.
 *
 * Podo icons are authored as STROKE centerlines (24px outline set,
 * stroke-width ~1.2, round caps/joins) — the icon font build expands strokes
 * into fills (`@podoui/icon-build` stroke.ts), so the extracted source must
 * preserve stroke attributes instead of force-filling open paths.
 */
function iconSvgFromNode(
  node: PodoCloneNode,
  label: string,
  warnings: string[]
): string | undefined {
  const shapes: string[] = [];
  let unsupported = false;

  // SVG matrix(a b c d e f) 표기: x' = a·x + c·y + e, y' = b·x + d·y + f.
  const IDENTITY: readonly number[] = [1, 0, 0, 1, 0, 0];
  const fromRelativeTransform = (rt: number[][]): number[] => [
    rt[0]?.[0] ?? 1,
    rt[1]?.[0] ?? 0,
    rt[0]?.[1] ?? 0,
    rt[1]?.[1] ?? 1,
    rt[0]?.[2] ?? 0,
    rt[1]?.[2] ?? 0,
  ];
  const compose = (m: readonly number[], n: readonly number[]): number[] => [
    m[0]! * n[0]! + m[2]! * n[1]!,
    m[1]! * n[0]! + m[3]! * n[1]!,
    m[0]! * n[2]! + m[2]! * n[3]!,
    m[1]! * n[2]! + m[3]! * n[3]!,
    m[0]! * n[4]! + m[2]! * n[5]! + m[4]!,
    m[1]! * n[4]! + m[3]! * n[5]! + m[5]!,
  ];

  const walk = (current: PodoCloneNode, parentMatrix: readonly number[]): void => {
    for (const child of current.children ?? []) {
      // 회전/미러 변형(방향 변형 아이콘 등)까지 보존해야 하므로 평행이동만이
      // 아니라 2×3 아핀 행렬 전체를 합성해 path 데이터에 직접 굽는다 —
      // 글리프 파이프라인(stroke.ts)은 transform 속성을 해석하지 않는다.
      const matrix = compose(parentMatrix, fromRelativeTransform(child.relativeTransform));
      if (child.vector?.vectorPaths?.length) {
        const paint = vectorPaintAttributes(child);
        if (!paint) {
          warnings.push(`Icon "${label}": a vector child has no visible fill or stroke; skipped.`);
          unsupported = true;
        } else {
          for (const path of child.vector.vectorPaths) {
            const data = svgpath(path.data).matrix(matrix).round(4).toString();
            const fillRule =
              paint.kind === "fill" && path.windingRule === "EVENODD" ? ' fill-rule="evenodd"' : "";
            shapes.push(`<path d="${data}"${paint.attributes}${fillRule}/>`);
          }
        }
      } else if (child.vector?.svg) {
        // Complex vector networks fall back to whole-node SVG markup, which we
        // cannot safely inline into a composed glyph — skip the icon honestly.
        unsupported = true;
      }
      walk(child, matrix);
    }
  };
  walk(node, IDENTITY);

  if (unsupported || shapes.length === 0) {
    warnings.push(
      `Icon "${label}" could not be vector-serialized (${unsupported ? "complex vector network" : "no vector children"}); skipped.`
    );
    return undefined;
  }
  const width = roundValue(node.width);
  const height = roundValue(node.height);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${shapes.join("")}</svg>`;
}

/** fill/stroke presentation attributes for one vector node (currentColor). */
function vectorPaintAttributes(
  node: PodoCloneNode
): { kind: "fill" | "stroke"; attributes: string } | undefined {
  const visibleSolid = (paints?: PodoClonePaint[] | null): boolean =>
    (paints ?? []).some((paint) => paint.type === "SOLID" && paint.visible !== false);

  if (visibleSolid(node.fills)) {
    return { kind: "fill", attributes: ' fill="currentColor"' };
  }
  if (visibleSolid(node.strokes)) {
    const weight = typeof node.props.strokeWeight === "number" ? node.props.strokeWeight : 1;
    const cap = typeof node.props.strokeCap === "string" ? node.props.strokeCap.toLowerCase() : "";
    const join =
      typeof node.props.strokeJoin === "string" ? node.props.strokeJoin.toLowerCase() : "";
    const capAttr = cap === "round" || cap === "square" ? ` stroke-linecap="${cap}"` : "";
    const joinAttr = join === "round" || join === "bevel" ? ` stroke-linejoin="${join}"` : "";
    return {
      kind: "stroke",
      attributes: ` fill="none" stroke="currentColor" stroke-width="${roundValue(weight)}"${capAttr}${joinAttr}`,
    };
  }
  return undefined;
}

// ------------------------------------------------------------------- helpers

function setToken(
  tree: TokenTree,
  segments: string[],
  token: DesignToken,
  onCollision?: (path: string) => void
): void {
  let cursor: TokenTree = tree;
  const walked: string[] = [];
  for (const segment of segments.slice(0, -1)) {
    walked.push(segment);
    const existing = cursor[segment];
    if (!existing || "$type" in existing) {
      // A token here means one path is a prefix of another (color.blue vs
      // color.blue.50) — the leaf is clobbered into a group; report it.
      if (existing) {
        onCollision?.(walked.join("."));
      }
      cursor[segment] = {};
    }
    cursor = cursor[segment] as TokenTree;
  }
  const leaf = segments.at(-1)!;
  // Existing group (prefix collision) or token (duplicate sanitized name).
  if (cursor[leaf]) {
    onCollision?.(segments.join("."));
  }
  cursor[leaf] = token;
}

function sanitizeSegment(value: string): string | undefined {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || undefined;
}

function sanitizeSegments(name: string): string[] {
  return name
    .split("/")
    .map((segment) => sanitizeSegment(segment))
    .filter((segment): segment is string => Boolean(segment));
}

function sanitizePath(name: string): string | undefined {
  const segments = sanitizeSegments(name);
  return segments.length > 0 ? segments.join(".") : undefined;
}

/** kebab-case matching the spec identifier schema (`button`, `field-footer`). */
function sanitizeIdentifier(value: string): string | undefined {
  const kebab = value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/g, "")
    .replace(/-{2,}/g, "-");
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(kebab) ? kebab : undefined;
}

function roundValue(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function px(value: number): string {
  return `${roundValue(value)}px`;
}

function rgbaToCss(r: number, g: number, b: number, a: number): string {
  const channel = (value: number): string =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, "0");
  const base = `#${channel(r)}${channel(g)}${channel(b)}`;
  return a >= 1 ? base : `${base}${channel(a)}`;
}

function firstIssue(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.split("\n").slice(0, 3).join(" ").slice(0, 300);
}
