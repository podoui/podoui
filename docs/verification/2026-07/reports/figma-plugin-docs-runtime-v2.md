# Podo v2 Figma, docs, and runtime verification — 2026-07-25

## Result

The live Figma source, latest embedded-snapshot installer, plugin/CLI
transport, generated artifacts, documentation site, packed npm artifact, and
four requested runtimes were checked as one flow. The implementation defects
found during the run were fixed in this scope. The installer was run in the
user-provided empty Professional file and its output was audited independently
through the Figma Plugin API.

## Live Figma inventory

File: `PODO Design System` (`uaLVvCUnvoWj4oz6ZMXxwP`)

- 5 pages: Overview, separator, Web, Component, Documentation.
- 4 variable collections / 311 variables:
  - primitive: 150
  - responsive: 15
  - semantic: 34
  - theme: 112
- Every variable has a value for every declared mode. All 112 theme variables
  resolve in both light and dark modes (224 mode values); no missing alias was
  found.
- 23 local styles: 20 text and 3 effect styles.
- Component page: 126 component sets, 891 component nodes, 4 standalone
  components, and 2,222 instances. The prior plugin spec's 121/825 inventory
  was stale and has been corrected.
- Web page foundations: Color, Typography, Icon. Documented components: Field,
  Button, Input, Chip, Switch, Table, Checkbox, Radio, Toast, Tooltip, Badge,
  Datepicker, Textarea, and Select.

## Plugin and project export/import

- `figma-plugin` strict typecheck and production bundle pass with current Figma
  typings.
- The latest installer UI embedded the 2026-07-25 `PODO Design System`
  snapshot (11.7 MB) and exposed the single `PODO 디자인 시스템 설치` action;
  JSON import/export remained folded under advanced tools.
- Empty-file install completed in `qUlf4cPGuBB4LWspPGLEoI` with the plugin
  report: 4 collections, 311 variables, 23 styles, 126 component sets, and 891
  components. Independent inspection found no missing mode value, dangling
  alias, broken instance, or `[MISSING]` placeholder.
- Canonical source/target fingerprints matched for every token collection,
  including variable names, descriptions, types, scopes, code syntax, modes,
  literal values, and alias targets. Canonical text/effect style fingerprints
  also matched (20 text + 3 effect).
- The one import report warning is an intentional multi-geometry SVG fallback:
  seven of 54 SVG-backed vectors require a FRAME wrapper to preserve their
  viewbox and appearance. A live Figma experiment confirmed flattening them
  shrinks the geometry bounds; the wrapper retains visual geometry and reapplies
  monochrome paints/bindings. No affected source vector has a paint/effect style
  link. The warning text now states this accurately.
- Import no longer forwards an undefined non-slot component property value to
  `InstanceNode.setProperties`; missing values are skipped with a warning after
  bound-variable resolution.
- Import no longer writes `autoRename` to instance sublayers, which Figma does
  not support and previously reported repeatedly in the developer console.
- Plugin JSON schema, localhost receiver, converter, dry-run/approval boundary,
  and idempotent fixture conversion remain covered by CLI/spec tests.
- The installed target was sent through the real `프로젝트로 보내기` action to
  a fresh `podo import` receiver. The reviewed plan created 180 files, then
  `podo validate`, `podo build --dry-run`, and `podo build` passed. All 603
  imported token leaves were present in generated origins (150 primitive, 60
  responsive base/modes, 34 semantic, 23 style, 336 theme base/modes), with
  zero unresolved references.
- Token generation now emits theme-aware `tokensByTheme` plus
  `getPodoNativeTokens(theme, colorScheme)`, preserving every configured theme
  and color scheme in the project export.
- Inline icon manifests now plan only files they actually create (TTF + WOFF2),
  and the cache hash previews the same CSS that is written. File-backed
  manifests create TTF + WOFF + WOFF2.
- The packed artifact includes `PodoIcons.ttf`; native glyph maps therefore have
  a real font asset instead of unusable private-use codepoints alone.

## Documentation comparison

The deployed site was behind both the Figma Web page and current package API:

- Icon and DatePicker existed in Figma/code but had no site pages.
- Environment setup did not describe the real `.podo` init/validate/dry-run/
  build flow.
- React Native examples omitted theme selection, TTF loading, codepoint-to-glyph
  conversion, and `iconFontFamily`; copied snippets could render blank icons.
- The docs copied token/component values instead of consuming generated output.

The site now consumes its own committed `podo build` output (`tokens.css`,
`components.css`, icon CSS/fonts, native tokens), documents the public
`podo-ui/*` imports, adds Setup/Icon/DatePicker pages, explains target limits,
and uses working React Native code. DatePicker is explicitly marked React/Next
only; Web, Hono, and Native are not falsely advertised as supported.

Browser checks covered desktop and 390px mobile layouts, light/dark switching,
all nine font icons, DatePicker open/select behavior, navigation, field wiring,
and browser console/page errors. The mobile horizontal overflow defect and dark
theme root-variable defect found during this run were fixed.

## Packed consumer matrix

Artifact: `podo-ui-2.3.0.tgz`

Final reviewed-candidate SHA-256:
`9a60f31049590563ea6b056f161cde189570e5d6c645c3872b9267036aaa9fa6`

| Target | Verification |
| --- | --- |
| React 19 + Vite | fresh install, `podo init/validate/build`, production build, browser press/dark/icon/DatePicker checks |
| Next.js 16 App Router | fresh install, production build, hydration-free browser dark/icon/DatePicker checks |
| Hono 4 + Node | fresh install, TypeScript build, SSR browser theme/icon/Field/Table checks |
| React Native 0.86 + Expo SDK 57 | fresh install, generated native tokens + TTF, TypeScript, Xcode simulator build, Metro bundle, light/dark iPhone 17 Pro screenshots |

The simulator exposed additional native dark-mode gaps. Button, Input,
Textarea, Select, Chip, Switch, Checkbox, Radio, Toast, and Tooltip now resolve
the same semantic token families as web. Input/Textarea pass
`placeholderTextColor`; outline surfaces and labels no longer retain light-only
colors. Tinted dark toasts use reverse text for readable contrast. Search,
calendar, and close glyphs render from the generated TTF rather than tofu or
raw icon names.

Expo SDK 57.0.8 itself failed under Xcode 26.2 in
`expo-modules-jsi` (`abs(Double)` overload ambiguity). The temporary consumer
used the equivalent `Double.magnitude` expression to complete the simulator
build. No repository or Podo package source required that workaround.

## Evidence retained outside git

Screenshots and fresh consumer projects are under
`/tmp/podoui-v2-verify.Plg3tK/`; the fresh Figma project-send consumer is under
`/tmp/podo-figma-project-send.usKrFg/`. They include docs, React, Next, Hono,
iOS light/dark captures, and the generated `.podo`/`src/podo` results. The final
package checksum is recorded again after the last reviewed build before
release/deploy.
