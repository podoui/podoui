/**
 * Import side — local styles (text / effect / paint / grid).
 *
 * Runs after importVariables (SPEC "Hard ordering rules" #2) so that
 * variable-bound style fields (text fontFamily/fontSize, effect color/...)
 * can be rebound through the old→new variable id map. Raw values are always
 * written first, so a missing variable degrades to the raw value + warning.
 *
 * Text styles load their font before any property assignment; a font that
 * fails to load (e.g. SF Mono missing on the target machine) skips that one
 * style with a warning and the import continues.
 */

import { EffectData, PaintData, StylesData, TextStyleData } from '../schema';

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function deserializeLineHeight(lineHeight: { unit: string; value?: number }): LineHeight {
  if (lineHeight.unit === 'AUTO' || lineHeight.value === undefined) {
    return { unit: 'AUTO' };
  }
  return { unit: lineHeight.unit as 'PIXELS' | 'PERCENT', value: lineHeight.value };
}

/** Lazily resolves old source variable ids to freshly created Variable objects. */
class VariableResolver {
  private cache = new Map<string, Variable | null>();

  constructor(private varMap: Map<string, string>) {}

  async resolve(oldVarId: string): Promise<Variable | null> {
    const newVarId = this.varMap.get(oldVarId);
    if (newVarId === undefined) {
      return null;
    }
    let variable = this.cache.get(newVarId);
    if (variable === undefined) {
      variable = await figma.variables.getVariableByIdAsync(newVarId);
      this.cache.set(newVarId, variable);
    }
    return variable;
  }
}

// -------------------------------------------------------------- text styles

const TEXT_STYLE_BINDABLE_FIELDS: readonly VariableBindableTextField[] = [
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'paragraphSpacing',
  'paragraphIndent'
];

function isTextStyleBindableField(field: string): field is VariableBindableTextField {
  return (TEXT_STYLE_BINDABLE_FIELDS as readonly string[]).indexOf(field) !== -1;
}

async function importTextStyle(
  data: TextStyleData,
  resolver: VariableResolver,
  styleMap: Map<string, string>,
  warn: (m: string) => void
): Promise<void> {
  // Load the font BEFORE creating anything so a missing font (SF Mono on a
  // machine without it) leaves no half-initialized orphan style behind.
  const fontName: FontName = { family: data.fontName.family, style: data.fontName.style };
  try {
    await figma.loadFontAsync(fontName);
  } catch (e) {
    warn(
      `importStyles: text style "${data.name}" skipped — font ${fontName.family} ${fontName.style} could not be loaded: ${errorMessage(e)}`
    );
    return;
  }

  let style: TextStyle | null = null;
  try {
    style = figma.createTextStyle();
    style.name = data.name;
    style.description = data.description;
    style.fontName = fontName;
    style.fontSize = data.fontSize;
    style.letterSpacing = {
      unit: data.letterSpacing.unit as 'PIXELS' | 'PERCENT',
      value: data.letterSpacing.value
    };
    style.lineHeight = deserializeLineHeight(data.lineHeight);
    style.paragraphIndent = data.paragraphIndent;
    style.paragraphSpacing = data.paragraphSpacing;
    if (data.listSpacing !== undefined) {
      style.listSpacing = data.listSpacing;
    }
    style.textCase = data.textCase as TextCase;
    style.textDecoration = data.textDecoration as TextDecoration;
    if (data.leadingTrim !== undefined) {
      style.leadingTrim = data.leadingTrim as LeadingTrim;
    }
  } catch (e) {
    warn(`importStyles: text style "${data.name}" skipped: ${errorMessage(e)}`);
    if (style) {
      try {
        style.remove();
      } catch {
        // Best effort cleanup only.
      }
    }
    return;
  }

  // Raw values are in place — rebind variable-bound fields on top. A missing
  // variable keeps the raw value (already set above) and warns.
  if (data.bound) {
    for (const field of Object.keys(data.bound)) {
      const oldVarId = data.bound[field];
      if (!isTextStyleBindableField(field)) {
        warn(
          `importStyles: text style "${data.name}": bound field "${field}" is not bindable on a text style; raw value kept.`
        );
        continue;
      }
      const variable = await resolver.resolve(oldVarId);
      if (!variable) {
        warn(
          `importStyles: text style "${data.name}": variable ${oldVarId} for "${field}" was not imported; raw value kept.`
        );
        continue;
      }
      try {
        style.setBoundVariable(field, variable);
      } catch (e) {
        warn(
          `importStyles: text style "${data.name}": could not bind "${field}" to variable "${variable.name}": ${errorMessage(e)}; raw value kept.`
        );
      }
    }
  }

  styleMap.set(data.id, style.id);
}

// ------------------------------------------------------------ effect styles

const EFFECT_BINDABLE_FIELDS: readonly VariableBindableEffectField[] = [
  'color',
  'radius',
  'spread',
  'offsetX',
  'offsetY'
];

function isEffectBindableField(field: string): field is VariableBindableEffectField {
  return (EFFECT_BINDABLE_FIELDS as readonly string[]).indexOf(field) !== -1;
}

