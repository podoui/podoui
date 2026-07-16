/**
 * Podo Cloner — shared ORDERED per-type node property table.
 *
 * Both directions walk this one table: the export serializer
 * (src/export/nodes.ts) reads every listed property into NodeData.props and
 * the import builder (src/import/nodes.ts) assigns them back. A property
 * round-trips if and only if it is listed here (paints / effects / text
 * content / bound variables / style ids use dedicated NodeData fields, not
 * this table).
 *
 * Ordering rules encoded here (SPEC.md "Hard ordering rules" #4):
 *
 * - 'pre' entries apply right after node creation, BEFORE the node is
 *   appended to its parent. `layoutMode` comes first in the auto-layout
 *   block: `layoutWrap`, sizing modes, alignment, padding and spacing
 *   setters are only applicable once layoutMode is HORIZONTAL / VERTICAL.
 * - 'post' entries apply AFTER the node has been appended to its parent:
 *   layoutAlign / layoutGrow / layoutPositioning / layoutSizing* and
 *   min/max sizes are only valid on children of auto-layout frames (setting
 *   them when they do not apply throws — see applyNodeProps guards).
 * - Mixed-capable aggregates (cornerRadius, strokeWeight) are listed before
 *   their per-part fields (topLeftRadius..., strokeTopWeight...): a uniform
 *   value applies first and the per-part fields refine it. When the source
 *   value is figma.mixed the aggregate is skipped on export and the per-part
 *   fields carry the truth.
 *
 * TEXT caveat: the import builder applies the text content pipeline (fonts +
 * characters + segments) BEFORE this table's 'pre' phase — every TEXT block
 * property setter (textAlignHorizontal, paragraphSpacing, ...) requires the
 * node's fonts to be loaded.
 *
 * Deliberately NOT serialized (measured inventory has none, and they carry
 * document-behavior rather than component-visual state): layoutGrids,
 * guides, overflowDirection, exportSettings, constrainProportions,
 * numberOfFixedChildren, expanded.
 */

export type PropPhase = 'pre' | 'post';

export interface PropEntry {
  key: string;
  phase: PropPhase;
}

export type WarnFn = (message: string) => void;

function pre(key: string): PropEntry {
  return { key, phase: 'pre' };
}

function post(key: string): PropEntry {
  return { key, phase: 'post' };
}

// --------------------------------------------------------- building blocks

const SCENE: PropEntry[] = [pre('visible'), pre('locked')];

const BLEND: PropEntry[] = [pre('opacity'), pre('blendMode'), pre('isMask'), pre('maskType')];

/** layoutMode FIRST; wrap-dependent props after layoutWrap. */
const AUTO_LAYOUT: PropEntry[] = [
  pre('layoutMode'),
  pre('layoutWrap'),
  pre('primaryAxisSizingMode'),
  pre('counterAxisSizingMode'),
  pre('primaryAxisAlignItems'),
  pre('counterAxisAlignItems'),
  pre('counterAxisAlignContent'),
  pre('paddingLeft'),
  pre('paddingRight'),
  pre('paddingTop'),
  pre('paddingBottom'),
  pre('itemSpacing'),
  pre('counterAxisSpacing'),
  pre('itemReverseZIndex'),
  pre('strokesIncludedInLayout')
];

const FRAME_MISC: PropEntry[] = [pre('clipsContent')];

const CORNER: PropEntry[] = [pre('cornerRadius'), pre('cornerSmoothing')];

const RECT_CORNERS: PropEntry[] = [
  pre('topLeftRadius'),
  pre('topRightRadius'),
  pre('bottomLeftRadius'),
  pre('bottomRightRadius')
];

const STROKE: PropEntry[] = [
  pre('strokeWeight'),
  pre('strokeAlign'),
  pre('strokeCap'),
  pre('strokeJoin'),
  pre('strokeMiterLimit'),
  pre('dashPattern')
];

const STROKE_SIDES: PropEntry[] = [
  pre('strokeTopWeight'),
  pre('strokeRightWeight'),
  pre('strokeBottomWeight'),
  pre('strokeLeftWeight')
];

/**
 * TEXT block-level properties. Import must load the node's fonts (the text
 * pipeline does) before applying these. textAutoResize before textTruncation
 * before maxLines (maxLines only applies when truncation is ENDING).
 * autoRename is last: the pipeline force-disables it before writing
 * characters so the serialized node name survives.
 */
const TEXT_BLOCK: PropEntry[] = [
  pre('textAlignHorizontal'),
  pre('textAlignVertical'),
  pre('textAutoResize'),
  pre('textTruncation'),
  pre('maxLines'),
  pre('paragraphIndent'),
  pre('paragraphSpacing'),
  pre('listSpacing'),
  pre('hangingPunctuation'),
  pre('hangingList'),
  pre('autoRename')
];

/** Only valid once the node is a child of an auto-layout frame. */
const LAYOUT_CHILD: PropEntry[] = [
  post('layoutAlign'),
  post('layoutGrow'),
  post('layoutPositioning'),
  post('layoutSizingHorizontal'),
  post('layoutSizingVertical')
];

