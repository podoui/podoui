import { z } from "zod";

/**
 * podo-clone export document schema (Figma plugin export format).
 *
 * Mirror of `figma-plugin/src/schema.ts` — that file is the write-side
 * contract (plugin export/import), this file is the read-side contract the
 * CLI validates before converting a received document into Podo specs.
 * If the plugin schema changes, change this schema too.
 *
 * Deliberately loose where the plugin is loose: `props`, effect `value`,
 * `layoutGrids`, and `reactions` are opaque JSON bags applied through the
 * plugin's own property tables; the CLI never interprets them field-by-field.
 */

export const PODO_CLONE_FORMAT = "podo-clone";
export const PODO_CLONE_FORMAT_VERSION = 1;

const rgbaSchema = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
  a: z.number(),
});

/** field name -> source variable id */
const boundVarMapSchema = z.record(z.string(), z.string());

export const podoCloneVariableValueSchema = z.union([
  z.object({
    kind: z.literal("value"),
    value: z.union([z.boolean(), z.number(), z.string(), rgbaSchema]),
  }),
  z.object({ kind: z.literal("alias"), id: z.string() }),
]);

export const podoCloneVariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  resolvedType: z.enum(["BOOLEAN", "FLOAT", "STRING", "COLOR"]),
  scopes: z.array(z.string()),
  codeSyntax: z.record(z.string(), z.string()),
  hiddenFromPublishing: z.boolean(),
  valuesByMode: z.record(z.string(), podoCloneVariableValueSchema),
});

export const podoCloneCollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultModeId: z.string(),
  modes: z.array(z.object({ modeId: z.string(), name: z.string() })),
  hiddenFromPublishing: z.boolean(),
  variables: z.array(podoCloneVariableSchema),
});

const solidPaintSchema = z.object({
  type: z.literal("SOLID"),
  color: z.object({ r: z.number(), g: z.number(), b: z.number() }),
  opacity: z.number().optional(),
  visible: z.boolean().optional(),
  blendMode: z.string().optional(),
  bound: boundVarMapSchema.optional(),
});

const imagePaintSchema = z.object({
  type: z.literal("IMAGE"),
  scaleMode: z.string(),
  imageHash: z.string().nullable(),
  imageTransform: z.array(z.array(z.number())).optional(),
  scalingFactor: z.number().optional(),
  rotation: z.number().optional(),
  filters: z.record(z.string(), z.number()).optional(),
  opacity: z.number().optional(),
  visible: z.boolean().optional(),
  blendMode: z.string().optional(),
});

const gradientPaintSchema = z.object({
  type: z.enum(["GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"]),
  gradientTransform: z.array(z.array(z.number())),
  gradientStops: z.array(
    z.object({
      position: z.number(),
      color: rgbaSchema,
      bound: boundVarMapSchema.optional(),
    })
  ),
  opacity: z.number().optional(),
  visible: z.boolean().optional(),
  blendMode: z.string().optional(),
});

export const podoClonePaintSchema = z.union([
  solidPaintSchema,
  imagePaintSchema,
  gradientPaintSchema,
]);

export const podoCloneEffectSchema = z.object({
  type: z.enum(["DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"]),
  value: z.record(z.string(), z.unknown()),
  bound: boundVarMapSchema.optional(),
});

const fontSchema = z.object({ family: z.string(), style: z.string() });

const letterSpacingSchema = z.object({ unit: z.string(), value: z.number() });
const lineHeightSchema = z.object({ unit: z.string(), value: z.number().optional() });

const baseStyleFields = {
  id: z.string(),
  name: z.string(),
  description: z.string(),
};

export const podoCloneTextStyleSchema = z.object({
  ...baseStyleFields,
  fontName: fontSchema,
  fontSize: z.number(),
  letterSpacing: letterSpacingSchema,
  lineHeight: lineHeightSchema,
  paragraphIndent: z.number(),
  paragraphSpacing: z.number(),
  listSpacing: z.number().optional(),
  textCase: z.string(),
  textDecoration: z.string(),
  leadingTrim: z.string().optional(),
  bound: boundVarMapSchema.optional(),
});

export const podoCloneEffectStyleSchema = z.object({
  ...baseStyleFields,
  effects: z.array(podoCloneEffectSchema),
});

const paintStyleSchema = z.object({
  ...baseStyleFields,
  paints: z.array(podoClonePaintSchema),
});

const gridStyleSchema = z.object({
  ...baseStyleFields,
  layoutGrids: z.array(z.record(z.string(), z.unknown())),
});

export const podoCloneStylesSchema = z.object({
  text: z.array(podoCloneTextStyleSchema),
  effect: z.array(podoCloneEffectStyleSchema),
  paint: z.array(paintStyleSchema),
  grid: z.array(gridStyleSchema),
});

const slotSettingsSchema = z.object({
  stretchChildOnInsert: z.boolean().optional(),
  displayEmptyByDefault: z.boolean().optional(),
  minChildren: z.number().nullable().optional(),
  maxChildren: z.number().nullable().optional(),
  allowPreferredValuesOnly: z.boolean().optional(),
});

const componentPropertyTypeSchema = z.enum(["BOOLEAN", "TEXT", "INSTANCE_SWAP", "VARIANT", "SLOT"]);

