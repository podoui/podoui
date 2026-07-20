/**
 * podo-clone export document schema.
 *
 * This is the CONTRACT between export (runs in the source PODO file) and
 * import (runs in the empty target file). Every field written by
 * src/export/* must be consumed (or deliberately ignored with a comment)
 * by src/import/*. If you change this file, change both sides.
 *
 * All values must be JSON-safe (structuredClone of plugin objects is NOT
 * JSON-safe when it contains symbols like figma.mixed — serialize explicitly).
 *
 * A third consumer exists: `packages/spec/src/podo-clone.ts` is the Zod
 * mirror the CLI uses to validate received exports. Keep it in sync too.
 */

export const FORMAT = 'podo-clone' as const;
export const FORMAT_VERSION = 1;

export interface PodoExport {
  format: typeof FORMAT;
  version: typeof FORMAT_VERSION;
  source: { fileName: string; exportedAt: string };
  /** Unique fonts used anywhere in exported text — import preloads these. */
  fonts: FontData[];
  variables: CollectionData[];
  styles: StylesData;
  /** Top-level components / component sets grouped by their source page. */
  pages: PageComponentsData[];
  /** image hash -> base64 bytes (source file uses exactly 1 image today). */
  images: Record<string, string>;
  /** Export-side warnings, echoed in the import report. */
  warnings: string[];
}

export interface FontData {
  family: string;
  style: string;
}

// ---------------------------------------------------------------- variables

export interface CollectionData {
  /** Source collection id (used only for remapping). */
  id: string;
  name: string;
  defaultModeId: string;
  modes: { modeId: string; name: string }[];
  hiddenFromPublishing: boolean;
  variables: VariableData[];
}

export interface VariableData {
  /** Source variable id — every alias / binding in this document refers to it. */
  id: string;
  name: string;
  description: string;
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR';
  /** VariableScope[] — pass through verbatim. */
  scopes: string[];
  codeSyntax: Partial<Record<'WEB' | 'ANDROID' | 'iOS', string>>;
  hiddenFromPublishing: boolean;
  /** source modeId -> value */
  valuesByMode: Record<string, VariableValueData>;
}

export type VariableValueData =
  | { kind: 'value'; value: boolean | number | string | RGBAData }
  | { kind: 'alias'; id: string };

export interface RGBAData {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ------------------------------------------------------------------- paints

/** field name -> source variable id (e.g. paint color binding). */
export type BoundVarMap = Record<string, string>;

export interface SolidPaintData {
  type: 'SOLID';
  color: { r: number; g: number; b: number };
  opacity?: number;
  visible?: boolean;
  blendMode?: string;
  /** paint.boundVariables — today only { color: <varId> }. */
  bound?: BoundVarMap;
}

export interface ImagePaintData {
  type: 'IMAGE';
  scaleMode: string;
  /** key into PodoExport.images */
  imageHash: string | null;
  imageTransform?: number[][];
  scalingFactor?: number;
  rotation?: number;
  filters?: Record<string, number>;
  opacity?: number;
  visible?: boolean;
  blendMode?: string;
}

/** Gradients are unused in the source file today but kept for completeness. */
export interface GradientPaintData {
  type:
    | 'GRADIENT_LINEAR'
    | 'GRADIENT_RADIAL'
    | 'GRADIENT_ANGULAR'
    | 'GRADIENT_DIAMOND';
  gradientTransform: number[][];
  gradientStops: { position: number; color: RGBAData; bound?: BoundVarMap }[];
  opacity?: number;
  visible?: boolean;
  blendMode?: string;
}

export type PaintData = SolidPaintData | ImagePaintData | GradientPaintData;

export interface EffectData {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  /** JSON-safe copy of the plugin Effect object minus boundVariables. */
  value: Record<string, unknown>;
  /** effect.boundVariables (field -> source variable id). */
  bound?: BoundVarMap;
}

// ------------------------------------------------------------------- styles

export interface StylesData {
  text: TextStyleData[];
  effect: EffectStyleData[];
  /** Unused today (0 local paint/grid styles) but exported for completeness. */
  paint: PaintStyleData[];
  grid: GridStyleData[];
}

export interface BaseStyleData {
  /** Source style id — node styleId references remap through this. */
  id: string;
  name: string;
  description: string;
}

export interface TextStyleData extends BaseStyleData {
  fontName: FontData;
  fontSize: number;
  letterSpacing: { unit: string; value: number };
  lineHeight: { unit: string; value?: number };
  paragraphIndent: number;
  paragraphSpacing: number;
  listSpacing?: number;
  textCase: string;
  textDecoration: string;
  leadingTrim?: string;
  /** style.boundVariables (fontFamily / fontSize / ... -> source var id). */
  bound?: BoundVarMap;
}

export interface EffectStyleData extends BaseStyleData {
  effects: EffectData[];
}

export interface PaintStyleData extends BaseStyleData {
  paints: PaintData[];
}

export interface GridStyleData extends BaseStyleData {
  layoutGrids: Record<string, unknown>[];
}

// -------------------------------------------------------------------- nodes

/**
 * One serialized scene node.
 *
 * `props` is a bag of JSON-safe plugin-API property values applied on import
 * through the shared ordered table in src/nodes-props.ts (layout-affecting
 * properties have strict ordering constraints — see SPEC.md). Paints, effects
 * and other fields that need remapping do NOT go into `props`; they use the
 * dedicated typed fields below.
 */
export interface NodeData {
  /** Source node id (debugging + instance override addressing). */
  id: string;
  type: string;
  name: string;

