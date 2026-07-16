/**
 * Import side — component tree builder.
 *
 * Implements SPEC.md exactly:
 *  - one SECTION per source page, stacked vertically with 200px gaps;
 *  - two-pass shells-then-trees: pass 1a creates every COMPONENT /
 *    COMPONENT_SET as empty shells (variant members combined via
 *    figma.combineAsVariants, order preserved so the first serialized
 *    variant stays the spatial top-left = defaultVariant) and records
 *    oldId -> node for every component INCLUDING variant members; pass 1b
 *    adds non-variant property definitions (the returned suffixed names feed
 *    the old-name -> new-name map used to rewrite componentPropertyReferences
 *    and instance.setProperties); pass 2 populates the trees;
 *  - instance overrides are applied in a dedicated pass AFTER every tree is
 *    populated, so instances of later-built components have real subtrees to
 *    walk;
 *  - reactions are re-applied last (destination ids only exist at the end).
 *
 * Every capability gap degrades to warn() — only unrecoverable states throw.
 */

import type {
  ComponentPropertyDefData,
  EffectData,
  FontData,
  InstanceData,
  NodeData,
  PageComponentsData,
  PaintData,
  PodoExport
} from '../schema';
import { applyNodeProps, applyOverrideProps, stableStringify, toPlain } from '../nodes-props';

const MISSING_PREFIX = '⚠ missing: ';
const SECTION_PADDING = 100;
const SECTION_GAP = 200;
const FALLBACK_FONT: FontName = { family: 'Inter', style: 'Regular' };

type PropNameMap = Map<string, string>;

interface DeferredOverride {
  node: InstanceNode;
  data: NodeData;
}

interface DeferredReaction {
  node: SceneNode;
  reactions: unknown[];
}

interface Ctx {
  doc: PodoExport;
  varMap: Map<string, string>;
  styleMap: Map<string, string>;
  warn: (m: string) => void;
  warnDedup: (m: string) => void;
  /** old component id -> new ComponentNode (standalone AND variant members). */
  componentIdMap: Map<string, ComponentNode>;
  /** old node id -> new node id (reaction destination remap). */
  nodeIdMap: Map<string, string>;
  /** new defs-owner node id (set or standalone component) -> old->new prop names. */
  propMapByOwner: Map<string, PropNameMap>;
  /** remote publish key -> imported component (null = import failed). */
  remoteCache: Map<string, ComponentNode | null>;
  /** new variable id -> Variable object. */
  variableCache: Map<string, Variable | null>;
  loadedFonts: Set<string>;
  failedFonts: Set<string>;
  fallbackFontReady: boolean | null;
  deferredOverrides: DeferredOverride[];
  deferredReactions: DeferredReaction[];
  imageMap: Map<string, string>;
  /**
   * Ids of createNodeFromSvg wrapper FRAMEs kept for multi-geometry vectors.
   * Their serialized node-level fills/strokes/effects belong to the source
   * VECTOR (the SVG children already carry the exact paints) and must not be
   * painted onto the wrapper itself.
   */
  svgWrapperIds: Set<string>;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function plainPropName(name: string): string {
  const hash = name.indexOf('#');
  return hash >= 0 ? name.slice(0, hash) : name;
}

function fontKey(font: FontName): string {
  return `${font.family}::${font.style}`;
}

// -------------------------------------------------------------- primitives

async function resolveVariable(ctx: Ctx, oldVarId: string): Promise<Variable | null> {
  const newId = ctx.varMap.get(oldVarId);
  if (newId === undefined) {
    ctx.warnDedup(`변수 매핑 누락: ${oldVarId} — 해당 바인딩은 원본 값으로만 재현됩니다.`);
    return null;
  }
  let variable = ctx.variableCache.get(newId);
  if (variable === undefined) {
    try {
      variable = await figma.variables.getVariableByIdAsync(newId);
    } catch (e) {
      ctx.warnDedup(`변수 조회 실패(${newId}): ${errMsg(e)}`);
      variable = null;
    }
    ctx.variableCache.set(newId, variable);
  }
  return variable;
}

async function ensureFont(ctx: Ctx, font: FontData | FontName): Promise<FontName | null> {
  const name: FontName = { family: font.family, style: font.style };
  const key = fontKey(name);
  if (ctx.loadedFonts.has(key)) return name;
  if (!ctx.failedFonts.has(key)) {
    try {
      await figma.loadFontAsync(name);
      ctx.loadedFonts.add(key);
      return name;
    } catch {
      ctx.failedFonts.add(key);
      ctx.warnDedup(
        `폰트 로드 실패: ${name.family} ${name.style} — ${FALLBACK_FONT.family} ${FALLBACK_FONT.style}(으)로 대체합니다.`
      );
    }
  }
  // fallback
  if (ctx.fallbackFontReady === null) {
    try {
      await figma.loadFontAsync(FALLBACK_FONT);
      ctx.fallbackFontReady = true;
    } catch {
      ctx.fallbackFontReady = false;
      ctx.warnDedup(`대체 폰트(${FALLBACK_FONT.family})조차 로드하지 못했습니다 — 일부 텍스트가 생성되지 않을 수 있습니다.`);
    }
  }
  return ctx.fallbackFontReady ? { ...FALLBACK_FONT } : null;
}

async function importRemote(ctx: Ctx, key: string): Promise<ComponentNode | null> {
  if (ctx.remoteCache.has(key)) return ctx.remoteCache.get(key) ?? null;
  let component: ComponentNode | null = null;
  try {
    component = await figma.importComponentByKeyAsync(key);
  } catch (e) {
    ctx.warnDedup(`원격 컴포넌트 가져오기 실패 (key ${key}): ${errMsg(e)}`);
  }
  ctx.remoteCache.set(key, component);
  return component;
}

// ------------------------------------------------------------------- paints

async function deserializePaint(p: PaintData, ctx: Ctx): Promise<Paint | null> {
  if (p.type === 'SOLID') {
    let paint: SolidPaint = { type: 'SOLID', color: { r: p.color.r, g: p.color.g, b: p.color.b } };
    if (p.opacity !== undefined) paint = { ...paint, opacity: p.opacity };
    if (p.visible !== undefined) paint = { ...paint, visible: p.visible };
    if (p.blendMode !== undefined) paint = { ...paint, blendMode: p.blendMode as BlendMode };
    if (p.bound && p.bound['color']) {
      const variable = await resolveVariable(ctx, p.bound['color']);
      if (variable) {
        try {
          paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
        } catch (e) {
          ctx.warnDedup(`페인트 변수 바인딩 실패: ${errMsg(e)}`);
        }
      }
    }
    return paint;
  }
  if (p.type === 'IMAGE') {
    let newHash: string | null = null;
    if (p.imageHash) {
      const cached = ctx.imageMap.get(p.imageHash);
      if (cached !== undefined) {
        newHash = cached;
      } else {
        const base64 = ctx.doc.images[p.imageHash];
        if (base64) {
          try {
            const image = figma.createImage(figma.base64Decode(base64));
            newHash = image.hash;
          } catch (e) {
            ctx.warnDedup(`이미지 재생성 실패 (${p.imageHash}): ${errMsg(e)}`);
          }
        } else {
          ctx.warnDedup(`이미지 바이트 누락 (${p.imageHash}) — 회색 페인트로 대체합니다.`);
        }
        // '' marks a failed conversion so it is attempted only once.
        ctx.imageMap.set(p.imageHash, newHash ?? '');
      }
      if (newHash === '') newHash = null;
    }
    if (!newHash) {
      return { type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } };
    }
    const paint: Record<string, unknown> = { type: 'IMAGE', scaleMode: p.scaleMode, imageHash: newHash };
    if (p.imageTransform) paint.imageTransform = p.imageTransform;
    if (p.scalingFactor !== undefined) paint.scalingFactor = p.scalingFactor;
    if (p.rotation !== undefined) paint.rotation = p.rotation;
    if (p.filters) paint.filters = p.filters;
    if (p.opacity !== undefined) paint.opacity = p.opacity;
    if (p.visible !== undefined) paint.visible = p.visible;
    if (p.blendMode !== undefined) paint.blendMode = p.blendMode;
    return paint as unknown as ImagePaint;
  }
  if (
    p.type === 'GRADIENT_LINEAR' ||
    p.type === 'GRADIENT_RADIAL' ||
    p.type === 'GRADIENT_ANGULAR' ||
    p.type === 'GRADIENT_DIAMOND'
  ) {
    if (p.gradientStops.some((s) => s.bound && s.bound['color'])) {
      ctx.warnDedup('그라디언트 스톱의 변수 바인딩은 플러그인 API로 재현할 수 없어 원본 색상만 적용합니다.');
    }
    const paint: Record<string, unknown> = {
      type: p.type,
      gradientTransform: p.gradientTransform,
      gradientStops: p.gradientStops.map((s) => ({ position: s.position, color: s.color }))
    };
    if (p.opacity !== undefined) paint.opacity = p.opacity;
    if (p.visible !== undefined) paint.visible = p.visible;
    if (p.blendMode !== undefined) paint.blendMode = p.blendMode;
    return paint as unknown as GradientPaint;
  }
  ctx.warnDedup(`미지원 페인트 타입 '${(p as { type: string }).type}' — 건너뜁니다.`);
  return null;
}

