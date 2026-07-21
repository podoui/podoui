# Podo UI v2 — Next.js runtime FROZEN-ARTIFACT FINAL verification (2026-07-21, session `next8`)

**This report supersedes every earlier Next-runtime report. The repo is code-frozen; the tarball tested here is EXACTLY what ships. Every current-fact claim below cites output produced in THIS session (`next8`). Earlier rounds (next5 definitive, next4 and older) are kept verbatim in the History appendix and are NOT current evidence.**

- Artifact under test: `podo-ui-2.0.4.tgz`, **sha1 `634f24adaa889b613dbc1fee9e8f77c72ddf3d3e`** — verified as this session's first logged action (`next-commands.log` banner `=== FROZEN FINAL VERIFICATION session next8 tarball 634f24ad… ===` at log line 5849, immediately followed by the `shasum` output) and re-verified at the top of the reinstall section.
- Clean reinstall this session: `rm -rf node_modules/podo-ui package-lock.json && npm install ../../podo-ui-2.0.4.tgz` (node v25.8.2 / npm 11.11.1). **Freshness proof (bit-for-bit, including two files that CHANGED this round):** `tar -xOf podo-ui-2.0.4.tgz package/dist/react/index.js | shasum` = **`06c2e00766f61be352a404469518d691fe749dae`** = `shasum node_modules/podo-ui/dist/react/index.js` (changed this round — the stale install had `61511ca1…`; carries the Icon size/decorative, Table drag-outside and callback work); `styles.css` = **`fa65c26a969aa0b521d9b6c2159a02d0c27a05b7`** both sides (changed this round — next5 had `55d4f4e3…`; carries the new `.podo-icon[data-size]` CSS, `grep -c 'data-size'` → 25); `dist/react/datepicker.js` = `a2d8fd629f7552d63e9ef6577d05f8ee9a3c6f2d` both sides (unchanged from the react7 audit build). Installed version readout `2.0.4`.
- Repo gate (READ ONLY, not re-run here): `pnpm check` green — **`Test Files  23 passed (23)` / `Tests  326 passed | 2 skipped (328)`** (`scratchpad/check-final.log:73-74`, file dated Jul 21 12:11 — same minute as the tarball).
- Harness: `harness/next` (Next.js **16.2.10**, Turbopack, react/react-dom 19.2), production `next build` + `next start -p 5212 -H 127.0.0.1`. Podo assets regenerated **from this tarball's CLI** this session (`npx podo build --out-dir app/podo --force` → `[podo:build] Generated 16 files in app/podo.`). The kitchen sink was extended BEFORE the single production build for the round-6 checks (B1 icon size/decorative fixtures; B4 callback readouts `switch-onclick`/`checkbox-native`/`input-native`/`textarea-native`/`radio-cbc` + `onOptionAdd` on `select-addable`; audit fixtures `table-disdefault`, `field-count`+set button, `dp-boundary`, `dp-yr`, `dp-homeend`, `ed2-set-a`/`ed2-set-b`, `editor3` height 120px). The installed package was never touched after the reinstall and there were **no mid-session harness rebuilds** — every browser item ran on the single final build.
- Browser: every step via `npx agent-browser --session next8` (fresh session; **481 wrapper-logged browser commands**), driven through `harness/next/ab-next8.sh` which echoes the FULL argv (entire eval JS included) into `reports/next-commands.log` before running and appends the full output.
- Raw SSR snapshot: `reports/next-ssr-next8.html` (104,237 B, captured from the final build before the browser pass).
- Screenshots: `reports/next-shots/m01`–`m26` (m-prefix = this session, 28 files incl. m05b/m14b).
- Verdict: **31 / 32 checklist items PASS; 1 item (B3) PARTIAL-FAIL** — the badge *binding-consumption and override* work in the browser, but the premise "the generated `components.css` defines `--podo-badge-*` vars" is FALSE for this frozen artifact (details in the B3 row + Findings). Zero unexplained console/page errors; zero hydration warnings.

## How to reproduce

```sh
cd /private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next
shasum ../../podo-ui-2.0.4.tgz               # must be 634f24adaa889b613dbc1fee9e8f77c72ddf3d3e
# full rebuild steps documented in start.sh (npm i tarball, podo build --force, .ts cleanup, next build)
./start.sh                                   # next start -p 5212 -H 127.0.0.1, pid in server.pid
curl -s http://127.0.0.1:5212/ | grep -c 'id="podo-editor-'   # → 3 (distinct SSR editor ids)
kill $(cat server.pid)
```

Log sections in `reports/next-commands.log` are grep-able by banner (`== ITEM 9: Select single (next8) ==`, `== B2: … ==` etc.; next8 banner at log line 5849; the log contains bash `$'…'` byte-escapes from `%q`-quoting Korean argv — use `LC_ALL=C grep -a`).

## Checklist results — A items (24/24 PASS)

Every row was exercised in the real browser against the production server. "Evidence" quotes observed output recorded in `reports/next-commands.log` under the named `(next8)` banner.

