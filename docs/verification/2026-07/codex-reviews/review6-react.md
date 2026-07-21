## Blocking findings

1. Final-artifact browser evidence is missing. [react.md](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/react.md:109>) claims a logged `microv` verification against `b691f35…`, but [react-commands.log](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/react-commands.log:12221>) ends after closing `react8`; it contains neither `microv` nor `b691f35…`. The exhaustive browser run therefore proves `634f24…`, not the current artifact. This matters because `dist/react/editor/index.js` changed afterward.

2. Unbound DatePicker selection is broken and the harness avoids exercising it. `value` is optional, and the harness mounts `<DatePicker ... placeholder>` without it at [App.tsx](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/react/src/App.tsx:879>), but only checks its placeholder. With the default `showActions=false`, selection updates `tempValue` at [datepicker.tsx](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:1180), while rendered state is read exclusively from `value` at [datepicker.tsx](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:1281). When `value` is omitted, a date selection closes and immediately renders blank again; time selection likewise resets visually.

3. Controlled/open Tooltips detach from their triggers after scrolling or resizing. Coordinates are measured only by the layout effect at [index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:1594), while the movement listener explicitly returns whenever the `open` prop is supplied at [index.tsx](/Users/tarucy/project/podoui/packages/react/src/index.tsx:1624). Thus `open={true}` and controlled Tooltips remain fixed at stale viewport coordinates. The harness tests toggling and initial geometry, but never movement while open.

4. Clicking an already-selected Editor image nests another selection wrapper. The existing-wrapper click path invokes `handleImageClick` again at [editor/index.tsx](/Users/tarucy/project/podoui/packages/react/src/editor/index.tsx:326). That handler unwraps only when a different image is selected, then unconditionally creates and inserts another `.image-wrapper` with eight handles at [useImageEditor.ts](/Users/tarucy/project/podoui/packages/react/src/editor/hooks/useImageEditor.ts:360). The report clicks the image once and immediately deletes it, so repeated selection was never tested.

## Non-blocking suggestions

- Record the verified export inventory explicitly: `PodoThemeProvider`, `Button`, `Chip`, `Badge`, `Switch`, `Checkbox`, `Radio`, `Input`, `Textarea`, `Select`, `Tooltip`, `Toast`, `Toaster`, `Table`, `Field`, `Icon`, `Typography`, `DatePicker`, `Editor`, and `EditorView`. All appear in the harness.
- Add focused browser regressions for the three source defects and preserve the final artifact hash in the raw command log.

VERDICT: FAIL