async function deserializePaints(paints: PaintData[], ctx: Ctx): Promise<Paint[]> {
  const out: Paint[] = [];
  for (const p of paints) {
    const paint = await deserializePaint(p, ctx);
    if (paint) out.push(paint);
  }
  return out;
}

async function deserializeEffects(effects: EffectData[], ctx: Ctx): Promise<Effect[]> {
  const out: Effect[] = [];
  for (const e of effects) {
    let effect = { ...e.value, type: e.type } as unknown as Effect;
    if (e.bound) {
      for (const field of Object.keys(e.bound)) {
        const variable = await resolveVariable(ctx, e.bound[field]);
        if (!variable) continue;
        try {
          effect = figma.variables.setBoundVariableForEffect(
            effect,
            field as VariableBindableEffectField,
            variable
          );
        } catch (err) {
          ctx.warnDedup(`이펙트 변수 바인딩 실패(${field}): ${errMsg(err)}`);
        }
      }
    }
    out.push(effect);
  }
  return out;
}

// ---------------------------------------------------------------- geometry

function applyResize(node: SceneNode, data: NodeData, ctx: Ctx): void {
  if (node.type === 'BOOLEAN_OPERATION') return; // bounds derive from children
  const w = data.width;
  const h = data.height;
  if (typeof w !== 'number' || typeof h !== 'number' || !isFinite(w) || !isFinite(h)) return;
  try {
    if (node.type === 'LINE') {
      node.resize(Math.max(w, 0), 0); // LINE height must be exactly 0
      return;
    }
    if (node.type === 'TEXT' && data.props['textAutoResize'] === 'WIDTH_AND_HEIGHT') {
      return; // both dims derive from content
    }
    if ('resizeWithoutConstraints' in node) {
      (node as SceneNode & LayoutMixin).resizeWithoutConstraints(Math.max(w, 0.01), Math.max(h, 0.01));
    }
  } catch (e) {
    ctx.warnDedup(`크기 적용 실패 '${data.name}': ${errMsg(e)}`);
  }
}

function applyTransform(node: SceneNode, m: number[][] | undefined, ctx: Ctx): void {
  if (!m || m.length < 2 || !m[0] || !m[1] || m[0].length < 3 || m[1].length < 3) return;
  const t: Transform = [
    [Number(m[0][0]), Number(m[0][1]), Number(m[0][2])],
    [Number(m[1][0]), Number(m[1][1]), Number(m[1][2])]
  ];
  for (const row of t) {
    for (const v of row) {
      if (!isFinite(v)) return;
    }
  }
  if (!('relativeTransform' in node)) return;
  try {
    (node as SceneNode & LayoutMixin).relativeTransform = t;
  } catch (e) {
    ctx.warnDedup(`위치 적용 실패 '${node.name}': ${errMsg(e)}`);
  }
}

// --------------------------------------------------------------------- text

function toLineHeight(lh: { unit: string; value?: number }): LineHeight {
  if (lh.unit === 'AUTO' || lh.value === undefined) return { unit: 'AUTO' };
  return { unit: lh.unit as 'PIXELS' | 'PERCENT', value: lh.value };
}

