/**
 * Export side — local styles (text / effect / paint / grid).
 *
 * The source file has 20 text + 3 effect styles and no paint/grid styles,
 * but all four kinds are enumerated for completeness. Text-style
 * boundVariables (fontFamily / fontSize / ...) and effect boundVariables
 * are captured as field → source-variable-id maps and remapped on import.
 *
 * Paint/effect serialization helpers are deliberately local (minimal)
 * copies rather than imports from export/nodes.ts, to avoid a circular
 * seam between the parallel modules — styles only need solid paints and
 * shadow/blur effects.
 */

import {
  BoundVarMap,
  EffectData,
  EffectStyleData,
  GridStyleData,
  PaintData,
  PaintStyleData,
  StylesData,
  TextStyleData
} from '../schema';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** alias-per-field map ({ fontSize: {type,id} }) -> { fontSize: id }. */
function serializeAliasMap(
  boundVariables: { [field: string]: VariableAlias | undefined } | undefined
): BoundVarMap | undefined {
  if (!boundVariables) {
    return undefined;
  }
  const out: BoundVarMap = {};
  let any = false;
  for (const field of Object.keys(boundVariables)) {
    const alias = boundVariables[field];
    if (alias) {
      out[field] = alias.id;
      any = true;
    }
  }
  return any ? out : undefined;
}

function serializeLineHeight(lineHeight: LineHeight): { unit: string; value?: number } {
  if (lineHeight.unit === 'AUTO') {
    return { unit: 'AUTO' };
  }
  return { unit: lineHeight.unit, value: lineHeight.value };
}

// ------------------------------------------------------- local paint helper

function serializeStylePaint(
  paint: Paint,
  context: string,
  warn: (m: string) => void
): PaintData | null {
  if (paint.type !== 'SOLID') {
    // Source file has no paint styles at all; anything non-solid here is
    // outside the measured inventory — warn instead of silently dropping.
    warn(`${context}: unsupported paint type ${paint.type} in a paint style; dropped.`);
    return null;
  }
  const data: PaintData = {
    type: 'SOLID',
    color: { r: paint.color.r, g: paint.color.g, b: paint.color.b }
  };
  if (paint.opacity !== undefined) {
    data.opacity = paint.opacity;
  }
  if (paint.visible !== undefined) {
    data.visible = paint.visible;
  }
  if (paint.blendMode !== undefined) {
    data.blendMode = paint.blendMode;
  }
  const bound = serializeAliasMap(paint.boundVariables);
  if (bound) {
    data.bound = bound;
  }
  return data;
}

// ------------------------------------------------------ local effect helper

function serializeStyleEffect(
  effect: Effect,
  context: string,
  warn: (m: string) => void
): EffectData | null {
  if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
    const value: Record<string, unknown> = {
      type: effect.type,
      color: { r: effect.color.r, g: effect.color.g, b: effect.color.b, a: effect.color.a },
      offset: { x: effect.offset.x, y: effect.offset.y },
      radius: effect.radius,
      visible: effect.visible,
      blendMode: effect.blendMode
    };
    if (effect.spread !== undefined) {
      value.spread = effect.spread;
    }
    if (effect.type === 'DROP_SHADOW' && effect.showShadowBehindNode !== undefined) {
      value.showShadowBehindNode = effect.showShadowBehindNode;
    }
    const data: EffectData = { type: effect.type, value };
    const bound = serializeAliasMap(effect.boundVariables);
    if (bound) {
      data.bound = bound;
    }
    return data;
  }

  if (effect.type === 'LAYER_BLUR' || effect.type === 'BACKGROUND_BLUR') {
    const value: Record<string, unknown> = {
      type: effect.type,
      radius: effect.radius,
      visible: effect.visible,
      blurType: effect.blurType
    };
    if (effect.blurType === 'PROGRESSIVE') {
      value.startRadius = effect.startRadius;
      value.startOffset = { x: effect.startOffset.x, y: effect.startOffset.y };
      value.endOffset = { x: effect.endOffset.x, y: effect.endOffset.y };
    }
    const data: EffectData = { type: effect.type, value };
    const bound = serializeAliasMap(effect.boundVariables);
    if (bound) {
      data.bound = bound;
    }
    return data;
  }

  warn(`${context}: unsupported effect type ${effect.type}; dropped.`);
  return null;
}

