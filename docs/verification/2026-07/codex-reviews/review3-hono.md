## Blocking findings

1. `Field` does not support its advertised generic control slot. The spec permits “Any control: input, button, combobox, textarea, custom tags” with no Hono limitation ([field.component.json](/Users/tarucy/project/podoui/packages/spec/samples/components/field.component.json:45)). `Field` injects IDs and ARIA attributes ([index.tsx](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:989)), but Select, Checkbox, Radio, Switch, and Button discard some or all of them while destructuring props. Static rendering from the verified tarball showed:

   - `Field` + Checkbox: label `for="terms-field-control"`, but the checkbox has no matching `id`, `aria-labelledby`, `aria-describedby`, or `required`.
   - Invalid/required `Field` + Select: only `id` and `aria-labelledby` survive; `aria-invalid`, `aria-describedby`, and required state are lost.
   - `Field` + Switch: the label points to a nonexistent control ID.

   The harness only composes Field with Input/Textarea ([server.tsx](/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:394)), avoiding this public composition path.

2. `Field.invalid` does not propagate visual invalid state, and the harness masks that defect. Input styling depends on its `invalid` prop ([index.tsx](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:904)), while Field injects only `aria-invalid`. Consequently, `<Field invalid error="Bad"><Input /></Field>` renders a normal `.podo-input` wrapper without `data-state="invalid"`. The harness redundantly passes `invalid` to both Field and Input ([server.tsx](/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:404)), so its screenshot cannot prove Field propagation.

3. `Field disabled` can still contain an enabled control. `wireHonoControl` deliberately lets an explicit child `disabled={false}` override the disabled Field ([index.tsx](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:1123)). Static output then has `data-disabled="true"` on Field while its Input remains focusable and editable. That contradicts the public disabled state; the harness tests only the non-conflicting case.

4. Disabled Switch omits the specified `aria-disabled`. The shared behavior computes it ([core/index.ts](/Users/tarucy/project/podoui/packages/core/src/index.ts:246)), and the Switch JSON contract explicitly requires it ([switch.component.json](/Users/tarucy/project/podoui/packages/spec/samples/components/switch.component.json:132)), but the renderer emits only native `disabled` ([hono/index.tsx](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:727)). The report never asserts this attribute.

5. Several harness Selects are unnamed comboboxes. The closed single Select, disabled multi Select, and invalid Select omit both `aria-label` and `aria-labelledby` ([server.tsx](/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:226), [server.tsx](/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:313)). Raw evidence confirms unnamed `role="combobox"` elements at `hono-commands.log:596-599` and `:624-630`. Fixing only expanded Selects does not establish correct accessibility for every rendered Select.

6. `Toast.suffixIcon` is silently discarded when `closable` is also set. The public props do not declare these mutually exclusive, yet the closable branch always renders the hard-coded X and ignores `suffixIcon` ([index.tsx](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:501)). The harness tests closable and suffix text separately but never exercises `suffixIcon` ([server.tsx](/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:344)).

7. Disabled/read-only functional coverage remains incomplete. No disabled Textarea is rendered anywhere, and there is no real-keyboard attempt proving read-only Input/Textarea reject edits. Given the explicit instruction to verify disabled no-op behavior, DOM counts and screenshots are insufficient evidence for those public states.

## Non-blocking suggestions

- Record Hono JS/DTS hashes in the report. Independent comparison found installed, tarball, and repo `dist/hono` files byte-identical.
- Add a Field composition matrix covering every Hono control export.
- The `agent-browser` const-redeclaration error is convincingly tool-side and was cleanly rerun; it is not itself blocking.

VERDICT: FAIL