async function applyText(node: TextNode, data: NodeData, ctx: Ctx): Promise<void> {
  const t = data.text;
  if (!t) return;
  const attempt = (what: string, fn: () => void): void => {
    try {
      fn();
    } catch (e) {
      ctx.warnDedup(`텍스트 '${data.name}' ${what} 실패: ${errMsg(e)}`);
    }
  };

  // Keep the serialized node name: fresh TextNodes auto-rename on characters.
  attempt('autoRename 해제', () => {
    node.autoRename = false;
  });

  // Empty text nodes have zero segments — fall back to the serialized
  // node-level font (TextData.fontName) before resorting to FALLBACK_FONT.
  const firstFont = t.segments.length ? t.segments[0].fontName : (t.fontName ?? FALLBACK_FONT);
  const nodeFont = await ensureFont(ctx, firstFont);
  if (!nodeFont) {
    ctx.warn(`텍스트 '${data.name}': 사용할 수 있는 폰트가 없어 내용을 쓰지 못했습니다.`);
    return;
  }
  attempt('기본 폰트 설정', () => {
    node.fontName = nodeFont;
  });
  if (!t.segments.length && t.fontSize !== undefined) {
    const nodeFontSize = Math.max(t.fontSize, 1);
    attempt('기본 크기 설정', () => {
      node.fontSize = nodeFontSize;
    });
  }
  for (const seg of t.segments) {
    await ensureFont(ctx, seg.fontName);
  }

  try {
    node.characters = t.characters;
  } catch (e) {
    ctx.warn(`텍스트 '${data.name}' 내용 쓰기 실패: ${errMsg(e)}`);
    return;
  }

  const length = node.characters.length;
  let openTypeSeen = false;
  for (const seg of t.segments) {
    const start = seg.start;
    const end = Math.min(seg.end, length);
    if (end <= start) {
      if (seg.end > length) {
        ctx.warnDedup(`텍스트 '${data.name}' 세그먼트 범위가 내용 길이를 벗어납니다.`);
      }
      continue;
    }
    // Raw ranged values FIRST, style ids LAST: writing a style-managed text
    // property onto a styled range detaches the text style, so the style
    // assignment must win (mirrors the fills -> fillStyleId ordering below).
    const segFont = await ensureFont(ctx, seg.fontName);
    if (segFont) {
      attempt('구간 폰트', () => node.setRangeFontName(start, end, segFont));
    }
    attempt('구간 크기', () => node.setRangeFontSize(start, end, Math.max(seg.fontSize, 1)));
    attempt('구간 대소문자', () => node.setRangeTextCase(start, end, seg.textCase as TextCase));
    attempt('구간 장식', () => node.setRangeTextDecoration(start, end, seg.textDecoration as TextDecoration));
    attempt('구간 자간', () =>
      node.setRangeLetterSpacing(start, end, {
        unit: seg.letterSpacing.unit as 'PIXELS' | 'PERCENT',
        value: seg.letterSpacing.value
      })
    );
    attempt('구간 행간', () => node.setRangeLineHeight(start, end, toLineHeight(seg.lineHeight)));
    if (seg.listOptions) {
      attempt('구간 리스트', () =>
        node.setRangeListOptions(start, end, { type: seg.listOptions!.type as 'ORDERED' | 'UNORDERED' | 'NONE' })
      );
    }
    if (seg.indentation !== undefined) {
      attempt('구간 들여쓰기', () => node.setRangeIndentation(start, end, seg.indentation!));
    }
    if (seg.hyperlink) {
      if (seg.hyperlink.type === 'NODE') {
        const mapped = ctx.nodeIdMap.get(seg.hyperlink.value);
        if (mapped) {
          attempt('구간 하이퍼링크', () => node.setRangeHyperlink(start, end, { type: 'NODE', value: mapped }));
        } else {
          ctx.warnDedup('노드 하이퍼링크 대상이 아직/더 이상 존재하지 않아 건너뜁니다.');
        }
      } else {
        const url = seg.hyperlink.value;
        attempt('구간 하이퍼링크', () => node.setRangeHyperlink(start, end, { type: 'URL', value: url }));
      }
    }
    if (seg.fills && seg.fills.length) {
      const paints = await deserializePaints(seg.fills, ctx);
      attempt('구간 채우기', () => node.setRangeFills(start, end, paints));
    }
    if (seg.fillStyleId) {
      const mapped = ctx.styleMap.get(seg.fillStyleId);
      if (mapped) {
        try {
          await node.setRangeFillStyleIdAsync(start, end, mapped);
        } catch (e) {
          ctx.warnDedup(`구간 채우기 스타일 적용 실패: ${errMsg(e)}`);
        }
      } else {
        ctx.warnDedup(`채우기 스타일 매핑 누락: ${seg.fillStyleId}`);
      }
    }
    if (seg.bound) {
      for (const field of Object.keys(seg.bound)) {
        const variable = await resolveVariable(ctx, seg.bound[field]);
        if (!variable) continue;
        attempt(`구간 변수(${field})`, () =>
          node.setRangeBoundVariable(start, end, field as VariableBindableTextField, variable)
        );
      }
    }
    // Per-segment text style id last (see raw-before-style comment above).
    if (seg.textStyleId) {
      const mapped = ctx.styleMap.get(seg.textStyleId);
      if (mapped) {
        try {
          await node.setRangeTextStyleIdAsync(start, end, mapped);
        } catch (e) {
          ctx.warnDedup(`구간 텍스트 스타일 적용 실패: ${errMsg(e)}`);
        }
      } else {
        ctx.warnDedup(`텍스트 스타일 매핑 누락: ${seg.textStyleId}`);
      }
    }
    if (seg.openTypeFeatures && Object.keys(seg.openTypeFeatures).length) openTypeSeen = true;
  }

  // Node-level text style absolutely last, after every raw ranged write.
  if (data.textStyleId) {
    const mapped = ctx.styleMap.get(data.textStyleId);
    if (mapped) {
      if (node.textStyleId !== mapped) {
        try {
          await node.setTextStyleIdAsync(mapped);
        } catch (e) {
          ctx.warnDedup(`텍스트 스타일 적용 실패: ${errMsg(e)}`);
        }
      }
    } else {
      ctx.warnDedup(`텍스트 스타일 매핑 누락: ${data.textStyleId}`);
    }
  }

  if (openTypeSeen) {
    ctx.warnDedup('openTypeFeatures는 플러그인 API에 setter가 없어 재적용하지 못했습니다.');
  }
}

// ------------------------------------------------------------ shared common

/**
 * Drops `boundVariables: {}` entries (runtime paints/effects expose the key
 * even when nothing is bound; serialized copies omit it — semantically the
 * same "no bindings" state).
 */
function stripEmptyBound(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripEmptyBound);
  if (value && typeof value === 'object') {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src)) {
      const v = src[key];
      if (
        key === 'boundVariables' &&
        v &&
        typeof v === 'object' &&
        !Array.isArray(v) &&
        Object.keys(v as Record<string, unknown>).length === 0
      ) {
        continue;
      }
      out[key] = stripEmptyBound(v);
    }
    return out;
  }
  return value;
}

/**
 * True when the deserialized value is deep-equal to the node's current value
 * (after toPlain normalization). Assigning object-valued properties on
 * instance sublayers registers explicit overrides even when identical, so
 * equal writes are skipped; any doubt (mixed, unreadable) reports "different"
 * and the write proceeds — the failure direction is always "apply".
 */
function sameAfterPlain(current: unknown, next: unknown): boolean {
  if (typeof current === 'symbol') return false; // figma.mixed
  try {
    return (
      stableStringify(stripEmptyBound(toPlain(current))) ===
      stableStringify(stripEmptyBound(toPlain(next)))
    );
  } catch {
    return false;
  }
}

/** True when the node's style id already equals the remapped style id. */
function styleAlreadyApplied(
  node: SceneNode,
  key: 'fillStyleId' | 'strokeStyleId' | 'effectStyleId',
  oldId: string,
  ctx: Ctx
): boolean {
  const mapped = ctx.styleMap.get(oldId);
  if (!mapped) return false; // let applyMappedStyle emit the mapping warning
  return (node as unknown as Record<string, unknown>)[key] === mapped;
}

async function applyMappedStyle(
  node: SceneNode,
  method: 'setFillStyleIdAsync' | 'setStrokeStyleIdAsync' | 'setEffectStyleIdAsync',
  oldId: string,
  ctx: Ctx
): Promise<void> {
  const mapped = ctx.styleMap.get(oldId);
  if (!mapped) {
    ctx.warnDedup(`스타일 매핑 누락: ${oldId}`);
    return;
  }
  const bag = node as unknown as Record<string, unknown>;
  if (typeof bag[method] !== 'function') return;
  try {
    await (bag[method] as (id: string) => Promise<void>)(mapped);
  } catch (e) {
    ctx.warnDedup(`스타일 적용 실패(${method}): ${errMsg(e)}`);
  }
}

async function applyBoundVariables(node: SceneNode, data: NodeData, ctx: Ctx): Promise<void> {
  if (!data.bound) return;
  for (const field of Object.keys(data.bound)) {
    const value = data.bound[field];
    if (Array.isArray(value)) continue; // ranged text bindings ride in segments
    const variable = await resolveVariable(ctx, value);
    if (!variable) continue;
    // Already bound to the same variable (e.g. inherited from the instance
    // main) — a re-write would only pin an explicit override.
    const currentAlias = (
      node as unknown as { boundVariables?: Record<string, { id?: string } | undefined> }
    ).boundVariables?.[field];
    if (currentAlias && currentAlias.id === variable.id) continue;
    try {
      (node as unknown as {
        setBoundVariable(f: VariableBindableNodeField | VariableBindableTextField, v: Variable | null): void;
      }).setBoundVariable(field as VariableBindableNodeField, variable);
    } catch (e) {
      ctx.warnDedup(`변수 바인딩 실패 '${node.name}'.${field}: ${errMsg(e)}`);
    }
  }
}

/**
 * Fills / strokes / effects / style ids / node bound vars / property refs /
 * reactions — everything that needs remapping and applies uniformly.
 */
