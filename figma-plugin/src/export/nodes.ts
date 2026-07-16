/**
 * Export side — node-tree serializer.
 *
 * serializeTopLevel(page, ctx) finds every top-level COMPONENT /
 * COMPONENT_SET on the page and serializes the full trees into NodeData
 * (src/schema.ts). Side effects accumulate in ExportCtx: image paint bytes
 * into ctx.images, every distinct font into ctx.fonts, capability gaps into
 * ctx.warn.
 *
 * figma.mixed handling: every mixed-capable aggregate is either skipped in
 * favor of its per-part representation (corner radii / stroke weights via
 * the shared table, text properties via getStyledTextSegments) or encoded
 * explicitly (TEXT fills === mixed -> fills: null, segments carry fills).
 */

import type {
  BoundVarMap,
  ComponentMetaData,
  ComponentPropertyDefData,
  ComponentSetMetaData,
  EffectData,
  FontData,
  InstanceData,
  NodeData,
  PageComponentsData,
  PaintData,
  TextData,
  TextSegmentData,
  VectorData
} from '../schema';
import { readNodeProps, toPlain } from '../nodes-props';

export interface ExportCtx {
  /** image hash -> base64 bytes (fills PodoExport.images). */
  images: Record<string, string>;
  /** `${family}::${style}` -> FontData (fills PodoExport.fonts). */
  fonts: Map<string, FontData>;
  /** Capability gaps call this instead of throwing. */
  warn(m: string): void;
  /** Optional progress hook awaited once per serialized top-level item. */
  tick?: () => Promise<void>;
  /**
   * Every component referenced by instances / swap targets (variant members
   * register their owning set). serializeReferencedComponents embeds the ones
   * that were not exported as page items — remote library components AND
   * local components on pages outside the export scope — so the clone needs
   * neither library access nor the skipped pages.
   */
  referencedMains: Map<string, ComponentNode | ComponentSetNode>;
  /** ids of COMPONENT / COMPONENT_SET nodes (incl. variant members) already serialized as page items. */
  exportedComponentIds: Set<string>;
}