const MIN_MAX: PropEntry[] = [post('minWidth'), post('maxWidth'), post('minHeight'), post('maxHeight')];

const CONSTRAINTS: PropEntry[] = [post('constraints')];

// ------------------------------------------------------------ per-type map

const FRAME_LIKE: PropEntry[] = [
  ...SCENE,
  ...BLEND,
  ...AUTO_LAYOUT,
  ...FRAME_MISC,
  ...CORNER,
  ...RECT_CORNERS,
  ...STROKE,
  ...STROKE_SIDES,
  ...LAYOUT_CHILD,
  ...MIN_MAX,
  ...CONSTRAINTS
];

/**
 * INSTANCE uses a reduced table: auto-layout / clipsContent are driven by the
 * main component and their setters throw on instances. Only override-safe
 * own-props plus auto-layout-child placement props are listed.
 */
const INSTANCE_TABLE: PropEntry[] = [
  ...SCENE,
  ...BLEND,
  ...CORNER,
  ...RECT_CORNERS,
  ...STROKE,
  ...STROKE_SIDES,
  ...LAYOUT_CHILD,
  ...MIN_MAX,
  ...CONSTRAINTS
];

const TABLE: Record<string, PropEntry[]> = {
  FRAME: FRAME_LIKE,
  COMPONENT: FRAME_LIKE,
  COMPONENT_SET: FRAME_LIKE,
  SLOT: FRAME_LIKE,
  INSTANCE: INSTANCE_TABLE,
  RECTANGLE: [
    ...SCENE,
    ...BLEND,
    ...CORNER,
    ...RECT_CORNERS,
    ...STROKE,
    ...STROKE_SIDES,
    ...LAYOUT_CHILD,
    ...MIN_MAX,
    ...CONSTRAINTS
  ],
  ELLIPSE: [
    ...SCENE,
    ...BLEND,
    pre('arcData'),
    ...CORNER,
    ...STROKE,
    ...LAYOUT_CHILD,
    ...MIN_MAX,
    ...CONSTRAINTS
  ],
  // LineNode has no CornerMixin / IndividualStrokesMixin; height is always 0.
  LINE: [...SCENE, ...BLEND, ...STROKE, ...LAYOUT_CHILD, ...MIN_MAX, ...CONSTRAINTS],
  VECTOR: [...SCENE, ...BLEND, ...CORNER, ...STROKE, ...LAYOUT_CHILD, ...MIN_MAX, ...CONSTRAINTS],
  // booleanOperation first so import can normalize the op created via
  // figma.union(); BooleanOperationNode has no ConstraintMixin.
  BOOLEAN_OPERATION: [
    ...SCENE,
    ...BLEND,
    pre('booleanOperation'),
    ...CORNER,
    ...STROKE,
    ...LAYOUT_CHILD,
    ...MIN_MAX
  ],
  TEXT: [
    ...SCENE,
    ...BLEND,
    ...STROKE,
    ...TEXT_BLOCK,
    ...LAYOUT_CHILD,
    ...MIN_MAX,
    ...CONSTRAINTS
  ]
};

/** Minimal fallback for node types outside the measured inventory. */
const FALLBACK: PropEntry[] = [...SCENE, ...BLEND];

export function propEntriesFor(type: string): readonly PropEntry[] {
  return TABLE[type] ?? FALLBACK;
}

/**
 * Props that are legal to re-apply on nodes INSIDE an instance subtree
 * (the SPEC "override-safe" set). Layout/auto-layout props are main-driven
 * and throw on instance sublayers.
 */
export const OVERRIDE_SAFE_PROPS: readonly string[] = [
  'visible',
  'locked',
  'opacity',
  'blendMode',
  'cornerRadius',
  'cornerSmoothing',
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
  'strokeWeight',
  'strokeAlign',
  'strokeCap',
  'strokeJoin',
  'strokeMiterLimit',
  'dashPattern',
  'strokeTopWeight',
  'strokeRightWeight',
  'strokeBottomWeight',
  'strokeLeftWeight'
];

// ------------------------------------------------------------------ helpers

/**
 * Deep JSON-safe clone of a plugin-API value. Drops symbols (figma.mixed),
 * functions and undefined members; readonly arrays become plain arrays.
 */
export function toPlain(value: unknown): unknown {
  if (value === null) return null;
  const t = typeof value;
  if (t === 'number' || t === 'string' || t === 'boolean') return value;
  if (t === 'symbol' || t === 'function' || value === undefined) return undefined;
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      const plain = toPlain(item);
      out.push(plain === undefined ? null : plain);
    }
    return out;
  }
  if (t === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const plain = toPlain((value as Record<string, unknown>)[key]);
      if (plain !== undefined) out[key] = plain;
    }
    return out;
  }
  return undefined;
}