  props: Record<string, unknown>;

  /** Geometry: width/height from node.width/height. */
  width: number;
  height: number;
  /** Position/rotation within parent. */
  relativeTransform: number[][];

  fills?: PaintData[] | null; // null == figma.mixed (TEXT with mixed fills)
  strokes?: PaintData[];
  effects?: EffectData[];

  /** Node-level boundVariables (field -> source var id or array of ids). */
  bound?: Record<string, string | string[]>;

  /** Source style ids; remapped through the style id map on import. */
  textStyleId?: string;
  effectStyleId?: string;
  fillStyleId?: string;
  strokeStyleId?: string;

  componentPropertyReferences?: Record<string, string>;

  text?: TextData;
  vector?: VectorData;
  instance?: InstanceData;
  component?: ComponentMetaData;
  componentSet?: ComponentSetMetaData;

  /** Prototype reactions (JSON-safe Reaction[]) — best effort. */
  reactions?: unknown[];

  children?: NodeData[];
}

export interface TextData {
  characters: string;
  /**
   * Node-level font/size (only when not figma.mixed). Empty text nodes yield
   * ZERO segments, so without these the import would fall back to
   * Inter Regular 12 — import prefers them whenever segments are empty.
   */
  fontName?: FontData;
  fontSize?: number;
  /**
   * getStyledTextSegments result — one entry per styled run, covering:
   * fontName, fontSize, fontWeight?, textCase, textDecoration, letterSpacing,
   * lineHeight, fills, textStyleId, fillStyleId, listOptions, indentation,
   * hyperlink, openTypeFeatures, boundVariables.
   */
  segments: TextSegmentData[];
}

export interface TextSegmentData {
  start: number;
  end: number;
  fontName: FontData;
  fontSize: number;
  textCase: string;
  textDecoration: string;
  letterSpacing: { unit: string; value: number };
  lineHeight: { unit: string; value?: number };
  fills: PaintData[];
  textStyleId: string;
  fillStyleId: string;
  listOptions?: { type: string };
  indentation?: number;
  hyperlink?: { type: string; value: string } | null;
  /** segment boundVariables (fills handled inside PaintData.bound). */
  bound?: BoundVarMap;
  /**
   * OpenType features that read back `true` on this segment. EXPORT-ONLY:
   * node.openTypeFeatures has no setter in the plugin API, so import records
   * a warning instead of re-applying these.
   */
  openTypeFeatures?: Record<string, boolean>;
}

export interface VectorData {
  /** Primary path: settable vectorPaths. */
  vectorPaths?: { windingRule: string; data: string }[];
  /**
   * Fallback when vectorPaths cannot represent the node (complex vector
   * network with per-region fills): SVG string of the exported node, replayed
   * with figma.createNodeFromSvg on import.
   */
  svg?: string;
  handleMirroring?: string;
}

export interface InstanceData {
  /** Source main-component node id (local components remap through idMap). */
  componentId: string;
  /** Publish key — used with importComponentByKeyAsync for remote components. */
  componentKey: string;
  remote: boolean;
  /** instance.componentProperties: full prop name -> value. */
  componentProperties: Record<
    string,
    {
      type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT' | 'SLOT';
      /** SLOT properties can have no value at runtime (observed in real files). */
      value?: boolean | string;
      /** Source variable id bound to this property value (boundVariables.value). */
      bound?: string;
      /**
       * INSTANCE_SWAP only: publish key of the component the value (a source
       * component node id) points at, resolved at export time so import can
       * fall back to importComponentByKeyAsync when the id is not local.
       */
      valueKey?: string;
      /** INSTANCE_SWAP only: whether the referenced component is remote. */
      valueRemote?: boolean;
    }
  >;
  /**
   * Serialized subtree of this instance AS IT APPEARS in the source
   * (with overrides applied). Import walks this against the fresh instance
   * to re-apply overrides (fills, characters, visibility, ...).
   */
  overrides?: NodeData;
}

/** Mirror of the plugin-API SlotSettings object (all fields optional). */
export interface SlotSettingsData {
  stretchChildOnInsert?: boolean;
  displayEmptyByDefault?: boolean;
  minChildren?: number | null;
  maxChildren?: number | null;
  allowPreferredValuesOnly?: boolean;
}

export interface ComponentPropertyDefData {
  /** Full property name including the '#id' suffix for non-variant props. */
  name: string;
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT' | 'SLOT';
  /**
   * Absent for SLOT definitions: the plugin API can neither read a meaningful
   * SLOT default nor write one (editComponentProperty rejects defaultValue
   * for SLOT). Always present for BOOLEAN / TEXT / INSTANCE_SWAP / VARIANT.
   */
  defaultValue?: boolean | string;
  variantOptions?: string[];
  /** INSTANCE_SWAP / SLOT preferred values: component keys. */
  preferredValues?: { type: 'COMPONENT' | 'COMPONENT_SET'; key: string }[];
  /** SLOT only (editComponentProperty restriction). */
  description?: string;
  /** SLOT only: slot child limits / insert behavior. */
  slotSettings?: SlotSettingsData;
  /** Source variable id bound to the definition defaultValue, if any. */
  boundDefaultValue?: string;
  /**
   * INSTANCE_SWAP only: publish key of the component referenced by
   * defaultValue (a source node id), so import can remap via the component
   * id map or fall back to importComponentByKeyAsync.
   */
  defaultValueKey?: string;
  /** INSTANCE_SWAP only: whether the defaultValue component is remote. */
  defaultValueRemote?: boolean;
}

export interface ComponentMetaData {
  description: string;
  documentationLinks: { uri: string }[];
  /** Only for standalone components (variant members inherit from the set). */
  propertyDefs: ComponentPropertyDefData[];
  /** Publish key of the source component (for cross-reference/debugging). */
  key: string;
}

export interface ComponentSetMetaData {
  description: string;
  documentationLinks: { uri: string }[];
  propertyDefs: ComponentPropertyDefData[];
  key: string;
}

// ---------------------------------------------------------------- placement

export interface PageComponentsData {
  pageId: string;
  pageName: string;
  /** Top-level COMPONENT / COMPONENT_SET nodes with absolute page coords. */
  items: { x: number; y: number; node: NodeData }[];
}

// ------------------------------------------------------------- UI protocol

export type UiToMain =
  | { type: 'export' }
  | { type: 'import'; payload: string }
  | { type: 'cancel' };

export type MainToUi =
  | { type: 'progress'; phase: string; done: number; total: number }
  | { type: 'export-done'; payload: string; fileName: string }
  | { type: 'import-done'; report: ImportReport }
  | { type: 'error'; message: string };

export interface ImportReport {
  variableCollections: number;
  variables: number;
  styles: number;
  componentSets: number;
  components: number;
  warnings: string[];
}