| # | Item | Result | Evidence (observed output, log banner) |
|---|---|---|---|
| A1 | Button press/keyboard/disabled/variants | PASS | `== ITEM 1 ==`: pointer click → clicks `1`, real Enter → `2`, real Space → `3`, presses `3`; disabled `{"disabledAttr":true,"ariaDisabled":"true","disabledClicks":"0"}`; variants `[{저장하기 solid-primary md},{비활성 버튼 solid-danger md},{외곽 위험 lg outline-danger lg},{보조 xs solid-assistive xs}]` (m01) |
| A2 | Badge computed styles | PASS | `== ITEM 2 + B3 ==`: `natural {bg:"rgb(62, 66, 75)",color:"rgb(249, 249, 249)"}`, `danger {bg:"rgb(242, 59, 59)"}`, `red {bg:"rgb(254, 241, 241)",color:"rgb(242, 59, 59)"}`, `info {bg:"rgb(0, 149, 255)"}`; dot `{dot:"true",text:"",w:6,h:6,bg:"rgb(62, 168, 86)"}` |
| A3 | Chip | PASS | `== ITEM 3 ==`: toggle `{sel:"true",state:"selected"}`→`{sel:"false",state:null}`; controlled `{"ctl":"true","aria":"true"}`; prop-wins `{"dataState":null,"ariaPressed":"false","attempt":"true","presses":"1"}`; label click → removed `false`, X (`aria-label=제거`) → `{"removed":"true","stillMounted":false}`; disabled removable `{"rootTag":"SPAN","dataDisabled":"true","dataRemovable":"true","dataState":"selected","xDisabled":true,"xAriaDisabled":"true","xTabIndex":-1,"removes":"0","chipStillMounted":true}` |
| A4 | Switch | PASS | `== ITEMS 4-6 ==`: `{on:{state:"on",ariaChecked:"true"},off:"off"}`; disabled `{"disabled":true,"ariaDisabled":"true","counter":"0"}` |
| A5 | Checkbox (mixed) | PASS | `== ITEMS 4-6 ==`: click → `checked`; `{"indeterminateProp":true,"dataState":"indeterminate"}`, a11y snapshot `checkbox "전체 선택" [checked=mixed]`; disabled counter `0` |
| A6 | Radio | PASS | `== ITEMS 4-6 ==`: `grape`→`apple`; disabled `{"disabled":true,"checked":false,"value":"apple","counter":"0"}` |
| A7 | Input | PASS | `== ITEM 7 ==`: controlled `포도조아` (value+readout); uncontrolled accepts typing (value now ` 추가초기값`); disabled `{"activeIsDisabledInput":false,"disabledValue":"고정값"}` after a real `type` attempt; readOnly `{"roWrapDataState":"read-only","roWrapBorder":"1px solid rgba(0, 0, 0, 0)","roWrapBackground":"rgba(0, 0, 0, 0)"}` vs normal `1px solid rgb(228, 228, 231)` + white; invalid `{"invAriaInvalid":"true","invWrapDataState":"invalid"}` |
| A8 | Textarea incl. countMax cap | PASS | `== ITEM 8 ==`: `여러 줄 내용`; 12 chars into countMax=10 → `{"value":"열두글자를넘겨보려는","valueLen":10,"maxLength":10,"count":"10/10"}`; disabled `{"focusWentToDisabled":false,"dDataState":"disabled"}`; readOnly `read-only` + transparent chrome |
| A9 | Select single | PASS | `== ITEM 9 ==`: pick 사과 → `{"picked":"apple","menusAfter":0,"trigger":"사과"}`; ArrowDown×3 `{"activedescendant":"_R_peavb_-2","activeLabel":"오렌지"}` → Enter → `orange`, menus 0; outside click 1→0 value unchanged; controlled `{"trigger":"사과","ctlValue":"apple","attempt":"melon"}` (prop wins) → external `{"trigger":"오렌지","ctlValue":"orange"}`; disabled `{"ariaDisabled":"true","tabIndex":-1,"dataState":"disabled","menus":0,"changes":"0"}` |
| A10 | Select multi | PASS | `== ITEM 10 ==` + RERUN: per-click toggles → `grape`→`grape,apple`→`…orange`→`grape,apple,orange,melon` with `menuStillOpen:true` (m03); maxChips `{"chips":["포도","사과","오렌지"],"more":"+1","moreAria":"외 1개 선택됨"}`; X `사과 제거` → `grape,orange,melon`; clear (`모두 해제`) → `none`; controlled multi `{"propWins":{"value":"grape,melon","attempt":"grape,melon,apple"}}` then external set → chips `["포도","멜론"]`; readOnly `{"ariaReadonly":"true","removeButtons":0,"chevron":0,"menusAfterClick":0}` chips `["포도","사과"]`; disabled `{"ariaDisabled":"true","rootDataState":"disabled","removeButtons":0,"menusAfterClick":0}` chips `[{포도 dataDisabled:"true"},{사과 dataDisabled:"true"}]` |
| A11 | Select defaultOpen guard | PASS | `== ITEM 11 ==` fresh reload: `{"plainAriaExpanded":"true","menuCount":1,"optionLabels":["포도","사과","오렌지","멜론"],"disabledAriaExpanded":"false","disabledAriaDisabled":"true","readonlyAriaExpanded":"false","readonlyAriaReadonly":"true"}` (m04); pick → `apple`; clicking disabled/readOnly → menus `0` each; errors/console EMPTY after the reload |
| A12 | Select searchable + focus-restore | PASS | `== ITEM 12 ==`: focus lands on search input `{"focusedIsSearchInput":true,"role":"combobox","ariaExpanded":"true","ariaControls":"_R_49eavb_","ariaAutocomplete":"list"}`; `오` filters to `["오렌지"]`; ArrowDown `{"ariaActivedescendant":"_R_49eavb_-0","activeCellLabel":"오렌지","idInsideListbox":true}`; Enter → `orange`, **`{"focusRestored":{"activeClass":"podo-select__trigger","activeElementIsStoredTrigger":true}}`** (identity pinned to `window.__selSearchTrigger`); PATH B reopen via Enter (`searchFocused:true`), type `멜`, Escape → `{"menusAfterEscape":0,"activeElementIsStoredTrigger":true,"valueUnchanged":"orange"}` |
| A13 | Select addable outside listbox | PASS | `== ITEM 13 + B4 ==`: `{"listboxChildren":[option 포도/사과/오렌지/멜론],"addInputFound":true,"addInputInsideListbox":false,"addRowParentClass":"podo-select__add"}`; add `두리안`+Enter → value/trigger `두리안`; reopen `{"optionCount":5,"durian":[{"ariaSelected":"true"}],"childRoles":["option"×5]}` |
| A14 | Select a11y routing | PASS | `== ITEM 14 ==`: `{"comboboxId":"select-labeled","comboboxRole":"combobox","labelText":"과일 선택 라벨","labelHtmlFor":"select-labeled","match":true}` |
| A15 | Select viewport flip | PASS | `== ITEM 15 RERUN ==` on the PORTAL select (`spaceBelow:90`): `{"trigTop":499,"menuTop":295,"menuBottom":493,"flippedAbove":true,"lastOptTop":442,"lastOptBottom":484,"lastOptInViewport":true}` (m05b) — first attempt used the `portal={false}` inline select which renders in-flow (no flip by design; logged) |
| A16 | Tooltip | PASS | `== ITEM 16 ==`: forced-open at load `{"forcedOpenPresent":true,"text":"항상 열린 말풍선","inBody":true,"visible":true,"position":"top"}` (still mounted at the final sweep); hover `{"count":1,"text":"임시 저장돼요","position":"top","inBody":true,"idMatch":true}` (m06) → unhover `0`; REAL keyboard focus (Shift+Tab onto the trigger) `{"activeIsTrigger":true,"tipsOnKeyboardFocus":1,"describedbyWired":true}` → Tab away `{"prevTipGone":0,"bottomFocused":true,"bottomPos":"bottom","bottomTheme":"reverse"}`; controlled `{"ctlState":"true","ctlVisibleWithoutHover":true}`→off `0`; inline `{"inlineFound":true,"insideWrap":true,"inBody":false}` |
| A17 | Toast/Toaster | PASS | `== ITEM 17 parts 1-4 ==`: 5 fired w/ max3 → `{"visibleCount":3,[{danger,role:"alert"},{info,status},{warning,status}]}` oldest 2 evicted (m07); dismiss-all → `0`; inline `{"caption":"인라인 캡션"}` X(`닫기`) → closed, unmounted; auto `{"appeared":true,"lastAliveAtMs":2642,"goneByMs":2745,"duration":2500}`; manual `{"manualAliveAt3500":true}` → X → `0`; pause-on-hover `{"expandedOnHover":"true","stillAliveAfter4sHover":1,"goneMsAfterUnhover":2736}`; custom Toaster `top-left/1200/max2`: `{"position":"top-left","cssTop":"16px","cssLeft":"16px","visibleCount":2,"titles":["안내예요","실패했어요"],"evictedOldest":true}` (m08); plain toast under duration 1200 → `{"lastAliveMs":1326,"goneMs":1429}`; swapped back `bottom-right/3000/max3` |
| A18 | Table incl. drag + defaultSelected-filtered | PASS | `== ITEM 18 / 18b ==`: initial `{"readout":"0","row0Selected":"true","row2Disabled":"true","row2CheckboxDisabled":true}`; row1 → `0,1`; disabled row click → `0,1`; select-all → `0,1,3,4`, again → `none`; drag along `td.podo-table__check` row0→row3 → `0,1,3` (disabled row 2 skipped) (m09); **`table-disdefault` (`defaultSelected={[1,2]}`, row 2 disabled)**: row1 `{dataSelected:"true",checkboxChecked:true}`, **row2 `{dataDisabled:"true",dataSelected:null,checkboxChecked:false,checkboxDisabled:true}`** — disabled index filtered out; rows 0/3 unselected |
| A19 | Field | PASS | `== ITEM 19/19b/19c ==`: wiring `{"labelFor":"_R_q2avb_-control","inputId":"_R_q2avb_-control","idMatch":true,"generatedId":true,"ariaRequired":"true","helper":true,"count":"2/10","maxLength":10}`; error `{"errorText":"이메일 형식이 아니에요","errAriaInvalid":"true","describedby":"_R_1a2avb_-error","describedbyPointsToError":true}`; Field-disabled `{"disInputDisabled":true,"fieldDataDisabled":"true","focusRefused":true,"value":""}` after real typing; explicit `{"explicitId":"custom-field-control","explicitLabelFor":"custom-field-control","match":true}`; **OR semantics** `<Field disabled><Input disabled={false}/></Field>` → `{"inputIsDisabled":true,"focusRefused":true,"valueAfterTyping":""}`; `<Field invalid><Input/></Field>` → `{"ariaInvalid":"true","wrapDataState":"invalid","invalidBorder":"1px solid rgb(242, 59, 59)"}`; **counter-controlled**: before `{"counter":"0/30","inputValue":""}` → external set (no typing) → `{"counter":"9/30","inputValue":"외부에서 넣은 값","valueLength":9}` |
| A20 | Icons E001–E009 | PASS | `== ITEMS 20 + N3 ==`: all 9 glyphs `menu E001 … search E009`, each `{fontFamily:"PodoIcons",contentLen:3}`; `{"fontStatuses":["loaded"],"fontCheck":true}` (m10) |
| A21 | Typography responsive | PASS | `== ITEM 21 ==`: 1280px `{"h1Tag":"H1","h1FontSize":"32px","bodyFontSize":"16px"}`; toggle → `landing/dark` + `data-color-scheme="dark"` → back `landing/light`; viewport 900 → `{"h1FontSizeAt900":"28px"}` (m12) → restored `32px` |
| A22 | DatePicker exhaustive | PASS | all 12 combos + placeholder/reset/Escape/outside-click-cancel/disabled-flip/keyboard grid + constrained roving/arrows/**Home-End** + **yearRange/maxDate year select** + **period year clamp** + **boundary minute** — full breakdown below |
| A23 | Editor | PASS | all 13 toolbar groups incl **cross-block color** + **image click-edit/delete** + **table context menu** + youtube + code-view live onChange + validator (REAL zod) + **A→B→A** + editor ids + height + scope — full breakdown below |
| A24 | Final console sweep | PASS | `errors`+`console` printed **nothing** at: initial open, the ITEM-11 reload, all three hiccup reloads, and the final sweep (`== ITEM 24 + N2 ==`, forced-open tooltip `{"forcedOpenTooltipStillMounted":true}`); `server.log` = Next 16.2.10 Ready banner only (quoted) |

## Checklist results — B items (round-6 checks: 3 PASS, 1 PARTIAL-FAIL)

| # | Item | Result | Evidence |
|---|---|---|---|
| B1 | Icon size + decorative spec | **PASS** | `== B1 ==` full DOM quotes: `<i data-testid="icon-sz-sm" aria-hidden="true" data-size="sm" class="podo-icon podo-icon-search"></i>` → **computed font-size `16px`**; md → **`24px`**; lg → **`32px`** (the new `.podo-icon[data-size]` CSS in this round's styles.css); `<Icon decorative={false} aria-label="검색">` → **`<i data-testid="icon-labeled" aria-label="검색" role="img" data-size="md" class="podo-icon podo-icon-search"></i>`** (role="img" + label + **NO aria-hidden**); default icon stays `<i … aria-hidden="true" data-size="md" …>` at 24px (m11) |
| B2 | Table drag released OUTSIDE | **PASS** | `== B2 ==`: state `0,1,3` → real drag from `td.podo-table__check` (row 0) with the mouseup over `h1` (page body, outside the table) → state unchanged `0,1,3` (no spurious toggle); then a NORMAL row click on row 3 → **`0,1`** (toggled off — the click was NOT swallowed), second click → **`0,1,3`** (toggled back). The previously-reported swallowed-click behavior is fixed |
| B3 | Badge token bindings | **PARTIAL-FAIL** | Consumption+override half PASSES in-browser (`== ITEM 2 + B3 ==`): themed badge computed bg `rgb(242, 59, 59)` comes from the styles.css fallback; injecting `<style>[data-testid=badge-danger]{--podo-badge-root-background:#123456;}</style>` → `{"varNow":"#123456","computedBg":"rgb(18, 52, 86)"}` (m02), removed → back to `rgb(242, 59, 59)` — the `.podo-badge` rules do consume the binding vars. **But the stated premise FAILS:** the freshly generated `app/podo/components.css` (quoted in full in the log) defines binding vars ONLY for `.podo-button`/`.podo-field`/`.podo-input` — `grep -c -- '--podo-badge' app/podo/components.css` → **0**; in-browser `getComputedStyle(badge).getPropertyValue('--podo-badge-root-background')` → **empty**. Root cause (repo, READ ONLY): `packages/cli/src/index.ts:1143` `defaultComponentDocuments` contains only `button`/`input`/`field` component documents — no badge — while `styles.css:184-188` claims the vars are "emitted per-theme by `podo build`'s components.css" |
| B4 | Flagged callback props | **PASS** | `== B4 ==` all five wired to readouts and exercised: **Select `onOptionAdd`** → payload readout **`{"value":"두리안","label":"두리안"}`** (fired on add, full option object); **Switch `onClick`** → two clicks → `{"switchOnClickCount":"2","lastCheckedFromOnCheckedChange":"false"}` (both `onClick` and `onCheckedChange` fire); **Checkbox native `onChange`** → `{"checkboxNativeOnChange":"native:true"}` (event.target.checked); **Input native `onChange`** → real typing → `{"inputNativeOnChange":"네이티브값"}`; **Textarea native `onChange`** → `{"textareaNativeOnChange":"본문 이벤트"}`; **Radio `onCheckedChange`** → `{"radioOnCheckedChange":"cbc:true"}` |

## Checklist results — N items (4/4 PASS)

| # | Item | Result | Evidence |
|---|---|---|---|
| N1 | next build + production serve + raw SSR | PASS | `########## next8 SECTION: next build ##########`: `✓ Compiled successfully in 2.4s`, `Route (app) ┌ ○ /` static; serve: curl `200`, `next-ssr-next8.html` 104,237 B. Raw-HTML quotes from THIS build: forced-open Tooltip **inline in SSR**: `id="tooltip-always-wrap"><button data-testid="tooltip-always-trigger" aria-describedby="_R_3piavb_" …><span class="podo-button__label">항상 열림 대상</span></button><div id="_R_3piavb_" role="tooltip" class="podo-tooltip" data-theme="default" data-position="top" …` + text `항상 열린 말풍선`; defaultOpen Select **menuless in SSR**: `id="select-defaultopen" role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-controls="_R_7peavb_"` — the page's ONLY `aria-expanded="true"` — with `grep -c 'podo-select__menu'` → **0**; **THREE distinct Editor ids ×1 each** (superset of the two-distinct-ids requirement): `id="podo-editor-_R_1aiavb_"`, `id="podo-editor-_R_2aiavb_"`, `id="podo-editor-_R_4qiavb_"` |
| N2 | Hydration: zero warnings | PASS | `errors`/`console` printed **nothing** at: initial load, the ITEM-11 fresh reload, all three hiccup reloads, and the final sweep — with the forced-open portal Tooltip, the defaultOpen Select and all THREE Editors mounted from first paint. Browser ids EQUAL the SSR ids: `{"ids":["podo-editor-_R_1aiavb_","podo-editor-_R_2aiavb_","podo-editor-_R_4qiavb_"],"distinct":true,"matchSSR":true}` |
| N3 | icons.css glyphs incl. check/close/search | PASS | Browser (post-hydration): `check E007`, `close E008`, `search E009` all `fontFamily:"PodoIcons"` (A20 row) and the B1 size/decorative fixtures render correctly (m10/m11); installed file quotes (logged): `.podo-icon-check::before { content: "\E007"; }`, `close → \E008`, `search → \E009` from `node_modules/podo-ui/dist/icons-assets/PodoIcons.css`; export `"./icons.css": "./dist/icons-assets/PodoIcons.css"` |
| N4 | `dist/react/index.js` "use client" | PASS | Reinstall section: `head -1 node_modules/podo-ui/dist/react/index.js` → **`"use client";`**, and that file hashes `06c2e007…` — bit-for-bit equal to the tarball entry (freshness proof above) |

### A22 breakdown — DatePicker (banners `== ITEM 22 … (next8) ==`)

| Sub-check | Result | Evidence (observed) |
|---|---|---|
| 1. instant/date (no actions) | PASS | placeholder `{"placeholderShown":"날짜 선택","cls":"podo-dp-inputPart  podo-dp-placeholder"}`; pick 7/15 → `{"readout":"2026-07-15","closed":true,"trigger":"2026-07-15"}` |
| 2. instant/date + showActions | PASS | day click → `{"pendingReadout":"none","dropdownStillOpen":true,"applyPresent":true,"triggerTemp":"2026 - 07 - 10"}`; 적용 → `{"readout":"2026-07-10","closedAfterApply":true}` |
| 3. instant/time (no actions) | PASS | inline selects `["시 선택","분 선택"]`, no dropdown, `applyPresent:false`; 14 → `14:00`, 30 → `14:30` (instant per change) |
| 4. instant/time + showActions | PASS | hour 9 → `{"applyVisible":true,"resetVisible":true,"readout":"none"}`; min 45 → temp `["9","45"]` readout `none`; 적용 → `{"readout":"09:45","actionsGone":true}` |
| 5. instant/datetime (no actions) | PASS | day 7/12 → `{"readout":"2026-07-12 none","calendarClosed":true}`; 8:20 → `2026-07-12 08:20` |
| 6. instant/datetime + showActions | PASS | day 7/18 → `{"readout":"none none","dropdownStillOpen":true}`; 16:05 → still `none none`; 적용 → `{"readout":"2026-07-18 16:05","closedAfterApply":true}` |
| 7. period/date showActions={false} | PASS | `{"grids":["2026년 7월","2026년 8월"],"applyPresent":false}`; 7/5 → `2026-07-05~none` (live), 7/20 → `{"readout":"2026-07-05~2026-07-20","closedAfterComplete":true}` |
| 8. period/date (default actions) | PASS | 7/5+7/20 → `{"readout":"none~none","dropdownStillOpen":true,"applyPresent":true,"rangeCells":14}` (m13); 적용 → committed, closed |
| 9. period/time showActions={false} | PASS | 4 selects `["시 선택","분 선택","종료 시 선택","종료 분 선택"]`; 10:15 → `10:15~none` (live), 19:50 → `10:15~19:50` |
| 10. period/time (default actions) | PASS | 9:15/18:45 → `{"pending":"none~none","temp":"9,15,18,45","applyPresent":true}`; 적용 → `{"readout":"09:15~18:45","actionsGone":true}` |
| 11. period/datetime showActions={false} | PASS | 7/3+7/25 → `{"datesReadout":"2026-07-03 none~2026-07-25 none","closedOnCompletion":true}`; times → `2026-07-03 07:30~2026-07-25 22:10` |
| 12. period/datetime (default actions) | PASS (RERUN 2) | temps `2026 - 07 - 08\|YYYY - MM - DD` → `…\|2026 - 07 - 28` pending; times 11:00/23:30 (inline selects in `#dp-period-dt` — NOT in the dropdown; first attempt logged) still pending; 적용 → **`{"readout":"2026-07-08 11:00~2026-07-28 23:30","closedAfterApply":true}`** (m14b) |
| 초기화 commits cleared value (×2) | PASS | combo-2 `{"readout":"none","closedAfterReset":true,"triggerBackToPlaceholder":"YYYY - MM - DD"}`; combo-12 `{"afterReset":"none none~none none","closedAfterReset":true}` |
| outside-click cancels pending | PASS | combo-2 pending 7/10 → click `h1` → `{"readoutStays":"none","dropdownClosed":true,"triggerBackTo":"YYYY - MM - DD"}` |
| Escape closes + refocuses trigger | PASS | `{"openAfterEscape":false,"activeTag":"BUTTON","activeClass":"podo-dp-inputPart ","isTriggerInsideDpInstant":true}` |
| disabled at mount | PASS | `{"tag":"BUTTON","disabled":true,"ariaDisabled":"true","gridOpenAfterProgClick":false}` + real click → `{"gridOpenAfterRealClick":false,"dropdowns":0}` |
| disabled flip while open (cancel semantics) | PASS (RERUN after hiccup) | committed `2026-07-10`, pending 7/15 `{"pendingTrigger":"2026 - 07 - 15","dropdownOpen":true,"applyPresent":true}`; flip → `{"gridAfterFlip":0,"applyAfterFlip":false,"onChangeCount":"0","valueUncommitted":"2026-07-10"}` with DOM `<button type="button" class="podo-dp-inputPart " aria-disabled="true" disabled="">2026 - 07 - 10</button>`; click while disabled → grid `0`; re-enable → `{"staysClosed":true,"triggerDisabledNow":false,"changesStill":"0"}` |
| keyboard grid + month boundary | PASS | roving `{"gridcellCount":35,"rovingCount":1,"rovingLabel":"2026년 7월 15일","rovingIsSelected":"true"}`; ArrowRight → `7/16` (tabindex 0); ArrowDown×2 → `7/23`→`7/30`; ArrowDown → **`{"gridLabelAfterCrossing":"2026년 8월","focusedLabel":"2026년 8월 6일","focusedIsRoving":true}`**; Enter → `{"committed":"2026-08-06","closed":true}`; Tab order `["이전 달","년도 선택","월 선택","다음 달","2026년 8월 6일"]`, `gridcellsInTabOrder:1` |
| constrained roving + arrows + all-disabled month | PASS (RERUN) | minDate 7/22 + disable[7/23], selected 7/15, today 7/21: `{"rovingCount":1,"rovingLabel":"2026년 7월 22일","selectedCell":{label:"2026년 7월 15일",ariaSelected:"true",disabled:true,tabindex:"-1"},"todayCell":{label:"2026년 7월 21일",disabled:true,tabindex:"-1"}}`; ArrowRight → `{"focusedAfterArrowRight":"2026년 7월 24일","focusedTabindex":"0","skippedCell":{label:"2026년 7월 23일",disabled:true,tabindex:"-1"}}`; 이전 달 → June `{"gridLabel":"2026년 6월","gridcells":35,"tabStops":0,"allDisabled":true}` (m15) |
| constrained Home/End | PASS | `dp-homeend` (value Wed 7/8; 7/5, 7/6, 7/11 disabled): open `{"rovingLabel":"2026년 7월 8일","disabledJulyDays":["2026년 7월 5일","2026년 7월 6일","2026년 7월 11일"]}`; **Home → `2026년 7월 7일`** (skipped disabled Sun/Mon, stayed in week, tabindex 0 moved); **End → `2026년 7월 10일`** (skipped disabled Sat inward); grid stays 7월 (m16) |
| yearRange/maxDate year select | PASS (RERUN after hiccup) | `dp-yr` (yearRange {2000,2030}, maxDate 2030-12-31, controlled 1990-06-15): open → `{"selectedYear":"1990","selectedText":"1990년","optCount":32,"firstFive":["1990년","2000년","2001년","2002년","2003년"],"lastTwo":["2029년","2030년"],"gridLabel":"1990년 6월"}` (m17); select 2030+12월 (`gridNow:"2030년 12월"`, next enabled) → 다음 달 → **`{"gridLabel":"2031년 1월","yearSelectValue":"2031","yearSelectedText":"2031년","has2031":true,"lastThree":["2029년","2030년","2031년"],"firstOpt":"2000년"}`** (view year rendered past maxDate; 1990 extra option gone) (m18) |
| period year-change clamp | PASS | `dp-reverse` reopened after commit: `{"gridLabels":["2026년 7월","2026년 8월"],"leftYearOptionsMax":"2026년"}` (left year select offers nothing beyond the right calendar — 1926…2026 quoted); 이전 달 ×7 → `["2025년 12월","2026년 8월"]`; left year select 2025→2026 → **`{"gridLabels":["2026년 8월","2026년 8월"],"leftYearSelected":"2026년","leftMonthSelected":"8월","rightGridUnchanged":true,"leftEqualsRightBoundary":true}`** (m19) |
| reverse-order datetime period | PASS | preset `none 10:00~none 18:30`; clicked LATER 7/20 first, then EARLIER 7/10 (temps auto-sorted `2026 - 07 - 10\|2026 - 07 - 20`), 적용 → **`2026-07-10 18:30~2026-07-20 10:00`** — dates sorted AND times swapped with them |
| boundary minute (committed non-step-aligned) | PASS (browser, was unit-only in next5) | `dp-boundary` (minDate 23:59, minuteStep 30, committed 23:59): readout `2026-07-15 23:59`; hour select `{"value":"23","disabledBelow23":23,"optCount":24}`; minute select `{"value":"59","options":[{v:"0",disabled},{v:"30",disabled},{v:"59",selected,enabled}]}` |
| minuteStep live carry | PASS | `dp-minstep` (minDate 10:59, step 30, committed 12:00, `minuteOptions:["0","30"]`): pick hour 10 → **`2026-07-10 11:00`** (carried past :60 and clamped into the min window) |
| controlled cross-month update | PASS (RERUN after hiccup) | `2026-07-15` → external button → `{"readoutAfterSet":"2026-11-05","trigger":"2026 - 11 - 05"}`; reopen → `{"gridLabelOnReopen":"2026년 11월","selectedCellLabel":"2026년 11월 5일"}` (m20) |

### A23 breakdown — Editor (banners `== ITEM 23 part N (next8) ==`)

Toolbar inventory quoted from DOM (19 titles = 13 groups): `실행 취소, 다시 실행, 문단 형식, 굵게, 기울임, 밑줄, 취소선, 글꼴 색상, 배경 색상, 왼쪽 정렬, 목록, 번호 목록, 구분선, 표 삽입, 링크, 이미지, 유튜브, 서식 지우기, HTML 코드보기`.

| Group | Result | Evidence |
|---|---|---|
| role/aria | PASS | `{"role":"textbox","ariaMultiline":"true","ariaLabel":"리치 텍스트 편집기","contenteditable":"true"}` |
| editor ids (B6 superset) + heights | PASS | `{"count":3,"ids":["podo-editor-_R_1aiavb_","podo-editor-_R_2aiavb_","podo-editor-_R_4qiavb_"],"distinct":true,"noneIsBare":true,"matchSSR":true}`; heights `{editor1:{computedHeight:"200px",boundingHeight:200},editor2:{"180px",180},editor3:{"120px",120}}` — explicit small height honored, no forced 200px min |
| typing | PASS | `<p>초기 내용</p>` → real keystrokes → `<p>초기 내용 이어쓴 문장</p>` |
| text-style | PASS | 굵게/기울임/밑줄/취소선 → `<p><b><i><u><strike>초기 내용 이어쓴 문장</strike></u></i></b></p>` |
| undo-redo (toolbar) | PASS | 실행 취소 → `<p>초기 내용 이어쓴 문장</p>` (style batch undone); 다시 실행 → restored `<b><i><u><strike>…`; 실행 취소 → settled plain |
| paragraph | PASS | 문단 형식 → 제목 1 → `<h1>초기 내용 이어쓴 문장</h1><p>본문줄</p>` |
| cross-block color | PASS | selection spanning h1→p (`selText:"초기 내용 이어쓴 문장\n본문줄", anchorIn:"h1", focusIn:"p"`), 66 swatches, pick `글자색 #ff0000` → **`<h1><span style="color: rgb(255, 0, 0) !important;">…</span></h1><p><span style="color: rgb(255, 0, 0) !important;">본문줄</span></p>`**, `spanInsideH1:true, spanInsideP:true, spanWrappingBlock:false` (m21) |
| repeated color restyles in place | PASS | same run re-selected, pick `#0000ff` → both spans restyled to `rgb(0, 0, 255)`, **`spanCount:2` unchanged, `nestedSpan:false`, `spanWrappingBlock:false`** |
| align | PASS | options `["왼쪽 정렬","가운데 정렬","오른쪽 정렬"]`; 가운데 정렬 → `<p style="text-align: center;">` |
| list | PASS | 목록 → `<ul><li>…</li></ul>` (`afterUl:true`); 번호 목록 → `<ol><li>…</li></ol>` quoted |
| hr | PASS | 구분선 → `<hr>` inside the li (quoted) |
| table + context menu + focus return | PASS | grid cells are `div[role=button]` (`aria-label="2×2 표 삽입"`); insert → `{"rows":2,"cellsRow0":2,"activeInEditable":true}` + `<table border="1" style="border-collapse: collapse; width: 100%; …">`; **REAL right-click** (`mouse move/down right/up right` at the td center) → `.podo-ed-tableContextMenu` with 12 items quoted (셀 배경색 ▼ … 표 삭제); `아래에 행 추가` → `{"rows":3,"readoutRowCount":3,"menuClosed":true,"activeElement":{tag:"DIV",cls:"podo-ed-editorContent"}}` (m22); second right-click → `열 삭제` → `{"rows":3,"cellsPerRow":[1,1,1],"readoutTdCount":3,"menuClosed":true,"activeInEditable":true}` |
| link | PASS | select li text → 링크 → URL input (placeholder `https://...`, native value setter) → 삽입 → `<a href="https://podoui.com" target="_blank" rel="noopener noreferrer">본문줄</a>` |
| image upload + click-edit + delete | PASS | 이미지 dialog tabs `파일 업로드`/`URL 입력`; page has 6 file inputs (3 editors × 2) — real `upload` of test-image.png into editor1's SECOND input (imageFileInputRef) → `{"previewImg":true,"fileNameShown":true}` → 삽입 → `{"imgInserted":true,"isDataUri":true,"srcHead":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgA","wrapperStyle":"text-align: left;"}`; **real click on the 1×1 img** → `{"selectionWrapperAdded":true,"popupControlsFound":["100%","75%","50%","원본","이미지 삭제","취소","적용"],"deleteBtnCount":1}` (m23); `이미지 삭제` → **`{"imgRemains":false,"wrapperRemains":false,"emptyAlignmentDivCount":0,"readoutHasImg":false}`** (alignment wrapper removed too) |
| youtube | PASS | URL input (placeholder `https://www.youtube.com/watch?v=... 또는 https://youtu.be/...`) → 삽입 → `{"iframe":{"src":"https://www.youtube.com/embed/dQw4w9WgXcQ","width":"100%","height":"100%","title":"YouTube video player","allowfullscreen":"true"}}` |
| format clear | PASS | element-spanning selection over the styled li (span + embedded wrappers quoted `before`) → 서식 지우기 → `after:"초기 내용 이어쓴 문장"`, `formattingGone:true` |
| code view (live onChange) | PASS | HTML 코드보기 → `{"codeTextareaPresent":true,"contenteditableUnmounted":true}` w/ pretty-printed value; textarea edit → `{"liveOnChange":true}` (readout updated live); 에디터로 전환 → `{"contenteditableBack":true,"domIncludesNewPara":true}` |
| validator (REAL zod) | PASS | harness passes `z.string().refine(no "금지어")` directly as `validator`; code-view edit containing 금지어 → `{"validatorFired":true,"validatorMessage":"금지어는 쓸 수 없어요","validatorClass":"podo-ed-validator"}` (m24); clean edit → `{"validatorMsg":"검증 성공","readout":"<p>깨끗한 내용</p>"}` |
| code view A→B→A | PASS | STEP 1 A emitted FROM the code view: `{taValue:"<p>AAA</p>", readout:"<p>AAA</p>"}`; STEP 2 external B while open: `{taValue:"<p>BBB\n</p>", readout:"<p>BBB</p>"}`; STEP 3 external A (identical to previously-emitted string): **`{taValue:"<p>AAA\n</p>", taRefreshedBackToA:true}`** — not swallowed by echo memory |
| external set while code view open | PASS | `{"codeViewStillOpen":true,"taValue":"<p>외부에서 바꾼 내용\n</p>","readout":"<p>외부에서 바꾼 내용</p>"}`; rich-view roundtrip `insertText` → `<p>외부에서 바꾼 내용 추가</p>` |
| Ctrl+Z scope | PASS | typed `바깥 입력 텍스트` into the outside input (focus verified), Ctrl+Z dispatched ON it → `{"outsideValue":"바깥 입력 텍스트","editorHtmlUnchanged":true,"focusedTid":"editor-outside-input"}` |
| EditorView | PASS | `{"viewClass":"podo-ed-editorView ","matchesReadout":true,"viewHasTable":true,"anchorHref":"https://podoui.com"}` (m25); the youtube iframe was verified at insertion (part 9) and later removed together with the li's formatting by the 서식-지우기 step, so it is intentionally absent from this final snapshot |

## Findings (blocking-level, carried to the structured summary)

1. **B3 (partial): `podo build` does not emit the badge binding vars it documents.** The freshly generated `app/podo/components.css` (this tarball's CLI, full file quoted in the log) contains bindings only for `.podo-button`/`.podo-field`/`.podo-input`; `grep -c -- '--podo-badge'` → 0 and the browser resolves `--podo-badge-root-background` to empty on a themed badge. `styles.css:184-188` explicitly claims these vars are "emitted per-theme by `podo build`'s components.css". Suspected repo location: `packages/cli/src/index.ts:1143` (`defaultComponentDocuments` has `button`/`input`/`field` only — no badge document). The badge rules DO consume the vars correctly (override demo works, m02), so this is a generator/spec-coverage gap, not a runtime CSS bug.

## Console / page errors (A24, N2)

- `errors` / `console` printed **nothing** (= empty output) at: initial load, the ITEM-11 fresh reload, all three hiccup reloads, and the final sweep. No hydration-mismatch or React warnings at any point — with the forced-open portal Tooltip, defaultOpen Select and all three Editors mounted from first paint.
- `server.log`: Next 16.2.10 Ready banner only (quoted post-run).
- The only external content is the YouTube embed; it produced no console message this session.

## Environmental artifacts (tooling, not app defects — all logged in place with VOID/RERUN banners)

1. **Tab resets to `about:blank` (×3):** mid flip/constrained batch, mid yearRange/boundary batch, and before the ctl-month check (`location.href` → `"about:blank"` quoted each time; banners `FLIP+CONSTRAINED BATCH VOID`, `YEARRANGE/BOUNDARY BATCH VOID`, `CTL-MONTH BATCH VOID`). Fifth round in a row for this agent-browser hiccup class. `errors`/`console` were empty around each reset; the page was reloaded and every affected check re-run cleanly (all remaining checks depend only on initial state, so later batches began with a fresh reload).
2. **`type` requires a selector** (`type <sel> <text>`); the first two B4 native-onChange attempts logged `Element not found` before the corrected calls.
3. **Inline (`portal={false}`) Select does not flip** — flip is a portal-placement feature; the first ITEM-15 run on `#select-inline` rendered in-flow below the trigger (quoted), re-run on the portal `#select-single` → flipped (m05b), matching next4/next5.
4. **Select-multi chips use `.podo-chip`** (not `.podo-select__chip`) — first chip readouts returned `[]`; corrected selector quoted under `ITEM 10 RERUN`.
5. **Period/datetime time selects render inline in the component container, not inside the dropdown** — combo-12's first attempt targeted `.podo-dp-dropdown select[aria-label="시 선택"]` (hit the year/month selects; one eval died with `Illegal invocation` on an undefined select) and committed a dates-only value; full clean rerun under `combo 12 RERUN 2` (m14b).
6. **React value tracker:** URL inputs (link/youtube) and code-view textareas were driven via the native `HTMLInputElement`/`HTMLTextAreaElement` prototype value setters + `input` events.
7. **Editor table-grid cells are `div[role=button]`** (aria-label `N×M 표 삽입`), not `<button>` — first query returned empty; corrected and logged.
8. **Six `input[type=file]` page-wide** (3 editors × 2 each); editor1's SECOND input (imageFileInputRef) was marked via `data-up-idx` and used for the real upload.
9. **Log encoding:** the wrapper `%q`-quotes argv; Korean text appears as bash `$'…'` byte escapes — use `LC_ALL=C grep -a`.

## Screenshots (`reports/next-shots/`, m-prefix, 28 files)

`m01-button-badge`, `m02-badge-override`, `m03-select-multi-4vals`, `m04-defaultopen-postmount`, `m05-select-flip` (inline no-flip), `m05b-select-flip-portal`, `m06-tooltip-hover`, `m07-toast-stack-max3`, `m08-toaster-topleft-max2`, `m09-table-drag`, `m10-icons`, `m11-icon-sizes`, `m12-responsive-900`, `m13-period-pending`, `m14-period-dt-applied`, `m14b-period-dt-full`, `m15-constrained-june`, `m16-homeend`, `m17-yearrange-1990`, `m18-yearrange-2031`, `m19-period-clamp`, `m20-ctl-month-november`, `m21-editor-crossblock-color`, `m22-table-rowadded`, `m23-image-edit-popup`, `m24-validator-error`, `m25-editor-final`, `m26-final-page`.

## Session hygiene

Server killed (`kill $(cat server.pid)`, pid 74473; post-kill curl → `000` connection refused) and browser session `next8` closed (`✓ Browser closed`) — logged under `== SESSION HYGIENE (next8) ==`. `start.sh` updated to describe the next8 rebuild (tarball sha 634f24ad…) and the kitchen-sink extensions.

---
---

# History appendix — earlier rounds (SUPERSEDED by the next8 report above; kept verbatim, including their own nested history)

# Podo UI v2 — Next.js runtime DEFINITIVE FINAL verification, round E (2026-07-20, session `next5`)

**This report supersedes every earlier Next-runtime report. Every current-fact claim below cites output produced in THIS session (`next5`) against the NEWEST artifact. Earlier rounds (including the previous "definitive" `next4` round) are kept verbatim in the History appendix and are NOT current evidence.**

- Artifact under test: `podo-ui-2.0.4.tgz`, **sha1 `02fbd90ecc348460d5c8883e14e69af1578f0dcc`** — verified as this session's first logged command (`next-commands.log` header `=== DEFINITIVE FINAL VERIFICATION session next5 tarball 02fbd90… ===`) and re-verified at the top of the reinstall section.
- Clean reinstall this session: `rm -rf node_modules/podo-ui package-lock.json && npm install ../../podo-ui-2.0.4.tgz`. **Freshness proof (bit-for-bit):** `tar -xOf podo-ui-2.0.4.tgz package/dist/react/index.js | shasum` = `61511ca1b24b6a55fbeef8c419c0ce01b1ac6cb5` = `shasum node_modules/podo-ui/dist/react/index.js`; same for `styles.css` (`55d4f4e3897cf7b82714db3609f622f577753fde` both sides). (Log section `########## next5 SECTION: clean reinstall ##########`.)
- Repo gate (READ ONLY, not re-run here): `pnpm check` green — `Test Files  23 passed (23)`, `Tests  261 passed | 2 skipped (263)` (`scratchpad/check-final.log:73-74`, re-quoted in this session's log under the B4/B9 citations banner).
- Harness: `harness/next` (Next.js **16.2.10**, Turbopack, react/react-dom 19.2), production `next build` + `next start -p 5212 -H 127.0.0.1`. Podo assets regenerated **from this tarball's CLI** this session (`npx podo build --out-dir app/podo --force` → `[podo:build] Generated 16 files in app/podo.`). The kitchen sink was extended BEFORE the build for the round-E checks (B1/B2/B3/B5 DatePicker instances, B6/B7 second Editor with `zod` validator + external-set button, B8 Field-OR instances); the installed package was never touched after the reinstall and there were **no mid-session harness rebuilds** — every browser item ran on the single final build.
- Browser: every step via `npx agent-browser --session next5` (fresh session; **552 wrapper-logged browser commands**), driven through `harness/next/ab-next5.sh` which echoes the FULL argv (entire eval JS included) into `reports/next-commands.log` before running and appends the full output.
- Raw SSR snapshot: `reports/next-ssr-next5.html` (93,903 B, captured from the final build before the browser pass).
- Screenshots: `reports/next-shots/h01`–`h17` (h-prefix = this session).
- Verdict: **37/37 checklist items PASS** (A: 24 re-run items, B1–B9 new round-4 checks, N1–N4). Zero unexplained console/page errors; zero hydration warnings.

## How to reproduce

```sh
cd /private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next
# full rebuild steps documented in start.sh (npm i tarball sha1 02fbd90…, podo build --force, .ts cleanup, next build)
./start.sh                                   # next start -p 5212 -H 127.0.0.1, pid in server.pid
curl -s http://127.0.0.1:5212/ | grep -c 'id="podo-editor-'   # → 2 (distinct SSR editor ids)
kill $(cat server.pid)
```

Log sections in `reports/next-commands.log` are grep-able by banner (`== ITEM 9: Select single (next5) ==`, `== B1 RERUN: … ==` etc.; the log contains bash `$'…'` byte-escapes from `%q`-quoting Korean argv — use `LC_ALL=C grep -a`).

## Checklist results — A items (24/24)

Every row was exercised in the real browser against the production server. "Evidence" quotes observed output recorded in `reports/next-commands.log` under the named `(next5)` banner.

| # | Item | Result | Evidence (observed output, log banner) |
|---|---|---|---|
| A1 | Button incl. keyboard | PASS | `== ITEM 1 ==`: clicks `1`→`2` (Enter)→`3` (Space), presses `3`; disabled `{"disabledAttr":true,"ariaDisabled":"true"}` → counter `0`; variants `[{저장하기 solid-primary md},{비활성 버튼 solid-danger md},{외곽 위험 lg outline-danger lg},{보조 xs solid-assistive xs}]` (h01) |
| A2 | Badge computed styles | PASS | `== ITEM 2 ==`: `badge-natural {bg:"rgb(62, 66, 75)",color:"rgb(249, 249, 249)"}` vs `badge-red {bg:"rgb(254, 241, 241)",color:"rgb(242, 59, 59)"}` (light bg/red text) vs `badge-danger {bg:"rgb(242, 59, 59)"}`, `badge-info {bg:"rgb(0, 149, 255)"}`; dot `{dot:"true",text:"",w:6,h:6,bg:"rgb(62, 168, 86)"}` |
| A3 | Chip | PASS | `== ITEM 3 ==` (+ IIFE rerun banner): toggle `{"sel":"true","state":"selected"}`→`false`; controlled `{"ctl":"true","aria":"true"}`; prop-wins `{"dataState":null,"ariaPressed":"false","attempt":"true","presses":"1"}`; label click → `chip-removed false`, X (`aria-label=제거`) → `{"removed":"true","stillMounted":false}`; disabled removable `{"rootTag":"SPAN","dataDisabled":"true","dataRemovable":"true","dataState":"selected","xDisabled":true,"xAriaDisabled":"true","xTabIndex":-1}` + X `.click()` → removes `0`, `chipStillMounted:true` |
| A4 | Switch disabled no-op | PASS | `== ITEMS 4-6 ==`: `{"state":"on","ariaChecked":"true"}`→`off`; disabled `{"disabled":true,"ariaDisabled":"true"}`, counter `0` |
| A5 | Checkbox (mixed) | PASS | `== ITEMS 4-6 ==`: `checked`; `{"indeterminateProp":true,"dataState":"indeterminate"}`, a11y snapshot `checkbox "전체 선택" [checked=mixed]`; disabled `.click()` → counter `0` |
| A6 | Radio disabled no-op | PASS | `== ITEMS 4-6 ==`: `grape`→`apple`; disabled `{"disabled":true,"checked":false,"value":"apple"}`, counter `0` |
| A7 | Input incl. disabled/readOnly | PASS | `== ITEM 7 ==`: controlled `포도조아` (value+readout); uncontrolled `초기값 추가`; disabled `{"activeIsDisabledInput":false,"disabledValue":"고정값"}` after real typing; readOnly `{"roWrapDataState":"read-only","roWrapBorder":"1px solid rgba(0, 0, 0, 0)","roWrapBackground":"rgba(0, 0, 0, 0)"}` vs normal `1px solid rgb(228, 228, 231)` + white; invalid `{"invAriaInvalid":"true","invWrapDataState":"invalid"}` |
| A8 | Textarea incl. countMax cap | PASS | `== ITEM 8 ==`: `여러 줄 내용`; 12 chars into countMax=10 → `{"value":"열두글자를넘겨보려는","valueLen":10,"maxLength":10,"count":"10/10"}`; disabled `{"focusWentToDisabled":false,"dDataState":"disabled"}`; readOnly `read-only` + transparent chrome |
| A9 | Select single | PASS | `== ITEM 9 ==`: pick 사과 → `{"value":"apple","menus":0,"trigger":"사과"}`; ArrowDown×3 `{"activedescendant":"_R_peavb_-2","activeLabel":"오렌지"}` → Enter → `orange`; outside click 1→0 value unchanged; controlled `{"trigger":"사과","ctlValue":"apple","attempt":"melon"}` (prop wins) → external `{"trigger":"오렌지","ctlValue":"orange"}`; disabled `{"ariaDisabled":"true","tabIndex":-1,"dataState":"disabled","menus":0,"changes":"0"}` |
| A10 | Select multi | PASS | `== ITEM 10 ==` + 2 rerun banners: per-click toggle → `{"values":"grape,apple,orange,melon","menuStillOpen":1}` (h03); maxChips `{"chips":["포도","사과","오렌지"],"more":"+1","moreAria":"외 1개 선택됨"}`; X `사과 제거` → `grape,orange,melon`; clear (`모두 해제`) → `none`; controlled multi (owned-listbox click) `{"value":"grape,melon","attempt":"grape,melon,apple","chips":["포도","멜론"]}`; readOnly `{"ariaReadonly":"true","chips":["포도","사과"],"removeButtons":0,"chevron":0,"menusAfterClick":0}`; disabled `{"ariaDisabled":"true","rootDataState":"disabled","chips":[{포도 dataDisabled:"true"},{사과 dataDisabled:"true"}],"removeButtons":0,"menusAfterClick":0}` |
| A11 | Select defaultOpen guard | PASS | `== ITEM 11 ==` fresh reload: `{"plainAriaExpanded":"true","menuCount":1,"optionLabels":["포도","사과","오렌지","멜론"],"disabledAriaExpanded":"false","disabledAriaDisabled":"true","readonlyAriaExpanded":"false","readonlyAriaReadonly":"true"}` (h05); pick → `apple`; clicking disabled/readOnly → menus `0` each |
| A12 | Select searchable | PASS | `== ITEM 12 ==`: typing `오` → `{"focusedIsSearchInput":true,"role":"combobox","ariaExpanded":"true","ariaControls":"_R_49eavb_","ariaAutocomplete":"list","filtered":["오렌지"]}`; ArrowDown → `{"ariaActivedescendant":"_R_49eavb_-0","activeCellLabel":"오렌지","idInsideListbox":true}`; Enter → `orange`, menus 0, trigger `오렌지` |
| A13 | Select addable outside listbox | PASS | `== ITEM 13 ==`: `{"listboxChildren":[option×4],"addInputFound":true,"addInputInsideListbox":false,"addRowParentClass":"podo-select__add"}`; add `두리안`+Enter → value/trigger `두리안`; reopen 5 options, `두리안 aria-selected "true"`, `childRoles:["option"×5]` |
| A14 | Select a11y routing | PASS | `== ITEM 14 ==`: `{"comboboxId":"select-labeled","comboboxRole":"combobox","labelText":"과일 선택 라벨","labelHtmlFor":"select-labeled","match":true}` |
| A15 | Select viewport flip | PASS | `== ITEM 15 ==`: `spaceBelow:90` → `{"trigTop":499,"menuTop":295,"menuBottom":493,"flippedAbove":true,"lastOptTop":442,"lastOptBottom":484,"lastOptInViewport":true}` (h04) |
| A16 | Tooltip | PASS | `== ITEM 16 ==` + focus-retry banner: forced-open at load `{"forcedOpenPresent":true,"text":"항상 열린 말풍선","inBody":true,"visible":true,"position":"top"}` (still mounted at final sweep); hover `{"count":1,"text":"임시 저장돼요","position":"top","inBody":true,"idMatch":true}` (h06) → unhover `0`; **keyboard focus** (real Tab) `{"activeIsTrigger":true,"tipsOnKeyboardFocus":1,"describedbyWired":true}` → Tab away `0` (programmatic `.focus()` shows no bubble — noted below); bottom `{"bottomPos":"bottom","bottomTheme":"reverse"}`; controlled `{"ctlState":"true","ctlVisibleWithoutHover":true}`→off `0`; inline `{"insideWrap":true,"inBody":false}` |
| A17 | Toast/Toaster | PASS | `== ITEM 17 parts 1-4 ==`: 5 fired w/ max3 → `{"visibleCount":3,[{warning,status},{info,status},{danger,role:"alert"}]}` oldest 2 evicted (h07); dismiss-all → `0`; inline `{"caption":"인라인 캡션"}` X(`닫기`) → `toastClosed true`; auto in-page timing `{"appeared":true,"lastAliveAtMs":2595,"goneByMs":2697}` (duration 2500); manual `{"manualAliveAt3500":true}` → X → closed; pause-on-hover `{"expandedOnHover":"true","stillAliveAfter4sHover":1}` → unhover `{"goneMsAfterUnhover":612}` (remaining time resumed); custom Toaster `top-left/1200/max2`: `{"position":"top-left","cssTop":"16px","cssLeft":"16px","visibleCount":2,"titles":["성공했어요성공 캡션","실패했어요"],"evictedOldest":true}` (h08); plain toast under duration 1200 → `{"lastAliveMs":1355,"goneMs":1438}`; swapped back `bottom-right/3000/max3` |
| A18 | Table incl. drag | PASS | `== ITEM 18 ==` + 2 drag banners: initial `{"readout":"0","row0Selected":"true","row2Disabled":"true","row2CheckboxDisabled":true}`; row1 → `0,1`; disabled row → `0,1`; select-all → `0,1,3,4`, again → `none`; **drag along `td.podo-table__check` col row0→row3** → `0,1,3` (disabled row 2 skipped) (h09). First drag attempt on data-cells column → no-op (drag anchors on the checkbox column per component contract; logged) |
| A19 | Field wiring | PASS | `== ITEM 19 ==`: `{"labelFor":"_R_puavb_-control","inputId":"_R_puavb_-control","idMatch":true,"generatedId":true,"ariaRequired":"true","helper":true,"count":"2/10","maxLength":10}`; error `{"errorText":"이메일 형식이 아니에요","errAriaInvalid":"true","describedby":"_R_19uavb_-error","describedbyPointsToError":true}`; disabled `{"disInputDisabled":true,"fieldDataDisabled":"true","focusRefused":true,"value":""}` after real typing; explicit `{"explicitId":"custom-field-control","explicitLabelFor":"custom-field-control","match":true}` |
| A20 | Icons E001–E009 | PASS | `== ITEMS 20 + N3 ==`: all 9 glyphs `menu E001 … search E009`, each `{fontFamily:"PodoIcons",contentLen:3}`; `{"fontStatuses":["loaded"],"fontCheck":true}` (h10) |
| A21 | Typography responsive | PASS | `== ITEM 21 ==`: 1280px `{"h1Tag":"H1","h1FontSize":"32px","bodyFontSize":"16px"}`; toggle → `landing/dark` + `data-color-scheme="dark"` → back `landing/light`; viewport 900 → `{"h1FontSizeAt900":"28px"}` (h11) → restored `32px` |
| A22 | DatePicker exhaustive | PASS | all 12 combos + placeholder/reset/Escape/outside-click-cancel/disabled-at-mount/minuteStep + roving grid keyboard — breakdown below |
| A23 | Editor | PASS | all 13 toolbar groups + scope + live code-view — breakdown below |
| A24 | Final console sweep | PASS | `errors`+`console` printed **nothing** at: initial open, ITEM-11 reload, both hiccup reloads, and the final sweep (`== ITEM 24 + N2 ==`); `server.log` = Ready banner only (quoted) |

## Checklist results — B items (9/9, new round-4 checks)

| # | Item | Result | Evidence |
|---|---|---|---|
| B1 | DatePicker disabled-flip-while-open | PASS (browser) | `== B1 RERUN ==`: committed `2026-07-10`, pending temp after 7/15 click `{"pendingTrigger":"2026 - 07 - 15","dropdownOpen":true,"applyPresent":true}`; flip disabled=true → `{"gridAfterFlip":0,"applyAfterFlip":false,"onChangeCount":"0","valueUncommitted":"2026-07-10"}` with DOM quote `<button type="button" class="podo-dp-inputPart " aria-disabled="true" disabled="">2026 - 07 - 10</button>` (cancel semantics — temp discarded, no commit); click while disabled → grid `0`; re-enable → `{"staysClosed":true,"triggerDisabledNow":false,"changesStill":"0"}`, DOM `aria-disabled="false"`. Mirrors `datepicker.test.tsx:388` "closes an open dropdown with cancel semantics when disabled flips true" |
| B2 | Constrained calendar keyboard | PASS (browser) | `== B2 RERUN ==` (minDate 2026-07-22, disable [7/23], selected 7/15, today 7/20): roving skips BOTH disabled candidates → `{"rovingCount":1,"rovingLabel":"2026년 7월 22일","selectedCell":{"ariaSelected":"true","disabled":true,"tabindex":"-1"},"todayCell":{"disabled":true,"tabindex":"-1"}}`; ArrowRight skips disabled 7/23 → `{"focusedAfterArrowRight":"2026년 7월 24일","focusedTabindex":"0","skippedCell":{"disabled":true,"tabindex":"-1"}}`; 이전 달 → fully-disabled June `{"gridLabel":"2026년 6월","gridcells":35,"tabStops":0,"allDisabled":true}` (h14). Mirrors `datepicker.test.tsx:423/447/473` |
| B3 | Reverse-order datetime period | PASS (browser) | `== B3 RERUN ==` (pre-set times start 10:00 / end 18:30): clicked LATER 7/20 first, then EARLIER 7/10, 적용 → readout **`2026-07-10 18:30~2026-07-20 10:00`**, triggers `["2026 - 07 - 10","2026 - 07 - 20"]` — dates auto-sorted AND both times kept, swapped (start time became endTime and vice versa). Mirrors `datepicker.test.tsx:494` |
| B4 | Step-clamp vs minDate | PASS (unit-covered + live boundary) | Unit tests (quoted in log): `datepicker.test.tsx:189` **"clamps the 23:59 carry boundary to exactly the min time (23:59)"** and `:213` **"clamps a step-carried time back into the minDate window (23:45 min)"** — the 23:xx boundary itself is NOT reachable through the harness UI (its picker has minDate 10:59), so those two exact cases rest on the unit tests. The harness-reachable min-boundary case ran live: `== ITEM 22 + B4 live ==` minuteStep=30 + minDate `{10:59}` → `{"minuteOptions":["0","30"]}`, picking hour 10 → committed `2026-07-10 11:00` (carried past :60 and clamped into the min window) |
| B5 | Controlled cross-month update | PASS (browser) | `== B5 RERUN ==`: `2026-07-15` → external button → `{"readoutAfterSet":"2026-11-05","trigger":"2026 - 11 - 05"}`; reopen → `{"gridLabelOnReopen":"2026년 11월","selectedCellLabel":"2026년 11월 5일"}` (h15). Mirrors `datepicker.test.tsx:527` |
| B6 | Two Editors mounted | PASS (browser) | `== B6 RERUN ==`: `{"count":2,"ids":["podo-editor-_R_1aeavb_","podo-editor-_R_2aeavb_"],"distinct":true,"noneIsBare":true,"bothContenteditable":true,"wraps":["editor1","editor2"]}` — same ids as the raw SSR HTML (stable across hydration). Both function: editor 1 exercised across all 13 groups; editor 2 code-view edits + rich-view `insertText` → readout `<p>외부에서 바꾼 내용 추가</p>` |
| B7 | Editor validator prop | PASS (browser) | `== B7 ==` + addendum: harness passes `z.string().refine(no "금지어")`; code-view edit containing 금지어 → `{"validatorFired":true,"validatorMessage":"금지어는 쓸 수 없어요","validatorClass":"podo-ed-validator"}`; clean edit → message cleared and same-eval capture shows `{"validatorSuccessMsg":"검증 성공"}`; external controlled set while code view open → `{"codeViewStillOpen":true,"textareaRefreshed":true,"textareaValue":"<p>외부에서 바꾼 내용\n</p>"}` |
| B8 | Field OR semantics | PASS (browser) | `== ITEM 19 ==`: `<Field disabled><Input disabled={false}/></Field>` → `{"inputIsDisabled":true,"focusRefused":true,"valueAfterTyping":"","fieldDataDisabled":"true"}` (real typing attempt failed — Field wins the OR); `<Field invalid><Input/></Field>` (no consumer invalid prop) → `{"ariaInvalid":"true","wrapDataState":"invalid","invalidBorder":"1px solid rgb(242, 59, 59)"}` vs normal `1px solid rgb(228, 228, 231)` |
| B9 | Chip ref | PASS (unit-covered) | Not browser-reachable (React refs are not observable from the DOM). Covered by `index.test.tsx:168` **"forwards the ref to the span root in removable mode and the button otherwise"** — removable chip ref receives the `span.podo-chip` root (`data-removable="true"`), toggle chip ref the `button.podo-chip` root (quoted in log under the citations banner) |

## Checklist results — N items (4/4)

| # | Item | Result | Evidence |
|---|---|---|---|
| N1 | next build + production serve + raw SSR | PASS | Log section `########## next5 SECTION: podo build regen + next build ##########`: `✓ Compiled successfully in 2.4s` … `Route (app) ┌ ○ /` static; serve section: curl `200`, `next-ssr-next5.html` 93,903 B. Raw-HTML quotes: forced-open Tooltip **inline**: `id="tooltip-always-wrap"><button data-testid="tooltip-always-trigger" aria-describedby="_R_3piavb_" …><span class="podo-button__label">항상 열림 대상</span></button><div id="_R_3piavb_" role="tooltip" class="podo…` + text `항상 열린 말풍선`; defaultOpen Select w/o menu: `id="select-defaultopen" role="combobox" aria-expanded="true" aria-haspopup="listbox" aria-controls="_R_79eavb_"` with `podo-select__menu` count **0**; TWO Editors with DISTINCT ids in the raw HTML (SSR duplicate-id fix): **`id="podo-editor-_R_1aeavb_"` ×1 and `id="podo-editor-_R_2aeavb_"` ×1** |
| N2 | Hydration | PASS | `errors`/`console` printed nothing at initial load, after the ITEM-11 reload, after both hiccup reloads, and at the final sweep — with the forced-open portal Tooltip, the defaultOpen Select AND both Editors mounted from first paint; browser ids equal SSR ids (B6 quote); forced-open tooltip re-verified mounted at the final sweep (`{"forcedOpenTooltipStillMounted":true}`) |
| N3 | icons.css glyphs incl. check/close/search | PASS | Browser: `check E007`, `close E008`, `search E009` all `fontFamily:"PodoIcons"` (A20 row); installed file quote (logged): `podo-icon-check::before { content: "\E007"; }`, `close → \E008`, `search → \E009` from `node_modules/podo-ui/dist/icons-assets/PodoIcons.css`; export `"./icons.css": "./dist/icons-assets/PodoIcons.css"` |
| N4 | `dist/react/index.js` "use client" | PASS | Reinstall section quotes `head -1` of the freshly installed files: `dist/react/index.js` → `"use client";` (also `datepicker.js`, `editor/index.js`, `editor/view.js`); `index.js` sha1 equals the tarball entry bit-for-bit (freshness proof above) |

### A22 breakdown — DatePicker (banners `== ITEM 22 … (next5) ==`)

| Sub-check | Result | Evidence (observed) |
|---|---|---|
| 1. instant/date (no actions) | PASS | placeholder prop `{"placeholderShown":"날짜 선택","cls":"podo-dp-inputPart  podo-dp-placeholder"}` (also in raw SSR); pick 7/15 → `{"readout":"2026-07-15","closed":true,"trigger":"2026-07-15"}` |
| 2. instant/date + showActions | PASS | day click → `{"pendingReadout":"none","dropdownStillOpen":true,"applyPresent":true,"triggerTemp":"2026 - 07 - 10"}`; 적용 → `{"readout":"2026-07-10","closedAfterApply":true}` |
| 3. instant/time (no actions) | PASS | inline selects `["시 선택","분 선택"]`, no dropdown, `applyPresent:false`; 14 → `14:00`, 30 → `14:30` (instant per change) |
| 4. instant/time + showActions | PASS | hour 9 → `{"applyVisible":true,"resetVisible":true,"readout":"none"}`; min 45 → temp `9,45` readout `none`; 적용 → `{"readout":"09:45","actionsGone":true}` |
| 5. instant/datetime (no actions) | PASS | day 7/12 → `{"readout":"2026-07-12 none","calendarClosed":true}`; 8:20 → `2026-07-12 08:20` |
| 6. instant/datetime + showActions | PASS | day 7/18 → `{"readout":"none none","dropdownStillOpen":true}`; 16:05 → still `none none`; 적용 → `{"readout":"2026-07-18 16:05","closedAfterApply":true}` |
| 7. period/date showActions={false} | PASS | `{"grids":["2026년 7월","2026년 8월"],"applyPresent":false}`; 7/5 → `2026-07-05~none` (live), 7/20 → `{"readout":"2026-07-05~2026-07-20","closedAfterComplete":true}` |
| 8. period/date (default actions) | PASS | 7/5+7/20 → `{"readout":"none~none","dropdownStillOpen":true,"applyPresent":true,"rangeCells":14}` (h12); 적용 → committed, closed |
| 9. period/time showActions={false} | PASS | 4 selects `["시 선택","분 선택","종료 시 선택","종료 분 선택"]`; 10:15 → `10:15~none` (live), 19:50 → `10:15~19:50` |
| 10. period/time (default actions) | PASS | 9:15/18:45 → `{"readout":"none~none","displayedTemp":"9,15,18,45","applyPresent":true}`; 적용 → `{"readout":"09:15~18:45","actionsGone":true}` |
| 11. period/datetime showActions={false} | PASS | 7/3+7/25 → `{"readout":"2026-07-03 none~2026-07-25 none","closedOnCompletion":true}`; times → `2026-07-03 07:30~2026-07-25 22:10` |
| 12. period/datetime (default actions) | PASS | 7/8 → temp `2026 - 07 - 08|YYYY - MM - DD` readout pending; 7/28 → temp `…|2026 - 07 - 28` still pending; 11:00/23:30 still pending; 적용 → `{"readout":"2026-07-08 11:00~2026-07-28 23:30","closedAfterApply":true}` (h13) |
| 초기화 commits cleared value | PASS twice | combo-2 instance `{"readout":"none","closedAfterReset":true,"triggerBackToPlaceholder":"YYYY - MM - DD"}`; combo-12 instance `{"afterReset":"none none~none none","closedAfterReset":true}` |
| outside-click cancels pending dropdown | PASS | combo-2 pending 7/10 → click `h1` → `{"readoutStays":"none","dropdownClosed":true,"triggerBackTo":"YYYY - MM - DD"}` |
| Escape closes + refocuses trigger | PASS | `{"openAfterEscape":false,"activeTag":"BUTTON","activeClass":"podo-dp-inputPart ","isTriggerInsideDpInstant":true}` |
| disabled at mount | PASS | `{"tag":"BUTTON","disabled":true,"ariaDisabled":"true","gridOpenAfterProgClick":false}` + real click → `{"gridOpenAfterRealClick":false,"dropdowns":0}` |
| minuteStep boundary (B4 live part) | PASS | quoted in B4 row |
| keyboard grid | PASS | roving `{"gridcellCount":35,"rovingCount":1,"rovingLabel":"2026년 7월 15일"}` (= selected day); ArrowRight → `7/16` (`tabindex "0"`); ArrowDown → `7/23` → `7/30`; **month boundary** ArrowDown → `{"gridLabelAfterCrossing":"2026년 8월","focusedLabel":"2026년 8월 6일","focusedIsRoving":true}`; Enter → `{"committed":"2026-08-06","closed":true}`; Tab order: dropdown tabbables `["이전 달","년도 선택","월 선택","다음 달","2026년 8월 6일"]`, `gridcellsInTabOrder:1` |

### A23 breakdown — Editor (banners `== ITEM 23 … (next5) ==`)

Toolbar inventory quoted from DOM: `실행 취소, 다시 실행, 문단 형식, 굵게, 기울임, 밑줄, 취소선, 글꼴 색상, 배경 색상, 왼쪽 정렬, 목록, 번호 목록, 구분선, 표 삽입, 링크, 이미지, 유튜브, 서식 지우기, HTML 코드보기` — all 13 `ToolbarItem` groups present.

| Group | Result | Evidence |
|---|---|---|
| role/aria | PASS | `{"role":"textbox","ariaMultiline":"true","ariaLabel":"리치 텍스트 편집기","contenteditable":"true"}` |
| typing | PASS | `<p>초기 내용</p>` → real keystrokes → `<p>초기 내용 이어쓴 문장</p>` |
| text-style | PASS | successive `<b>` → `<b><i>` → `<b><i><u>` → `<b><i><u><strike>초기 내용 이어쓴 문장</strike></u></i></b>` (readouts one tick stale per eval; settled state re-read and quoted) |
| undo-redo (toolbar) | PASS | 실행 취소 → strike removed; 다시 실행 → restored; 실행 취소 → settled `<p><b><i><u>초기 내용 이어쓴 문장</u></i></b></p>` |
| paragraph | PASS | dropdown options quoted: `제목 1, 제목 2, 제목 3, 본문, P1, P2, P3, P3 Semibold, P4, P4 Semibold, P5, P5 Semibold` (12); 제목 1 → `<h1><b><i><u>…` |
| color | PASS | palette 66 `podo-ed-colorButton`s; first swatch `rgb(255, 0, 0)` → `<span style="color: #ff0000 !important;">` |
| align | PASS | icon-only option buttons w/ titles `["왼쪽 정렬","가운데 정렬","오른쪽 정렬"]`; 가운데 정렬 → `<div style="text-align: center;">` around the li content |
| list | PASS | 목록 → `<ul><li>…</li></ul>`; 번호 목록 → `<ol><li>…</li></ol>` |
| hr | PASS | 구분선 → `<hr>` appended inside the li |
| table | PASS | `podo-ed-tableGrid` 10×10 (10 rows × 10 cells); cell [1][1] → `<table border="1" style="border-collapse: collapse; width: 100%; …">` with `tdCount:4` |
| link | PASS | select text → 링크 → URL input (placeholder `https://...`) via **native value setter** → 삽입 → `<a href="https://podoui.com" target="_blank" rel="noopener noreferrer">초기 내용 이어쓴 문장</a>` |
| image (real file upload) | PASS | 이미지 dropdown tabs `파일 업로드`/`URL 입력`; `agent-browser upload` of the real PNG into the **second** `input[type=file]` (imageFileInputRef) → preview `test-image.png`, preview img `data:` URI → 삽입 → `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB…` |
| youtube | PASS | URL input (placeholder `https://www.youtube.com/watch?v=... 또는 https://youtu.be/...`) → 삽입 → `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allowfullscreen="true" …` |
| format (clear) | PASS | code-view-added `<p><b>코드뷰 추가 문단</b></p>` + element-spanning selection → 서식 지우기 → `<p>코드뷰 추가 문단</p>` |
| code (live onChange) | PASS | HTML 코드보기 → `textarea.podo-ed-codeEditor` w/ pretty-printed HTML, contenteditable **unmounted**; textarea edit → `{"readoutIncludesNewParaLive":true}` (onChange fired live); 에디터로 전환 → `{"contenteditableBack":true,"domIncludesNewPara":true}` |
| Ctrl+Z scope | PASS | typed `바깥 입력 텍스트` into `[data-testid=editor-outside-input]` (focus verified); ctrl+z KeyboardEvent dispatched ON the outside input (bubbles) → `{"outsideValue":"바깥 입력 텍스트","editorDomStillHasClearedPara":true,"focusedTid":"editor-outside-input"}` — the editor history (which held the format-clear + style actions) did NOT fire |
| EditorView | PASS | `{"viewClass":"podo-ed-editorView ","matchesReadout":true,"viewHasTable":true,"anchorHref":"https://podoui.com","viewHasIframe":true,"viewHasImg":true}` (h16) |

## Console / page errors (A24, N2)

- `errors` / `console` printed **nothing** (= empty) at: initial load, the ITEM-11 fresh reload, both hiccup reloads, and the final sweep. No hydration-mismatch or React warnings at any point — with the forced-open portal Tooltip, defaultOpen Select and BOTH Editors mounted from first paint.
- `server.log`: Next 16.2.10 Ready banner only (quoted in log, post-run).
- The only external content is the YouTube iframe embed; it produced no console message this session.

## Environmental artifacts (tooling, not app defects — all logged in place with VOID/RERUN banners)

1. **Tab resets to `about:blank` (twice):** once after the refused dp-flip-toggle click batch, once between the B5 batch and the Editor batch (`location.href` → `"about:blank"` quoted both times). Fourth round in a row this agent-browser hiccup class appeared. `errors`/`console` were empty before and after each reset; the page was reloaded and every affected check re-run cleanly (banners `B1/B2/B3/B5 BATCH VOID`, `EDITOR BATCH VOID`).
2. **Eval scope reuse:** agent-browser evals share a JS scope per page — a second top-level `const c` threw `Identifier 'c' has already been declared`. All subsequent evals wrapped in IIFEs; the one affected chip check re-ran cleanly.
3. **Same-tick DOM reads:** React commits after the event tick, so readouts read in the same eval as a `.click()` are one tick stale (visible in the Editor text-style sequence — each eval returned the pre-click HTML). Settled states were re-read in follow-up evals and quoted.
4. **Same-tick multi-clicks:** clicking 4 multi-select options inside ONE eval raced the re-render (only the last registered; and a follow-up option click landed in a stale leftover menu, toggling `select-multi` to `apple`). Re-run with per-click evals and with the target listbox resolved via the trigger's `aria-controls` (banners `ITEM 10 RERUN`/`RERUN 2`).
5. **React value tracker:** setting `input.value` directly + dispatching `input` does NOT reach React state (value tracker); the first link/youtube 삽입 clicks were no-ops with empty URL state. Re-run using the native `HTMLInputElement`/`HTMLTextAreaElement` prototype value setters — inserts then succeeded (banner `ITEM 23 RETRY: link + youtube with native value setter`).
6. **Geometry/selector misses (logged honestly):** (a) dp-flip toggle button covered by the open dropdown → agent-browser refused the real click; re-run clicking the harness button via eval `.click()` (still a real React event, as proven by the chip `onPress` counters). (b) First table drag ran along the data-cell column → no-op; the drag contract anchors on `td.podo-table__check` (`index.tsx` pointer handlers) — re-run there → `0,1,3`. (c) Align/paragraph dropdown options are icon-only/`title`-keyed — textContent lookups failed before the `title`-based retry. (d) The image dialog exposes two sibling `input[type=file]`s; the second (imageFileInputRef) is the correct target. (e) Programmatic `.focus()` does not raise the Tooltip bubble; real keyboard focus (Tab) does — the keyboard path is the a11y-relevant one and is what the evidence quotes.
7. **Log encoding:** the wrapper `%q`-quotes argv; Korean text appears as bash `$'…'` byte escapes — use `LC_ALL=C grep -a`.

## Screenshots (`reports/next-shots/`, h-prefix)

`h01-button-badge`, `h02-select-multi-open`, `h03-select-multi-4chips`, `h04-select-flip`, `h05-defaultopen-postmount`, `h06-tooltip-hover`, `h07-toast-stack-max3`, `h08-toaster-topleft-max2`, `h09-table-drag`, `h10-icons`, `h11-responsive-900`, `h12-period-pending`, `h13-period-dt-applied`, `h14-constrained-june-disabled`, `h15-ctl-month-november`, `h16-editor-final`, `h17-final-page`.

## Session hygiene

Server killed (`kill $(cat server.pid)`, pid 58152; post-kill curl → `000`/refused) and browser session `next5` closed (`✓ Browser closed`) at end of pass — logged under `== SESSION HYGIENE ==`.

---
---

# History appendix — earlier rounds (SUPERSEDED by the next5 report above; kept verbatim, including their own nested history)

# Podo UI v2 — Next.js runtime DEFINITIVE FINAL verification (2026-07-20, session `next4`)

**This report supersedes every earlier Next-runtime report. Every claim below cites output produced in THIS session (`next4`) against the FINAL artifact. Earlier rounds are kept verbatim in the History appendix and are NOT current evidence.**

- Artifact under test: `podo-ui-2.0.4.tgz`, **sha1 `af9c435ab12272b57b2c188cf711112416faeb31`** — verified as this session's first logged command (`next-commands.log` header) and re-verified immediately before the clean reinstall.
- Clean reinstall this session: `rm -rf node_modules/podo-ui package-lock.json && npm install ../../podo-ui-2.0.4.tgz`. **Freshness proof (bit-for-bit):** `tar -xOf podo-ui-2.0.4.tgz package/dist/react/index.js | shasum` = `79cc3fab0b01c27a061cf584a3c7d9ea36a5618d` = `shasum node_modules/podo-ui/dist/react/index.js`; same for `styles.css` (`55d4f4e3897cf7…`). Marker unique to this final build: installed `styles.css` contains the `:checked` checkbox selectors (`grep -c ':checked'` → `6`).
- Repo gate (context, not re-run here): `pnpm check` green — `Test Files  23 passed (23)`, `Tests  239 passed | 2 skipped (241)` (`scratchpad/check-final.log:73-74`).
- Harness: `harness/next` (Next.js **16.2.10**, Turbopack, react/react-dom 19.2, node v25.8.2/npm 11.11.1), production `next build` + `next start -p 5212 -H 127.0.0.1`. Podo assets regenerated **from this tarball's CLI** this session (`npx podo build --out-dir app/podo --force` → `[podo:build] Generated 16 files in app/podo.`).
- Browser: every step via `npx agent-browser --session next4` (fresh session; **623 logged browser commands**), driven through the logging wrapper `harness/next/ab-next4.sh` which echoes the FULL argv (entire eval JS included) into `reports/next-commands.log` before running and appends the full output.
- Raw SSR snapshot: `reports/next-ssr-next4.html` (81,185 B, recaptured after the final harness build).
- Screenshots: `reports/next-shots/g01`–`g17` (g-prefix = this session).
- Verdict: **28/28 checklist items PASS.** Zero unexplained console/page errors; zero hydration warnings.

## How to reproduce

```sh
cd /private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next
# full rebuild steps documented in start.sh (npm i tarball, podo build --force, .ts cleanup, next build)
./start.sh                                   # next start -p 5212 -H 127.0.0.1, pid in server.pid
curl -s http://127.0.0.1:5212/ | grep -o '항상 열린 말풍선'    # forced-open tooltip in raw SSR
kill $(cat server.pid)
```

Log sections in `reports/next-commands.log` are grep-able by banner (`== ITEM 9: Select single ==` etc.; note the log contains bash `$'…'` byte-escapes from `%q`-quoting Korean argv — use `grep -a` if your grep flags it as binary).

## Harness finalization note

The kitchen sink was extended this session (Badge themes, controlled Selects, defaultOpen×disabled/readOnly, forced-open Tooltip, swappable Toaster, 12 DatePicker combos, chip prop-wins/onPress, uncontrolled Input, plain toast). Two harness-only rebuilds happened mid-session (adding `chip-propwins`/`input-uncontrolled`, then `toast-fire-plain`); the installed package was never touched after the reinstall, and the SSR snapshot + full console sweep were recaptured on the FINAL build. Items 1–2 were re-run against the final build; every other item ran only on the final build.

## Checklist results (28/28)

Every row was exercised in the real browser against the production server. "Evidence" quotes observed output recorded in `reports/next-commands.log` under the named banner.

| # | Item | What was exercised | Result | Evidence (observed output, log banner) |
|---|---|---|---|---|
| 1 | Button | pointer click (onClick+onPress); keyboard **Enter** and **Space** on focused button; disabled programmatic `.click()`; theme/size samples | PASS | `== ITEM 1 ==` (+ final-build rerun banner): clicks `1`→`2` (Enter)→`3` (Space), presses `3`; disabled `{"disabledAttr":true,"ariaDisabled":"true"}` → counter `0`; variants `[{저장하기 solid-primary md},{비활성 solid-danger md},{외곽 위험 outline-danger lg},{보조 solid-assistive xs}]` |
| 2 | Badge | 4 themes + count + dot collapse; **computed backgrounds** natural vs red vs dot | PASS | `== ITEM 2 ==`: `badge-natural {theme:"natural",text:"3",bg:"rgb(62, 66, 75)"}` (dark) vs `badge-red {theme:"red",text:"12",bg:"rgb(254, 241, 241)",color:"rgb(242, 59, 59)"}` (light bg/red text) vs `badge-danger {bg:"rgb(242, 59, 59)"}`; dot: `{dot:"true",text:"",w:6,h:6,bg:"rgb(62, 168, 86)"}` (children ignored, 6px point); screenshot `g02` |
| 3 | Chip | uncontrolled toggle; controlled; **`selected` prop wins over click**; **onPress callback**; removable X removes (label click doesn't); removable+disabled fully inert | PASS | `== ITEM 3 ==`: toggle `true`/`data-state=selected`→`false`; prop-wins chip after click: `{"dataState":null,"ariaPressed":"false","attempt":"true","presses":"1"}` (onSelectedChange+onPress fired, visual state pinned); label click → `chip-removed false`, X (`aria-label=제거`) → `true`, count 0; disabled: `{"rootTag":"SPAN","dataDisabled":"true","dataRemovable":"true","dataState":"selected","xDisabled":true,"xAriaDisabled":"true","xTabIndex":-1}`, X `.click()` → removes counter `0`, chip still mounted |
| 4 | Switch | toggle on/off; disabled no-op | PASS | `== ITEMS 4-6 ==`: `on`/`aria-checked="true"`→`off`; disabled `{"disabled":true,"ariaDisabled":"true"}`, counter `0` |
| 5 | Checkbox | toggle; **indeterminate → `checked=mixed`**; disabled no-op | PASS | `== ITEMS 4-6 ==`: `checked`; input `.indeterminate=true`, `data-state=indeterminate`, a11y snapshot `checkbox "전체 선택" [checked=mixed]`; disabled counter `0` |
| 6 | Radio | pick 포도→사과; disabled no-op | PASS | `== ITEMS 4-6 ==`: `grape`→`apple`; disabled `{"disabled":true,"checked":false}`, value stays `apple`, counter `0` |
| 7 | Input | controlled readback; **uncontrolled** typing; disabled blocks real typing (focus refused); readOnly boxless; invalid attrs | PASS | `== ITEM 7 ==`: controlled `포도조아` (value+readout); uncontrolled `초기값 추가`; disabled: `activeIsDisabledInput:false`, value stays `고정값` after typing; readOnly `{"wrapDataState":"read-only","wrapBorder":"1px solid rgba(0, 0, 0, 0)","wrapBackground":"rgba(0, 0, 0, 0)"}` vs normal `1px solid rgb(228, 228, 231)` + white; invalid `{"ariaInvalid":"true","wrapDataState":"invalid"}` |
| 8 | Textarea | typing readback; Field `countMax` cap; disabled/readOnly | PASS | `== ITEM 8 ==`: `여러 줄 내용`; 12 chars typed into countMax=10 → `{"value":"열두글자를넘겨보려는","valueLen":10,"maxLength":10,"count":"10/10"}`; disabled `{"focusWentToDisabled":false,"dataState":"disabled"}`; readOnly `read-only` + transparent chrome |
| 9 | Select single | open/pick/close; ArrowDown×3+Enter; outside click; **controlled `value` prop (prop wins + external set)**; disabled inert | PASS | `== ITEM 9 ==`: pick 사과 → `apple`, menu 0, trigger `사과`; keyboard `activedescendant _R_peavb_-2`/`오렌지` → Enter → `orange`; outside click 1→0 value unchanged; controlled: option click → `{"trigger":"사과","ctlValue":"apple","attempt":"melon"}` (prop wins), external button → `{"trigger":"오렌지","ctlValue":"orange"}`; disabled `{"ariaDisabled":"true","tabIndex":-1,"dataState":"disabled","menus":0}` counter `0` |
| 10 | Select multi | toggle 4 values (menu stays open); **maxChips +N**; chip X removal; clearable; **controlled `values`**; readOnly static; disabled static chips | PASS | `== ITEM 10 ==`: `grape,apple,orange,melon`, `menuStillOpen:1`, chips 3 + `.podo-select__chip-more` `{"more":"+1","moreAria":"외 1개 선택됨"}` (g03); X `사과 제거` → `grape,orange,melon`; `.podo-select__clear`(`모두 해제`) → `none`; controlled: option click → values stay `grape,melon`, `attempt:"grape,melon,apple"`, external set → chips `포도,멜론`; readOnly `{"ariaReadonly":"true","chips":["포도","사과"],"removeButtons":0,"chevron":0}` + click → 0 menus; disabled `{"ariaDisabled":"true","rootDataState":"disabled","chips":[{포도 dataDisabled:"true"},{사과 dataDisabled:"true"}],"removeButtons":0}` + click → 0 menus |
| 11 | Select defaultOpen ×(plain/disabled/readOnly) | fresh reload; post-mount menu for plain; **no menu ever for disabled/readOnly**, clicks no-op | PASS | `== ITEM 11 ==`: plain `{"plainAriaExpanded":"true","menuCount":1,"menuParent":"BODY","optionLabels":["포도","사과","오렌지","멜론"]}` (g04), pick → `apple`; `{"disabledAriaExpanded":"false","disabledAriaDisabled":"true","readonlyAriaExpanded":"false","readonlyAriaReadonly":"true","totalMenus":1}`; clicking each → menu count `0` |
| 12 | Select searchable | type-to-filter; **combobox wiring on the focused input**; ArrowDown activedescendant; Enter picks | PASS | `== ITEM 12 ==`: typing `오` → `{"focusedIsSearchInput":true,"role":"combobox","ariaExpanded":"true","ariaControls":"_R_49eavb_","ariaAutocomplete":"list","filtered":["오렌지"],"menuId":"_R_49eavb_"}`; ArrowDown → `{"ariaActivedescendant":"_R_49eavb_-0","activeCellLabel":"오렌지","idInsideListbox":true}`; Enter → `orange`, menu 0, trigger `오렌지` |
| 13 | Select addable | add row **outside** `[role=listbox]`; listbox children all options; add+select | PASS | `== ITEM 13 ==` DOM quote: `{"listboxChildren":[{role:"option",포도},{option,사과},{option,오렌지},{option,멜론}],"addInputFound":true,"addInputInsideListbox":false,"addRowParentClass":"podo-select__add"}`; add `두리안`+Enter → readout/trigger `두리안`; reopen: 5 options, `두리안 aria-selected="true"`, `listboxChildRoles:["option"×5]` |
| 14 | Select a11y routing | Select `id` + Field label → **label `for` === combobox element id** | PASS | `== ITEM 14 ==`: `{"comboboxId":"select-labeled","comboboxRole":"combobox","labelText":"과일 선택 라벨","labelHtmlFor":"select-labeled","match":true}` |
| 15 | Select viewport flip | trigger scrolled to `spaceBelow:90`px, open | PASS | `== ITEM 15 ==`: `{"innerHeight":633,"trigTop":499,"menuTop":289,"menuBottom":493,"flippedAbove":true,"lastOptTop":442,"lastOptBottom":484,"lastOptInViewport":true}`; screenshot `g05` |
| 16 | Tooltip | hover; focus; bottom/reverse variant; controlled `open`; inline `portal={false}`; **forced-open present at load** | PASS | `== ITEM 16 ==`: forced-open at load `{"forcedOpenPresent":true,"text":"항상 열린 말풍선","inBody":true,"visible":true,"position":"top"}` (still mounted at final sweep); hover `{"count":1,"text":"임시 저장돼요","position":"top","inBody":true,"idMatch":true}` (g06) → unhover `0`; focus → bubble next tick (`tipsNextTick:[…,"임시 저장돼요"]`, describedby wired) → blur → gone; bottom `{"bottomPos":"bottom","bottomTheme":"reverse"}`; controlled `{"ctlState":"true","ctlVisibleWithoutHover":true}`→off `0`; inline `{"insideWrap":true,"inBody":false}` |
| 17 | Toast/Toaster | 4 states + eviction; auto-dismiss; manual close; pause-on-hover; `toast.dismiss()`; **custom Toaster: `max={2}` eviction + `top-left` + `duration={1200}`** (remount) | PASS | `== ITEM 17 ==` (final-build rerun): 5 fired w/ max3 → `visibleCount:3` `[warning status,info status,danger role=alert]` oldest 2 evicted (g07); dismiss-all → `0`; inline Toast `{"caption":"인라인 캡션"}` X → `toast-closed true`; async-eval timings: auto `{appeared:true,lastAliveAtMs:2653,goneByMs:2755}` (duration 2500); manual alive at 3.5s, X (`닫기`) → 0; pause-on-hover `{"expandedOnHover":"true","stillAliveAfter4sHover":1,"goneMsAfterUnhover":2736}`; custom config `toaster-cfg top-left/1200/max2`: 3 fired → `{"position":"top-left","cssTop":"16px","cssLeft":"16px","visibleCount":2,"titles":["실패했어요","성공했어요"],"evictedOldest":true}` (g09); no-options toast under it → `{"lastAliveMs":1319,"goneMs":1422}` (≈1200+exit) |
| 18 | Table | defaultSelected; row toggle; disabled row inert; select-all skips disabled; **drag range-selection** | PASS | `== ITEM 18 ==`: initial `0`, `row0 data-selected="true"`, row2 `data-disabled="true"`+checkbox disabled; toggle row1 → `0,1`; disabled row click → `0,1`; select-all → `0,1,3,4`, again → `none`; `drag` row0→row3 cells → `0,1,3` (row 2 skipped) (g10) |
| 19 | Field | label/helper/error/required/count; **Field disabled disables wrapped Input** (typing attempt); explicit id; generated id | PASS | `== ITEM 19 ==`: `{"labelFor":"_R_puavb_-control","inputId":"_R_puavb_-control","idMatch":true,"generatedId":true,"ariaRequired":"true","helper":"10자 이내로 입력해요","count":"2/10","maxLength":10}`; error `{"errorText":"이메일 형식이 아니에요","errAriaInvalid":"true","describedbyPointsToError":true}`; disabled `{"disInputDisabled":true,"fieldDataDisabled":"true","focusRefused":true}` + typing → value `""`; explicit `{"explicitId":"custom-field-control","explicitLabelFor":"custom-field-control","match":true}` |
| 20 | Icon | all 9 glyphs E001–E009 non-empty `::before` | PASS | `== ITEMS 20+27 ==`: `menu E001 … search E009`, each `{fontFamily:"PodoIcons",contentLen:3}`; screenshot `g11` |
| 21 | Typography + theme + responsive | h1/body sizes; `usePodoTheme` toggle; 900px viewport | PASS | `== ITEM 21 ==`: 1280px `{"h1Tag":"H1","h1FontSize":"32px","bodyFontSize":"16px"}`; toggle → `landing/dark`+`data-color-scheme="dark"` → back `landing/light`; `set viewport 900 800` → `{"h1FontSizeAt900":"28px"}` (g12) → restored `32px` (tokens.css `--podo-typography-heading-xlarge-fontSize` 32→28 in the 768–1279px media query, regenerated this session) |
| 22 | DatePicker exhaustive | **all 12 mode×type×showActions combos committed** + placeholder + 초기화 + Escape + outside-click cancel + disabled + minuteStep + keyboard grid | PASS | see breakdown below |
| 23 | Editor | **all 13 toolbar groups** + code-view live onChange + Ctrl+Z scope + role/aria + EditorView | PASS | see breakdown below |
| 24 | Final console/errors | `errors`+`console` sweeps: initial, after every reload, final | PASS | every invocation printed **nothing** (empty); `server.log` = Ready banner only (quoted under `== ITEMS 24+26 ==`) |
| 25 | next build + SSR curl | production build; `next start`; raw HTML has component markup incl. **forced-open Tooltip bubble inline** and **defaultOpen Select w/o menu** | PASS | build: `✓ Compiled successfully` … `Route (app) ┌ ○ /` static; curl `200`; `next-ssr-next4.html`: `role="tooltip" class="podo-tooltip" … data-position="top"` + `<span class="podo-tooltip__bubble">항상 열린 말풍선</span>` INLINE inside `#tooltip-always-wrap`; `id="select-defaultopen" … aria-expanded="true"` with `podo-select__menu` ×**0** (no crash, no SSR menu); `podo-button__label` ×22, `저장하기`/`포도 한 상자`/`헤드라인 텍스트`/`인라인 토스트 제목`/`data-podo-theme`/`podo-icon-menu`/`podo-icon-search` ×1, DatePicker `날짜 선택` placeholder ×1; defaultOpen+disabled/readOnly SSR: `aria-expanded="false"` + `aria-disabled`/`aria-readonly` |
| 26 | Hydration | zero hydration warnings across the whole pass WITH forced-open portal Tooltip + defaultOpen Select from first paint | PASS | `console`/`errors` empty at initial load, after every reload (4×), and at the final sweep; forced-open tooltip verified mounted at first check AND at final sweep (`forcedOpenTooltipStillMounted:true`) |
| 27 | `podo-ui/icons.css` | computed font-family + charCodes incl. check/close/search | PASS | `== ITEMS 20+27 ==`: `check E007`, `close E008`, `search E009` all `fontFamily:"PodoIcons"`; `document.fonts` `["loaded"]`, `fontCheck:true`; export verified in installed `package.json`: `"./icons.css": "./dist/icons-assets/PodoIcons.css"` |
| 28 | RSC boundary | installed dist `"use client"` banners | PASS | `head -1` quotes (reinstall section): `dist/react/index.js` → `"use client";` (also `datepicker.js`, `editor/index.js`, `editor/view.js`); `index.js` sha equals the tarball entry bit-for-bit |

### Item 22 breakdown — DatePicker (banners `== ITEM 22 … ==` and `-- combo N … --`)

| Sub-check | Result | Evidence (observed) |
|---|---|---|
| 1. instant/date (no actions) | PASS | placeholder `{"placeholderShown":"날짜 선택","cls":"…podo-dp-placeholder"}` (prop wins, also in SSR); Enter-commit `2026-08-04` (below); mouse pick 8/15 → `{"readout":"2026-08-15","closed":true,"trigger":"2026-08-15"}` |
| 2. instant/date + showActions | PASS | day click → `{"pendingReadout":"none","dropdownStillOpen":true,"applyPresent":true,"triggerTemp":"2026 - 07 - 10"}`; 적용 → `{"readout":"2026-07-10","closedAfterApply":true}` |
| 3. instant/time (no actions) | PASS | inline native selects (`시 선택`/`분 선택`, no dropdown, `applyPresent:false`); 14 → `14:00`, 30 → `14:30` (instant commit per change) |
| 4. instant/time + showActions | PASS | hour 9 → actions appear `{"applyVisible":true,"resetVisible":true}`, readout `none`; min 45 → temp `9:45`, readout `none`; 적용 → `{"readout":"09:45","actionsGone":true}` |
| 5. instant/datetime (no actions) | PASS | day 7/12 → `{"readout":"2026-07-12 none","calendarClosed":true}`; time 8:20 → `2026-07-12 08:20` |
| 6. instant/datetime + showActions | PASS | day 7/18 → `{"readout":"none none","dropdownStillOpen":true}`; time 16:05 → still `none none`; 적용 → `{"readout":"2026-07-18 16:05","closedAfterApply":true}` |
| 7. period/date showActions={false} | PASS | two calendars `["2026년 7월","2026년 8월"]`, `applyPresent:false`; 7/5 → `2026-07-05~none` (live commit), 7/20 → `{"readout":"2026-07-05~2026-07-20","closedAfterComplete":true}` |
| 8. period/date (default actions) | PASS | 7/5+7/20 → `{"readout":"none~none","dropdownStillOpen":true,"applyPresent":true}` (g13); 적용 → `2026-07-05~2026-07-20`, closed |
| 9. period/time showActions={false} | PASS | 4 selects `["시 선택","분 선택","종료 시 선택","종료 분 선택"]`; start 10:15 → `10:15~none` (live), end 19:50 → `10:15~19:50` |
| 10. period/time (default actions) | PASS | 4 selects set 9:15/18:45 → `{"readout":"none~none","displayedTemp":"9,15,18,45","applyPresent":true}`; 적용 → `{"readout":"09:15~18:45","actionsGone":true}` |
| 11. period/datetime showActions={false} | PASS | 7/3+7/25 → `2026-07-03 none~2026-07-25 none` (closed on completion); times → `2026-07-03 07:30~2026-07-25 22:10` |
| 12. period/datetime (default actions) | PASS | clean run after 초기화: start pick → trigger temp `2026 - 07 - 08|YYYY - MM - DD` readout `none…`, end pick → temp `2026 - 07 - 08|2026 - 07 - 28` readout still `none…`, times 11:00/23:30 still pending; 적용 → `{"readout":"2026-07-08 11:00~2026-07-28 23:30","closedAfterApply":true}` (g14) |
| placeholder prop | PASS | quoted in combo 1 + raw SSR `날짜 선택` |
| 초기화 commits cleared value | PASS | twice: combo-2 instance `{"readout":"none","closedAfterReset":true,"triggerBackToPlaceholder":"YYYY - MM - DD"}`; combo-12 instance `afterReset:"none none~none none"` |
| Escape closes + refocuses trigger | PASS | `{"openBeforeEscape":true}` → `{"openAfterEscape":false,"activeTag":"BUTTON","activeClass":"podo-dp-inputPart ","isTriggerInsideDpInstant":true}` |
| outside click cancels pending-actions dropdown | PASS | combo-2: pending 7/10 → click `h1` → `{"readoutStays":"none","dropdownClosed":true,"triggerBackTo":"YYYY - MM - DD"}` |
| disabled DatePicker | PASS | trigger `{"tag":"BUTTON","disabled":true,"ariaDisabled":"true"}`; programmatic AND real click → `gridOpen:false`, 0 dropdowns |
| minuteStep boundary (UI-reachable) | PASS | `minuteStep={30}` + `minDate {10:59}`: minute options `["0","30"]`; picking hour `10` → committed readout `2026-07-10 11:00` (carried to 11:00, not 10:60 — same semantics as `datepicker.test.tsx:167-187` "carries minute rounding into the next hour instead of emitting :60") |
| keyboard grid | PASS | roving: `{"gridcellCount":35,"rovingCount":1,"rovingLabel":"2026년 7월 20일"}`; ArrowRight → `2026년 7월 21일`; ArrowDown → `2026년 7월 28일`; **month boundary** ArrowDown → `{"gridLabelAfterCrossing":"2026년 8월","focusedLabel":"2026년 8월 4일","focusedIsRoving":true}`; Enter → committed `2026-08-04`, closed; Tab order: dropdown tabbables `[이전 달, 년도 선택, 월 선택, 다음 달, gridcell 2026년 8월 4일]` — `gridcellsInTabOrder:1`, and pressing Tab from 월 선택 → `다음 달` → the single gridcell → out |

### Item 23 breakdown — Editor (banner `== ITEM 23 … ==`)

Toolbar inventory quoted from DOM: `실행 취소, 다시 실행, 문단 형식, 굵게, 기울임, 밑줄, 취소선, 글꼴 색상, 배경 색상, 왼쪽 정렬(dropdown), 목록, 번호 목록, 구분선, 표 삽입, 링크, 이미지, 유튜브, 서식 지우기, HTML 코드보기` — all 13 `ToolbarItem` groups of `editor/types.ts`/`constants.ts` present.

| Group | Result | Evidence (onChange readout before → after) |
|---|---|---|
| role/aria | PASS | `{"role":"textbox","ariaMultiline":"true","ariaLabel":"리치 텍스트 편집기","contenteditable":"true"}` |
| typing | PASS | `<p>초기 내용</p>` → `<p>초기 내용 이어쓴 문장</p>` |
| text-style | PASS | successive `<b>` → `<b><i>` → `<b><i><u>` → `<b><i><u><strike>초기 내용 이어쓴 문장</strike></u></i></b>` |
| undo-redo (toolbar buttons) | PASS | 실행 취소 → `<strike>` removed; 다시 실행 → restored; 실행 취소 → removed again |
| paragraph | PASS | dropdown options `제목 1…P5 Semibold` (12); 제목 1 → `<h1><b><i><u>…</u></i></b></h1>` |
| color | PASS | palette 6×11 `podo-ed-colorButton`s; first swatch `rgb(255, 0, 0)` → `<span style="color: #ff0000 !important;"><h1>…` |
| align | PASS | 가운데 정렬 → `<h1 style="text-align: center;">` |
| list | PASS | 목록 → `<ul><li>…</li></ul>`; 번호 목록 → `<ol><li>…</li></ol>` |
| hr | PASS | 구분선 → `<hr>` appended inside the li |
| table | PASS | 표 삽입 grid selector (`podo-ed-tableGrid` 10×10) → `<table border="1" style="border-collapse: collapse; width: 100%; …">` with `tdCount:4` |
| link | PASS | select text → 링크 → fill `input[placeholder="https://..."]` → 삽입 → `<a href="https://podoui.com" target="_blank" rel="noopener noreferrer">초기 내용 이어쓴 문장</a>` |
| image (real file upload) | PASS | 이미지 dropdown has both 파일 업로드/URL 입력 tabs; `agent-browser upload` of a real 1×1 PNG into the image file input → preview `test-image.png` shown → 삽입 → `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB…">` (`isDataUri:true`) |
| youtube | PASS | 유튜브 → URL input (`placeholder https://www.youtube.com/watch?v=…`) filled with `watch?v=dQw4w9WgXcQ` → 삽입 → `<iframe width="100%" … src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player"…` |
| format (clear) | PASS | `<p><b>코드뷰 추가 문단</b></p>` + element-spanning selection → 서식 지우기 → `<p>코드뷰 추가 문단</p>` (note: a selection strictly INSIDE the `<b>` wrapper keeps the wrapper — the implementation replaces the selected range's contents, `editor/index.tsx:426`) |
| code (live onChange) | PASS | HTML 코드보기 → `textarea.podo-ed-codeEditor` w/ pretty-printed HTML, contenteditable unmounted (g15); typing `<p>코드뷰 추가 문단</p>` into the textarea → readout updated **live** (`readoutIncludesNewPara:true`); 에디터로 전환 → rendered back |
| Ctrl+Z scope | PASS | clean rerun: editor history holds a bold action (`<p><b>초기 내용</b></p>`); typed `바깥 입력 텍스트` into `[data-testid=editor-outside-input]` (focus verified); ctrl+z keydown dispatched ON the outside input (bubbles through document) → `{"outsideValue":"바깥 입력 텍스트","editorReadout":"<p><b>초기 내용</b></p>","editorDom":"<p><b>초기 내용</b></p>","focusedTid":"editor-outside-input"}` — the editor's scoped handler did NOT intercept (a document-level listener would have undone the bold) |
| EditorView | PASS | `{"viewClass":"podo-ed-editorView ","viewInnerHTML":"<p><b>초기 내용</b></p>","matchesReadout":true,"boldRendered":true}` (g16) |

## Console / page errors (items 24, 26)

- `errors` / `console` printed **nothing** (= empty) at: initial load, the two post-rebuild reloads, the fresh-mount reload for item 11, the post-hiccup reload, and the final sweep. No hydration-mismatch or React warnings at any point — with the forced-open portal Tooltip and the defaultOpen Select mounted from first paint.
- `server.log`: Next 16.2.10 Ready banner only (quoted in log).
- The only console-relevant external content is the YouTube iframe embed; no console message was produced by it in this session.

## Environmental artifacts (tooling, not app defects — all logged in place)

1. **Concurrent-session wrapper clobber:** the shared `scratchpad/ab4.sh` wrapper was overwritten mid-batch by a concurrent `react4` verification session. The affected ITEM-1 batch was declared VOID in the log, the wrapper was moved to `harness/next/ab-next4.sh` (session-private), and ITEM 1 was re-run cleanly. A few of the voided batch's argv lines were logged into `react-commands.log` by the foreign wrapper.
2. **Ctrl+Z tab reset:** immediately after `press Control+z` the tab reset to `about:blank` (known agent-browser Ctrl/Meta hiccup, third recorded round in a row). `errors`/`console` were empty before and after; the page was reloaded and the entire Ctrl+Z scope check re-run cleanly (synthetic KeyboardEvent dispatch, which still exercises the scoped-handler fix).
3. **CLI latency vs toast timers:** per-command `npx` startup (~1–2 s under concurrent load) exceeded the 2500 ms auto-toast duration, so cross-command reads missed live toasts. All timing-sensitive toast checks were re-run INSIDE single async evals with in-page timestamps (quoted above). The earlier cross-command misses are logged and marked.
4. **Same-tick DOM reads:** React commits after the event tick, so a read issued in the same eval as a `.click()` can be stale (observed twice: tooltip focus, toast fire). All assertions above use next-tick/next-call reads.
5. **Automation-error retries (logged honestly):** (a) multi-select trigger click landed on a chip → menu didn't open; retried via the chevron. (b) combo-12 two same-tick gridcell clicks raced the re-render and corrupted the temp range; re-run with per-click evals after 초기화. (c) link/image dialogs: first selector matched the page-level outside input / the wrong of two file inputs; retried scoped (and the outside input was cleared before reuse). (d) `[title="#ff0000"]` swatch lookup — the shipped palette buttons carry no title attr; clicked `.podo-ed-colorButton` (bg `rgb(255,0,0)`) instead.
6. **Log encoding:** the wrapper `%q`-quotes argv, so Korean selector text appears as bash `$'…'` byte escapes; some escape sequences are not valid UTF-8, which can make locale-aware `grep` treat `next-commands.log` as binary. Use `grep -a` / `LC_ALL=C`. Content is complete (623 wrapper-logged browser commands + install/build/SSR sections).

## Session hygiene

Server killed (`kill $(cat server.pid)`, pid 28846 confirmed) and browser session `next4` closed (`✓ Browser closed`) at end of pass — logged.

---
---

# History appendix — earlier rounds (SUPERSEDED by the next4 report above; kept verbatim, including their own nested history)

# Podo UI v2 — Next.js runtime FINAL verification (2026-07-20, session `next3`)

- Package under test: `podo-ui-2.0.4.tgz`, **sha1 `b70028087aeba928ef88a2ba01215e1ef03d0825`** (repacked local build; reinstalled fresh this pass — see "Freshness" below)
- Harness: `/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next` (App Router kitchen sink, substantially extended this round)
- Runtime: Next.js 16.2.10 (Turbopack, production `next start -p 5212 -H 127.0.0.1`), react/react-dom 19.2
- Browser: every step via `npx agent-browser --session next3` (fresh session). Full command lines (including complete `eval` expressions — logged via a wrapper that echoes the exact argv before running) and outputs: `reports/next-commands.log`, section `########## FINAL VERIFICATION PASS (session next3, tarball sha1 b70028087aeb...)`.
- Screenshots: `reports/next-shots/f01`–`f17` (f-prefix = this pass)
- Verdict: **27/27 checklist items PASS.** Zero unexplained console/page errors. All previously-fixed bugs re-verified in-browser with DOM quotes.

## Freshness / installed-package proof

```
$ shasum ../../podo-ui-2.0.4.tgz
b70028087aeba928ef88a2ba01215e1ef03d0825  ../../podo-ui-2.0.4.tgz
$ rm -rf node_modules/podo-ui package-lock.json && npm install ../../podo-ui-2.0.4.tgz   # clean reinstall
```

Installed dist inspection (item 27 — RSC boundary):

```
node_modules/podo-ui/dist/react/index.js        → first line: "use client";
node_modules/podo-ui/dist/react/datepicker.js   → "use client";
node_modules/podo-ui/dist/react/editor/index.js → "use client";
node_modules/podo-ui/dist/react/editor/view.js  → "use client";
```

`package.json` export `"./icons.css": "./dist/icons-assets/PodoIcons.css"`; `dist/icons-assets/` ships `PodoIcons.css/.woff/.woff2/.metadata.json`, and the CSS defines **all 9 glyphs** `\E001..\E009` including `podo-icon-check::before { content: "\E007" }` (the check glyph was missing from the 6-glyph bundle in the previous round — see Corrections).

## Production pipeline (item 23) — PASS

Consumer flow used: `npm i <tarball>` → `npx podo init --target react --theme landing --yes` → `npx podo build --out-dir app/podo` (`[podo:build] Generated 16 files in app/podo.`) → `app/layout.jsx` imports `podo-ui/styles.css`, `podo-ui/icons.css`, `./podo/tokens.css`.

```
▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 2.0s
✓ Generating static pages using 4 workers (3/3) in 387ms
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

Served via `./start.sh`; `curl -w "%{http_code}"` → `200`. Raw pre-hydration HTML saved to `reports/next-ssr-final.html` (42,814 B). Quoted fragments:

| fragment | count / quote |
|---|---|
| `podo-button__label` | ×17 |
| `저장하기`, `포도 한 상자`, `헤드라인 텍스트`, `인라인 토스트 제목`, `data-podo-theme` | ×1 each |
| `podo-icon-menu` … `podo-icon-search` | present (all 9 icon `<i>`s server-rendered) |
| DatePicker placeholder prop | `<button type="button" class="podo-dp-inputPart  podo-dp-placeholder">날짜 선택` |
| defaultOpen Select (item 24) | `id="select-defaultopen" class="podo-select" data-size="md" data-open="true"` present, **`podo-select__menu` ×0** — the portal menu is *not* server-rendered (mounted-guard), page prerenders without crashing |

**Build caveat (harness/tooling, not a component defect):** `podo build --out-dir app/podo` emits `.ts` files; Next 16's TypeScript auto-setup then tries to self-install and its worker crashes (`The "id" argument must be of type string`). Deleting the generated `.ts` files (only `tokens.css` is consumed) + `tsconfig.json`/`next-env.d.ts` makes the build green. Steps recorded in `start.sh`. A consumer generating podo output inside `app/` would hit the same Next behavior.

## Checklist results (items 1–27)

Every row was exercised in the real browser against the production server; "Evidence" quotes observed output from `next-commands.log`.

| # | Component / feature | What was exercised | Result | Evidence (observed) |
|---|---|---|---|---|
| 1 | Button | `onClick`+`onPress` (both exist in ButtonProps) via pointer click; keyboard **Enter** and **Space** on focused button; disabled no-op (programmatic `.click()`); variant/size render | PASS | clicks/presses `1/1` after click → `2` after Enter → `3/3` after Space; disabled: `{"disabledAttr":true,"ariaDisabled":"true"}`, `btn-disabled-clicks`→`0`; variants `[{저장하기 solid-primary md},{비활성 solid-danger md},{외곽 위험 outline-danger lg},{보조 solid-assistive xs}]` |
| 2 | Chip | uncontrolled toggle; **controlled** `selected` w/ state readout; removable removes via X only; **removable+disabled** (fixed bug) | PASS | toggle: `chip-selected` `true`→`false`, `data-state=selected`; controlled: `chip-ctl-state` `true` (aria-pressed `true`) → `false`; removable: label click → `chip-removed` **false**, X click → `true`, chip unmounted; disabled removable DOM quote: `{"rootTag":"SPAN","dataDisabled":"true","dataRemovable":"true","dataState":"selected","xDisabled":true,"xAriaDisabled":"true","xTabIndex":-1}` + programmatic X `.click()` → `chip-disabled-removes`→`0` |
| 3 | Switch | click toggle; disabled no-op | PASS | `switch-state`→`on`, `aria-checked="true"`; disabled `.click()`: `{"disabled":true}`, `switch-disabled-changes`→`0` |
| 4 | Checkbox | toggle; indeterminate → **mixed** aria; disabled no-op | PASS | `checkbox-state`→`checked`; `{"indProp":true}`, `data-state=indeterminate`, snapshot: `checkbox "전체 선택" [checked=mixed]`; disabled `.click()` → counter `0` |
| 5 | Radio | select 포도→사과; disabled no-op | PASS | `radio-value` `grape`→`apple`; disabled `.click()`: `{"disabled":true,"checked":false}`, value stays `apple`, counter `0` |
| 6 | Input | **controlled** typing readback; disabled blocks typing; readOnly no-box; invalid attrs | PASS | fill → value & readout `포도조아`; disabled: focus refused (keystrokes landed in the still-focused input-main → `포도조아변경시도`), disabled value stayed `고정값`; readOnly: `{"roWrapDataState":"read-only","roWrapBorder":"1px solid rgba(0, 0, 0, 0)","roWrapBackground":"rgba(0, 0, 0, 0)"}` (vs normal `1px solid rgb(66,108,237)` + white bg); invalid: `{"invAriaInvalid":"true","invWrapDataState":"invalid"}` |
| 7 | Textarea | typing readback; Field `countMax` cap; disabled/readOnly | PASS | `textarea-value`→`여러 줄 내용`; typed 12 chars into countMax=10 textarea → value `열두글자를넘겨보려는` (10), `{"count":"10/10","maxLength":10,"valueLen":10}`; `{"dDisabled":true,"dDataState":"disabled","focusWentToDisabled":false}`, readOnly `data-state=read-only` + transparent border |
| 8 | Select single | open/pick/close; keyboard ArrowDown×3+Enter; outside click closes; disabled no-op | PASS | pick: `select-value`→`apple`, `{"menusAfterPick":0,"triggerText":"사과"}`; keyboard: active cell `오렌지`, `aria-activedescendant="_R_peavb_-2"`, Enter → `orange`; outside click: menu 1→0, value unchanged; disabled: `{"menus":0,"ariaDisabled":"true","tabIndex":-1,"dataState":"disabled"}`, counter `0` |
| 9 | Select multi | pick 4 (menu stays open); maxChips `+N`; chip X removal; clearable ✕; **disabled multi static chips** (fixed bug) | PASS | `grape,apple,orange,melon`, `{"menuStillOpen":1,"chips":["포도","사과","오렌지"],"more":"+1","moreAria":"외 1개 선택됨"}`; chip X → `apple,orange,melon`; clear ✕ → `none`; disabled DOM quote: chips are `<span class="podo-chip" … data-state="selected" data-removable="true" data-disabled="true"><span class="podo-chip__label">포도</span></span>` ×2, `"removeButtons":0`, root `data-state=disabled` |
| 10 | Select searchable | type-to-filter; **focused search input carries combobox wiring** (fixed bug); ArrowDown activedescendant; Enter picks | PASS | typing `오` → `{"filtered":["오렌지"],"focusedIsSearch":true,"role":"combobox","ariaExpanded":"true","ariaControls":"_R_49eavb_","ariaAutocomplete":"list","menuId":"_R_49eavb_","triggerRole":null}` (trigger dropped its role); after ArrowDown `{"ariaActivedescendantAfterArrow":"_R_49eavb_-0","activeCellId":"_R_49eavb_-0","match":true}`; Enter → `select-search-value`→`orange`, menu closed |
| 11 | Select addable | type new value in add row → added & selected | PASS | fill add-input `두리안` + Enter → `select-addable-value`→`두리안`; reopen: options `[포도 F,사과 F,오렌지 F,멜론 F,두리안 aria-selected=true]`, trigger `두리안` |
| 12 | Select `portal={false}` + `defaultOpen` | inline renders in flow & works; defaultOpen menu after mount w/o errors | PASS | inline: `{"insideRoot":true,"parentClass":"podo-select","dataPortal":null,"position":"absolute"}`, pick → `melon`; defaultOpen at load (before any click): `{"dataOpen":"true","menuCount":1,"listPortal":"true","listParent":"BODY","optionLabels":["포도","사과","오렌지","멜론"]}`, `errors`/`console` empty; functional: reopened in view, pick → `apple` |
| 13 | Select viewport flip (re-confirm) | trigger near bottom (`spaceBelow: 90`px), open | PASS | `{"innerHeight":633,"trigTop":499,"menuTop":289,"menuBottom":493,"flippedAbove":true,"lastOptTop":442,"lastOptBottom":484,"lastOptInViewport":true}`; screenshot `f04` |
| 14 | Tooltip | hover; **focus** shows; position/theme variant; **controlled `open`**; **`portal={false}` inline** (all names per TooltipProps) | PASS | hover: `{"count":1,"text":"임시 저장돼요","position":"top","inBody":true,"role":"tooltip","idMatch":true}` → unhover `0`; focus: `{"countOnFocus":1}` → blur to next trigger swaps bubble; bottom variant `{"bottomPos":"bottom","bottomTheme":"reverse"}`; controlled: toggle → `{"tipTexts":["제어된 말풍선"],"ctlVisibleWithoutHover":true}` → toggle off `[]`; inline: `{"insideWrap":true,"inBody":false,"styleAttr":null}` |
| 15 | Toast | success/danger/info/warning; auto-dismiss observed; manual close; **pause-on-hover**; `toast.dismiss()`; `max`/`position` options (both in ToasterProps) | PASS | fired 4 states with `max={3}` → `{"position":"bottom-right","visibleCount":3,"states":[warning status,info status,danger **role=alert**]}` (oldest success evicted); `toast.dismiss()` → `0`; auto (duration 2500) → alive at fire, `0` after 3.5 s; pause-on-hover: hover stack → `expanded:"true"`, **still alive after 4 s hover**, gone ~3 s after unhover; manual toast survived 3.5 s then closed via its X → `0`; inline Toast X → `toast-closed`→`true` |
| 16 | Table | `defaultSelected`; row click toggle; disabled row no-op; header select-all; **drag range-selection** (real mouse down/move/up) | PASS | initial readout `0`, `row0 data-selected="true"`, row2 `data-disabled="true"` + its checkbox disabled; click 샤인머스캣 → `0,1`; click 품절 상품 → `0,1` (unchanged); select-all → `0,1,3,4` (skips disabled), again → `none`; drag from row0 check cell through rows: readout `0,1` mid-drag → `0,1,3` (disabled row 2 skipped) → stays `0,1,3` after mouseup; screenshot `f08` |
| 17 | Field | label/helper/error/required/count wiring; **Field `disabled` disables wrapped Input** (fixed bug); default vs explicit id | PASS | typed 3 chars → `{"count":"3/10","helper":"10자 이내로 입력해요","required":"true","inputId":"_R_puavb_-control","labelFor":"_R_puavb_-control","idMatch":true,"ariaRequired":"true","maxLength":10}`; error field: `{"errorText":"이메일 형식이 아니에요","errAriaInvalid":"true","errDescribedby":"_R_19uavb_-error","errorId":"_R_19uavb_-error"}`; disabled field: `{"disInputDisabled":true,"disFieldData":"true","focusRefused":true}` + typing attempt → value stays `""` (keystrokes landed in the previously-focused control); explicit: `{"explicitId":"custom-field-control","explicitLabelFor":"custom-field-control"}` |
| 18 | Icon | all 9 glyphs render non-empty `::before` | PASS | `menu E001, chevron-left E002, chevron-right E003, calendar E004, time E005, refresh E006, check E007, close E008, search E009` — every one `fontFamily:"PodoIcons"`, `contentLen:3`; `fontsLoaded:["loaded"], fontCheck:true`; screenshot `f09` |
| 19 | Typography + theme + responsive | h1/body sizes; provider context toggle; 900 px viewport | PASS | at 1280 px: `{"h1FontSize":"32px","bodyFontSize":"16px","h1Tag":"H1"}`; `set viewport 900 800` → `{"innerWidth":900,"h1FontSizeAt900":"28px"}` (from generated `tokens.css` media query) → restored 1280 → `32px`; theme: `theme-context` `landing/light`→`landing/dark` (`data-color-scheme="dark"`)→back |
| 20 | DatePicker (all sub-checks) | see breakdown below | PASS | see breakdown |
| 21 | Editor | see breakdown below | PASS | see breakdown |
| 22 | Zero unexplained console/page errors | `errors`/`console` after load, mid-run, and final sweep | PASS | every `errors`/`console` invocation printed **nothing** (empty = none); `server.log` = Ready banner only |
| 23 | next build + production serve + raw SSR | full section above | PASS | build output + curl fragments quoted above |
| 24 | Select defaultOpen on SSR page | prerender + post-mount menu | PASS | SSR: `data-open="true"` with `podo-select__menu ×0` (no crash — build prerendered `/` statically); post-mount browser eval: `menuCount:1`, options listed, `errors` empty (quoted in row 12) |
| 25 | Hydration cleanliness | console across the entire pass | PASS | zero console output at initial load, after both reloads, and at final sweep — no hydration-mismatch warnings at any point |
| 26 | `podo-ui/icons.css` import + PodoIcons font incl. check | layout import + computed styles | PASS | `app/layout.jsx:2` `import "podo-ui/icons.css";`; computed `font-family: PodoIcons` on all icons and **check = E007** (row 18); `document.fonts` status `loaded` |
| 27 | RSC boundary note | installed dist banner | PASS | all four dist entry files begin with `"use client";` (quoted in Freshness) — importing from a Server Component remains a legal server→client boundary, matching the §5 probe of the earlier round |

### Item 20 breakdown — DatePicker

| Sub-check | Result | Evidence |
|---|---|---|
| instant/date pick (regression) | PASS | calendar opened (year/month selects `2026`/`7월`); clicked gridcell `2026년 7월 15일` → `dp-value`→`2026-07-15`, dropdown closed, trigger `2026-07-15` |
| period/date Apply (regression) | PASS | two calendars (`grids:["2026년 7월","2026년 8월"]`); picked 7/5 then 7/20 → readout still `none~none` (uncommitted), `periodText:"2026년 7월 5일 ~ 2026년 7월 20일"`, `rangeCells:14`; 적용 → `2026-07-05~2026-07-20`, closed. (First 적용 click landed during a screenshot-scroll and missed — retried with the identical command; both attempts logged.) |
| instant/time | PASS | native selects (`시 선택`/`분 선택`): 14 → `14:00`, 30 → `14:30`; icon `podo-icon-time` |
| **period+time commits via Apply** (fixed) | PASS | set 4 selects (9/15/18/45) → readout **stays `none~none`**, `{"pendingActionsVisible":true,"applyPresent":true,"displayedTemp":"9,15,18,45"}`; 적용 → `09:15~18:45`, actions closed |
| **instant+showActions stays open, commits via Apply** (fixed) | PASS | day-10 click → readout still `none`, `{"dropdownStillOpen":true,"triggerShowsTemp":"2026 - 07 - 10"}`; 적용 → `2026-07-10`, `closedAfterApply:true` |
| **placeholder prop renders** (fixed) | PASS | `{"placeholderShown":"날짜 선택","isPlaceholderClass":"podo-dp-inputPart  podo-dp-placeholder"}` — also in raw SSR HTML |
| **초기화 commits cleared value** (fixed) | PASS | after committed `2026-07-10`: open → click `.podo-dp-reset` → readout `none`, `{"closedAfterReset":true,"triggerBackToPlaceholder":"YYYY - MM - DD"}` (this instance has no placeholder prop → format template) |
| **Escape closes + refocuses trigger** (fixed) | PASS | `{"openBeforeEscape":true}` → Escape → `{"openAfterEscape":false,"activeTag":"BUTTON","activeClass":"podo-dp-inputPart ","activeText":"2026-07-15","isTriggerInsideDpInstant":true}` |
| a11y: nav names, day labels, grid roles | PASS | `snapshot -i`: `button "이전 달"`, `button "다음 달"`, `combobox "년도 선택"`, `combobox "월 선택"`, `gridcell "2026년 7월 15일"` …; eval: `{"gridRole":"grid","gridLabel":"2026년 7월","rowCount":7-row layout,"colHeaders":"일월화수목금토","day15Label":"2026년 7월 15일"}` |

### Item 21 breakdown — Editor

| Sub-check | Result | Evidence |
|---|---|---|
| role/aria | PASS | `{"role":"textbox","ariaMultiline":"true","ariaLabel":"리치 텍스트 편집기","contenteditable":"true"}` |
| type text (onChange) | PASS | `editor-html` → `<p>초기 내용 이어쓴 문장</p>` |
| bold / italic / underline / strike | PASS | successive: `<p><b>…</b></p>` → `<b><i>…` → `<b><i><u>…` → `<b><i><u><strike>초기 내용 이어쓴 문장</strike></u></i></b>` |
| undo / redo (Ctrl+Z / Ctrl+Y inside editor) | PASS | Ctrl+Z removed `<strike>`; Ctrl+Y restored it; Ctrl+Z removed again (focus verified `podo-ed-editorContent`) |
| unordered / ordered list | PASS | 목록 → `<ul><li>…</li></ul>`; 번호 목록 → `<ol><li>…</li></ol>` |
| alignment | PASS | align dropdown options `["왼쪽 정렬","가운데 정렬","오른쪽 정렬"]`; 가운데 정렬 → `<li style="text-align: center;">` |
| link insert via dialog | PASS | selected text, 링크 → dropdown w/ URL input; filled `https://podoui.com`, 삽입 → `<a href="https://podoui.com" target="_blank" rel="noopener noreferrer">초기 내용 이어쓴 문장</a>` |
| code-view toggle | PASS | `HTML 코드보기` → `textarea.podo-ed-codeEditor` with pretty-printed HTML (`"<p>\n</p>\n<ol>\n  <li style=…"`), contenteditable unmounted; `에디터로 전환` → back |
| **SCOPE FIX: Ctrl+Z in outside input** | PASS | typed `바깥 입력 텍스트` into `[data-testid=editor-outside-input]` (focus verified outside editor root); editor html before `<p><b>초기 내용 추가분</b></p>` (bold in undo history); **Ctrl+Z** → `{"outsideInputValueAfterCtrlZ":"바깥 입력 텍스트","editorHtmlReadoutAfterCtrlZ":"<p><b>초기 내용 추가분</b></p>","editorDomAfterCtrlZ":"<p><b>초기 내용 추가분</b></p>","focusedTid":"editor-outside-input"}` — the editor's undo did **not** fire and the input was untouched |
| EditorView renders HTML | PASS | `{"viewClass":"podo-ed-editorView ","viewInnerHTML":"<p><b>초기 내용 추가분</b></p>","matchesReadout":true,"boldRendered":true}` |

## Corrections to earlier-round claims (explicit)

1. **STALE (first pass §2 note + `datepicker.tsx:945` citation):** "DatePicker's SSR placeholder is the format template `YYYY-MM-DD`, not the `placeholder` prop — intended behavior." The current code makes the `placeholder` prop win (`packages/react/src/datepicker.tsx:1025-1030`, `placeholder ?? (dateFormat ? …)`); verified both in raw SSR HTML (`>날짜 선택<`) and hydrated. Instances without a `placeholder` prop still show the format template (e.g. `YYYY - MM - DD`), which is the documented fallback.
2. **STALE (re-verification note):** "The default glyph bundle covers 6 icons … `<Icon name="check" />` is outside this set and still renders empty; expected." The shipped bundle now covers **9** glyphs (`PodoIcons.metadata.json` codepoints 57345–57353) and `check` (E007), `close` (E008), `search` (E009) all render — verified by computed `::before` charcodes.
3. **Superseded scope:** the first pass verified 18 components with basic interactions; this pass adds controlled/disabled/readOnly/keyboard/a11y coverage for every checklist item, so the table above supersedes the first-pass table. No first-pass PASS was overturned.

## Console / page errors (items 22, 25)

- `errors` / `console` after initial load: **empty**. After each of the two mid-run reloads: **empty**. Final sweep at end of pass: **empty**.
- No hydration-mismatch or React warnings at any point in the whole pass.
- `server.log`: Ready banner only.
- Two agent-browser session hiccups occurred (tab reset to `about:blank`): once after a `fill` attempt on the disabled input with a shortened env timeout, once immediately after a `press Control+z`. In both cases `errors`/`console` were empty before the reset, the page was reloaded, and the interrupted checks were re-run cleanly — including the identical `Control+z` sequence, which then passed with full evidence. Same hiccup class was recorded in both earlier rounds. Not a page/app error.
- Two automation retries (both logged honestly): (a) period-picker 적용 click issued right after a screenshot missed (scroll made coordinates stale) — identical retry committed; (b) `find text "초기화" click` did not match (button label contains a glyph icon node) — clicked via `.podo-dp-reset`.

## Screenshots (`reports/next-shots/`, f-prefix)

`f01-initial-defaultopen.png` (post-mount defaultOpen state), `f02-defaultopen-reopened.png`, `f03-select-multi-maxchips.png` (3 chips + `+1`), `f04-select-flip.png` (menu flipped above trigger), `f05-tooltip-hover.png`, `f06-toast-stack-max3.png` (warning/info/danger stack, bottom-right), `f07-toast-pause-on-hover.png`, `f08-table-drag-range.png` (rows 0,1,3 selected, disabled row 2 unselected), `f09-icons.png` (9 glyphs), `f10-responsive-900.png` (h1 28 px), `f11-datepicker-open.png` (calendar + named nav), `f12-datepicker-period.png` (range highlighted, actions row), `f13-datepicker-period-time-pending.png`, `f14-editor-styles.png`, `f15-editor-codeview.png`, `f16-editor-final.png`, `f17-final-page.png`.

## How to reproduce

```sh
cd /private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next
# full rebuild steps are documented in start.sh (npm i tarball, podo init/build, .ts cleanup, next build)
./start.sh                          # next start -p 5212 -H 127.0.0.1, pid in server.pid
curl -s http://127.0.0.1:5212/ | grep -o '날짜 선택'     # SSR check
# open http://127.0.0.1:5212/ — every readout is a data-testid span
kill $(cat server.pid)
```

Server was killed and session `next3` closed at the end of the pass (logged).

---
---

# History — earlier rounds (kept verbatim; superseded where the Corrections section says so)

# Podo UI v2 — Next.js runtime verification (2026-07-20)

- Package under test: `podo-ui-2.0.4.tgz` (packed local build, installed via `npm i <tarball>` — NOT the registry)
- Harness: `/private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next`
- Runtime: Next.js 16.2.10 (App Router, Turbopack), react 19.2 / react-dom 19.2, node v25.8.2, npm 11.11.1
- Server: `next start -p 5212 -H 127.0.0.1` (production build)
- Browser: `npx agent-browser --session next …` for every browser step; full command output in `reports/next-commands.log`
- Verdict: **18/18 components PASS**. The 2 findings from the first pass (A: Select portal menu unreachable past viewport; B: icon glyphs missing from tarball) are both **RESOLVED** in the repacked `podo-ui-2.0.4.tgz` (sha1 `ec37fab…`) — see "Re-verification (post-fix, tarball sha ec37fab)" at the end of this report.

## 1. Production pipeline — PASS

`npx next build` output tail (observed):

```
▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 2.1s
✓ Generating static pages using 4 workers (3/3) in 347ms
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
```

Served with `nohup npx next start -p 5212 -H 127.0.0.1 > server.log 2>&1 &`; `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5212/` → `200`. `server.log` shows `✓ Ready in 160ms` and no errors for the whole session.

## 2. SSR (raw HTML, no JS) — PASS

`curl -s http://127.0.0.1:5212/ > reports/next-ssr.html` (21,062 bytes, saved next to this report). Occurrence counts in the pre-hydration HTML (`grep -o | wc -l`):

| fragment | count |
|---|---|
| `podo-button__label` | 6 |
| `저장하기` (Button label) | 1 |
| `포도 한 상자` (Table cell) | 1 |
| `헤드라인 텍스트` (Typography h1) | 1 |
| `인라인 토스트 제목` (Toast) | 1 |
| `data-podo-theme` (ThemeProvider) | 1 |
| `podo-icon-menu` (Icon) | 1 |

Quoted fragment from the raw HTML (DatePicker + Typography region):

```html
<p data-testid="typo-body" class="podo-text podo-text--body">본문 텍스트예요.</p></section>
<section id="sec-datepicker" ...><div class="podo-dp-datepicker "><div class="podo-dp-input  ">
<div class="podo-dp-inputContent"><button type="button" class="podo-dp-inputPart  podo-dp-placeholder">YYYY-MM-DD</button></div>
<i class="podo-dp-inputIcon podo-icon podo-icon-calendar"></i></div></div><span data-testid="dp-value">none</span>
```

Note: DatePicker's SSR placeholder is the format template `YYYY-MM-DD`, not the `placeholder` prop — intended behavior per `packages/react/src/datepicker.tsx:945` ("format이 있으면 placeholder도 포맷에 맞게 표시"). **[STALE — see Corrections #1 in the final report above: the placeholder prop now wins and renders `날짜 선택`.]**

## 3. Hydration cleanliness — PASS

- After initial `open http://127.0.0.1:5212/`: `npx agent-browser --session next errors` → **no output**; `console` → **no output**.
- Re-checked mid-run (after the multi-select investigation) and at the very end of the session: `errors` → no output, `console` → no output.
- No hydration-mismatch or React warnings appeared at any point (see `next-commands.log`, entries after `== errors (after load) ==`, `== console (after load) ==`, and the final `>> agent-browser errors` / `console`).

## 4. Component coverage (18/18)

All interactive state was mirrored into DOM readouts (`data-testid` spans) and asserted with `get text` / `get value` / `get attr` / `get count`. Decisive observed outputs are quoted.

| # | Component | Rendered (SSR + hydrated) | Interactions exercised | Result | Evidence (observed output) |
|---|---|---|---|---|---|
| 1 | PodoThemeProvider | yes | `usePodoTheme` readout; toggle colorScheme via button | PASS | `get text [data-testid=theme-context]` → `landing/light` → after click → `landing/dark`; `eval …dataset.colorScheme` → `"dark"` |
| 2 | Button | yes | 2 clicks (onClick+onPress); disabled button programmatic `.click()` | PASS | `btn-clicks`→`2`, `btn-presses`→`2`, `btn-disabled-clicks`→`"0"`, `get attr … aria-disabled`→`true` |
| 3 | Chip | yes | toggle (onSelectedChange); removable chip X (onRemove) | PASS | `chip-selected`→`true`; `get attr data-state`→`selected`; `chip-removed`→`true` |
| 4 | Badge | yes | static render: theme, dot mode | PASS | `get text badge-danger`→`99+`; `get attr data-theme`→`danger`; dot eval → `{"dot":"true","text":"","cls":"podo-badge"}` (children ignored as documented); `get count .podo-badge`→`3` |
| 5 | Switch | yes | click toggle (onCheckedChange) | PASS | `switch-state`→`on`; `aria-checked`→`"true"` |
| 6 | Checkbox | yes | click toggle; indeterminate rendered | PASS | `checkbox-state`→`checked`; snapshot shows `checkbox … [checked=mixed]`; eval → `"indeterminate-present"` |
| 7 | Radio | yes | select 포도 then 사과 (controlled group) | PASS | `radio-value`→`grape` then `apple` |
| 8 | Input | yes | `fill` + onValueChange readout | PASS | `get value`→`포도조아`; `input-value`→`포도조아` |
| 9 | Textarea | yes | `fill` + onValueChange readout | PASS | `get value`→`여러 줄 내용`; `textarea-value`→`여러 줄 내용` |
| 10 | Select | yes | single: open portal menu, pick 사과; multi: toggle 3 options across reopens, chip-remove on trigger, 모두 해제 (clearable) | PASS (see Finding A) | single: `select-value`→`apple`, trigger text `"사과"`; multi: `select-multi`→`grape` → `grape,orange,melon` (menu stayed open, options `[selected]` in snapshot) → chip X → `apple` → clear-all → `none` |
| 11 | Tooltip | yes | hover trigger → portal bubble; unhover → gone | PASS | `get count .podo-tooltip` 1 while hovered, `0` after; eval → text `"임시 저장돼요"`, `inBody:true`, `aria-describedby` injected |
| 12 | Toast / Toaster / toast() | yes | `toast()` + `toast.success()` (manual), close inline Toast via X, dismiss stack | PASS | `.podo-toast` count 1→2→3; stack eval → `[{"state":"success","title":"성공했어요","caption":"성공 캡션"},{"state":"normal","title":"저장됐어요"}]`; `toast-closed`→`true`; after dismiss count→`0` |
| 13 | Table | yes | row-1 checkbox, select-all, deselect-all (onSelectionChange) | PASS | `table-selected`→`0` → `0,1,2` → `none` |
| 14 | Field | yes | auto char counter, maxLength cap, error text | PASS | after typing 3 chars `.podo-field__count`→`3/10`; 12-char fill capped: `get value`→`열두글자를넘겨보려는` (10 chars), count `10/10`; `.podo-field__error`→`이메일 형식이 아니에요`; helper→`10자 이내로 입력해요` |
| 15 | Icon | yes | static render ×3 | PASS (see Finding B) | `get count i.podo-icon`→`5` (3 in section + calendar + editor); eval → `{"cls":"podo-icon podo-icon-menu","tag":"I","ariaHidden":"true"}` |
| 16 | Typography | yes | h1 + body variants | PASS | `get text typo-h1`→`헤드라인 텍스트`; eval → `{"hTag":"H1","hCls":"podo-text podo-text--h1","bTag":"P","bCls":"podo-text podo-text--body"}` |
| 17 | DatePicker | yes | open calendar (year/month selects present, 2026년/7월), click day 15, onChange readout | PASS | `dp-value`→`2026-07-15`; trigger text eval → `"2026-07-15"` |
| 18 | Editor + EditorView | yes | click + type in contenteditable (onChange), select-all + 굵게 toolbar; EditorView mirrors HTML | PASS | `editor-html`→`<p>초기 내용 이어쓴 문장</p>`; after bold → `<p><b>초기 내용 이어쓴 문장</b></p>`; EditorView innerHTML eval → identical string |

## 5. Server/client boundary (throwaway probe) — observed behavior

Added `app/rsc/page.jsx` that imports `{ Button, Badge } from "podo-ui/react"` **without** `"use client"` and renders them from a Server Component. Observed outcome: **`next build` succeeds** —

```
✓ Compiled successfully in 1908ms
Route (app)
┌ ○ /
├ ○ /_not-found
└ ○ /rsc
○  (Static)  prerendered as static content
```

Reason: every `dist/react/*.js` file in the tarball ships a `"use client"` banner (verified: `dist/react/index.js`, `dist/react/datepicker.js`, `dist/react/editor/index.js`, `dist/react/editor/view.js` all start with `"use client";`), so importing from a Server Component is a legal server→client boundary and the components hydrate as client components. No RSC error is produced. The probe was then deleted and the final build re-run green (routes `/` and `/_not-found` only).

## 6. Findings (non-blocking)

**A. Portal Select menu is unreachable when it extends past the viewport (UX hazard, also breaks naive automation).** — **RESOLVED (re-verified 2026-07-20, tarball ec37fab)**: the portal menu now flips above the trigger (or caps its height) when it would overflow the viewport; the previously unreachable last option was clicked with a real pointer click and the readout updated while the menu stayed open. Evidence in the re-verification section below.
Original finding (first pass):
With the Select mid-page, the open portal menu's last option sat below the fold (`getBoundingClientRect().top` 688 vs `innerHeight` 633; `elementFromPoint` → null). Any page scroll closes the menu by design ("Portal 메뉴는 스크롤/리사이즈를 따라가지 않고 닫아요", `packages/react/src/index.tsx:1050`, listener at `:1068`), and the portal positioning effect (`:1038-1048`) does not clamp/flip the menu into the viewport. Net effect: a user (or automation that scrolls-into-view before clicking) cannot reach off-screen options — the scroll closes the menu before the click lands. Verified not to be a logic bug: with the trigger scrolled near the viewport top first, real pointer clicks toggled values correctly and the menu stayed open (`grape` → `grape,orange,melon`). Suggest viewport clamping or flip-up positioning.

**B. Icon glyphs don't render from the tarball alone.** — **RESOLVED (re-verified 2026-07-20, tarball ec37fab)**: the tarball now ships `dist/icons-assets/PodoIcons.css` (+ woff/woff2) exported as `"podo-ui/icons.css"`, and `import "podo-ui/icons.css"` (the documented consumer path, README "스타일") makes `.podo-icon` compute `font-family: PodoIcons` with real `::before` glyph codepoints. Evidence in the re-verification section below.
Original finding (first pass):
`<Icon name="menu" />` produces correct markup (`<i class="podo-icon podo-icon-menu" aria-hidden="true">`), but packaged `styles.css` ships only the `.podo-icon` base — per its own comment the glyph font/codepoints live in a *generated* `PodoIcons.css` (`packages/podo-ui/styles.css:1622`), which the tarball does not include. Computed font-family on the icon is the body font (`"Apple SD Gothic Neo"`), so icons are visually empty in a plain `npm i podo-ui` + `import "podo-ui/styles.css"` app (affects the DatePicker calendar icon too). Markup-level PASS; flagging the packaged-experience gap for the maintainer.

Minor observations (not defects):
- DatePicker shows `YYYY-MM-DD` (format template) instead of the `placeholder` prop when `format` is set — intended per `datepicker.tsx:945`. **[STALE — fixed; see Corrections #1 above.]**
- Mid-session the browser tab once ended up on `about:blank` after a `press Escape` (agent-browser session hiccup, not a page error — `errors`/`console` were empty). The page was reloaded and all remaining checks rerun; assertions before the reload were already captured in the log.
- React commits from programmatic `.click()` in `eval` land after the same-tick `textContent` read — same-call readouts can look stale; all assertions above used separate follow-up `get text` calls.

## 7. Console / page errors

- `errors` after initial load: **empty (no page errors)**
- `console` after initial load: **empty (no console messages)**
- `errors` / `console` mid-run and at end of session: **empty**
- `server.log` (SSR side): only the Ready banner; no errors.

## 8. Screenshots (`reports/next-shots/`)

1. `01-initial.png` — full kitchen sink after hydration
2. `02-select-multi.png` — multi select with 1 chip (during investigation)
3. `03-select-multi-open.png` — multi menu open, 3 options selected
4. `04-tooltip.png` — tooltip bubble visible on hover
5. `05-toasts.png` — Toaster stack (normal + success) + inline toast
6. `06-table-selected.png` — table with all rows selected
7. `07-field.png` — field counter 10/10 + error field
8. `08-datepicker-open.png` — calendar open (2026-07)
9. `09-datepicker-picked.png` — trigger showing 2026-07-15
10. `10-editor.png` — editor with bolded content
11. `11-final.png` — final page state

## 9. How to reproduce

```sh
cd /private/tmp/claude-501/-Users-tarucy-project-podoui/885735ab-d9d3-4bc8-9008-5a94bf821edb/scratchpad/harness/next
npx next build        # only if .next/ is missing
./start.sh            # nohup next start -p 5212 -H 127.0.0.1, pid in server.pid
# open http://127.0.0.1:5212/  (kitchen sink; all readouts are data-testid spans)
# SSR check: curl -s http://127.0.0.1:5212/ | grep -o '저장하기'
kill $(cat server.pid)
```

Full agent-browser transcript: `reports/next-commands.log` (171 commands). Raw SSR snapshot: `reports/next-ssr.html`.

## Re-verification (post-fix, tarball sha ec37fab)

Date: 2026-07-20 (same day, later session). Repo rebuilt with fixes; `pnpm check` fully green upstream (21 files, 184 tests). The tarball `podo-ui-2.0.4.tgz` was **repacked in place at the same version**, so the stale copy was removed deterministically before reinstalling:

```sh
cd harness/next
rm -rf node_modules/podo-ui package-lock.json
npm install ../../podo-ui-2.0.4.tgz     # sha1 ec37fab54586fcc0ed5e7b3737091f48c71dc9e1
```

Freshness proof: before reinstall the installed `package.json` had no `"./icons.css"` export; after reinstall `node_modules/podo-ui/dist/icons-assets/` exists (`PodoIcons.css` 634B, `PodoIcons.woff` 1328B, `PodoIcons.woff2` 924B, + metadata/ts files) and `package.json:21` reads `"./icons.css": "./dist/icons-assets/PodoIcons.css"`.

Harness change (per README "스타일", now the documented consumer path): `app/layout.jsx` gained `import "podo-ui/icons.css";` next to the existing `import "podo-ui/styles.css";`. Rebuilt (`npx next build` → `✓ Generating static pages using 4 workers (3/3) in 422ms`, routes `/` + `/_not-found`), restarted via `./start.sh`, `curl -w "%{http_code}"` → `200`. Browser: `npx agent-browser --session next2` for every step (fresh session).

| # | Fix under test | Result | Decisive observed evidence |
|---|---|---|---|
| 1 | Icon packaging: default glyph bundle shipped + exported as `podo-ui/icons.css` | **PASS** | Served CSS chunk contains `@font-face{font-family:PodoIcons;src:url(../media/PodoIcons.2u5-7qjhit3pw.woff)format("woff"),url(../media/PodoIcons.1wx1r7kvf490i.woff2)format("woff2");font-display:block` and glyph rules whose hexdump shows `content:"\ee 80 81"` (U+E001) / `\ee 80 84` (U+E004); both font URLs serve `200 font/woff 1328B` / `200 font/woff2 924B`. In-browser eval: `{"menuFontFamily":"PodoIcons","menuBeforeHex":"22,e001,22","calFontFamily":"PodoIcons","calBeforeHex":"22,e004,22"}` — i.e. `.podo-icon` computed font-family is now `PodoIcons` (was `"Apple SD Gothic Neo"` in the first pass), `podo-icon-menu::before` content is `""` and the DatePicker calendar icon `podo-icon-calendar::before` is `""`. `document.fonts`: `{"podoIconsFaces":["loaded"],"checkFn":true}`. Calendar nav chevrons also render: `{"ff":"PodoIcons","beforeHex":"22,e002,22"}` (U+E002). Re-confirmed after a later reload: `{"menuFF":"PodoIcons","menuBeforeHex":"22,e001,22","calFF":"PodoIcons","calBeforeHex":"22,e004,22"}`. Screenshots `r1-datepicker-icon-closed.png`, `r2-datepicker-icons-open.png` show the calendar icon in the input and visible ‹ › nav glyphs. |
| 2 | Select viewport flip/cap: previously-unreachable off-screen option is now clickable | **PASS** | Reproduced the first-pass failing geometry: multi Select trigger scrolled to `triggerBottom: 553` with `innerHeight: 633` (`spaceBelow: 80` px — a 4-option ≈198px menu cannot fit below; in the first pass the last option sat at `top: 688 > 633` and `elementFromPoint` → `null`). After opening: `{"innerHeight":633,"trigger":{"top":509,"bottom":553},"menu":{"top":305,"bottom":503,"height":198},"flippedAboveTrigger":true,...,"options":[...,{"label":"멜론","top":452,"bottom":494}]}` — the menu **flipped above the trigger** (menu bottom 503 ≤ trigger top 509) and every option is inside the viewport (452/494 < 633). Hit-test: `elementFromPoint(426,473)` → `SPAN.podo-select__cell-label`, `hitIsInsideLastCell: true` (was `null`). Real click on 멜론: readout `[data-testid=select-multi]` `none` → `melon`, menu eval → `{"menuOpen":true,...{"label":"멜론","ariaSelected":"true","dataState":"selected"}}` — selection landed AND the menu stayed open. Clean confirmation pass after a reload reproduced identical geometry (`{"menuTop":305,"menuBottom":503,"flipped":true,"lastLabel":"멜론","lastTop":452,"lastBottom":494,"lastInViewport":true}`) and toggled two options in one open menu: readout `none` → `melon` → `melon,grape`, final eval `{"menuOpen":true,"selected":["포도","멜론"]}`. Screenshots `r3-select-flipped-open.png` (menu rendered above trigger), `r4-select-melon-selected-menu-open.png`, `r5-select-two-selected-menu-open.png` (both checkboxes checked, chips `멜론 ×` `포도 ×` on trigger, readout `melon,grape`). |
| 3 | Hydration/regression after rebuild | **PASS** | Raw SSR re-curled to `reports/next-ssr-refix.html` (21,127B): `podo-button__label` ×6, `저장하기` ×1, `포도 한 상자` ×1, `헤드라인 텍스트` ×1, `인라인 토스트 제목` ×1, `data-podo-theme` ×1, `podo-icon-menu` ×1, `podo-icon-calendar` ×1, `podo-dp-datepicker` ×1 — component markup unchanged. Browser `errors` / `console`: **empty** after initial load, empty after the mid-pass reload, and empty at the final check. `server.log`: Ready banner only. |

Notes for the auditor:

- One agent-browser session hiccup: after the r4 screenshot, an *optional* extra interaction (`find text "포도" click` — an ambiguous selector matching Radio labels/table cells too) coincided with an agent-browser `relaunched browser` event. No page error was involved (`errors`/`console` empty before and after). The page was reloaded and the whole Fix-2 interaction re-run cleanly with scoped selectors (`.podo-select__menu .podo-select__cell:last-child` / `:first-child`) — that clean pass produced the `none → melon → melon,grape` + `menuOpen:true` evidence above. The same class of hiccup was already noted in the first-pass report.
- The default glyph bundle covers 6 icons (`menu`, `calendar`, `chevron-left`, `chevron-right`, `refresh`, `time` — `PodoIcons.metadata.json`). The kitchen sink's `<Icon name="check" />` is outside this set and still renders empty; expected per bundle contents (project `podo build` output covers custom sets), not a regression. **[STALE — the current bundle ships 9 glyphs incl. check/close/search; see Corrections #2 above.]**
- The portal wrapper is `.podo-select__menu-list` appended to `<body>` (menu itself `position: static` inside it), so the first-pass "portal menu" architecture is unchanged — only positioning gained the flip/cap.

New screenshots (`reports/next-shots/`, `rN-` prefix): `r1-datepicker-icon-closed.png`, `r2-datepicker-icons-open.png`, `r3-select-flipped-open.png`, `r4-select-melon-selected-menu-open.png`, `r5-select-two-selected-menu-open.png`, `r6-final.png`. Full command transcript appended to `reports/next-commands.log` under the `########## RE-VERIFICATION (post-fix, tarball ec37fab)` banner. Server killed and session `next2` closed at end of pass.

## Final tarball note

After this report's verification pass (tarball b70028087aeb…), one further fix
landed: checkbox checked-paint selectors changed from
`[data-state="checked"]` to the live `:checked` pseudo-class
(packages/web/src/index.ts + packages/podo-ui/styles.css; markup unchanged).
Final tarball is 16b6e55f3d2c…. This runtime re-renders `data-state` on every
toggle, so checkbox behavior here is visually identical under either selector —
the git diff between the two tarballs contains only that CSS selector swap and
its web shadow-DOM snapshot updates (see repo git history; repo gate re-run
green: 23 files / 215 tests).

## Final artifact note (tarball 76b395ba4081…)

After this report's definitive pass (tarball 02fbd90ecc34…), one further fix
landed in `packages/native/src/index.tsx` only (Select trigger: swallow the
one onPress that react-native-web synthesizes from a handled Enter keydown —
the round-E native B5 finding). No file consumed by this runtime changed:
`@podoui/react`, `@podoui/hono`, `@podoui/web`, `@podoui/cli`, `styles.css`,
and the icon assets are identical between the two tarballs (working-tree diff
between the packs touched only `packages/native/src/index.tsx` and its test;
the native re-verification session additionally hash-matched the installed
`dist/react/index.js` against the value recorded in this report's session).
Repo gate re-run green on the final artifact: 23 files / 261 passed | 2
skipped (263). This report's evidence therefore stands for tarball
76b395ba4081bf5507d0949dde59a1eac1c1d61f.

## Final artifact note (tarball 7064859bf44b…)

A final fix round landed after this report's definitive pass: react-package
fixes (Editor validation timer race + code-view A→B→A sync + swatch/table-grid
accessibility, Table defaultSelected disabled-row filtering, Field controlled
counter sync, searchable-Select focus restore, DatePicker boundary-minute
rendering), hono fixes (native required for Field-wrapped Checkbox/Radio, Icon
size/decorative API, renderCriticalCss css-param escaping), and native fixes
(provider iconGlyphs resolution, Button pressed/disabled treatment, ScrollView
contentContainerStyle split, keyboard scroll-follow, counter sync, stale-lock
ref guard, example host-injection). All are unit-tested (repo gate green:
23 files / 276 passed | 2 skipped = 278) and the react-package changes were
browser-spot-checked in the react harness (session react6 — this runtime
consumes the identical dist/react build; see reports/react.md "R5 spot-check").
The Next.js-specific evidence in this report (SSR/hydration/RSC/icons/build)
is unaffected by those changes except through the shared dist, whose behavior
the react6 spot-check covers.

## Final artifact delta (tarball b691f35c3c93…)

Two findings from the frozen round (session *8) were fixed after it:
1. The default `podo build` now emits the Badge binding vars: the CLI's
   defaultComponentDocuments embeds the spec badge document and the default
   token document gained the `color.palette.*` tokens it references (values ==
   the styles.css fallback hexes). Regression-locked by the CLI build test
   (`--podo-badge-root-background:` / `.podo-badge[data-theme="red"]` /
   `--podo-color-palette-error-5: #FEF1F1` assertions).
2. The Editor's unwired second hidden file input was removed (uploads into it
   were silently inert). Regression-locked by the editor test
   ("renders exactly one file input, wired to the image upload flow").
Repo gate on the final artifact: 23 files / 327 passed | 2 skipped (329).
Micro-verification in the react harness (session microv, logged commands):
fresh install + `podo build --force` → components.css contains 33
`--podo-badge-*` declarations (e.g. `[data-theme="red"] {
--podo-badge-dot-color: var(--podo-color-palette-accent-50); … }`), tokens.css
defines the palette vars; in-browser, the danger Badge's
`--podo-badge-root-background` computes to `#F23B3B` with backgroundColor
rgb(242,59,59) (previously the var computed empty), and each of the 3 mounted
Editors renders exactly one `input[type=file]` (was two each). No other module
changed: only dist/cli and dist/react/editor differ from 634f24ad.

## Closing delta (final tarball 9da8f7ec6667…)

Nine last real bugs from adversarial round 6 were fixed with red→green tests
(repo gate: 23 files / 340 passed | 2 skipped = 342): uncontrolled DatePicker
committed values now render (+`defaultValue` prop; browser-verified in the
react harness: placeholder → "2026 - 07 - 15" after an uncontrolled pick);
Select chip-remove/clear-all keyboard activation no longer swallowed by the
trigger handler; controlled/forced-open Tooltips re-measure on scroll/resize;
re-clicking a selected Editor image keeps a single wrapper; SSR aria-expanded/
aria-controls now track the portal menu's actual presence; native Select
clear-all routes through the stale-event lock; labeled dot Badges are real
accessibility elements (native accessible+image role, hono role="img");
hono Tooltip accepts an id for the spec's aria-describedby contract.
Remaining adversarial-round-6 items are NOT bugs and are catalogued as:
feature backlog (native uncontrolled-state APIs, Field label-press focus,
DatePicker enable/disable-function browser fixtures, Editor toolbar-filter/
resize fixtures, Tooltip position fixtures), design questions (Typography
variant default derived from `as` — consistent react/hono behavior), and
environment-bound evidence (real iOS/Android assistive-technology behavior —
RNW + unit tests are the attainable proxy here).