async function applyCommon(node: SceneNode, data: NodeData, ctx: Ctx, propMap: PropNameMap | null): Promise<void> {
  // SVG-fallback wrapper frames keep their exact paints inside the imported
  // SVG children; the serialized node-level paints/effects/style ids/bindings
  // describe the source VECTOR and would paint the wrapper itself.
  const svgWrapper = ctx.svgWrapperIds.has(node.id);
  if (!svgWrapper && data.fills !== undefined && data.fills !== null && 'fills' in node) {
    const target = node as SceneNode & MinimalFillsMixin;
    const paints = await deserializePaints(data.fills, ctx);
    if (!sameAfterPlain(target.fills, paints)) {
      try {
        target.fills = paints;
      } catch (e) {
        ctx.warnDedup(`채우기 적용 실패 '${data.name}': ${errMsg(e)}`);
      }
    }
  }
  if (!svgWrapper && data.strokes && 'strokes' in node) {
    const target = node as SceneNode & MinimalStrokesMixin;
    const paints = await deserializePaints(data.strokes, ctx);
    if (!sameAfterPlain(target.strokes, paints)) {
      try {
        target.strokes = paints;
      } catch (e) {
        ctx.warnDedup(`획 적용 실패 '${data.name}': ${errMsg(e)}`);
      }
    }
  }
  if (!svgWrapper && data.effects && 'effects' in node) {
    const target = node as SceneNode & BlendMixin;
    const effects = await deserializeEffects(data.effects, ctx);
    if (!sameAfterPlain(target.effects, effects)) {
      try {
        target.effects = effects;
      } catch (e) {
        ctx.warnDedup(`이펙트 적용 실패 '${data.name}': ${errMsg(e)}`);
      }
    }
  }
  if (!svgWrapper) {
    if (data.fillStyleId && !styleAlreadyApplied(node, 'fillStyleId', data.fillStyleId, ctx)) {
      await applyMappedStyle(node, 'setFillStyleIdAsync', data.fillStyleId, ctx);
    }
    if (data.strokeStyleId && !styleAlreadyApplied(node, 'strokeStyleId', data.strokeStyleId, ctx)) {
      await applyMappedStyle(node, 'setStrokeStyleIdAsync', data.strokeStyleId, ctx);
    }
    if (data.effectStyleId && !styleAlreadyApplied(node, 'effectStyleId', data.effectStyleId, ctx)) {
      await applyMappedStyle(node, 'setEffectStyleIdAsync', data.effectStyleId, ctx);
    }
  }
  // textStyleId is applied inside the text pipeline (font-order constraint).

  if (!svgWrapper) await applyBoundVariables(node, data, ctx);

  if (data.componentPropertyReferences && propMap) {
    const refs: Record<string, string> = {};
    for (const key of Object.keys(data.componentPropertyReferences)) {
      const oldName = data.componentPropertyReferences[key];
      const mapped = propMap.get(oldName) ?? (oldName.indexOf('#') < 0 ? oldName : undefined);
      if (!mapped) {
        ctx.warnDedup(`컴포넌트 프로퍼티 참조 매핑 누락: ${oldName}`);
        continue;
      }
      refs[key] = mapped;
    }
    if (Object.keys(refs).length) {
      try {
        (node as unknown as { componentPropertyReferences: Record<string, string> }).componentPropertyReferences =
          refs;
      } catch (e) {
        ctx.warnDedup(`컴포넌트 프로퍼티 참조 적용 실패 '${data.name}': ${errMsg(e)}`);
      }
    }
  }

  if (data.reactions && data.reactions.length && 'reactions' in node) {
    ctx.deferredReactions.push({ node, reactions: data.reactions });
  }
}

// ---------------------------------------------------------------- instances

async function applyInstanceProps(
  node: InstanceNode,
  main: ComponentNode | null,
  inst: InstanceData,
  ctx: Ctx
): Promise<void> {
  let map: PropNameMap | null = null;
  if (main && !main.remote) {
    const ownerId = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.id : main.id;
    map = ctx.propMapByOwner.get(ownerId) ?? null;
  }
  const props: Record<string, string | boolean | VariableAlias> = {};
  for (const name of Object.keys(inst.componentProperties ?? {})) {
    const p = inst.componentProperties[name];
    if (p.type === 'SLOT') continue; // setProperties throws cannotSetSlotProperty
    let target = name;
    if (map) {
      const mapped = map.get(name);
      if (mapped) {
        target = mapped;
      } else if (name.indexOf('#') >= 0) {
        ctx.warnDedup(`인스턴스 프로퍼티 이름 매핑 누락: ${name}`);
        continue;
      }
    }
    let value: string | boolean | VariableAlias = p.value;
    if (p.type === 'INSTANCE_SWAP' && typeof p.value === 'string') {
      const local = ctx.componentIdMap.get(p.value);
      const swapped = local ?? (p.valueKey ? await importRemote(ctx, p.valueKey) : null);
      if (!swapped) {
        ctx.warnDedup(`INSTANCE_SWAP 값 매핑 실패${p.valueRemote ? ' (원격 컴포넌트)' : ''}: ${name}`);
        continue;
      }
      value = swapped.id;
    }
    if (p.bound) {
      const variable = await resolveVariable(ctx, p.bound);
      if (variable) value = figma.variables.createVariableAlias(variable);
    }
    props[target] = value;
  }
  if (!Object.keys(props).length) return;
  try {
    node.setProperties(props);
  } catch {
    // Retry one by one so a single bad property does not sink the rest.
    for (const key of Object.keys(props)) {
      try {
        node.setProperties({ [key]: props[key] });
      } catch (e) {
        ctx.warnDedup(`인스턴스 '${node.name}' 프로퍼티 '${key}' 적용 실패: ${errMsg(e)}`);
      }
    }
  }
}

async function createInstanceNode(data: NodeData, ctx: Ctx): Promise<SceneNode> {
  const inst = data.instance;
  if (!inst) {
    ctx.warnDedup(`인스턴스 데이터 누락 '${data.name}' — 빈 프레임으로 대체합니다.`);
    return figma.createFrame();
  }
  let main: ComponentNode | null = ctx.componentIdMap.get(inst.componentId) ?? null;
  if (!main && inst.componentKey) main = await importRemote(ctx, inst.componentKey);
  if (!main) {
    ctx.warn(
      `${inst.remote ? '원격' : '로컬'} 컴포넌트를 찾지 못했습니다: '${data.name}' — 자리표시 프레임을 생성합니다.`
    );
    const placeholder = figma.createFrame();
    placeholder.name = MISSING_PREFIX + data.name;
    return placeholder;
  }
  let node: InstanceNode;
  try {
    node = main.createInstance();
  } catch (e) {
    ctx.warn(`인스턴스 생성 실패 '${data.name}': ${errMsg(e)} — 자리표시 프레임을 생성합니다.`);
    const placeholder = figma.createFrame();
    placeholder.name = MISSING_PREFIX + data.name;
    return placeholder;
  }
  await applyInstanceProps(node, main, inst, ctx);
  return node;
}

// ------------------------------------------------------------------ vectors

function createVectorNode(data: NodeData, ctx: Ctx): SceneNode {
  const v = data.vector;
  if (v && v.svg) {
    try {
      const frame = figma.createNodeFromSvg(v.svg);
      if (frame.children.length === 1) {
        const only = frame.children[0];
        figma.currentPage.appendChild(only); // detach before removing wrapper
        frame.remove();
        return only;
      }
      ctx.warnDedup(
        `벡터 '${data.name}': SVG가 여러 지오메트리로 임포트되어 FRAME으로 유지합니다 (페인트는 SVG 원본을 따르며, 이 노드의 변수 바인딩·스타일 연결은 재현되지 않습니다).`
      );
      ctx.svgWrapperIds.add(frame.id);
      return frame;
    } catch (e) {
      ctx.warnDedup(`벡터 '${data.name}' SVG 재생성 실패: ${errMsg(e)} — vectorPaths로 대체합니다.`);
    }
  }
  const node = figma.createVector();
  if (v && v.vectorPaths && v.vectorPaths.length) {
    try {
      node.vectorPaths = v.vectorPaths.map((p) => ({
        windingRule: p.windingRule as WindingRule | 'NONE',
        data: p.data
      }));
    } catch (e) {
      ctx.warnDedup(`벡터 '${data.name}' 경로 적용 실패: ${errMsg(e)}`);
    }
  } else if (!v || (!v.svg && !v.vectorPaths)) {
    ctx.warnDedup(`벡터 '${data.name}'에 지오메트리 데이터가 없습니다.`);
  }
  if (v && v.handleMirroring && node.type === 'VECTOR') {
    try {
      node.handleMirroring = v.handleMirroring as HandleMirroring;
    } catch {
      // cosmetic only
    }
  }
  return node;
}

