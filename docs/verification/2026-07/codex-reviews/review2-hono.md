## Blocking findings

1. `Field disabled` does not disable its child. [`Field`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:938) only adds `data-disabled` to the wrapper; the attributes passed by [`wireHonoControl`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:984) omit `disabled`. Thus `<Field disabled><Input /></Field>` remains editable. The harness only tests an explicitly disabled `Input`, not the `Field` prop.

2. Preserving an explicit child ID breaks label activation. The label always targets the generated ID at [`index.tsx:972`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:972), while [`wireHonoControl`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:1095) preserves the child’s different ID. The recorded markup proves the mismatch: [`hono-commands.log:178`](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/hono-commands.log:178>) has `for="podo-field-website-control"` but `id="my-input"`. The report’s “PASS” assertion never compares those two values.

3. `Select` fails to expose declared states to assistive technology. `invalid` and `readOnly` only affect `data-state`/rendering at [`index.tsx:299`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:299); the combobox emits neither `aria-invalid` nor `aria-readonly` at [`index.tsx:311`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:311). The harness renders both states, but its assertions only inspect wrapper state, menu count, and chevron visibility.

4. The harness uses expanded Selects without the wiring required by the repository’s accessibility contract. `id` is optional, but `aria-controls` and the listbox ID are produced only when it exists at [`index.tsx:302`](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:302). The multi-select at [`server.tsx:260`](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:260>) is expanded without `id`, `aria-label`, or `aria-labelledby`, producing an unnamed expanded combobox with no `aria-controls`. The report selectively verifies only the correctly wired examples.

5. The supplied raw log does not substantiate final-tarball verification. Its sole “FINAL VERIFICATION” banner records tarball `b700280…` at [`hono-commands.log:73`](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/hono-commands.log:73>) and ends with the pre-fix checkbox failure. The report later claims a `16b6e55…` `honofix2` run at [`hono.md:130`](</private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/reports/hono.md:130>), but no `honofix2` command, full eval, console check, or screenshot exists in the supplied command log. Therefore the quoted two-array summary and zero-error claim for the final artifact are unverifiable.

## Non-blocking suggestions

All 15 component exports are instantiated: Badge, Button, Checkbox, Chip, Field, Icon, Input, Radio, Select, Switch, Table, Textarea, Toast, Tooltip, and Typography. `renderCriticalCss` and `honoRendererScope` are also covered.

Add regression assertions for `Field disabled`, explicit-child-ID label association, Select state ARIA, unnamed/id-less expanded Selects, and preserve the complete final-artifact browser transcript.

VERDICT: FAIL
