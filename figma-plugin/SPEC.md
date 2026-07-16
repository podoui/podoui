# Podo Cloner — implementation spec

A Figma plugin with two modes:

- **Export** — run inside the *PODO Design System* source file. Serializes all
  local variables, local styles, and every local component / component set
  (from all pages) into one JSON document (`src/schema.ts`), downloaded via the
  plugin UI.
- **Import** — run inside an (empty) target file. Creates a page named
  `_podo` and recreates variables, styles, and components *identically*.

No network access. The JSON file is the only transport.

## Source-file inventory (measured 2026-07-15 via REST)

These numbers bound what the serializer MUST cover. Anything outside this list
may be handled best-effort, but log a warning instead of silently dropping.

- Pages: `🦄 Overview` (3 components), `Web` (21), `Component` (801),
  `Documentation` (0). 121 component sets total, 825 components total.
- Scene node types used: `COMPONENT`, `COMPONENT_SET`, `FRAME`, `INSTANCE`,
  `TEXT`, `RECTANGLE`, `ELLIPSE`, `LINE`, `VECTOR`, `BOOLEAN_OPERATION` (3),
  `SECTION` (organizing only, not inside components). **No** GROUP, POLYGON,
  STAR, or mask (`isMask`) anywhere.
- Paints: `SOLID` only, plus 4 `IMAGE` paints sharing **1** imageRef.
  **No gradients.** Many solid paints carry `boundVariables.color`.
- Effects: `DROP_SHADOW`, `BACKGROUND_BLUR` only.
- Blend modes: all default. Rotation: used (~92 nodes). `strokeDashes`: used
  (765 nodes). Layout grids: none.
- Local styles: 20 TEXT + 3 EFFECT. No paint/grid styles. No remote styles.
- Node-level `boundVariables` keys seen: `color`, `fills`, `strokes`,
  `cornerRadius`, `rectangleCornerRadii`, `itemSpacing`, `counterAxisSpacing`,
  `paddingTop/Right/Bottom/Left`, `fontFamily`, `fontSize`, `textRangeFills`.
