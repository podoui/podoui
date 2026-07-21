## Blocking findings

1. Real React Native drops the claimed Input/Textarea/Field accessibility wiring. `packages/native/src/index.tsx:1160-1167,1231-1238,1864-1877` relies on `accessibilityDescribedBy` and `accessibilityState.invalid/required`. React Native 0.86’s `TextInput.js:634-649` only forwards `busy`, `checked`, `disabled`, `expanded`, and `selected`; no native `accessibilityDescribedBy` exists. Report A9/A11 admits RNW drops these attributes, but fiber inspection and fake-host unit tests merely prove Podo passed unsupported props—not that native assistive technology receives them.

2. Dot Badge is not an accessibility element on real native. `packages/native/src/index.tsx:728-735` puts `accessibilityLabel` on a plain `View` without `accessible={true}` or a role. Non-touchable React Native Views are not accessible by default. Report A4 proves only RNW’s DOM `aria-label`, so the JSON contract at `packages/spec/samples/components/badge.component.json:138-141` is not satisfied natively.

3. Field does not implement its declared label-focus behavior. The contract says label press should focus the control (`packages/spec/samples/components/field.component.json:102-104`), but `packages/native/src/index.tsx:1306-1313` renders an inert `Text`; no press handler or control ref is wired. The harness only checks ID relationships and never presses a label.

4. Select’s stale-event lock omits clear-all. Option and chip removal flow through guarded `pick()` at `packages/native/src/index.tsx:785-803,924-929`, but clear-all directly invokes `onValuesChange([])` at `packages/native/src/index.tsx:1096-1103`. A clear press queued before a `disabled`/`readOnly` flip can therefore mutate values afterward. Report A8 and the test at `packages/native/src/index.test.tsx:858` capture only stale option handlers, not stale clear-all.

5. The native runtime remains incomplete against its JSON source of truth. The specs expose uncontrolled state (`defaultSelected`, `defaultChecked`, `defaultValue`, `defaultValues`) for Chip, Switch, Checkbox, Radio, and Select—for example `chip.component.json:69-93`, `switch.component.json:41-80`, and `select.component.json:53-80`. The native interfaces and implementations at `packages/native/src/index.tsx:73-98,126-182,241-270` omit these APIs and always derive state from controlled props. The harness exclusively exercises controlled usage, avoiding this missing functionality.

## Non-blocking suggestions

- Public component inventory is exactly: `Button`, `Checkbox`, `Radio`, `Chip`, `Badge`, `Select`, `Input`, `Textarea`, `Field`, `Icon`, `Switch`, `Toast`, and `Tooltip`. All 13 appear in RNW factory coverage; the top-level string-host browser demo directly mounts only Button/Badge, while the 13-export unit test supplies structural coverage.
- The final tarball’s native JS and declarations match the frozen native8 build byte-for-byte. The documented convenience-export console errors are convincingly isolated to intentionally mounting test-only string hosts under React DOM.
- Add an actual React Native renderer/accessibility harness; RNW and forwarding fake hosts cannot establish acceptance of native-only accessibility props.

VERDICT: FAIL