function deserializeEffect(data: EffectData, context: string, warn: (m: string) => void): Effect | null {
  const v = data.value;
  if (data.type === 'DROP_SHADOW' || data.type === 'INNER_SHADOW') {
    const shadow: DropShadowEffect | InnerShadowEffect = {
      type: data.type,
      color: v.color as RGBA,
      offset: v.offset as Vector,
      radius: v.radius as number,
      visible: v.visible as boolean,
      blendMode: v.blendMode as BlendMode,
      ...(v.spread !== undefined ? { spread: v.spread as number } : {}),
      ...(data.type === 'DROP_SHADOW' && v.showShadowBehindNode !== undefined
        ? { showShadowBehindNode: v.showShadowBehindNode as boolean }
        : {})
    };
    return shadow;
  }
  if (data.type === 'LAYER_BLUR' || data.type === 'BACKGROUND_BLUR') {
    if (v.blurType === 'PROGRESSIVE') {
      const progressive: BlurEffectProgressive = {
        type: data.type,
        blurType: 'PROGRESSIVE',
        radius: v.radius as number,
        visible: v.visible as boolean,
        startRadius: v.startRadius as number,
        startOffset: v.startOffset as Vector,
        endOffset: v.endOffset as Vector
      };
      return progressive;
    }
    const normal: BlurEffectNormal = {
      type: data.type,
      blurType: 'NORMAL',
      radius: v.radius as number,
      visible: v.visible as boolean
    };
    return normal;
  }
  warn(`${context}: unsupported effect type ${data.type}; dropped.`);
  return null;
}

async function rebindEffect(
  effect: Effect,
  bound: Record<string, string>,
  context: string,
  resolver: VariableResolver,
  warn: (m: string) => void
): Promise<Effect> {
  let current = effect;
  for (const field of Object.keys(bound)) {
    const oldVarId = bound[field];
    if (!isEffectBindableField(field)) {
      warn(`${context}: effect field "${field}" is not variable-bindable; raw value kept.`);
      continue;
    }
    const variable = await resolver.resolve(oldVarId);
    if (!variable) {
      warn(
        `${context}: variable ${oldVarId} for effect field "${field}" was not imported; raw value kept.`
      );
      continue;
    }
    try {
      current = figma.variables.setBoundVariableForEffect(current, field, variable);
    } catch (e) {
      warn(
        `${context}: could not bind effect field "${field}" to variable "${variable.name}": ${errorMessage(e)}; raw value kept.`
      );
    }
  }
  return current;
}

// ------------------------------------------------------------- paint styles

async function deserializeStylePaint(
  data: PaintData,
  context: string,
  resolver: VariableResolver,
  warn: (m: string) => void
): Promise<Paint | null> {
  if (data.type !== 'SOLID') {
    // Source inventory has no paint styles; anything non-solid is out of scope.
    warn(`${context}: unsupported paint type ${data.type}; dropped.`);
    return null;
  }
  let paint: SolidPaint = {
    type: 'SOLID',
    color: { r: data.color.r, g: data.color.g, b: data.color.b },
    ...(data.opacity !== undefined ? { opacity: data.opacity } : {}),
    ...(data.visible !== undefined ? { visible: data.visible } : {}),
    ...(data.blendMode !== undefined ? { blendMode: data.blendMode as BlendMode } : {})
  };
  if (data.bound) {
    for (const field of Object.keys(data.bound)) {
      const oldVarId = data.bound[field];
      if (field !== 'color') {
        warn(`${context}: paint field "${field}" is not variable-bindable; raw value kept.`);
        continue;
      }
      const variable = await resolver.resolve(oldVarId);
      if (!variable) {
        warn(
          `${context}: variable ${oldVarId} for paint color was not imported; raw value kept.`
        );
        continue;
      }
      try {
        paint = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
      } catch (e) {
        warn(
          `${context}: could not bind paint color to variable "${variable.name}": ${errorMessage(e)}; raw value kept.`
        );
      }
    }
  }
  return paint;
}

// -------------------------------------------------------------------- entry

export async function importStyles(
  styles: StylesData,
  varMap: Map<string, string>,
  warn: (m: string) => void
): Promise<Map<string, string>> {
  const styleMap = new Map<string, string>();
  const resolver = new VariableResolver(varMap);

  for (const data of styles.text) {
    await importTextStyle(data, resolver, styleMap, warn);
  }

  for (const data of styles.effect) {
    const context = `importStyles: effect style "${data.name}"`;
    try {
      const style = figma.createEffectStyle();
      style.name = data.name;
      style.description = data.description;
      const effects: Effect[] = [];
      for (const effectData of data.effects) {
        const effect = deserializeEffect(effectData, context, warn);
        if (!effect) {
          continue;
        }
        effects.push(
          effectData.bound
            ? await rebindEffect(effect, effectData.bound, context, resolver, warn)
            : effect
        );
      }
      style.effects = effects;
      styleMap.set(data.id, style.id);
    } catch (e) {
      warn(`${context} skipped: ${errorMessage(e)}`);
    }
  }

  for (const data of styles.paint) {
    const context = `importStyles: paint style "${data.name}"`;
    try {
      const style = figma.createPaintStyle();
      style.name = data.name;
      style.description = data.description;
      const paints: Paint[] = [];
      for (const paintData of data.paints) {
        const paint = await deserializeStylePaint(paintData, context, resolver, warn);
        if (paint) {
          paints.push(paint);
        }
      }
      style.paints = paints;
      styleMap.set(data.id, style.id);
    } catch (e) {
      warn(`${context} skipped: ${errorMessage(e)}`);
    }
  }

  for (const data of styles.grid) {
    const context = `importStyles: grid style "${data.name}"`;
    try {
      const style = figma.createGridStyle();
      style.name = data.name;
      style.description = data.description;
      // Grid styles are unused in the source file; layout grids were exported
      // as JSON-safe structural copies of plain LayoutGrid data.
      style.layoutGrids = data.layoutGrids as unknown as LayoutGrid[];
      styleMap.set(data.id, style.id);
    } catch (e) {
      warn(`${context} skipped: ${errorMessage(e)}`);
    }
  }

  return styleMap;
}
