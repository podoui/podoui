## Blocking findings

1. Tooltip violates its accessibility contract. The spec requires the trigger’s `aria-describedby` to reference the tooltip bubble ([tooltip.component.json:78](/Users/tarucy/project/podoui/packages/spec/samples/components/tooltip.component.json:78)), but `HonoTooltipProps` exposes neither an `id` nor a trigger, and the rendered `role="tooltip"` has no ID ([index.tsx:456](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:456)). The harness renders standalone bubbles, while report item 14 checks only position, theme, ordinal, and arrow existence. “Triggering needs client code” does not waive the required SSR relationship.

2. Typography’s default contradicts the JSON source of truth. The spec defines `variant` default as `"body"` with no Hono limitation ([typography.component.json:39](/Users/tarucy/project/podoui/packages/spec/samples/components/typography.component.json:39)), but Hono changes the default to `"h1"` whenever `as="h1"` ([index.tsx:1132](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:1132)). The harness avoids this contract: its audited H1 explicitly supplies `variant="h1"` ([server.tsx:545](/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/hono/src/server.tsx:545)). Report item 14 therefore does not test the public default.

3. Dot Badge does not reliably expose the meaning promised by its API. The spec says `aria-label` supplies meaning when dot mode removes all text ([badge.component.json:138](/Users/tarucy/project/podoui/packages/spec/samples/components/badge.component.json:138)), but Hono emits an empty generic `<span aria-label>` with no name-bearing role or hidden text ([index.tsx:706](/Users/tarucy/project/podoui/packages/hono/src/index.tsx:706)). Generic spans prohibit author-provided accessible names under ARIA semantics. The report merely reads back `getAttribute("aria-label")`, which is tautological and does not prove an accessible name.

## Non-blocking suggestions

- Export enumeration found all 15 public components—`Textarea`, `Select`, `Tooltip`, `Toast`, `Table`, `Button`, `Chip`, `Badge`, `Switch`, `Checkbox`, `Radio`, `Input`, `Field`, `Icon`, and `Typography`—and every export appears in the harness.
- The final tarball hash is `b691f35c…`; its Hono JS, styles, icon CSS, and font hashes match the frozen artifact evidence. The final artifact lineage is therefore credible for Hono.
- Report item 18’s `forMatchesId` check does not prove label activation for `Field<Select>` because the target is a non-labelable `div[role=combobox]`. Document that limitation or test the intended client behavior.

VERDICT: FAIL