// -------------------------------------------------------------------- slots

function createSlotNode(data: NodeData, ctx: Ctx, host: ComponentNode | null): SceneNode {
  if (host) {
    const candidate = host as unknown as { createSlot?: () => SceneNode };
    if (typeof candidate.createSlot === 'function') {
      try {
        return candidate.createSlot.call(host);
      } catch (e) {
        ctx.warnDedup(`슬롯 생성 실패 '${data.name}': ${errMsg(e)} — 일반 프레임으로 대체합니다.`);
      }
    } else {
      ctx.warnDedup('이 Figma 버전은 createSlot을 지원하지 않아 SLOT을 일반 프레임으로 재현합니다.');
    }
  } else {
    ctx.warnDedup(`컴포넌트 외부의 SLOT '${data.name}'은 일반 프레임으로 재현합니다.`);
  }
  return figma.createFrame();
}

// ------------------------------------------------------------ boolean nodes

async function createBooleanNode(
  data: NodeData,
  parent: BaseNode & ChildrenMixin,
  ctx: Ctx,
  host: ComponentNode | null,
  propMap: PropNameMap | null
): Promise<SceneNode> {
  const kids: SceneNode[] = [];
  const kidData: NodeData[] = [];
  for (const child of data.children ?? []) {
    const built = await buildNode(child, parent, ctx, host, propMap);
    if (built) {
      kids.push(built);
      kidData.push(child);
    }
  }
  if (!kids.length) {
    ctx.warn(`불리언 '${data.name}'에 재현 가능한 자식이 없어 빈 프레임으로 대체합니다.`);
    return figma.createFrame();
  }
  const op = String(data.props['booleanOperation'] ?? 'UNION');
  let node: BooleanOperationNode;
  try {
    if (op === 'SUBTRACT') node = figma.subtract(kids, parent);
    else if (op === 'INTERSECT') node = figma.intersect(kids, parent);
    else if (op === 'EXCLUDE') node = figma.exclude(kids, parent);
    else node = figma.union(kids, parent);
  } catch (e) {
    ctx.warn(`불리언 연산 실패 '${data.name}': ${errMsg(e)} — 프레임으로 대체합니다.`);
    const frame = figma.createFrame();
    for (const kid of kids) {
      try {
        frame.appendChild(kid);
      } catch {
        // leave the child where it is
      }
    }
    return frame;
  }
  // Children transforms are container-relative (not boolean-relative);
  // re-apply now that the children sit inside the boolean node.
  for (let i = 0; i < kids.length; i++) {
    applyTransform(kids[i], kidData[i].relativeTransform, ctx);
  }
  return node;
}

// ------------------------------------------------------------- tree builder

function isChildrenNode(node: SceneNode): node is SceneNode & ChildrenMixin {
  return 'appendChild' in node;
}

async function buildNode(
  data: NodeData,
  parent: BaseNode & ChildrenMixin,
  ctx: Ctx,
  host: ComponentNode | null,
  propMap: PropNameMap | null
): Promise<SceneNode | null> {
  let node: SceneNode;
  let childrenHandled = false;
  switch (data.type) {
    case 'FRAME':
      node = figma.createFrame();
      break;
    case 'RECTANGLE':
      node = figma.createRectangle();
      break;
    case 'ELLIPSE':
      node = figma.createEllipse();
      break;
    case 'LINE':
      node = figma.createLine();
      break;
    case 'TEXT':
      node = figma.createText();
      break;
    case 'VECTOR':
      node = createVectorNode(data, ctx);
      break;
    case 'BOOLEAN_OPERATION':
      node = await createBooleanNode(data, parent, ctx, host, propMap);
      childrenHandled = true;
      break;
    case 'INSTANCE':
      node = await createInstanceNode(data, ctx);
      childrenHandled = true; // subtree comes from the main component
      break;
    case 'SLOT':
      node = createSlotNode(data, ctx, host);
      break;
    default:
      ctx.warnDedup(`미지원 노드 타입 '${data.type}' — FRAME으로 대체합니다.`);
      node = figma.createFrame();
      break;
  }

  ctx.nodeIdMap.set(data.id, node.id);
  if (node.name.indexOf(MISSING_PREFIX) !== 0) {
    try {
      node.name = data.name;
    } catch {
      // name is not critical
    }
  }

  if (node.type === 'TEXT') {
    await applyText(node, data, ctx); // fonts + characters before any text prop
  }
  applyNodeProps(node, data.type, data.props, 'pre', ctx.warnDedup);
  applyResize(node, data, ctx);

  if (node.parent !== parent) {
    try {
      parent.appendChild(node);
    } catch (e) {
      ctx.warn(`'${data.name}' 부모 연결 실패: ${errMsg(e)}`);
    }
  }

  applyNodeProps(node, data.type, data.props, 'post', ctx.warnDedup);
  if (data.type !== 'BOOLEAN_OPERATION') {
    applyTransform(node, data.relativeTransform, ctx);
  }
  await applyCommon(node, data, ctx, propMap);

  if (data.type === 'INSTANCE' && node.type === 'INSTANCE') {
    if (data.instance && data.instance.overrides) {
      ctx.deferredOverrides.push({ node, data });
    }
  } else if (!childrenHandled && data.children && data.children.length) {
    if (isChildrenNode(node)) {
      for (const child of data.children) {
        await buildNode(child, node, ctx, host, propMap);
      }
    } else {
      ctx.warnDedup(`'${data.name}' (${node.type})은 자식을 가질 수 없어 하위 트리를 건너뜁니다.`);
    }
  }
  return node;
}

// -------------------------------------------------- component property defs

async function addPropertyDefs(
  owner: ComponentNode | ComponentSetNode,
  defs: ComponentPropertyDefData[],
  ctx: Ctx
): Promise<PropNameMap> {
  const map: PropNameMap = new Map();
  for (const def of defs) {
    if (def.type === 'VARIANT') {
      map.set(def.name, def.name); // created by combineAsVariants from child names
      continue;
    }
    if (def.type === 'SLOT') {
      continue; // reconciled after the tree pass (createSlot creates them)
    }
    const plain = plainPropName(def.name);
    let defaultValue: string | boolean | VariableAlias =
      def.defaultValue !== undefined ? def.defaultValue : def.type === 'BOOLEAN' ? false : '';
    if (def.type === 'INSTANCE_SWAP') {
      const local = typeof def.defaultValue === 'string' ? ctx.componentIdMap.get(def.defaultValue) : undefined;
      const target = local ?? (def.defaultValueKey ? await importRemote(ctx, def.defaultValueKey) : null);
      if (!target) {
        ctx.warn(
          `INSTANCE_SWAP 프로퍼티 '${def.name}' 기본값 컴포넌트${def.defaultValueRemote ? '(원격)' : ''}를 찾지 못해 프로퍼티 생성을 건너뜁니다.`
        );
        continue;
      }
      defaultValue = target.id;
    }
    if (def.boundDefaultValue) {
      const variable = await resolveVariable(ctx, def.boundDefaultValue);
      if (variable) defaultValue = figma.variables.createVariableAlias(variable);
    }
    let options: ComponentPropertyOptions | undefined;
    if (def.type === 'INSTANCE_SWAP' && def.preferredValues && def.preferredValues.length) {
      options = { preferredValues: def.preferredValues.map((p) => ({ type: p.type, key: p.key })) };
    }
    try {
      const newName = owner.addComponentProperty(plain, def.type, defaultValue, options);
      map.set(def.name, newName);
    } catch (e) {
      ctx.warn(`컴포넌트 프로퍼티 '${def.name}' 생성 실패 ('${owner.name}'): ${errMsg(e)}`);
    }
  }
  return map;
}