/** Registers an instance main (or swap target) for the external-embed pass. */
function registerMain(ctx: ExportCtx, main: ComponentNode): void {
  const owner = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : main;
  ctx.referencedMains.set(owner.id, owner);
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function fontKey(font: FontName): string {
  return `${font.family}::${font.style}`;
}

function registerFont(ctx: ExportCtx, font: FontName): void {
  ctx.fonts.set(fontKey(font), { family: font.family, style: font.style });
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ------------------------------------------------------------------- paints

async function captureImageBytes(hash: string, ctx: ExportCtx): Promise<void> {
  if (Object.prototype.hasOwnProperty.call(ctx.images, hash)) return;
  const image = figma.getImageByHash(hash);
  if (!image) {
    ctx.warn(`이미지 해시 '${hash}'에 해당하는 이미지를 찾지 못했습니다 — 가져오기 시 회색 대체 페인트가 사용됩니다.`);
    return;
  }
  try {
    const bytes = await image.getBytesAsync();
    ctx.images[hash] = figma.base64Encode(bytes);
  } catch (e) {
    ctx.warn(`이미지 바이트 추출 실패 (${hash}): ${errMsg(e)}`);
  }
}

function paintBound(paint: Paint): BoundVarMap | undefined {
  const bv = (paint as unknown as { boundVariables?: Record<string, { id?: string } | undefined> }).boundVariables;
  if (!bv) return undefined;
  const out: BoundVarMap = {};
  for (const key of Object.keys(bv)) {
    const alias = bv[key];
    if (alias && typeof alias.id === 'string') out[key] = alias.id;
  }
  return Object.keys(out).length ? out : undefined;
}

async function serializePaint(paint: Paint, ctx: ExportCtx): Promise<PaintData | null> {
  if (paint.type === 'SOLID') {
    const data: PaintData = {
      type: 'SOLID',
      color: { r: paint.color.r, g: paint.color.g, b: paint.color.b }
    };
    if (paint.opacity !== undefined) data.opacity = paint.opacity;
    if (paint.visible !== undefined) data.visible = paint.visible;
    if (paint.blendMode !== undefined) data.blendMode = paint.blendMode;
    const bound = paintBound(paint);
    if (bound) data.bound = bound;
    return data;
  }
  if (paint.type === 'IMAGE') {
    if (paint.imageHash) await captureImageBytes(paint.imageHash, ctx);
    const data: PaintData = {
      type: 'IMAGE',
      scaleMode: paint.scaleMode,
      imageHash: paint.imageHash
    };
    if (paint.imageTransform) data.imageTransform = toPlain(paint.imageTransform) as number[][];
    if (paint.scalingFactor !== undefined) data.scalingFactor = paint.scalingFactor;
    if (paint.rotation !== undefined) data.rotation = paint.rotation;
    if (paint.filters) data.filters = toPlain(paint.filters) as Record<string, number>;
    if (paint.opacity !== undefined) data.opacity = paint.opacity;
    if (paint.visible !== undefined) data.visible = paint.visible;
    if (paint.blendMode !== undefined) data.blendMode = paint.blendMode;
    return data;
  }
  if (
    paint.type === 'GRADIENT_LINEAR' ||
    paint.type === 'GRADIENT_RADIAL' ||
    paint.type === 'GRADIENT_ANGULAR' ||
    paint.type === 'GRADIENT_DIAMOND'
  ) {
    const data: PaintData = {
      type: paint.type,
      gradientTransform: toPlain(paint.gradientTransform) as number[][],
      gradientStops: paint.gradientStops.map((stop) => {
        const s: { position: number; color: { r: number; g: number; b: number; a: number }; bound?: BoundVarMap } = {
          position: stop.position,
          color: { r: stop.color.r, g: stop.color.g, b: stop.color.b, a: stop.color.a }
        };
        const alias = stop.boundVariables?.color;
        if (alias && typeof alias.id === 'string') s.bound = { color: alias.id };
        return s;
      })
    };
    if (paint.opacity !== undefined) data.opacity = paint.opacity;
    if (paint.visible !== undefined) data.visible = paint.visible;
    if (paint.blendMode !== undefined) data.blendMode = paint.blendMode;
    return data;
  }
  ctx.warn(`미지원 페인트 타입 '${paint.type}' — 건너뜁니다 (인벤토리 외).`);
  return null;
}

async function serializePaints(paints: readonly Paint[], ctx: ExportCtx): Promise<PaintData[]> {
  const out: PaintData[] = [];
  for (const paint of paints) {
    const data = await serializePaint(paint, ctx);
    if (data) out.push(data);
  }
  return out;
}

// ------------------------------------------------------------------ effects

const EFFECT_TYPES: readonly string[] = ['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR'];

function serializeEffects(effects: readonly Effect[], ctx: ExportCtx): EffectData[] {
  const out: EffectData[] = [];
  for (const effect of effects) {
    if (!EFFECT_TYPES.includes(effect.type)) {
      ctx.warn(`미지원 이펙트 타입 '${effect.type}' — 건너뜁니다 (인벤토리 외).`);
      continue;
    }
    const value: Record<string, unknown> = {};
    const bag = effect as unknown as Record<string, unknown>;
    for (const key of Object.keys(bag)) {
      if (key === 'type' || key === 'boundVariables') continue;
      const plain = toPlain(bag[key]);
      if (plain !== undefined) value[key] = plain;
    }
    const data: EffectData = { type: effect.type as EffectData['type'], value };
    const bv = (effect as unknown as { boundVariables?: Record<string, { id?: string } | undefined> })
      .boundVariables;
    if (bv) {
      const bound: BoundVarMap = {};
      for (const key of Object.keys(bv)) {
        const alias = bv[key];
        if (alias && typeof alias.id === 'string') bound[key] = alias.id;
      }
      if (Object.keys(bound).length) data.bound = bound;
    }
    out.push(data);
  }
  return out;
}

// --------------------------------------------------------------------- text

function serializeLineHeight(lh: LineHeight): { unit: string; value?: number } {
  return lh.unit === 'AUTO' ? { unit: 'AUTO' } : { unit: lh.unit, value: lh.value };
}

type SegmentRow = Pick<
  StyledTextSegment,
  | 'characters'
  | 'start'
  | 'end'
  | 'fontName'
  | 'fontSize'
  | 'textCase'
  | 'textDecoration'
  | 'letterSpacing'
  | 'lineHeight'
  | 'fills'
  | 'textStyleId'
  | 'fillStyleId'
  | 'listOptions'
  | 'indentation'
  | 'hyperlink'
  | 'openTypeFeatures'
  | 'boundVariables'
>;

async function serializeText(node: TextNode, ctx: ExportCtx): Promise<TextData> {
  if (node.fontName !== figma.mixed) registerFont(ctx, node.fontName);
  const segments: TextSegmentData[] = [];
  let rows: SegmentRow[] = [];
  try {
    rows = node.getStyledTextSegments([
      'fontName',
      'fontSize',
      'textCase',
      'textDecoration',
      'letterSpacing',
      'lineHeight',
      'fills',
      'textStyleId',
      'fillStyleId',
      'listOptions',
      'indentation',
      'hyperlink',
      'openTypeFeatures',
      'boundVariables'
    ]);
  } catch (e) {
    ctx.warn(`텍스트 '${node.name}' 세그먼트 추출 실패: ${errMsg(e)}`);
    rows = [];
  }
  for (const seg of rows) {
    registerFont(ctx, seg.fontName);
    const data: TextSegmentData = {
      start: seg.start,
      end: seg.end,
      fontName: { family: seg.fontName.family, style: seg.fontName.style },
      fontSize: seg.fontSize,
      textCase: seg.textCase,
      textDecoration: seg.textDecoration,
      letterSpacing: { unit: seg.letterSpacing.unit, value: seg.letterSpacing.value },
      lineHeight: serializeLineHeight(seg.lineHeight),
      fills: await serializePaints(seg.fills, ctx),
      textStyleId: seg.textStyleId,
      fillStyleId: seg.fillStyleId
    };
    if (seg.listOptions && seg.listOptions.type !== 'NONE') data.listOptions = { type: seg.listOptions.type };
    if (seg.indentation) data.indentation = seg.indentation;
    if (seg.hyperlink) data.hyperlink = { type: seg.hyperlink.type, value: seg.hyperlink.value };
    const bv = seg.boundVariables;
    if (bv) {
      const bound: BoundVarMap = {};
      for (const key of Object.keys(bv)) {
        const alias = (bv as Record<string, { id?: string } | undefined>)[key];
        if (alias && typeof alias.id === 'string') bound[key] = alias.id;
      }
      if (Object.keys(bound).length) data.bound = bound;
    }
    if (seg.openTypeFeatures) {
      const features: Record<string, boolean> = {};
      for (const key of Object.keys(seg.openTypeFeatures)) {
        if ((seg.openTypeFeatures as Record<string, boolean>)[key] === true) features[key] = true;
      }
      if (Object.keys(features).length) data.openTypeFeatures = features;
    }
    segments.push(data);
  }
  const out: TextData = { characters: node.characters, segments };
  // Node-level font/size: an EMPTY text node has zero segments, so these are
  // the only way import can restore its font (instead of Inter Regular 12).
  if (node.fontName !== figma.mixed) {
    out.fontName = { family: node.fontName.family, style: node.fontName.style };
  }
  if (node.fontSize !== figma.mixed) {
    out.fontSize = node.fontSize;
  }
  return out;
}

// ------------------------------------------------------------------- vector

async function serializeVector(node: VectorNode, ctx: ExportCtx): Promise<VectorData> {
  const data: VectorData = {};
  let complex = false;
  try {
    const regions = node.vectorNetwork.regions;
    complex = !!regions && regions.length > 1;
  } catch {
    complex = false;
  }
  const paths = node.vectorPaths;
  if (!complex && paths.length > 0) {
    data.vectorPaths = paths.map((p) => ({ windingRule: String(p.windingRule), data: p.data }));
  } else {
    try {
      data.svg = await node.exportAsync({ format: 'SVG_STRING' });
    } catch (e) {
      ctx.warn(`벡터 '${node.name}' SVG 내보내기 실패 (${errMsg(e)}) — vectorPaths로 대체합니다.`);
      if (paths.length > 0) {
        data.vectorPaths = paths.map((p) => ({ windingRule: String(p.windingRule), data: p.data }));
      } else {
        ctx.warn(`벡터 '${node.name}'에 직렬화 가능한 지오메트리가 없습니다.`);
      }
    }
  }
  if (node.handleMirroring !== figma.mixed) data.handleMirroring = node.handleMirroring;
  return data;
}

// -------------------------------------------------------- component property

async function serializePropertyDefs(
  owner: ComponentNode | ComponentSetNode,
  ctx: ExportCtx
): Promise<ComponentPropertyDefData[]> {
  let defs: ComponentPropertyDefinitions;
  try {
    defs = owner.componentPropertyDefinitions;
  } catch (e) {
    ctx.warn(`'${owner.name}' 컴포넌트 프로퍼티 정의 읽기 실패: ${errMsg(e)}`);
    return [];
  }
  const out: ComponentPropertyDefData[] = [];
  for (const name of Object.keys(defs)) {
    const def = defs[name];
    const data: ComponentPropertyDefData = { name, type: def.type };
    if (def.type !== 'SLOT') data.defaultValue = def.defaultValue;
    if (def.variantOptions) data.variantOptions = [...def.variantOptions];
    if (def.preferredValues && def.preferredValues.length) {
      data.preferredValues = def.preferredValues.map((p) => ({ type: p.type, key: p.key }));
    }
    if (def.description) data.description = def.description;
    if (def.slotSettings) data.slotSettings = toPlain(def.slotSettings) as ComponentPropertyDefData['slotSettings'];
    const boundDefault = def.boundVariables?.defaultValue;
    if (boundDefault && typeof boundDefault.id === 'string') data.boundDefaultValue = boundDefault.id;
    if (def.type === 'INSTANCE_SWAP' && typeof def.defaultValue === 'string' && def.defaultValue) {
      try {
        const target = await figma.getNodeByIdAsync(def.defaultValue);
        if (target && target.type === 'COMPONENT') {
          data.defaultValueKey = target.key;
          data.defaultValueRemote = target.remote;
          registerMain(ctx, target);
        }
      } catch {
        // id not resolvable — import falls back to the raw id and warns there
      }
    }
    out.push(data);
  }
  return out;
}

// ----------------------------------------------------------------- instance

async function serializeInstance(node: InstanceNode, ctx: ExportCtx): Promise<InstanceData | null> {
  let main: ComponentNode | null = null;
  try {
    main = await node.getMainComponentAsync();
  } catch (e) {
    ctx.warn(`인스턴스 '${node.name}' 메인 컴포넌트 조회 실패: ${errMsg(e)}`);
  }
  if (!main) return null;
  registerMain(ctx, main);

  const componentProperties: InstanceData['componentProperties'] = {};
  let props: ComponentProperties | null = null;
  try {
    props = node.componentProperties;
  } catch (e) {
    ctx.warn(`인스턴스 '${node.name}' componentProperties 읽기 실패: ${errMsg(e)}`);
  }
  if (props) {
    for (const name of Object.keys(props)) {
      const p = props[name];
      const rec: InstanceData['componentProperties'][string] = { type: p.type, value: p.value };
      const alias = p.boundVariables?.value;
      if (alias && typeof alias.id === 'string') rec.bound = alias.id;
      if (p.type === 'INSTANCE_SWAP' && typeof p.value === 'string' && p.value) {
        try {
          const target = await figma.getNodeByIdAsync(p.value);
          if (target && target.type === 'COMPONENT') {
            rec.valueKey = target.key;
            rec.valueRemote = target.remote;
            registerMain(ctx, target);
          }
        } catch {
          // unresolvable id — import warns when it cannot remap
        }
      }
      componentProperties[name] = rec;
    }
  }

  return {
    componentId: main.id,
    componentKey: main.key,
    remote: main.remote,
    componentProperties
  };
}

// ---------------------------------------------------------------- node core

const BOUND_SKIP_KEYS: readonly string[] = [
  'fills',
  'strokes',
  'effects',
  'layoutGrids',
  'componentProperties',
  'textRangeFills',
  'textRangeStrokes'
];

function serializeBoundVariables(node: SceneNode): Record<string, string | string[]> | undefined {
  const bv = (node as unknown as { boundVariables?: Record<string, unknown> }).boundVariables;
  if (!bv) return undefined;
  const out: Record<string, string | string[]> = {};
  for (const key of Object.keys(bv)) {
    if (BOUND_SKIP_KEYS.includes(key)) continue; // covered per-paint / per-effect / per-segment
    const value = bv[key];
    if (Array.isArray(value)) continue; // text fields read back as arrays; segments carry them
    const alias = value as { type?: string; id?: string } | undefined;
    if (alias && alias.type === 'VARIABLE_ALIAS' && typeof alias.id === 'string') out[key] = alias.id;
  }
  return Object.keys(out).length ? out : undefined;
}

function hasChildren(node: SceneNode): node is SceneNode & ChildrenMixin {
  return 'children' in node;
}

async function serializeNode(node: SceneNode, ctx: ExportCtx, asOverrideRoot: boolean): Promise<NodeData> {
  const dims = node as unknown as { width: number; height: number; relativeTransform: Transform };
  const data: NodeData = {
    id: node.id,
    type: node.type,
    name: node.name,
    props: readNodeProps(node, node.type),
    width: dims.width,
    height: dims.height,
    relativeTransform: toPlain(dims.relativeTransform) as number[][]
  };

  // fills / strokes / effects. Empty arrays are emitted on purpose: freshly
  // created import nodes carry NON-empty factory defaults (createFrame's
  // white background, createRectangle's gray fill, createLine's black
  // stroke), so import must be able to distinguish "no paints" from "field
  // absent" and clear the defaults.
  if ('fills' in node) {
    const fills = node.fills;
    if (fills === figma.mixed) {
      data.fills = null; // TEXT with mixed fills — segments carry per-range fills
    } else {
      data.fills = await serializePaints(fills, ctx);
    }
  }
  if ('strokes' in node) {
    data.strokes = await serializePaints(node.strokes, ctx);
  }
  if ('effects' in node && node.effects.length) {
    data.effects = serializeEffects(node.effects, ctx);
  }

  // node-level bound variables (single-alias fields only)
  const bound = serializeBoundVariables(node);
  if (bound) data.bound = bound;

  // style ids (mixed text style ids are carried per-segment)
  if ('textStyleId' in node && node.textStyleId !== figma.mixed && node.textStyleId) {
    data.textStyleId = node.textStyleId;
  }
  if ('effectStyleId' in node && node.effectStyleId) data.effectStyleId = node.effectStyleId;
  if ('fillStyleId' in node && node.fillStyleId !== figma.mixed && node.fillStyleId) {
    data.fillStyleId = node.fillStyleId;
  }
  if ('strokeStyleId' in node && node.strokeStyleId) data.strokeStyleId = node.strokeStyleId;

  if ('componentPropertyReferences' in node && node.componentPropertyReferences) {
    const refs: Record<string, string> = {};
    const source = node.componentPropertyReferences as Record<string, string | undefined>;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (typeof value === 'string') refs[key] = value;
    }
    if (Object.keys(refs).length) data.componentPropertyReferences = refs;
  }

  if ('reactions' in node && node.reactions.length) {
    data.reactions = toPlain(node.reactions) as unknown[];
  }

  // type-specific payloads
  if (node.type === 'TEXT') {
    data.text = await serializeText(node, ctx);
  } else if (node.type === 'VECTOR') {
    data.vector = await serializeVector(node, ctx);
  } else if (node.type === 'COMPONENT') {
    const standalone = !(node.parent && node.parent.type === 'COMPONENT_SET');
    const meta: ComponentMetaData = {
      description: node.description,
      documentationLinks: toPlain(node.documentationLinks) as { uri: string }[],
      propertyDefs: standalone ? await serializePropertyDefs(node, ctx) : [],
      key: node.key
    };
    data.component = meta;
  } else if (node.type === 'COMPONENT_SET') {
    const meta: ComponentSetMetaData = {
      description: node.description,
      documentationLinks: toPlain(node.documentationLinks) as { uri: string }[],
      propertyDefs: await serializePropertyDefs(node, ctx),
      key: node.key
    };
    data.componentSet = meta;
  }

  if (node.type === 'INSTANCE' && !asOverrideRoot) {
    const instance = await serializeInstance(node, ctx);
    if (instance) {
      // Full subtree (with applied overrides) rides in instance.overrides;
      // the outer NodeData intentionally has no children.
      instance.overrides = await serializeNode(node, ctx, true);
      data.instance = instance;
      return data;
    }
    // Detached / unresolvable main: degrade to a plain frame subtree.
    ctx.warn(`인스턴스 '${node.name}'의 메인 컴포넌트가 없어 FRAME으로 직렬화합니다.`);
    data.type = 'FRAME';
  }

  if (hasChildren(node)) {
    const children: NodeData[] = [];
    for (const child of node.children) {
      children.push(await serializeNode(child, ctx, false));
    }
    if (children.length) data.children = children;
  }

  return data;
}

// ---------------------------------------------------------------- top level

function insideAnotherTopLevel(node: SceneNode): boolean {
  let parent = node.parent;
  while (parent && parent.type !== 'PAGE') {
    if (parent.type === 'COMPONENT' || parent.type === 'COMPONENT_SET') return true;
    parent = parent.parent;
  }
  return false;
}

export async function serializeTopLevel(page: PageNode, ctx: ExportCtx): Promise<PageComponentsData> {
  // Invisible instance children must stay reachable (spec correction 12).
  figma.skipInvisibleInstanceChildren = false;
  await page.loadAsync();

  const found = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
  const items: PageComponentsData['items'] = [];
  let sinceYield = 0;

  for (const node of found) {
    if (node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET') {
      continue; // variant members are serialized inside their set
    }
    if (insideAnotherTopLevel(node)) {
      ctx.warn(`'${node.name}'이(가) 다른 최상위 컴포넌트 내부에 있어 별도 항목으로 내보내지 않습니다.`);
      continue;
    }
    const abs = node.absoluteTransform;
    const data = await serializeNode(node, ctx, false);
    items.push({ x: abs[0][2], y: abs[1][2], node: data });
    ctx.exportedComponentIds.add(node.id);
    if (node.type === 'COMPONENT_SET') {
      for (const member of node.children) ctx.exportedComponentIds.add(member.id);
    }
    if (ctx.tick) {
      await ctx.tick();
    } else {
      sinceYield++;
      if (sinceYield >= 10) {
        sinceYield = 0;
        await yieldToUi();
      }
    }
  }

  return { pageId: page.id, pageName: page.name, items };
}

/**
 * Serializes every referenced component that was NOT exported as a page item
 * (remote library components, and local components on pages outside the
 * export scope) into a synthetic page, so the clone is self-contained.
 * Serializing one can register further mains (nested instances) — drain until
 * no new ones appear. Items are laid out in a flow grid (their source
 * positions are meaningless here).
 */
export async function serializeReferencedComponents(ctx: ExportCtx): Promise<PageComponentsData | null> {
  const seen = new Set<string>();
  const items: PageComponentsData['items'] = [];
  const GAP = 48;
  const PER_ROW = 10;
  let x = 0;
  let y = 0;
  let rowMax = 0;
  let col = 0;

  for (;;) {
    const pending = Array.from(ctx.referencedMains.values()).filter(
      (c) => !seen.has(c.id) && !ctx.exportedComponentIds.has(c.id)
    );
    if (!pending.length) break;
    for (const component of pending) {
      seen.add(component.id);
      let data: NodeData;
      try {
        data = await serializeNode(component, ctx, false);
      } catch (e) {
        ctx.warn(
          `참조 컴포넌트 '${component.name}' 직렬화 실패: ${errMsg(e)} — 가져오기 시 라이브러리 접근으로 폴백합니다.`
        );
        continue;
      }
      items.push({ x, y, node: data });
      rowMax = Math.max(rowMax, component.height);
      col++;
      if (col >= PER_ROW) {
        col = 0;
        x = 0;
        y += rowMax + GAP;
        rowMax = 0;
      } else {
        x += component.width + GAP;
      }
      if (ctx.tick) await ctx.tick();
    }
  }

  if (!items.length) return null;
  return { pageId: '__external__', pageName: 'External', items };
}
