# API-NOTES — ground truth from `node_modules/@figma/plugin-typings/plugin-api.d.ts`

All line numbers (`L…`) refer to that exact file (12 394 lines). Quotes are verbatim.
"DP" = constraint that applies when manifest has `"documentAccess": "dynamic-page"`.

## ⚠ Spec corrections

1. **`slotContentId` does not exist in the plugin API.** `componentPropertyReferences` is typed
   `{ [nodeProperty in 'visible' | 'characters' | 'mainComponent']?: string } | null` (L6282–6286).
   `slotContentId` (SPEC inventory + schema) is REST-only vocabulary. The setter doc hints slots are
   wired by *applying a slot property to a frame* ("When setting, may throw the following errors:
   cannotApplySlotPropertyToNonFrameNode, cannotApplySlotPropertyToFrameWithGrid, or
   cannotApplySlotPropertyToFrame", L6280) but **no typed key exists for it** — slot recreation must go
   through `ComponentNode.createSlot()` (L10748–10751), not `componentPropertyReferences`.
2. **`instance.setProperties()` cannot set SLOT properties.** "Does not support `'SLOT'` properties and
   will throw `cannotSetSlotProperty`" (L10804). Import must filter SLOT entries out of
   `InstanceData.componentProperties` before calling `setProperties`; slot content overrides can only be
   reproduced by editing the instance's slot children (the overrides walk).
3. **SLOT `defaultValue` cannot round-trip.** `editComponentProperty`: "`defaultValue` is supported for
   `'BOOLEAN'`, `'TEXT'`, and `'INSTANCE_SWAP'` properties, but not for `'VARIANT'` or `'SLOT'`" (L9431).
   `addComponentProperty` still *requires* a `defaultValue` positional arg (L9419–9424) — what to pass for
   SLOT is undocumented; verify at runtime (and whether `createSlot()` itself creates the SLOT property —
   the d.ts never states the linkage, only that "slots are defined by a component property reference that
   only makes sense inside their parent component", L10856–10857).
4. **`createVariableAlias` takes a `Variable` object, not an id** — `createVariableAlias(variable: Variable): VariableAlias`
   (L2171). SPEC's remap table (`createVariableAlias(varMap[id])`) must store `Variable` objects in the map,
   or use `createVariableAliasByIdAsync(variableId: string)` (L2178).
5. **`addMode` can throw on pricing tier**: "If limited the current pricing tier, this method will throw an
   error with the message `in addMode: Limited to N modes only`" (L11563–11565). Multi-mode source
   collections can fail in a free-plan target file → needs the warning path (SPEC doesn't mention).
6. **`defaultModeId` is `readonly`** (L11537–11538). Import cannot set it; map source `defaultModeId` →
   fresh collection's `modes[0].modeId` (a new collection has exactly one mode; canonical pattern
   `collection.modes[0].modeId` in the docs, L11346–11348) and `renameMode` it.
7. **`rectangleCornerRadii` bound-variable key (REST) doesn't exist.** Plugin-side keys are
   `topLeftRadius`/`topRightRadius`/`bottomLeftRadius`/`bottomRightRadius`; "a `cornerRadius` binding sets
   all four corners and appears in `boundVariables` as `topLeftRadius`/…" (L6290–6292). Import must bind the
   4 individual fields; export will read them individually.
8. **Node-level text bound variables read back as arrays.** `boundVariables` maps
   `VariableBindableTextField` (incl. `fontFamily`, `fontSize`) to `VariableAlias[]` and `textRangeFills`
   to `VariableAlias[]` (L6295–6308). A whole-node `setBoundVariable('fontFamily', v)` cannot reproduce
   per-range bindings — use `setRangeBoundVariable` per segment (L9653–9658).
9. **`layoutWrap` may only be set when `layoutMode === "HORIZONTAL"`**: "Setting it on layers without this
   property will throw an Error" (L7463). (SPEC's ordering rule 4 must set layoutMode first — consistent —
   but also never set WRAP on VERTICAL frames.)
10. **`figma.getImageByHash` returns `Image | null`** (L1705) — SPEC's `figma.getImageByHash(hash).getBytesAsync()`
    needs a null guard.
11. **Variant-from-child-name derivation is not documented in the d.ts.** `combineAsVariants` docs never
    mention `Prop=Value` name parsing (L1755–1780); only editor behavior guarantees it. Shell pass must set
    variant child names *before* combining and verify `componentPropertyDefinitions` afterwards.
12. **Export must keep `figma.skipInvisibleInstanceChildren = false`** (default `false` in Figma, `true` in
    Dev Mode, L84): when `true`, invisible instance children *and their descendants* become inaccessible
    (`children`/`findAll` exclude them; property access throws, L93–104) — that would break serializing
    `visible:false` overrides.

## 1. Variables

- API surface `interface VariablesAPI` L2071–2222, reached via `figma.variables` (L442).
- `createVariableCollection(name: string): VariableCollection` (L2151).
- `createVariable(name: string, collection: VariableCollection, resolvedType: VariableResolvedDataType): Variable`
  (L2142–2146). **Collection param is the object** — the `(name, collectionId: string, …)` overload
  (L2130–2134) is "@deprecated … will throw an exception if the plugin manifest contains
  `"documentAccess": "dynamic-page"`" (L2124).
- `VariableResolvedDataType = 'BOOLEAN' | 'COLOR' | 'FLOAT' | 'STRING'` (L11258);
  `VariableValue = boolean | string | number | RGB | RGBA | VariableAlias` (L11263);
  `VariableAlias { type: 'VARIABLE_ALIAS'; id: string }` (L11259–11262).
- `Variable.setValueForMode(modeId: string, newValue: VariableValue): void` (L11439);
  `readonly valuesByMode: { [modeId: string]: VariableValue }` (does **not** resolve aliases, L11441–11445).
- `createVariableAlias(variable: Variable): VariableAlias` (L2171);
  `createVariableAliasByIdAsync(variableId: string): Promise<VariableAlias>` (L2178). Aliases may cross
  collections (worked example L11392–11407).
- `setVariableCodeSyntax(platform: CodeSyntaxPlatform, value: string): void` (L11489);
  `CodeSyntaxPlatform = 'WEB' | 'ANDROID' | 'iOS'` (L11290); `codeSyntax` readonly map (L11457–11459).
- `scopes: Array<VariableScope>` writable (L11455); `VariableScope` union of 22 values
  `'ALL_SCOPES' | 'TEXT_CONTENT' | 'CORNER_RADIUS' | 'WIDTH_HEIGHT' | 'GAP' | 'ALL_FILLS' | 'FRAME_FILL' |
  'SHAPE_FILL' | 'TEXT_FILL' | 'STROKE_COLOR' | 'STROKE_FLOAT' | 'EFFECT_FLOAT' | 'EFFECT_COLOR' |
  'OPACITY' | 'FONT_FAMILY' | 'FONT_STYLE' | 'FONT_WEIGHT' | 'FONT_SIZE' | 'LINE_HEIGHT' |
  'LETTER_SPACING' | 'PARAGRAPH_SPACING' | 'PARAGRAPH_INDENT'` (L11264–11286). Scopes only affect picker UI,
  not bindability (L11453).
- `Variable.hiddenFromPublishing: boolean` writable, "Can only true if … local" ; both variable and
  collection flags are independent (L11300–11308). `VariableCollection.hiddenFromPublishing: boolean` (L11515).
- `Variable.name`, `description` writable (L11296–11299); `id`, `key`, `resolvedType`, `remote`,
  `variableCollectionId` readonly (L11295–11322).
- `VariableCollection` (L11505–11573): `readonly modes: Array<{ modeId: string; name: string }>` (L11525–11528);
  `readonly defaultModeId: string` (L11538); `addMode(name: string): string` returns the new modeId (L11570);
  `renameMode(modeId, newName): void` (L11572); `removeMode(modeId): void` (L11559); `remove()` (L11557).
- Fresh collection: created with exactly one mode; docs always take `collection.modes[0].modeId` as mode 1
  and `addMode('Mode 2')` for the rest (L11346–11348).
- `getLocalVariableCollectionsAsync(): Promise<VariableCollection[]>` (L2114);
  `getVariableByIdAsync(id: string): Promise<Variable | null>` (L2077);
  `getLocalVariablesAsync(type?): Promise<Variable[]>` (L2103). All non-async variants are deprecated and
  throw under DP (L2081, 2107, 2118).
- `importVariableByKeyAsync(key): Promise<Variable>` (L2221) — published variables only.

## 2. Variable binding

- `VariableBindableNodeField` (L6554–6581): `'height' | 'width' | 'characters' | 'itemSpacing' |
  'paddingLeft' | 'paddingRight' | 'paddingTop' | 'paddingBottom' | 'visible' | 'cornerRadius' |
  'topLeftRadius' | 'topRightRadius' | 'bottomLeftRadius' | 'bottomRightRadius' | 'minWidth' | 'maxWidth' |
  'minHeight' | 'maxHeight' | 'counterAxisSpacing' | 'strokeWeight' | 'strokeTopWeight' |
  'strokeRightWeight' | 'strokeBottomWeight' | 'strokeLeftWeight' | 'opacity' | 'gridRowGap' | 'gridColumnGap'`.
- `VariableBindableTextField = 'fontFamily' | 'fontSize' | 'fontStyle' | 'fontWeight' | 'letterSpacing' |
  'lineHeight' | 'paragraphSpacing' | 'paragraphIndent'` (L6582–6590).
- `node.setBoundVariable(field: VariableBindableNodeField | VariableBindableTextField, variable: Variable | null): void`
  (L6326–6329). The `(field, variableId: string | null)` overload is deprecated and **throws under DP**
  (L6312–6317). `null` unbinds (L6321).
- `node.boundVariables` (readonly, L6295–6308): node fields → single `VariableAlias`; text fields →
  `VariableAlias[]`; plus `fills?: VariableAlias[]`, `strokes?: VariableAlias[]`, `effects?: VariableAlias[]`,
  `layoutGrids?: VariableAlias[]`, `componentProperties?: { [propertyName]: VariableAlias }`,
  `textRangeFills?: VariableAlias[]`. The `fills`/`strokes` arrays are the **read-side reflection of
  per-paint color bindings**; there is no node-level setter for them (not in `VariableBindableNodeField`) —
  rebind by rewriting each paint via `setBoundVariableForPaint` and reassigning the array.
- `figma.variables.setBoundVariableForPaint(paint: SolidPaint, field: VariableBindablePaintField, variable: Variable | null): SolidPaint`
  — "returns a copy of the paint which is now bound" (L2180–2190); `VariableBindablePaintField = 'color'` (L6591).
- `figma.variables.setBoundVariableForEffect(effect: Effect, field: VariableBindableEffectField, variable: Variable | null): Effect`
  (present; L2191–2202); `VariableBindableEffectField = 'color' | 'radius' | 'spread' | 'offsetX' | 'offsetY'` (L6594).
- `TextNode.setRangeBoundVariable(start, end, field: VariableBindableTextField, variable: Variable | null): void`
  — "Requires any new fonts to be loaded" (L9650–9658); getter `getRangeBoundVariable(start, end, field):
  VariableAlias | null | figma.mixed` (L9645–9649). Fields = the 8 text fields above (so yes: `fontFamily`
  and `fontSize` are both range-bindable).
- `TextStyle.setBoundVariable(field: VariableBindableTextField, variable: Variable | null): void` (L12189)
  and `TextStyle.boundVariables?: { [field in VariableBindableTextField]?: VariableAlias }` (L12178–12180).
  Passing a variable ID string "is not supported" (L12187).
- Paint/effect **style** boundVariables are readonly arrays keyed `'paints'` / `'effects'`
  (L12118–12120, L12203–12205) — populate by assigning rebound `Paint[]`/`Effect[]` to `.paints`/`.effects`.
- Component-property binding: `VariableBindableComponentPropertyField = 'value'`,
  `…DefinitionField = 'defaultValue'` (L6598–6599); `setProperties` accepts `VariableAlias` values
  (L10806) — pair with `figma.variables.createVariableAlias` (doc L2165–2170).

## 3. Styles

- `figma.createTextStyle(): TextStyle` (L1465), `createEffectStyle(): EffectStyle` (L1471),
  `createPaintStyle(): PaintStyle` (L1459), `createGridStyle(): GridStyle` (L1477) — all "only available in
  Figma Design" (L1455 etc.). New text style defaults: "Inter Regular, font size 12" (L1463).
- `TextStyle` fields (L12122–12190): `fontSize: number`, `textDecoration: TextDecoration`,
  `fontName: FontName`, `letterSpacing: LetterSpacing`, `lineHeight: LineHeight`,
  `leadingTrim: LeadingTrim`, `paragraphIndent`, `paragraphSpacing`, `listSpacing: number`,
  `hangingPunctuation: boolean`, `hangingList: boolean`, `textCase: TextCase`. **`leadingTrim` and
  `listSpacing` exist on TextStyle** (L12150, L12162). `LeadingTrim = 'CAP_HEIGHT' | 'NONE'` (L5164).
- **No font-loading requirement is documented on TextStyle setters** in the d.ts. The load requirement is
  documented on the *node-side* mirror props ("Setting this property to a different value requires the new
  font to be loaded", `fontName` L9464). Assume runtime requires `loadFontAsync(style.fontName)` before
  setting `fontName` (and dependent props) on a TextStyle; the typings neither confirm nor deny.
- `BaseStyleMixin`: `readonly id`, `name` writable, `description`/`descriptionMarkdown` writable via
  `PublishableMixin` (L8916, 8925), `documentationLinks: ReadonlyArray<DocumentationLink>` (L8942),
  `readonly key` (L8948), `remove()` (L12104). `getStyleConsumersAsync()` (L12090; sync `consumers` throws
  under DP, L12094).
- `EffectStyle.effects: ReadonlyArray<Effect>` — "List of {@link Effect} to replace the `effects` property
  with" (L12197–12199). Bound-variable workflow: build each effect object, run
  `setBoundVariableForEffect(effect, field, variable)` to get a bound copy (L2191–2202), then
  `style.effects = [boundCopies]`. Effect `boundVariables` fields on the objects themselves are readonly
  (DropShadow L4156–4158, InnerShadow L4195–4197, Blur `{ radius }` only, L4218–4220).
- Node style-id linkage: `fillStyleId`/`strokeStyleId`/`effectStyleId`/`textStyleId`/`gridStyleId` are all
  **read-only under DP** — use `setFillStyleIdAsync` (L8371–8381), `setStrokeStyleIdAsync` (L8283–8289),
  `setEffectStyleIdAsync` (L7238–7244), `setTextStyleIdAsync` (L10595–10601), `setGridStyleIdAsync`
  (L9002–9008).

## 4. Components

- `figma.createComponent(): ComponentNode` — "new node has width and height both at 100, and is parented
  under `figma.currentPage`" (L1090–1102). `createComponentFromNode(node): ComponentNode` (L1120).
- `figma.combineAsVariants(nodes: ReadonlyArray<ComponentNode>, parent: BaseNode & ChildrenMixin, index?: number): ComponentSetNode`
  (L1776–1780). "This list must be non-empty, and must consist of only component nodes" (L1760). "Why is
  there no `figma.createComponentSet()`? … empty component sets are not supported in Figma" (L1772).
  "Since combining as variants involves moving nodes to a different parent, this operation is subject to
  many reparenting restrictions" (L1774). Variant property definitions from `Prop=Value` child names:
  **not documented in typings** (see spec correction 11); observable afterwards via
  `componentPropertyDefinitions` / deprecated `variantGroupProperties` (L10722–10726).
- `ComponentSetNode.defaultVariant: ComponentNode` readonly — "the top-left-most variant, spatially"
  (L10715–10718).
- `addComponentProperty(propertyName: string, type: ComponentPropertyType, defaultValue: string | boolean | VariableAlias, options?: ComponentPropertyOptions): string`
  — "returns the property name with its unique identifier suffixed"; supports
  `'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT' | 'SLOT'` (L9416–9424). **The returned suffixed name is
  the remap key** (example: `addComponentProperty("ButtonIcon", "INSTANCE_SWAP", "2:22")` →
  `"ButtonIcon#4:3"`, L9324–9325).
- `ComponentPropertyOptions = { preferredValues?: InstanceSwapPreferredValue[]; description?: string; slotSettings?: SlotSettings }`
  (L10685–10689). `editComponentProperty(propertyName, { name?, defaultValue?, preferredValues?, description?, slotSettings? }): string`
  (L9436–9445) with restrictions (L9428–9434): name = all types; defaultValue = BOOLEAN/TEXT/INSTANCE_SWAP
  only; **preferredValues = INSTANCE_SWAP and SLOT only; description = SLOT only; slotSettings = SLOT only**.
  `deleteComponentProperty` supports BOOLEAN/TEXT/INSTANCE_SWAP/SLOT (L9447–9449).
- `componentPropertyDefinitions: ComponentPropertyDefinitions` readonly (L9415); shape
  `{ [propertyName]: { type; defaultValue: string | boolean; preferredValues?; variantOptions?; description?; slotSettings?; readonly boundVariables?: { defaultValue?: VariableAlias } } }`
  (L10693–10705). `ComponentPropertiesMixin` sits on **both** `ComponentSetNode` (L10706) and
  `ComponentNode` (L10731–10735); standalone components "will never have `'VARIANT'` properties"
  (L9335–9337). Non-variant prop names carry a `'#'` unique-id suffix; "The entire property name should be
  used for all Component property-related API methods" (L9262).
- `componentPropertyReferences` **is settable** (mutable property):
  `{ [nodeProperty in 'visible' | 'characters' | 'mainComponent']?: string } | null` (L6282–6286); values are
  the full suffixed property names; only valid on component/instance sublayers (L6278). Setter errors quoted
  in spec correction 1 (L6280). No `slotContentId` key exists.
- `instance.setProperties(properties: { [propertyName: string]: string | boolean | VariableAlias }): void`
  (L10806) — quote: "`propertyName` … should be suffixed with `'#'` and a unique ID for `'TEXT'`,
  `'BOOLEAN'`, and `'INSTANCE_SWAP'` properties. **Does not support `'SLOT'` properties and will throw
  `cannotSetSlotProperty`.** In the case of name collision, this function prioritizes updating the
  `'VARIANT'` type properties. Existing properties that are non-specified in the function will maintain
  their current value." (L10804).
- `InstanceNode.componentProperties: ComponentProperties` readonly (L10810); value shape
  `{ [propertyName]: { type: ComponentPropertyType; value: string | boolean; preferredValues?; readonly boundVariables?: { value?: VariableAlias } } }`
  (L10766–10775).
- `figma.importComponentByKeyAsync(key: string): Promise<ComponentNode>` — "Promise is rejected if there is
  no published component with that key or if the request fails" (L1586–1588);
  `importComponentSetByKeyAsync` (L1592); `importStyleByKeyAsync(key): Promise<BaseStyle>` (L1596).
- `readonly exposedInstances: InstanceNode[]` (L10824–10827); `isExposedInstance: boolean` — "only
  writeable on primary `InstanceNode`s contained within a `ComponentNode` or `ComponentSetNode`" (L10828–10831).
- `InstanceNode.mainComponent` is **write-only under DP**; read via `getMainComponentAsync()` (L10786–10794).
  `swapComponent(componentNode)` preserves overrides; assigning `mainComponent` clears them (L10796–10802).
- `ComponentNode.createInstance(): InstanceNode` — parented under `figma.currentPage` by default (L10744–10747).
  `instances` getter throws under DP → `getInstancesAsync()` (L10755–10761).

## 5. SLOT

- `type ComponentPropertyType = 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT' | 'SLOT'` (L10667).
- `SlotSettings = { stretchChildOnInsert?: boolean; displayEmptyByDefault?: boolean; minChildren?: number | null; maxChildren?: number | null; allowPreferredValuesOnly?: boolean }`
  (L10675–10681).
- `ComponentNode.createSlot(): SlotNode` — "Creates a new slot node within this component" (L10748–10751).
  Only on ComponentNode; no `figma.createSlot`, nothing on ComponentSetNode/InstanceNode.
- `interface SlotNode extends DefaultFrameMixin` (L10849–10873): `readonly type: 'SLOT'` (L10853);
  frame-like (children via ChildrenMixin, auto-layout via AutoLayoutMixin, fills/strokes etc.).
  - `clone(): FrameNode` — "The clone is returned as a plain `FrameNode` rather than a `SlotNode`, because
    slots are defined by a component property reference that only makes sense inside their parent
    component" (L10855–10859).
  - `resetSlot(): void` — "Resets a given slot node to the original component slot content" (L10860–10863)
    → this is how a slot behaves *inside an instance* (content is overridable per-instance, resettable).
  - `readonly limitViolations: Array<'BELOW_MIN' | 'ABOVE_MAX' | 'HAS_NON_PREFERRED'>` — limits come from the
    SLOT property's `SlotSettings`; "Returns an empty array when within limits… `BELOW_MIN` and `ABOVE_MAX`
    are mutually exclusive" (L10865–10872). Limits are advisory (violations reported, not prevented).
- `'SLOT'` is part of the `SceneNode` union (L12052), so slots appear as regular children when walking
  component and instance subtrees.
- Slot frames reject grid layout: "`GRID` is not supported for Slot frames, and setting `GRID` will throw a
  cannotApplyGridToSlot error" (L7294).
- SLOT `ComponentPropertyDefinition` restrictions: `defaultValue` not editable, `description` +
  `slotSettings` + `preferredValues` allowed (L9428–9434); definition object may carry `slotSettings`
  (L10700). Default-value semantics for SLOT are otherwise undocumented (spec correction 3).

## 6. Text

- `getStyledTextSegments<Fields…>(fields, start?, end?)` (L9809–9820): documented full field list (L9662–9687):
  `fontSize, fontName, fontWeight, fontStyle, textDecoration, textDecorationStyle, textDecorationOffset,
  textDecorationThickness, textDecorationColor, textDecorationSkipInk, textCase, lineHeight, letterSpacing,
  fills, textStyleId, fillStyleId, listOptions, listSpacing, indentation, paragraphIndent,
  paragraphSpacing, hyperlink, boundVariables, textStyleOverrides, openTypeFeatures`. Result rows always
  include `characters`, `start`, `end` (interface `StyledTextSegment` L5208–5325; segment
  `boundVariables?: { [field in VariableBindableTextField]?: VariableAlias }` L5318–5320; segment
  `openTypeFeatures: { readonly [feature in OpenTypeFeature]: boolean }` L5312–5314). Emoji =
  surrogate pairs; ranges may split code points (L9753–9805).
- `setRangeTextStyleIdAsync(start, end, styleId): Promise<void>` — "Requires the font to be loaded"
  (L9619–9621). `setRangeTextStyleId` is deprecated: "will throw an exception if the plugin manifest
  contains `"documentAccess": "dynamic-page"`" (L9623–9627). Same async/sync pair for fill style:
  `setRangeFillStyleIdAsync` (L9635) vs deprecated `setRangeFillStyleId` (L9641).
- `figma.loadFontAsync(fontName: FontName): Promise<void>` (L1649); result cached, safe to repeat (L1645–1647).
  Required before: setting `characters` ("Setting this property requires the font the be loaded… will reset
  styles applied to character ranges", L9514–9522), `insertCharacters`/`deleteCharacters` (L9528, 9540),
  `fontName` (L9464), `textCase` (L9472), `letterSpacing` (L9506), `paragraphIndent`/`paragraphSpacing`
  (L9827–9833), `setRangeFills` ("Requires font to be loaded", L9609), `setRangeBoundVariable` ("Requires
  any new fonts to be loaded", L9651), `textAlignHorizontal`/`textAlignVertical` (L10551–10557),
  `textAutoResize` (L10559), `textStyleId` ("Requires the font to be loaded", L10593).
- `textTruncation: 'DISABLED' | 'ENDING'` (L10575); with `textAutoResize` `"HEIGHT"`/`"WIDTH_AND_HEIGHT"`
  truncation needs `maxHeight` or `maxLines` (L10573). `maxLines: number | null`, ">= 1 … set to `null`" to
  disable, only applies when `textTruncation === 'ENDING'` (L10577–10583).
  `textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE'` — `'TRUNCATE'` deprecated (L10565–10567).
- Hyperlinks: node-level `hyperlink: HyperlinkTarget | null | figma.mixed` (L9512);
  `setRangeHyperlink(start, end, value: HyperlinkTarget | null)` — "Removes the hyperlink in range if
  `value` is `null`" (L9601–9603). `HyperlinkTarget = { type: 'URL' | 'NODE'; value: string }` (L5165–5168).
- `openTypeFeatures` on the node is **readonly** (`readonly openTypeFeatures: {…} | figma.mixed`,
  L9500–9504). No setter anywhere → export-only; cannot be re-applied on import (mention in warnings).
- `fontWeight` is readonly (L9470). `fontSize` min value 1 (L9460–9462).
- `TextNode.textStyleId: string | figma.mixed` — DP read-only → `setTextStyleIdAsync(styleId)` (L10592–10601).

## 7. Geometry / nodes

- `vectorPaths: VectorPaths` **settable** on `VectorLikeMixin` (L8712–8726); no DP restriction (unlike
  `vectorNetwork`, which is DP read-only → `setVectorNetworkAsync`, L8716–8722).
  `type VectorPaths = ReadonlyArray<VectorPath>` (L5151);
  `VectorPath { readonly windingRule: WindingRule | 'NONE'; readonly data: string }` (L5118–5147) —
  `'NONE'`: "An open path won't have a fill" (L5131). `WindingRule = 'NONZERO' | 'EVENODD'` (L5026).
  Path data supports only `M L Q C Z` absolute commands, space-separated (L5139–5144).
- `handleMirroring: HandleMirroring | figma.mixed` settable (L8730);
  `HandleMirroring = 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH'` (L7278).
- `figma.createNodeFromSvg(svg: string): FrameNode` — "equivalent to the SVG import feature in the editor"
  (L1655–1657). Returns a FrameNode (wrap → children are the vector nodes).
- `LineNode` (L10438–10451): `DefaultShapeMixin + ConstraintMixin + AnnotationsMixin + ComplexStrokesMixin`;
  **no** CornerMixin / RectangleCornerMixin / IndividualStrokesMixin. `resize(width, height)`: "height …
  Must be >= 0.01, **except for {@link LineNode} which must always be given a height of exactly 0**"
  (L7092–7093, same for `resizeWithoutConstraints` L7107–7108). `createLine` example uses
  `line.resize(200, 0)` (L940–947).
- Boolean ops: `figma.union(nodes: ReadonlyArray<BaseNode>, parent: BaseNode & ChildrenMixin, index?): BooleanOperationNode`
  (L1842–1846); `subtract` (L1850–1854); `intersect` (L1858–1862); `exclude` (L1866–1870) — parent is
  **required** (same contract as `figma.group`, L1840). `figma.createBooleanOperation()` is deprecated
  (L1451–1453). `BooleanOperationNode` has children + CornerMixin (L10874–10889).
- `EllipseNode.arcData: ArcData` settable (L10467–10470);
  `ArcData { readonly startingAngle: number; readonly endingAngle: number; readonly innerRadius: number }`
  (L4112–4116); example `ellipse.arcData = {startingAngle: 0, endingAngle: Math.PI, innerRadius: 0.5}` (L977).
- `relativeTransform: Transform` (L6968): unit axes only — "The `relativeTransform` is **not** used for
  scaling… `sqrt(m00^2 + m10^2) == sqrt(m01^2 + m11^2) == 1`" (L6930); relative to the **container parent**
  (page/frame/component/instance), *not* group or boolean-operation parents (L6938); in auto-layout children
  "Setting `relativeTransform` … will ignore the translation components, but do keep the rotation
  components" (L6966). `x`/`y` = `relativeTransform[0][2]`/`[1][2]`, no-op in auto-layout children
  (L6890–6898). `rotation` (degrees, -180..180) also writes m00/m01/m10/m11, pivot = top-left (L6996–7002).
- `resize(width, height)` — applies child constraints recursively, "calls … could be expensive"; auto-layout
  parent resizes (L7089–7103). `resizeWithoutConstraints` — "Children of the node are never resized"
  (L7104–7118). Both ignore `targetAspectRatio`. Missing-font caution on text nodes (L7099, 7114).
- `minWidth/maxWidth/minHeight/maxHeight: number | null` — "Applicable only to auto-layout frames and their
  direct children. Value must be positive. Set to `null` to remove" (L6907–6922).
- Individual stroke weights: `IndividualStrokesMixin { strokeTopWeight, strokeBottomWeight,
  strokeLeftWeight, strokeRightWeight: number }` — "on a rectangle node or frame-like node… non-negative
  and can be fractional" (L8340–8349). Mixed into `RectangleNode` (L10426) and `BaseFrameMixin`
  (frames/components/instances/slots, L8985). When sides differ, `strokeWeight` reads `figma.mixed`
  (L8290–8302).
- `dashPattern: ReadonlyArray<number>` on `MinimalStrokesMixin` — "alternating dash and gap lengths, in
  pixels" (L8323–8326) — available on every stroked node type.
- Corner radii: `CornerMixin.cornerRadius: number | figma.mixed` + `cornerSmoothing: number` 0–1
  (L8562–8581); `RectangleCornerMixin.topLeftRadius/topRightRadius/bottomLeftRadius/bottomRightRadius: number`
  (L8585–8602). RectangleCornerMixin is on `RectangleNode` (L10425) and `BaseFrameMixin` (L8980) — and on
  `SectionNode` (L11851). Ellipse/Polygon/Star/Vector/BooleanOperation have only `CornerMixin`
  (L10455, 10475, 10495, 10521, 10877). LineNode has neither.

## 8. Layout

- `layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID'` (L7332). "Must be set to `"HORIZONTAL"` or
  `"VERTICAL"` in order for … `primaryAxisSizingMode`, `counterAxisSizingMode`, `layoutWrap`,
  `primaryAxisAlignItems`, `counterAxisAlignItems`, `counterAxisAlignContent`, `paddingTop`,
  `paddingBottom`, `paddingLeft`, `paddingRight`, `itemSpacing`, `counterAxisSpacing`,
  `itemReverseZIndex`, and `strokesIncludedInLayout` … to be applicable" (L7292). Toggling auto-layout off
  does not restore child positions (L7290).
- `layoutWrap: 'NO_WRAP' | 'WRAP'` — "can only be set on layers with `layoutMode === "HORIZONTAL"` …
  Setting it on layers without this property will throw an Error"; WRAP is required for
  `counterAxisSpacing`/`counterAxisAlignContent` (L7458–7467).
- `layoutSizingHorizontal / layoutSizingVertical: 'FIXED' | 'HUG' | 'FILL'` — "Applicable only on
  auto-layout frames, their children, and text nodes… `"HUG"` is only valid on auto-layout frames and text
  nodes. `"FILL"` is only valid on auto-layout children. **Setting these values when they don't apply will
  throw an error**" (L7003–7088). ⇒ append the child to its auto-layout parent (and set the parent's
  `layoutMode`) *before* setting `FILL`; set the frame's own `layoutMode` before `HUG`.
- `layoutAlign: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'INHERIT'` — "Applicable only on direct children of
  auto-layout frames"; MIN/CENTER/MAX deprecated values (L8088–8101). `layoutGrow: number` — 0 or 1 only,
  direct children of auto-layout frames (L8102–8111). `layoutPositioning: 'AUTO' | 'ABSOLUTE'` — "applicable
  only for direct children of auto-layout frames"; ABSOLUTE takes the child out of flow, respects
  constraints (L8112–8145). All three require the node to already be a child of an auto-layout frame.
- `itemSpacing: number` (L7677; negative values allowed per example L7742).
  `counterAxisSpacing: number | null` — only on HORIZONTAL/VERTICAL frames **with `layoutWrap: 'WRAP'`**;
  "Set this propety to `null` to have it sync with itemSpacing. This will never return `null`" (L7679–7725).
- `itemReverseZIndex: boolean` — HORIZONTAL/VERTICAL auto-layout frames; true = first layer drawn on top
  (L7726–7765). `strokesIncludedInLayout: boolean` (L7457).
- `gridStyleId`: **exists** (`BaseFrameMixin`, L8999–9008; DP read-only → `setGridStyleIdAsync`) — but the
  source file has no grid styles, so n/a for this project.
- `paddingLeft/Right/Top/Bottom: number` — "Applicable only on auto-layout frames" (L7333–7340 ff.).

## 9. Media / misc

- `figma.createImage(data: Uint8Array): Image` — "must be encoded as a PNG, JPEG, or GIF. Images have a
  maximum size of 4096 pixels (4K) in width and height. Invalid images will throw an error" (L1659–1665).
  `createImageAsync(src: string)` same 4096 limit, rejects (L1667–1701).
- `figma.getImageByHash(hash: string): Image | null` (L1705). `Image { readonly hash: string;
  getBytesAsync(): Promise<Uint8Array>; getSizeAsync(): Promise<{width, height}> }` (L12224–12239).
- `figma.base64Encode(data: Uint8Array): string` (L1886); `base64Decode(data: string): Uint8Array` (L1890).
- `figma.mixed`: `readonly mixed: unique symbol` — "constant value that some node properties return when
  they are a mix of multiple values… never needs to know the actual value, only that it is a unique,
  constant value that can be compared against" (L891–909). A `symbol` ⇒ **not JSON-safe**.
  Properties used by this SPEC that can return `figma.mixed`:
  `fills` (L8367), `fillStyleId` (L8377), `strokeWeight` (L8302), `strokeJoin` (L8312), `strokeCap` (L8520),
  `cornerRadius` (L8572), `handleMirroring` (L8730), `fontSize` (L9462), `fontName` (L9466),
  `fontWeight` (L9470), `textCase` (L9474), `openTypeFeatures` (L9500–9504), `letterSpacing` (L9508),
  `hyperlink` (L9512), `paragraphIndent` (L9829), `paragraphSpacing` (L9833), `listSpacing` (L9837),
  `textDecoration` (+style/offset/thickness/color/skipInk, L9849–9869), `lineHeight` (L9873),
  `leadingTrim` (L9877), `textStyleId` (L10597), and every `getRange*` accessor (L9548–9981).
- `figma.skipInvisibleInstanceChildren: boolean` — "Defaults to true in Figma Dev Mode and false in Figma
  and FigJam" (L84). When `true`: `children`/`findAll` exclude invisible instance children,
  `getNodeByIdAsync` returns null, property access on them throws (L93–104); `findAllWithCriteria` "can be
  up to hundreds of times faster" (L107).
- `findAllWithCriteria<T extends NodeType[]>(criteria: FindAllCriteria<T>): Array<{type: T[number]} & SceneNode>`
  (L6846–6852); `FindAllCriteria { types?: T; pluginData?: {keys?}; sharedPluginData?: {namespace, keys?} }`
  (L12303–12332). DP + PageNode ⇒ `page.loadAsync()` first (L6856; same note on `children`/`appendChild`/
  `findAll` etc., L6620, 6637).
- `figma.createSection(): SectionNode` (L1301). `SectionNode extends ChildrenMixin, MinimalFillsMixin,
  OpaqueNodeMixin, DevStatusMixin, AspectRatioLockMixin, MinimalStrokesMixin, CornerMixin,
  RectangleCornerMixin` (L11843–11851) — has `appendChild` via ChildrenMixin; `resize(width, height)` and
  `resizeWithoutConstraints(width, height)` both ">= 0.01", equivalent for sections ("Sections do not
  propagate constraints", L11864–11881). No LayoutMixin (no auto-layout, no rotation).
- Reactions: `reactions: ReadonlyArray<Reaction>` — DP read-only → `setReactionsAsync(reactions:
  Array<Reaction>): Promise<void>` (L8735–8895). `Reaction = { action?: Action (deprecated);
  actions?: Action[]; trigger: Trigger | null }` (L5341–5348). `Action` union (L5390–5449) incl.
  `{ type: 'NODE'; destinationId: string | null; navigation: Navigation; transition: Transition | null; … }`
  — fields are `readonly` in the type ⇒ build fresh objects on import (docs use a deep `clone()` helper,
  L8779–8784). `Trigger` union (L5472–5500) incl. `{ type: 'ON_CLICK' … }`. `Transition` =
  Simple(`'DISSOLVE' | 'SMART_ANIMATE' | 'SCROLL_ANIMATE'`) | Directional (L5453–5471). All plain data —
  JSON-safe (no functions), but `destinationId` needs the node-id remap.
- `figma.ui.postMessage(pluginMessage: any, options?)` — payload must be serializable "objects, arrays,
  numbers, strings, booleans, null, undefined, Date objects and Uint8Array objects. However, functions and
  prototype chains of objects will not be sent" (L2736–2751). **No size limit documented in the d.ts** —
  same restrictions as browser `postMessage` (L2742); the multi-MB export JSON string is legal, chunk only
  if runtime memory becomes an issue.
- `figma.showUI(html: string, options?: ShowUIOptions)` (L383); `ShowUIOptions { visible?, title?, width?,
  height?, position?, themeColors? }` (L2672–2687); width default 300 (min 70), height default 200 (min 0),
  changeable later via `figma.ui.resize(width, height)` (L353–354, L2719).
- `figma.currentPage: PageNode` — "If the manifest contains `"documentAccess": "dynamic-page"`, this
  property is read-only. Use {@link PluginAPI.setCurrentPageAsync}" (L461–466);
  `setCurrentPageAsync(page: PageNode): Promise<void>` (L470).
- `figma.createPage(): PageNode` — appended to document children; Starter plan limited to 3 pages, throws
  "The Starter plan only comes with 3 pages…" (L1122–1135).
- `figma.loadAllPagesAsync(): Promise<void>` — enables `documentchange`, `DocumentNode.findAll*`; "may be
  slow for large documents"; only needed under DP (L1912–1925). Per-page alternative:
  `PageNode.loadAsync(): Promise<void>` (L10256).
- `exportAsync` (for the SVG fallback): DP + PageNode needs `loadAsync` (L8614); returns `Uint8Array`
  (`SVG_STRING` variant returns string via `ExportSettingsSVGString` — see `exportAsync` overloads near L5008).

## Dynamic-page quick list (everything above that throws or is read-only under DP)

- Throws: `getVariableById`, `getVariableCollectionById`, `getLocalVariables`,
  `getLocalVariableCollections` (L2081–2118), `createVariable(name, collectionId, …)` (L2124),
  `setBoundVariable(field, variableId: string)` (L6312), `setRangeTextStyleId` / `setRangeFillStyleId`
  (L9625, 9639), `ComponentNode.instances` (L10759), `BaseStyle.consumers` (L12094), `getFileThumbnailNode`
  (L1899).
- Read-only (use async setter): `currentPage` → `setCurrentPageAsync` (L464); `fillStyleId` /
  `strokeStyleId` / `effectStyleId` / `textStyleId` / `gridStyleId` / `backgroundStyleId` →
  `set*StyleIdAsync` (L8371, 8283, 7238, 10595, 9002, 7264); `vectorNetwork` → `setVectorNetworkAsync`
  (L8716); `reactions` → `setReactionsAsync` (L8739); `InstanceNode.mainComponent` write-only →
  `getMainComponentAsync` to read (L10792).
- Requires load first: `PageNode.loadAsync()` before `children` / `appendChild` / `insertChild` / `findAll*`
  / `exportAsync` on a PageNode (L6620–6666, 8614); `figma.loadAllPagesAsync()` before `figma.root.findAllWithCriteria`
  / `documentchange` (L1912–1925).