function verifyVariantDefs(set: ComponentSetNode, defs: ComponentPropertyDefData[], ctx: Ctx): void {
  let current: ComponentPropertyDefinitions;
  try {
    current = set.componentPropertyDefinitions;
  } catch (e) {
    ctx.warnDedup(`'${set.name}' 프로퍼티 정의 확인 실패: ${errMsg(e)}`);
    return;
  }
  for (const def of defs) {
    if (def.type !== 'VARIANT') continue;
    const actual = current[def.name];
    if (!actual || actual.type !== 'VARIANT') {
      ctx.warn(`'${set.name}'의 VARIANT 프로퍼티 '${def.name}'이 자식 이름에서 파생되지 않았습니다.`);
      continue;
    }
    const wanted = def.variantOptions ?? [];
    const got = actual.variantOptions ?? [];
    for (const option of wanted) {
      if (got.indexOf(option) < 0) {
        ctx.warn(`'${set.name}' VARIANT '${def.name}' 옵션 '${option}'이 재현되지 않았습니다.`);
      }
    }
  }
}

async function reconcileSlotDefs(
  owner: ComponentNode | ComponentSetNode,
  defs: ComponentPropertyDefData[],
  map: PropNameMap,
  ctx: Ctx
): Promise<void> {
  const wanted = defs.filter((d) => d.type === 'SLOT');
  if (!wanted.length) return;
  let currentSlotNames: string[] = [];
  try {
    const current = owner.componentPropertyDefinitions;
    currentSlotNames = Object.keys(current).filter((name) => current[name].type === 'SLOT');
  } catch (e) {
    ctx.warnDedup(`'${owner.name}' SLOT 정의 조회 실패: ${errMsg(e)}`);
  }
  for (let i = 0; i < wanted.length; i++) {
    const def = wanted[i];
    const plain = plainPropName(def.name);
    const edit: {
      name?: string;
      preferredValues?: InstanceSwapPreferredValue[];
      description?: string;
      slotSettings?: SlotSettings;
    } = { name: plain };
    if (def.description !== undefined) edit.description = def.description;
    if (def.slotSettings) edit.slotSettings = def.slotSettings as SlotSettings;
    if (def.preferredValues && def.preferredValues.length) {
      edit.preferredValues = def.preferredValues.map((p) => ({ type: p.type, key: p.key }));
    }
    if (i < currentSlotNames.length) {
      // createSlot() materialized a definition — rename/configure it.
      try {
        const newName = owner.editComponentProperty(currentSlotNames[i], edit);
        map.set(def.name, newName);
      } catch (e) {
        ctx.warn(`SLOT 프로퍼티 '${def.name}' 설정 실패 ('${owner.name}'): ${errMsg(e)}`);
      }
    } else {
      // No auto-created definition: try creating one directly (defaultValue
      // semantics for SLOT are undocumented — '' is the best-effort value).
      try {
        let newName = owner.addComponentProperty(plain, 'SLOT', '');
        try {
          newName = owner.editComponentProperty(newName, edit);
        } catch {
          // settings are cosmetic; keep the property
        }
        map.set(def.name, newName);
      } catch (e) {
        ctx.warn(
          `SLOT 프로퍼티 '${def.name}' 재생성 실패 ('${owner.name}') — 슬롯 콘텐츠는 일반 자식으로 유지됩니다: ${errMsg(e)}`
        );
      }
    }
  }
  if (currentSlotNames.length > wanted.length) {
    ctx.warn(
      `'${owner.name}': 트리 재구성이 만든 SLOT 정의(${currentSlotNames.length}개)가 원본(${wanted.length}개)보다 많습니다 — 초과 정의는 자동 생성 이름/설정으로 남습니다.`
    );
  }
}

// --------------------------------------------------------- instance overrides

async function rebuildSlotContent(slot: SceneNode & ChildrenMixin, kids: NodeData[], ctx: Ctx): Promise<void> {
  try {
    for (const child of [...slot.children]) {
      child.remove();
    }
  } catch (e) {
    ctx.warn(`슬롯 '${slot.name}' 기존 콘텐츠 제거 실패: ${errMsg(e)} — 오버라이드를 건너뜁니다.`);
    return;
  }
  for (const child of kids) {
    await buildNode(child, slot, ctx, null, null);
  }
}

async function walkOverride(node: SceneNode, data: NodeData, ctx: Ctx, isRoot: boolean): Promise<void> {
  ctx.nodeIdMap.set(data.id, node.id);

  if (!isRoot && node.type === 'INSTANCE' && data.type === 'INSTANCE' && data.instance) {
    const inst = data.instance;
    let want: ComponentNode | null = ctx.componentIdMap.get(inst.componentId) ?? null;
    if (!want && inst.componentKey) want = await importRemote(ctx, inst.componentKey);
    if (want) {
      let current: ComponentNode | null = null;
      try {
        current = await node.getMainComponentAsync();
      } catch {
        current = null;
      }
      if (current && current.id !== want.id) {
        try {
          node.swapComponent(want); // preserves overrides, unlike mainComponent =
        } catch (e) {
          ctx.warnDedup(`중첩 인스턴스 '${node.name}' 스왑 실패: ${errMsg(e)}`);
        }
      }
    }
    await applyInstanceProps(node, want, inst, ctx);
    if (inst.overrides) {
      await walkOverride(node, inst.overrides, ctx, true);
    }
    return;
  }

  // Override-safe leaf properties. Every write below diffs against the
  // node's current (main-inherited) value first: only genuine source
  // overrides are re-applied, so instance sublayers are not override-pinned
  // wholesale (SPEC "re-apply differing leaf properties").
  applyOverrideProps(node, data.props, ctx.warnDedup);
  if (node.type === 'TEXT' && data.text) {
    await applyText(node, data, ctx);
  }
  if (data.fills !== undefined && data.fills !== null && 'fills' in node) {
    const target = node as SceneNode & MinimalFillsMixin;
    const paints = await deserializePaints(data.fills, ctx);
    if (!sameAfterPlain(target.fills, paints)) {
      try {
        target.fills = paints;
      } catch (e) {
        ctx.warnDedup(`오버라이드 채우기 실패 '${node.name}': ${errMsg(e)}`);
      }
    }
  }
  if (data.strokes && 'strokes' in node) {
    const target = node as SceneNode & MinimalStrokesMixin;
    const paints = await deserializePaints(data.strokes, ctx);
    if (!sameAfterPlain(target.strokes, paints)) {
      try {
        target.strokes = paints;
      } catch (e) {
        ctx.warnDedup(`오버라이드 획 실패 '${node.name}': ${errMsg(e)}`);
      }
    }
  }
  if (data.effects && 'effects' in node) {
    const target = node as SceneNode & BlendMixin;
    const effects = await deserializeEffects(data.effects, ctx);
    if (!sameAfterPlain(target.effects, effects)) {
      try {
        target.effects = effects;
      } catch (e) {
        ctx.warnDedup(`오버라이드 이펙트 실패 '${node.name}': ${errMsg(e)}`);
      }
    }
  }
  if (data.fillStyleId && !styleAlreadyApplied(node, 'fillStyleId', data.fillStyleId, ctx)) {
    await applyMappedStyle(node, 'setFillStyleIdAsync', data.fillStyleId, ctx);
  }
  if (data.strokeStyleId && !styleAlreadyApplied(node, 'strokeStyleId', data.strokeStyleId, ctx)) {
    await applyMappedStyle(node, 'setStrokeStyleIdAsync', data.strokeStyleId, ctx);
  }
  if (data.effectStyleId && !styleAlreadyApplied(node, 'effectStyleId', data.effectStyleId, ctx)) {
    await applyMappedStyle(node, 'setEffectStyleIdAsync', data.effectStyleId, ctx);
  }
  await applyBoundVariables(node, data, ctx);
  // Per-instance reaction overrides ride the deferred pass (pass 5) like all
  // other reactions. The instance ROOT may already be queued via applyCommon
  // with the identical payload — a second setReactionsAsync is harmless.
  if (data.reactions && data.reactions.length && 'reactions' in node) {
    ctx.deferredReactions.push({ node, reactions: data.reactions });
  }

  // Children — parallel walk by index + name.
  const kids = data.children ?? [];
  if (!kids.length) return;
  if (!('children' in node)) {
    ctx.warn(`오버라이드 구조 불일치: '${node.name}'에 자식이 없습니다 — 분기를 중단합니다.`);
    return;
  }
  const fresh = (node as SceneNode & ChildrenMixin).children;
  if (node.type === 'SLOT' && fresh.length !== kids.length) {
    // Slot content is instance-editable: replace it outright.
    await rebuildSlotContent(node as SceneNode & ChildrenMixin, kids, ctx);
    return;
  }
  if (fresh.length !== kids.length) {
    ctx.warn(
      `오버라이드 구조 불일치: '${node.name}' 자식 수 ${fresh.length} ≠ ${kids.length} — 분기를 중단합니다.`
    );
    return;
  }
  const used = new Set<number>();
  for (let i = 0; i < kids.length; i++) {
    const kd = kids[i];
    let index = -1;
    if (!used.has(i) && fresh[i].name === kd.name) {
      index = i;
    } else {
      for (let j = 0; j < fresh.length; j++) {
        if (!used.has(j) && fresh[j].name === kd.name) {
          index = j;
          break;
        }
      }
    }
    // Names systematically diverge exactly when an override exists: an
    // auto-renamed TEXT layer's serialized name follows its OVERRIDDEN
    // characters, and a manually swapped nested instance is named after the
    // swapped component. Child counts are equal here (checked above) and the
    // fresh subtree preserves the main's child order, so fall back to
    // positional pairing (same index, same type) before giving up.
    if (index < 0 && !used.has(i) && fresh[i].type === kd.type) {
      index = i;
    }
    if (index < 0) {
      ctx.warn(`오버라이드 자식 매칭 실패: '${node.name}' > '${kd.name}' — 해당 자식을 건너뜁니다.`);
      continue;
    }
    used.add(index);
    await walkOverride(fresh[index], kd, ctx, false);
  }
}