/**
 * EXPORT SIDE — read every table property present on the node into a plain
 * JSON-safe bag. figma.mixed aggregates are skipped (their per-part fields,
 * also in the table, carry the values); null values are skipped ("unset"
 * semantics: minWidth null, maxLines null, ...).
 */
export function readNodeProps(node: SceneNode, type: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const bag = node as unknown as Record<string, unknown>;
  for (const entry of propEntriesFor(type)) {
    if (!(entry.key in node)) continue;
    const value = bag[entry.key];
    if (value === undefined || value === null) continue;
    if (value === figma.mixed) continue; // per-part fields carry mixed values
    const plain = toPlain(value);
    if (plain !== undefined) out[entry.key] = plain;
  }
  return out;
}

/**
 * Deterministic JSON encoding (sorted object keys) of a toPlain()-safe value.
 * Used to detect equal-value writes in the instance override walk: assigning
 * a property on an instance sublayer registers an explicit override even when
 * the value is identical, pinning it against future main-component edits.
 * Only exact deep-equality skips a write; any doubt falls back to assigning.
 */
export function stableStringify(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    const encoded = JSON.stringify(value) as string | undefined;
    return encoded === undefined ? 'null' : encoded;
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
}

function isAutoLayout(candidate: unknown): boolean {
  if (!candidate || typeof candidate !== 'object') return false;
  if (!('layoutMode' in (candidate as Record<string, unknown>))) return false;
  const mode = (candidate as { layoutMode: unknown }).layoutMode;
  return mode === 'HORIZONTAL' || mode === 'VERTICAL';
}

/**
 * Applicability guards: mirror the documented "setting this when it does not
 * apply will throw" rules so the import path stays warning-free for plain
 * skips and only warns on real failures.
 */
function guardOk(node: SceneNode, key: string, value: unknown): boolean {
  switch (key) {
    case 'layoutWrap':
      return (node as unknown as { layoutMode?: unknown }).layoutMode === 'HORIZONTAL';
    case 'primaryAxisSizingMode':
    case 'counterAxisSizingMode':
    case 'primaryAxisAlignItems':
    case 'counterAxisAlignItems':
    case 'paddingLeft':
    case 'paddingRight':
    case 'paddingTop':
    case 'paddingBottom':
    case 'itemSpacing':
    case 'itemReverseZIndex':
    case 'strokesIncludedInLayout':
      return isAutoLayout(node);
    case 'counterAxisSpacing':
    case 'counterAxisAlignContent':
      return (node as unknown as { layoutWrap?: unknown }).layoutWrap === 'WRAP';
    case 'layoutAlign':
    case 'layoutGrow':
    case 'layoutPositioning':
      return isAutoLayout(node.parent);
    case 'layoutSizingHorizontal':
    case 'layoutSizingVertical':
      if (value === 'FILL') return isAutoLayout(node.parent);
      if (value === 'HUG') return isAutoLayout(node) || node.type === 'TEXT';
      return isAutoLayout(node) || isAutoLayout(node.parent) || node.type === 'TEXT';
    case 'minWidth':
    case 'maxWidth':
    case 'minHeight':
    case 'maxHeight':
      return isAutoLayout(node) || isAutoLayout(node.parent);
    default:
      return true;
  }
}

/**
 * IMPORT SIDE — assign the given phase's table properties onto the node in
 * table order. `type` is the SERIALIZED node type (the created node may be a
 * fallback of a different type; `key in node` keeps that safe). Failures
 * degrade to warn().
 */
export function applyNodeProps(
  node: SceneNode,
  type: string,
  props: Record<string, unknown>,
  phase: PropPhase,
  warn: WarnFn
): void {
  const bag = node as unknown as Record<string, unknown>;
  for (const entry of propEntriesFor(type)) {
    if (entry.phase !== phase) continue;
    const value = props[entry.key];
    if (value === undefined || value === null) continue;
    if (!(entry.key in node)) continue;
    if (!guardOk(node, entry.key, value)) continue;
    try {
      bag[entry.key] = value;
    } catch (e) {
      warn(
        `속성 적용 실패: ${node.type} '${node.name}'.${entry.key} — ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

/**
 * IMPORT SIDE, instance override walk — re-apply only the override-safe
 * subset onto a node inside an instance subtree.
 */
export function applyOverrideProps(node: SceneNode, props: Record<string, unknown>, warn: WarnFn): void {
  const bag = node as unknown as Record<string, unknown>;
  for (const key of OVERRIDE_SAFE_PROPS) {
    const value = props[key];
    if (value === undefined || value === null) continue;
    if (!(key in node)) continue;
    // Skip equal-value writes: they would register (and pin) an explicit
    // override on the instance sublayer without changing anything.
    try {
      const current = bag[key];
      if (typeof current !== 'symbol' && stableStringify(toPlain(current)) === stableStringify(value)) {
        continue;
      }
    } catch {
      // current value unreadable — fall through to the assignment
    }
    try {
      bag[key] = value;
    } catch (e) {
      warn(
        `오버라이드 속성 적용 실패: '${node.name}'.${key} — ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}