- Component property definitions: VARIANT 165, BOOLEAN 52, TEXT 25,
  INSTANCE_SWAP 1, **SLOT 11** (Figma Slots feature — verify plugin API
  support; if the running Figma version cannot create SLOT properties,
  recreate the slot's content as plain children and record a warning).
- `componentPropertyReferences` keys seen: `visible`, `characters`,
  `mainComponent`, `slotContentId`.
- Instances referencing **remote** components: 89 unique componentIds from an
  external icon library (63 remote entries in the file's component map).
- Fonts: Pretendard (400/500/600/700), IBM Plex Mono (400/500/700),
  SF Mono (500), Audiowide (400). SF Mono may be unavailable on the target
  machine — failure to load a font must degrade to a warning, not abort.
- Prototype reactions: 56 nodes (`ON_CLICK` / `SMART_ANIMATE`).

Raw analysis material for verification lives in the session scratchpad
(`file-full.json`, `components.json`, `component_sets.json`, `styles.json`).

## Module layout

```
src/schema.ts            frozen contract (see file header)
src/main.ts              entry: routes UiToMain messages, progress plumbing
src/ui.html              single self-contained HTML file (inline JS/CSS)
src/export/index.ts      buildExport(onProgress): Promise<PodoExport>
src/export/variables.ts  exportVariables(): Promise<CollectionData[]>
src/export/styles.ts     exportStyles(): Promise<StylesData>
src/export/nodes.ts      serializeTopLevel(page): Promise<PageComponentsData>
src/import/index.ts      runImport(doc, onProgress): Promise<ImportReport>
src/import/variables.ts  importVariables(doc): Promise<Map<oldVarId,newVarId>>
src/import/styles.ts     importStyles(doc, varMap): Promise<Map<oldStyleId,newStyleId>>
src/import/nodes.ts      buildComponents(doc, maps, onProgress)
src/nodes-props.ts       shared ordered per-type property table (both sides)
```

`main.ts` owns `figma.showUI`, message routing, and top-level try/catch →
`{type:'error'}`. Both modes are available from one UI (two buttons).

## Hard ordering rules (import)

1. **Variables before everything.** Two passes: create all collections +
   modes + variables with raw values first; then a second pass writes alias
   values (`figma.variables.createVariableAlias`) through the old→new id map.
   Aliases can cross collections.
2. **Styles after variables** (text styles bind fontFamily/fontSize vars).
3. **Component shells before trees.** Pass 1 creates every COMPONENT and
   COMPONENT_SET as empty shells (`figma.createComponent()`, then
   `figma.combineAsVariants(children, parent)` for sets) and records
   oldId→node for *every* component **including variant members** (instances
   reference variant ids directly). Pass 2 populates children/properties.
   This makes forward references between components safe.
4. Within a node: `layoutMode` before padding/spacing/alignment; append child
   to parent **before** setting `layoutAlign` / `layoutGrow` /
   `layoutPositioning` / `layoutSizing*`; `resize()` where applicable; TEXT
   requires `figma.loadFontAsync` for every font in the node before writing
   `characters` or ranged properties.
5. Load **all** fonts listed in `PodoExport.fonts` up front (parallel, with
   per-font try/catch → warning).

## Remapping tables

| Source ref                          | Import action |
| ----------------------------------- | ------------- |
| variable alias `{kind:'alias',id}`  | `createVariableAlias(varMap[id])` |
| node/paint/effect `bound` ids       | `setBoundVariable` / `figma.variables.setBoundVariableForPaint` / effect copy with rebind |
| `textStyleId` / `effectStyleId` (+ segment styleIds) | `setTextStyleIdAsync` etc. with styleMap |
| instance `componentId` (local)      | componentIdMap → `createInstance()` |
| instance `componentKey` (remote)    | `figma.importComponentByKeyAsync(key)`; on failure create a placeholder frame named `⚠ missing: <name>` + warning |
| `componentPropertyReferences`       | old full prop name → new full prop name map returned by `addComponentProperty` (the `#id` suffix changes) |
| image `imageHash`                   | `figma.createImage(bytes).hash` |

## Instance overrides

`InstanceData.overrides` carries the serialized subtree of the instance as it
appears in the source. After `createInstance()` + `setProperties()`, walk the
fresh instance subtree in parallel with the serialized one (match by child
index + name) and re-apply differing leaf properties (fills, strokes,
characters + segments, visible, opacity, bound variables). Structural
mismatches (different child counts — e.g. variant-dependent subtrees) end the
walk for that branch with a warning, not an error.

## Placement

Import creates one `_podo` page. For each source page with components, create
a `SECTION` named after the source page, offset sections vertically by
bounding-box height + 200px gap, and place each top-level item at its original
page coordinates translated into the section.

## Export specifics

- Use `figma.loadAllPagesAsync()` once, then per page
  `findAllWithCriteria({types:['COMPONENT','COMPONENT_SET']})`; keep sets and
  standalone components (parent is not a COMPONENT_SET). Skip components that
  live inside another top-level item's subtree (none expected, but guard).
- Variables: `figma.variables.getLocalVariableCollectionsAsync()` +
  `getVariableByIdAsync`.
- TEXT: `getStyledTextSegments([...all fields..., 'boundVariables'])`.
- VECTOR: prefer `vectorPaths`; if the vector network is more complex than
  its paths (multiple fill regions), fall back to
  `exportAsync({format:'SVG_STRING'})` stored in `VectorData.svg`.
- IMAGE paints: `figma.getImageByHash(hash).getBytesAsync()` → base64.
- `figma.mixed` sentinels: every property that can be mixed (fills on TEXT,
  cornerRadius, strokeWeight, ...) must be checked; mixed scalars serialize
  per-corner / per-side / per-segment instead.
- Progress: post `{type:'progress'}` every ~20 components; `await` a yield
  (`new Promise(r=>setTimeout(r,0))`) at the same cadence so the UI stays
  responsive with 825 components.

## Non-goals

- Publishing, library linking of the recreated assets.
- Pages other than `_podo`, non-component canvas content (documentation
  frames etc.).
- Guaranteed reproduction of prototype flows (best-effort reactions only).

## Verification gates

- `pnpm typecheck` and `pnpm build` green inside `figma-plugin/`.
- Root repo `pnpm lint` must stay green (add an eslint ignore for
  `figma-plugin/` at the root if needed).
- Coverage review against the inventory above: every listed node type,
  bound-variable key, property-definition type, and font path must have an
  explicit code path.
