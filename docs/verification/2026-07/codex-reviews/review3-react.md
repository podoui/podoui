## Blocking findings

1. DatePicker remains interactive if `disabled` flips while open. `selectingPart` is not cleared, so the dropdown stays rendered; calendar cells and Apply/Reset remain enabled, and their handlers lack disabled guards. This permits a disabled picker to commit changes. See [datepicker.tsx:856](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:856), [datepicker.tsx:888](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:888), [datepicker.tsx:1011](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:1011), and [datepicker.tsx:1547](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:1547). The harness tests only disabled-at-mount.

2. DatePicker’s roving-tabindex implementation breaks with disabled-date constraints. The roving day is chosen without considering `disable`, `enable`, `minDate`, or `maxDate`, then that cell receives both `tabIndex={0}` and native `disabled`. It is therefore skipped during tab navigation. Arrow/Home/End can likewise move onto a disabled cell, after which `.focus()` fails and the previously focused cell becomes `tabIndex=-1`. See [datepicker.tsx:407](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:407), [datepicker.tsx:419](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:419), and [datepicker.tsx:622](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:622). Report item 22 tests only an unconstrained calendar.

3. Reverse period-datetime selection loses the end time. The branch that auto-sorts an earlier second date says it swaps times, but derives both `adjustedStartTime` and `adjustedEndTime` from `tempValue.time`; `tempValue.endTime` is discarded. See [datepicker.tsx:1056](/Users/tarucy/project/podoui/packages/react/src/datepicker.tsx:1056). The 12-combination harness always selects dates in ascending order, so it does not exercise this branch.

4. Editor does not honor external controlled `value` changes while code view is open. The `[value]` synchronization effect updates only `editorRef`, which is unmounted in code view. `useCodeView` accepts `value` but has no synchronization effect for `codeContent` or `originalHtml`. See [index.tsx:447](/Users/tarucy/project/podoui/packages/react/src/editor/index.tsx:447) and [useCodeView.ts:52](/Users/tarucy/project/podoui/packages/react/src/editor/hooks/useCodeView.ts:52). The harness tests user typing, not an external value update.

5. Chip’s public ref contract is false in removable mode. It is declared as `forwardRef<HTMLButtonElement>`, but `onRemove` changes the root to a `<span>` and casts that span into the button ref. Consumers therefore receive an `HTMLSpanElement` through a ref typed as `HTMLButtonElement`. See [index.tsx:468](/Users/tarucy/project/podoui/packages/react/src/index.tsx:468) and [index.tsx:494](/Users/tarucy/project/podoui/packages/react/src/index.tsx:494). No ref behavior is covered by the harness.

## Non-blocking suggestions

- Export audit passed: all 20 public React components are represented—`PodoThemeProvider`, Button, Chip, Badge, Switch, Checkbox, Radio, Input, Textarea, Select, Tooltip, Toast, Toaster, Table, Field, Icon, Typography, DatePicker, Editor, and EditorView. The harness also covers `usePodoTheme` and `toast`.
- Rename the Editor assertion `allFormattingGone`: its quoted HTML retains `<h1 style="text-align: center">`, while the predicate checks only four inline tags.
- `check-final.log` exits successfully but prints unresolved Figma imports for most React components; these should not be described as a clean Figma check without qualification.

VERDICT: FAIL
