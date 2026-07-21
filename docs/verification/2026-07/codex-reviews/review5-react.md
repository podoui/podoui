## Blocking findings

1. The browser evidence does not test the claimed final artifact. The final tarball is `98d822280df13f1d67e56fc80d6e15fb8267941d`, but the report identifies `a80487a3…` as final and `react7` tested that artifact ([react.md](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/react.md:135>)). The harness still contains the old editor/CSS bytes:

   - Installed editor: `ad70e4c6…`; final tarball: `f5d2c9d8…`
   - Installed CSS: `55d4f4e3…`; final tarball: `d9e7ffa2…`

   This matters because the logged artifact explicitly had an unstyled image-edit popup and an off-screen table context menu ([react.md](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/react.md:156>)). Those fixes exist only in the later, untested artifact. The 315-test quality gate is valid unit evidence, but cannot establish browser rendering of the changed CSS/editor bundle.

2. React `Icon` violates the public JSON component specification, and the harness avoids the missing behavior. The spec requires `decorative` and `size=sm|md|lg`, with non-decorative icons supporting `aria-label` ([icon.component.json](/Users/tarucy/project/podoui/packages/spec/samples/components/icon.component.json:20)). React exposes only `name` ([index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:381)), emits no `data-size`, and unconditionally overwrites `aria-hidden="true"` ([index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:2256)). Thus a meaningful labeled icon cannot be exposed to assistive technology. The harness uses only `<Icon name={n}/>` ([App.tsx](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/react/src/App.tsx:769>)), and the report proves only glyph/font rendering ([react.md](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/react.md:53>)).

3. `Table` can retain stale drag state when the pointer is released outside the table. Cleanup exists only on the table’s `onPointerUp` ([index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:2129)); there is no document-level `pointerup`, `pointercancel`, or lost-capture cleanup. Re-entering after an outside release clears `dragRef` but leaves `dragMovedRef=true` ([index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:2092)). The next ordinary row-body click is consequently swallowed ([index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:2056)). Both unit and browser evidence release inside the table; the browser log releases over row 3 ([react-commands.log](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/react-commands.log:5036>)).

## Non-blocking suggestions

Coverage bookkeeping was otherwise complete: all 20 public component exports are mounted, and `toast` plus `usePodoTheme` are exercised.

VERDICT: FAIL
