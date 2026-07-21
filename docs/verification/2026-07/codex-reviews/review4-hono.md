## Blocking findings

Public components enumerated from `packages/hono/src/index.tsx`: Button, Chip, Badge, Input, Textarea, Select, Tooltip, Toast, Table, Field, Switch, Checkbox, Radio, Icon, and Typography. `renderCriticalCss` and `honoRendererScope` are additional runtime exports. Every export appears in the harness, but the following defects remain:

1. Field-required Checkbox and Radio controls are not natively required. `createFieldA11y()` injects `required: true`, and Field passes it into its child, but Checkbox and Radio neither declare nor emit `required`. They only preserve `aria-required`. Consequently, `<Field required><Checkbox/></Field>` or a required Radio inside a form will not participate in native constraint validation. The harness contains exactly these compositions, but its check only reads `ariaRequired`; it never puts them in the form or attempts invalid submission. See [core Field wiring](/Users/tarucy/project/podoui/packages/core/src/index.ts:195), [Hono Field](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:1063), [Checkbox](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:801), [Radio](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:883), harness lines 449–472, and `hono-commands.log:1111-1112`.

2. Icon does not implement its public JSON-spec contract. The source-of-truth spec exposes `decorative`, requires both `aria-hidden` and `aria-label` behavior, and defines `sm/md/lg` sizing, with no Hono limitation. Hono accepts only `name: string` and always renders `aria-hidden="true"`; it has no way to render a meaningful icon or select a size. The harness only tests decorative glyph presence and forces 24px through `.icon-row i`, masking the missing size API. See [icon spec](/Users/tarucy/project/podoui/packages/spec/samples/components/icon.component.json:20), [Hono Icon](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:1093), harness lines 501–509, and report item 1.

3. `renderCriticalCss()` protects theme strings but permits `css` to break out of its `<style>` element. It inserts `css` using `raw(css)` without neutralizing `</style`; a CSS string containing that sequence produces malformed HTML and can inject markup or script. The `/xss` evidence tests only the escaped `theme` value, so it does not establish safety or correct rendering for the helper’s other string input. See [renderCriticalCss](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:1110), harness lines 595–604, and `hono-commands.log:973-986`.

## Non-blocking suggestions

- Add a static Tooltip association example where a trigger’s `aria-describedby` resolves to the rendered tooltip. Current evidence proves only bubble appearance, role, arrow, and variants.
- Add native keyboard checks for Radio Arrow/Space behavior and direct Enter/Space activation checks for Button/Chip. Their native elements make these likely correct, but the report does not directly prove them.
- Correct report item 9’s “Raw bytes” quotation: `hono-commands.log:977` contains `\u003c/script>\u003cscript>`, not literal embedded closing/opening script tags.
- The failed shell-quoted evals at log lines 1114–1124 were convincingly rerun and are not application errors.

VERDICT: FAIL