export const podoClonePropertyDefSchema = z.object({
  name: z.string(),
  type: componentPropertyTypeSchema,
  defaultValue: z.union([z.boolean(), z.string()]).optional(),
  variantOptions: z.array(z.string()).optional(),
  preferredValues: z
    .array(z.object({ type: z.enum(["COMPONENT", "COMPONENT_SET"]), key: z.string() }))
    .optional(),
  description: z.string().optional(),
  slotSettings: slotSettingsSchema.optional(),
  boundDefaultValue: z.string().optional(),
  defaultValueKey: z.string().optional(),
  defaultValueRemote: z.boolean().optional(),
});

const componentMetaSchema = z.object({
  description: z.string(),
  documentationLinks: z.array(z.object({ uri: z.string() })),
  propertyDefs: z.array(podoClonePropertyDefSchema),
  key: z.string(),
});

const textSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  fontName: fontSchema,
  fontSize: z.number(),
  textCase: z.string(),
  textDecoration: z.string(),
  letterSpacing: letterSpacingSchema,
  lineHeight: lineHeightSchema,
  fills: z.array(podoClonePaintSchema),
  textStyleId: z.string(),
  fillStyleId: z.string(),
  listOptions: z.object({ type: z.string() }).optional(),
  indentation: z.number().optional(),
  hyperlink: z.object({ type: z.string(), value: z.string() }).nullable().optional(),
  bound: boundVarMapSchema.optional(),
  openTypeFeatures: z.record(z.string(), z.boolean()).optional(),
});

const textSchema = z.object({
  characters: z.string(),
  fontName: fontSchema.optional(),
  fontSize: z.number().optional(),
  segments: z.array(textSegmentSchema),
});

const vectorSchema = z.object({
  vectorPaths: z.array(z.object({ windingRule: z.string(), data: z.string() })).optional(),
  svg: z.string().optional(),
  handleMirroring: z.string().optional(),
});

const instancePropertySchema = z.object({
  type: componentPropertyTypeSchema,
  value: z.union([z.boolean(), z.string()]),
  bound: z.string().optional(),
  valueKey: z.string().optional(),
  valueRemote: z.boolean().optional(),
});

const instanceSchema = z.object({
  componentId: z.string(),
  componentKey: z.string(),
  remote: z.boolean(),
  componentProperties: z.record(z.string(), instancePropertySchema),
  get overrides() {
    return podoCloneNodeSchema.optional();
  },
});

export const podoCloneNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  props: z.record(z.string(), z.unknown()),
  width: z.number(),
  height: z.number(),
  relativeTransform: z.array(z.array(z.number())),
  fills: z.array(podoClonePaintSchema).nullable().optional(),
  strokes: z.array(podoClonePaintSchema).optional(),
  effects: z.array(podoCloneEffectSchema).optional(),
  bound: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional(),
  textStyleId: z.string().optional(),
  effectStyleId: z.string().optional(),
  fillStyleId: z.string().optional(),
  strokeStyleId: z.string().optional(),
  componentPropertyReferences: z.record(z.string(), z.string()).optional(),
  text: textSchema.optional(),
  vector: vectorSchema.optional(),
  get instance() {
    return instanceSchema.optional();
  },
  component: componentMetaSchema.optional(),
  componentSet: componentMetaSchema.optional(),
  reactions: z.array(z.unknown()).optional(),
  get children(): z.ZodOptional<z.ZodArray<typeof podoCloneNodeSchema>> {
    return z.array(podoCloneNodeSchema).optional();
  },
});

export const podoClonePageSchema = z.object({
  pageId: z.string(),
  pageName: z.string(),
  items: z.array(z.object({ x: z.number(), y: z.number(), node: podoCloneNodeSchema })),
});

export const podoCloneDocumentSchema = z.object({
  format: z.literal(PODO_CLONE_FORMAT),
  version: z.literal(PODO_CLONE_FORMAT_VERSION),
  source: z.object({ fileName: z.string(), exportedAt: z.string() }),
  fonts: z.array(fontSchema),
  variables: z.array(podoCloneCollectionSchema),
  styles: podoCloneStylesSchema,
  pages: z.array(podoClonePageSchema),
  images: z.record(z.string(), z.string()),
  warnings: z.array(z.string()),
});

export type PodoCloneVariableValue = z.infer<typeof podoCloneVariableValueSchema>;
export type PodoCloneVariable = z.infer<typeof podoCloneVariableSchema>;
export type PodoCloneCollection = z.infer<typeof podoCloneCollectionSchema>;
export type PodoClonePaint = z.infer<typeof podoClonePaintSchema>;
export type PodoCloneEffect = z.infer<typeof podoCloneEffectSchema>;
export type PodoCloneTextStyle = z.infer<typeof podoCloneTextStyleSchema>;
export type PodoCloneEffectStyle = z.infer<typeof podoCloneEffectStyleSchema>;
export type PodoCloneStyles = z.infer<typeof podoCloneStylesSchema>;
export type PodoClonePropertyDef = z.infer<typeof podoClonePropertyDefSchema>;
export type PodoCloneNode = z.infer<typeof podoCloneNodeSchema>;
export type PodoClonePage = z.infer<typeof podoClonePageSchema>;
export type PodoCloneDocument = z.infer<typeof podoCloneDocumentSchema>;

export function parsePodoCloneDocument(input: unknown): PodoCloneDocument {
  return podoCloneDocumentSchema.parse(input);
}
