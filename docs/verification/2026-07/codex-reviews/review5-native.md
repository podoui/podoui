## Blocking findings

1. Select’s options break its trigger-owned focus model. Each option is an enabled `host.Pressable` without `tabIndex`/`focusable` suppression (`packages/native/src/index.tsx:901-923`). The injected RNW `Pressable` defaults every enabled instance to `tabIndex=0` (`harness/native/node_modules/react-native-web/dist/exports/Pressable/index.js:118-132`). Consequently, Tab enters every option even though the JSON contract requires focus to remain on the trigger (`packages/spec/samples/components/select.component.json:195-206`). Report B5 checks focus only after Arrow/Enter/Escape and never exercises Tab.

2. Native Icon does not implement its public JSON contract. `NativeIconProps` exposes neither `size`, `decorative`, nor a non-decorative accessibility label (`packages/native/src/index.tsx:286-300`); rendering always hides the icon from assistive technology and never applies a size variant (`packages/native/src/index.tsx:1288-1307`). The source-of-truth spec requires `decorative`, `aria-label`, and `sm/md/lg`, with native’s only declared limitation being glyph-map use (`packages/spec/samples/components/icon.component.json:20-46`). Harness/report coverage checks glyph resolution and always-decorative hiding only.

3. Toast uses the wrong announcement role for four states. The implementation assigns `accessibilityRole: "alert"` unconditionally (`packages/native/src/index.tsx:1454-1458`), while the spec requires `status` for normal/success/info/warning and `alert` only for danger (`packages/spec/samples/components/toast.component.json:106-109`). Report A13 directly observes a success toast with `role:"alert"` and incorrectly marks it PASS.

4. Chip omits required toggle semantics and pressed feedback. It reports `accessibilityState.selected` instead of the specified `aria-pressed` state and uses a static style object with no active/pressed treatment (`packages/native/src/index.tsx:628-650`). The spec requires `aria-pressed` for selection toggles and an active state (`packages/spec/samples/components/chip.component.json:154-199`). Harness/report A3 verifies counters and resting colors, but never `aria-pressed` or a held press.

5. The report explicitly demonstrates failed keyboard contracts for Switch, Checkbox, and Radio. A12 records Space as a no-op on all three and never tests radio Arrow-key navigation. Their implementations provide only `onPress`, with no keyboard fallback (`packages/native/src/index.tsx:1322-1331`, `1388-1401`, `1597-1606`). This contradicts the JSON contracts: Switch Enter/Space (`switch.component.json:132-135`), Checkbox Space (`checkbox.component.json:107-110`), and Radio Arrow keys/Space (`radio.component.json:102-105`). Calling those failures “expected RNW behavior” does not make them passing behavior in the actual injected host.

6. Select does not wire its trigger to its listbox. The trigger supplies role, label, state, and `aria-activedescendant`, but no `aria-controls`/`accessibilityControls` or explicit popup relationship (`packages/native/src/index.tsx:978-1008`), despite assigning the menu an ID (`packages/native/src/index.tsx:1034-1043`). The spec requires `aria-expanded/aria-haspopup/aria-controls` (`packages/spec/samples/components/select.component.json:195-198`). Report B4 acknowledges that expanded is absent in RNW and never checks controls.

7. Tooltip lacks required tooltip semantics. Its root is only a styled `View`; no tooltip role or identifier is emitted (`packages/native/src/index.tsx:1517-1586`). Even accepting native’s documented static-bubble limitation, the spec still requires `role=tooltip` (`packages/spec/samples/components/tooltip.component.json:73-81`). Harness lines 499-505 and report A13 inspect only layout and colors.

## Non-blocking suggestions

- All 13 public component exports are present in the harness; none is wholly omitted.
- Update `native.md`: it still calls `7064859…` current, while the supplied final tarball is `98d8222…`, and older gate counts remain. The native module itself is byte-identical at `ee816078…`, so this bookkeeping mismatch does not independently invalidate the native observations.
- Isolate the intentionally incompatible convenience-export demo so its expected React errors cannot obscure new console regressions.

VERDICT: FAIL