// ------------------------------------------------------------------- styles

function serializeTextStyle(style: TextStyle): TextStyleData {
  const data: TextStyleData = {
    id: style.id,
    name: style.name,
    description: style.description,
    fontName: { family: style.fontName.family, style: style.fontName.style },
    fontSize: style.fontSize,
    letterSpacing: { unit: style.letterSpacing.unit, value: style.letterSpacing.value },
    lineHeight: serializeLineHeight(style.lineHeight),
    paragraphIndent: style.paragraphIndent,
    paragraphSpacing: style.paragraphSpacing,
    listSpacing: style.listSpacing,
    textCase: style.textCase,
    textDecoration: style.textDecoration,
    leadingTrim: style.leadingTrim
  };
  const bound = serializeAliasMap(style.boundVariables);
  if (bound) {
    data.bound = bound;
  }
  return data;
}

function serializeEffectStyle(style: EffectStyle, warn: (m: string) => void): EffectStyleData {
  const effects: EffectData[] = [];
  for (const effect of style.effects) {
    const data = serializeStyleEffect(effect, `exportStyles: effect style "${style.name}"`, warn);
    if (data) {
      effects.push(data);
    }
  }
  return {
    id: style.id,
    name: style.name,
    description: style.description,
    effects
  };
}

function serializePaintStyle(style: PaintStyle, warn: (m: string) => void): PaintStyleData {
  const paints: PaintData[] = [];
  for (const paint of style.paints) {
    const data = serializeStylePaint(paint, `exportStyles: paint style "${style.name}"`, warn);
    if (data) {
      paints.push(data);
    }
  }
  return {
    id: style.id,
    name: style.name,
    description: style.description,
    paints
  };
}

function serializeGridStyle(style: GridStyle, warn: (m: string) => void): GridStyleData {
  // Grid styles are unused in the source file (0 measured); LayoutGrid
  // objects are plain JSON-safe data, so a structural copy is sufficient.
  const layoutGrids: Record<string, unknown>[] = [];
  for (const grid of style.layoutGrids) {
    layoutGrids.push(JSON.parse(JSON.stringify(grid)) as Record<string, unknown>);
    if ('boundVariables' in grid && grid.boundVariables && Object.keys(grid.boundVariables).length > 0) {
      warn(
        `exportStyles: grid style "${style.name}" has bound variables on a layout grid; these are not remapped on import.`
      );
    }
  }
  return {
    id: style.id,
    name: style.name,
    description: style.description,
    layoutGrids
  };
}

export async function exportStyles(warn: (m: string) => void): Promise<StylesData> {
  const [textStyles, effectStyles, paintStyles, gridStyles] = await Promise.all([
    figma.getLocalTextStylesAsync(),
    figma.getLocalEffectStylesAsync(),
    figma.getLocalPaintStylesAsync(),
    figma.getLocalGridStylesAsync()
  ]);

  const out: StylesData = { text: [], effect: [], paint: [], grid: [] };

  for (const style of textStyles) {
    try {
      out.text.push(serializeTextStyle(style));
    } catch (e) {
      warn(`exportStyles: failed to serialize text style "${style.name}": ${errorMessage(e)}`);
    }
  }
  for (const style of effectStyles) {
    try {
      out.effect.push(serializeEffectStyle(style, warn));
    } catch (e) {
      warn(`exportStyles: failed to serialize effect style "${style.name}": ${errorMessage(e)}`);
    }
  }
  for (const style of paintStyles) {
    try {
      out.paint.push(serializePaintStyle(style, warn));
    } catch (e) {
      warn(`exportStyles: failed to serialize paint style "${style.name}": ${errorMessage(e)}`);
    }
  }
  for (const style of gridStyles) {
    try {
      out.grid.push(serializeGridStyle(style, warn));
    } catch (e) {
      warn(`exportStyles: failed to serialize grid style "${style.name}": ${errorMessage(e)}`);
    }
  }

  return out;
}