// ---------------------------------------------------------------- reactions

function remapReactions(reactions: unknown[], ctx: Ctx): unknown[] {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const src = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(src)) {
        const v = src[key];
        if (key === 'destinationId' && typeof v === 'string') {
          const mapped = ctx.nodeIdMap.get(v);
          if (!mapped) ctx.warnDedup('리액션 대상 노드가 재현 범위에 없어 대상 없이 연결합니다.');
          out[key] = mapped ?? null;
        } else if (key === 'variableId' && typeof v === 'string') {
          const mapped = ctx.varMap.get(v);
          if (!mapped) ctx.warnDedup('리액션이 참조하는 변수 매핑이 없어 대상 없이 연결합니다.');
          out[key] = mapped ?? null;
        } else {
          out[key] = walk(v);
        }
      }
      return out;
    }
    return value;
  };
  return reactions.map(walk);
}

// -------------------------------------------------------------- entry point

interface ShellItem {
  itemData: PageComponentsData['items'][number];
  top: SceneNode;
  members: { data: NodeData; node: ComponentNode }[] | null;
  defsOwner: ComponentNode | ComponentSetNode | null;
  defs: ComponentPropertyDefData[];
  propMap: PropNameMap;
}

interface ShellPage {
  section: SectionNode;
  items: ShellItem[];
}

function countComponents(doc: PodoExport): number {
  let count = 0;
  for (const page of doc.pages) {
    for (const item of page.items) {
      if (item.node.type === 'COMPONENT_SET') {
        for (const child of item.node.children ?? []) {
          if (child.type === 'COMPONENT') count++;
        }
      } else if (item.node.type === 'COMPONENT') {
        count++;
      }
    }
  }
  return count;
}

async function populateComponent(
  comp: ComponentNode,
  data: NodeData,
  ctx: Ctx,
  propMap: PropNameMap
): Promise<void> {
  ctx.nodeIdMap.set(data.id, comp.id);
  if (data.component) {
    try {
      if (data.component.description) comp.description = data.component.description;
    } catch (e) {
      ctx.warnDedup(`컴포넌트 설명 적용 실패 '${data.name}': ${errMsg(e)}`);
    }
    try {
      if (data.component.documentationLinks && data.component.documentationLinks.length) {
        comp.documentationLinks = data.component.documentationLinks;
      }
    } catch (e) {
      ctx.warnDedup(`문서 링크 적용 실패 '${data.name}': ${errMsg(e)}`);
    }
  }
  applyNodeProps(comp, 'COMPONENT', data.props, 'pre', ctx.warnDedup);
  applyResize(comp, data, ctx);
  applyNodeProps(comp, 'COMPONENT', data.props, 'post', ctx.warnDedup);
  applyTransform(comp, data.relativeTransform, ctx);
  await applyCommon(comp, data, ctx, propMap);
  for (const child of data.children ?? []) {
    await buildNode(child, comp, ctx, comp, propMap);
  }
}

export async function buildComponents(
  doc: PodoExport,
  varMap: Map<string, string>,
  styleMap: Map<string, string>,
  page: PageNode,
  onProgress: (done: number, total: number) => void,
  warn: (m: string) => void
): Promise<{ componentSets: number; components: number }> {
  const seenWarnings = new Set<string>();
  const ctx: Ctx = {
    doc,
    varMap,
    styleMap,
    warn,
    warnDedup: (m: string) => {
      if (seenWarnings.has(m)) return;
      seenWarnings.add(m);
      warn(m);
    },
    componentIdMap: new Map(),
    nodeIdMap: new Map(),
    propMapByOwner: new Map(),
    remoteCache: new Map(),
    variableCache: new Map(),
    loadedFonts: new Set(),
    failedFonts: new Set(),
    fallbackFontReady: null,
    deferredOverrides: [],
    deferredReactions: [],
    imageMap: new Map(),
    svgWrapperIds: new Set()
  };

  // Hidden instance children must stay walkable during the override pass.
  figma.skipInvisibleInstanceChildren = false;

  // Preload every exported font (cached, per-font failure -> warning).
  await Promise.all(doc.fonts.map((font) => ensureFont(ctx, font)));

  const total = countComponents(doc);
  onProgress(0, total);

  let createdSets = 0;
  let createdComponents = 0;

  // ------------------------------------------------- pass 1a: shells + sections
  const shellPages: ShellPage[] = [];
  let shellCount = 0;
  for (const pageData of doc.pages) {
    if (!pageData.items.length) continue;
    const section = figma.createSection();
    section.name = pageData.pageName;
    page.appendChild(section);
    const shellPage: ShellPage = { section, items: [] };
    shellPages.push(shellPage);

    for (const item of pageData.items) {
      const nodeData = item.node;
      if (nodeData.type === 'COMPONENT_SET') {
        const memberData = (nodeData.children ?? []).filter((c) => c.type === 'COMPONENT');
        if (!memberData.length) {
          warn(`컴포넌트 세트 '${nodeData.name}'에 배리언트가 없어 건너뜁니다.`);
          continue;
        }
        const members: { data: NodeData; node: ComponentNode }[] = [];
        for (const m of memberData) {
          const shell = figma.createComponent();
          shell.name = m.name; // 'Prop=Value' names drive variant derivation
          ctx.componentIdMap.set(m.id, shell);
          members.push({ data: m, node: shell });
          createdComponents++;
        }
        let set: ComponentSetNode | null = null;
        try {
          set = figma.combineAsVariants(
            members.map((m) => m.node),
            section
          );
          set.name = nodeData.name;
          ctx.nodeIdMap.set(nodeData.id, set.id);
          createdSets++;
        } catch (e) {
          warn(
            `'${nodeData.name}' 배리언트 결합 실패: ${errMsg(e)} — 멤버를 독립 컴포넌트로 유지합니다.`
          );
          for (const m of members) {
            try {
              section.appendChild(m.node);
            } catch {
              // stays on the current page
            }
          }
        }
        shellPage.items.push({
          itemData: item,
          top: set ?? members[0].node,
          members,
          defsOwner: set,
          defs: nodeData.componentSet ? nodeData.componentSet.propertyDefs : [],
          propMap: new Map()
        });
      } else if (nodeData.type === 'COMPONENT') {
        const shell = figma.createComponent();
        shell.name = nodeData.name;
        try {
          section.appendChild(shell);
        } catch (e) {
          warn(`'${nodeData.name}' 섹션 배치 실패: ${errMsg(e)}`);
        }
        ctx.componentIdMap.set(nodeData.id, shell);
        createdComponents++;
        shellPage.items.push({
          itemData: item,
          top: shell,
          members: null,
          defsOwner: shell,
          defs: nodeData.component ? nodeData.component.propertyDefs : [],
          propMap: new Map()
        });
      } else {
        warn(`최상위 항목 '${nodeData.name}'의 타입(${nodeData.type})은 지원하지 않습니다.`);
        continue;
      }
      shellCount++;
      if (shellCount % 50 === 0) await yieldToUi();
    }
  }

  // ---------------------------------------------------- pass 1b: property defs
  for (const shellPage of shellPages) {
    for (const item of shellPage.items) {
      if (!item.defsOwner) continue;
      item.propMap = await addPropertyDefs(item.defsOwner, item.defs, ctx);
      ctx.propMapByOwner.set(item.defsOwner.id, item.propMap);
      if (item.defsOwner.type === 'COMPONENT_SET') {
        verifyVariantDefs(item.defsOwner, item.defs, ctx);
      }
    }
  }
  await yieldToUi();

  // ----------------------------------------------------------- pass 2: trees
  let done = 0;
  const progress = async (): Promise<void> => {
    done++;
    if (done % 20 === 0 || done >= total) {
      onProgress(Math.min(done, total), total);
      await yieldToUi();
    }
  };

  for (const shellPage of shellPages) {
    for (const item of shellPage.items) {
      const nodeData = item.itemData.node;
      if (item.members) {
        // The set's own 'pre' props (layoutMode first) must be live BEFORE
        // the members are populated: member-level 'post' props (layoutAlign /
        // layoutSizing* / min-max) guard on the parent set's auto-layout
        // state and would be silently skipped while the set is still NONE.
        if (item.defsOwner && item.defsOwner.type === 'COMPONENT_SET') {
          applyNodeProps(item.defsOwner, 'COMPONENT_SET', nodeData.props, 'pre', ctx.warnDedup);
        }
        for (const member of item.members) {
          await populateComponent(member.node, member.data, ctx, item.propMap);
          await progress();
        }
        if (item.defsOwner && item.defsOwner.type === 'COMPONENT_SET') {
          const set = item.defsOwner;
          if (nodeData.componentSet) {
            try {
              if (nodeData.componentSet.description) set.description = nodeData.componentSet.description;
            } catch (e) {
              ctx.warnDedup(`세트 설명 적용 실패 '${nodeData.name}': ${errMsg(e)}`);
            }
            try {
              if (nodeData.componentSet.documentationLinks && nodeData.componentSet.documentationLinks.length) {
                set.documentationLinks = nodeData.componentSet.documentationLinks;
              }
            } catch (e) {
              ctx.warnDedup(`세트 문서 링크 적용 실패 '${nodeData.name}': ${errMsg(e)}`);
            }
          }
          try {
            set.resizeWithoutConstraints(Math.max(nodeData.width, 0.01), Math.max(nodeData.height, 0.01));
          } catch (e) {
            ctx.warnDedup(`세트 크기 적용 실패 '${nodeData.name}': ${errMsg(e)}`);
          }
          applyNodeProps(set, 'COMPONENT_SET', nodeData.props, 'post', ctx.warnDedup);
          await applyCommon(set, nodeData, ctx, item.propMap);
          await reconcileSlotDefs(set, item.defs, item.propMap, ctx);
        }
      } else if (item.top.type === 'COMPONENT') {
        await populateComponent(item.top, nodeData, ctx, item.propMap);
        if (item.defsOwner) {
          await reconcileSlotDefs(item.defsOwner, item.defs, item.propMap, ctx);
        }
        await progress();
      }
    }
  }

  // ------------------------------------------------ pass 3: instance overrides
  for (let i = 0; i < ctx.deferredOverrides.length; i++) {
    const rec = ctx.deferredOverrides[i];
    const overrides = rec.data.instance ? rec.data.instance.overrides : undefined;
    if (!overrides) continue;
    try {
      await walkOverride(rec.node, overrides, ctx, true);
    } catch (e) {
      warn(`인스턴스 '${rec.node.name}' 오버라이드 적용 중 오류: ${errMsg(e)}`);
    }
    if ((i + 1) % 20 === 0) await yieldToUi();
  }
  onProgress(Math.min(done, total), total);

  // ------------------------------------------------------- pass 4: placement
  let sectionY = 0;
  for (const shellPage of shellPages) {
    if (!shellPage.items.length) {
      try {
        shellPage.section.remove();
      } catch {
        // keep the empty section if removal fails
      }
      continue;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const item of shellPage.items) {
      minX = Math.min(minX, item.itemData.x);
      minY = Math.min(minY, item.itemData.y);
      maxX = Math.max(maxX, item.itemData.x + item.itemData.node.width);
      maxY = Math.max(maxY, item.itemData.y + item.itemData.node.height);
    }
    for (const item of shellPage.items) {
      const rt = item.itemData.node.relativeTransform;
      const rotation =
        rt && rt.length >= 2 && rt[0].length >= 3 && rt[1].length >= 3
          ? rt
          : [
              [1, 0, 0],
              [0, 1, 0]
            ];
      applyTransform(
        item.top,
        [
          [rotation[0][0], rotation[0][1], item.itemData.x - minX + SECTION_PADDING],
          [rotation[1][0], rotation[1][1], item.itemData.y - minY + SECTION_PADDING]
        ],
        ctx
      );
    }
    const width = maxX - minX + SECTION_PADDING * 2;
    const height = maxY - minY + SECTION_PADDING * 2;
    try {
      shellPage.section.resizeWithoutConstraints(Math.max(width, 0.01), Math.max(height, 0.01));
    } catch (e) {
      ctx.warnDedup(`섹션 크기 적용 실패 '${shellPage.section.name}': ${errMsg(e)}`);
    }
    shellPage.section.x = 0;
    shellPage.section.y = sectionY;
    sectionY += Math.max(height, 0.01) + SECTION_GAP;
  }

  // ------------------------------------------------------- pass 5: reactions
  for (const rec of ctx.deferredReactions) {
    const remapped = remapReactions(rec.reactions, ctx);
    const target = rec.node as unknown as { setReactionsAsync?: (r: unknown[]) => Promise<void> };
    if (typeof target.setReactionsAsync !== 'function') continue;
    try {
      await target.setReactionsAsync.call(rec.node, remapped);
    } catch (e) {
      ctx.warnDedup(`리액션 적용 실패 '${rec.node.name}': ${errMsg(e)}`);
    }
  }

  onProgress(total, total);
  return { componentSets: createdSets, components: createdComponents };
}
