# Hono ↔ React 패리티 표

Hono 렌더러가 React 렌더러의 공개 기능을 **전부** 제공하기 위한 정본 표예요(2026-11-17, todo.md F). 구조는 두 갈래예요.

- **서버(SSR)**: `packages/hono/src/index.tsx` 의 Hono 전용 렌더러가 React 초기 렌더와 같은 마크업을 내요. JS 없이도 폼 초깃값이 제출돼요.
- **클라이언트(island)**: `packages/react/src` 의 TSX 소스를 `hono/jsx/dom` 별칭으로 묶은 단일 정적 스크립트 `podo-ui/hono/client`(T3)가 상태·포털·효과가 있는 컴포넌트를 SSR 자리에 마운트해요. 상태가 없는 컴포넌트는 마운트하지 않고, 스크립트가 `document` 위임 리스너로 콜백을 CustomEvent 로 바꿔요.

행 수 확인(이 표가 전수인지): React 값 export **23개**, 타입 export **49개**(`index.tsx` 직접 선언 29 + 재수출 20).

```sh
pnpm --filter @podoui/react build
node --input-type=module -e 'import * as m from "./packages/react/dist/index.js"; console.log(Object.keys(m).length)'   # 23
grep -cE "^export (interface|type) " packages/react/src/index.tsx                                                         # 29
```

## 1. 공통 규칙

### 1.1 값 전달 (계획 D3)

| 기호        | 뜻                                                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JSON`      | 직렬화 가능 값 — SSR 이 island 래퍼 `data-podo-props` 에 그대로 싣고 클라이언트가 같은 prop 이름으로 넘겨요. `Date` 는 `{"$date":"YYYY-MM-DDTHH:mm:ss"}`(로컬 벽시계, `@podoui/core` `serializeProps`/`reviveProps`).              |
| `default`   | SSR 이 받은 값(`value`/`values`/`selected`)을 **비제어 초기값**(`defaultValue`/`defaultValues`/`defaultSelected`)으로 실어요(R1). 제어는 소비자가 `configure(id, { value })` 로 명시할 때만.                                       |
| `configure` | 함수·클래스 인스턴스·그것이 섞인 값 — SSR 은 prop 을 통째로 빼고 `data-podo-defer` 를 찍어요. 소비자가 `window.podo.client.configure(id, { prop })` 로 넘기면 바깥 island 가 마운트돼요(모든 defer 충족 시).                       |
| `slot`      | ReactNode 자식·슬롯 — SSR 이 그 영역에 `data-podo-slot="<prop>"` 를 찍고 정적 마크업을 내요. 클라이언트가 `domToVNode`(`packages/hono/src/client/dom-to-vnode.ts`)로 vnode 로 바꿔 같은 prop 에 넣어요. HTML 문자열 전달 없음(R3). |
| `event`     | React 콜백 → bubbling `CustomEvent('podo:<on 뺀 kebab>', { detail })`. detail 키 = React 콜백 인자 이름.                                                                                                                           |
| `native`    | 브라우저 이벤트가 그대로 일어나요(React `onClick`·`onChange` 등 DOM 핸들러). 함수 자체가 필요하면 `configure`.                                                                                                                     |

### 1.2 island / 비island 기준

island = React 컴포넌트가 **상태·포털·효과(hooks)** 를 갖는 것 → Select · DatePicker · Tooltip · Table(`checkbox` 일 때) · Toaster · Editor · Chip · **Switch**(T1 결정 D-2: `internalChecked` 상태). 비island = 네이티브 요소에 콜백만 얹은 것 → 마운트 없이 SSR 그대로 + 위임 이벤트. Field 는 글자 수 자동 카운트 상태가 있지만 자식 컨트롤을 품고 있어 island 로 만들지 않고, 위임 리스너가 카운트 숫자만 갱신해요(D-3).

### 1.4 configure 키와 `id` (T1 결정 D-1 — 계획 R2 구체화)

- configure 키는 island 래퍼의 **`data-podo-id="<id>"`** 예요. `window.podo.client.configure(id, …)` 는 `[data-podo-id]` 로 찾아요. 래퍼 자체에는 `id` 속성을 두지 않아요.
- 컴포넌트의 `id` prop 은 **React 가 받는 위치 그대로** 렌더해요 — Select 콤보박스·Chip 루트·Table·Switch 버튼. 그래서 Hono `Field` 가 연결한 `label[for]`·`aria-*` 가 그대로 유지돼요(래퍼 `span` 은 레이블을 붙일 수 없는 요소예요). 이 컴포넌트들은 `id` 를 props JSON 에도 실어요.
- React 가 `id` 를 받지 않는 컴포넌트(Tooltip·DatePicker·Toaster·Editor)의 Hono `id` 는 configure 키 전용이에요(props JSON 에서 빠져요).
- 같은 `id` 는 문서에 살아 있는 island 하나가 가져요 — 제거된 Chip 의 `id` 는 풀려서 같은 `id` 로 새로 `mount` 한 island 가 configure 를 받아요. `id` 없이 인라인으로 펼친 Select 메뉴의 리스트박스·셀 id 는 렌더 순서 자동 id(`podo-select-<n>`)라 같은 props 의 Select 가 여럿이어도 겹치지 않아요 — 요청마다 같은 마크업이 필요하면 `id` 를 주세요.
- 제어 모드(`configure(id, { value })` 등)에서 사용자가 값을 바꾸면 브리지가 저장 값을 먼저 갱신하고, 그다음 소비자 콜백·`podo:*` 이벤트가 불려요 — 그 안에서 다시 `configure` 한 값이 최종값이에요.
- SSR 이 만든 요소(`data-podo-generated=""` — 열린 Tooltip 의 인라인 말풍선 등)는 마운트 때 공유 컴포넌트가 다시 그려요. 그 요소의 `id` 는 트리거의 id 참조 속성(`aria-describedby`·`aria-labelledby` 등, Chip 트리거의 props 포함)에서 빠지고 기존 설명 `id` 는 남아요. 생성 요소 안의 island 복제본은 등록하지 않고, 슬롯 정의 `<template data-podo-slot>` 안 island(Tooltip 리치 `label`)와 생성 요소 id 는 바깥 island 의 구성원으로 등록·defer 집계·configure·id 정리 대상이에요. 사용자 `<template>` 안은 쓰이지 않는 마크업이라 등록하지 않고(defer 도 막지 않음) 마운트 때 옮기지도 않아요.
- Table 의 `thead`·`tbody` 는 직접 자식(또는 배열)로 넘겨요. Fragment 로 감싸면 React Table 은 선택 열을 만들지 않지만 Hono 는 마운트 때 DOM 에서 Fragment 경계가 사라져 선택 열이 생길 수 있어요 — Fragment 감싸기는 지원 범위 밖이에요.
- 래퍼 위치(계획 R6): 래퍼는 `span`(Table 만 `div`)이라 `<td>`·`<label>` 안에서 파서가 옮기지 않아요(`client.test.tsx` 「wrapper parsing」). island 를 `<table>`·`<tr>`·`<thead>` 의 직접 자식으로 두지 마세요. Select 의 SSR 루트는 React 처럼 `div` 라 `<p>` 안에 두면(래퍼와 무관하게) 파서가 `<p>` 를 닫아요 — Select 는 `<p>` 밖에 두세요.

### 1.3 테스트 ID

`<단계>/<파일>#<키>` — 파일은 `packages/hono/src/` 기준. 아직 없는 테스트는 해당 단계(T2~T6)가 이 ID 로 만들어요. `T1` 행은 이번 단계에 이미 있어요(`client/dom-to-vnode.test.ts`).

## 2. 값 export 전수표 (23)

| #   | React export        | 종류          | Hono 대응                                        | island                            | 이벤트(detail)                                                                                                                          | 마운트 후 승인 차이(§3.6 B)                                                                                                                      | 테스트 ID                                                                                                   |
| --- | ------------------- | ------------- | ------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1   | `Button`            | 컴포넌트      | `Button`                                         | 비island                          | `podo:press` `{ source: "button", originalEvent }`                                                                                      | —                                                                                                                                                | T2/index.test.tsx#button-attrs · T3/client.test.tsx#delegate-press                                          |
| 2   | `Chip`              | 컴포넌트      | `Chip`                                           | island(`span`)                    | `podo:press` `{ source: "chip", originalEvent }` · `podo:selected-change` `{ selected }` · `podo:remove` `{}`(cancelable, removable 만) | 없음                                                                                                                                             | T1/client/dom-to-vnode.test.ts#chip-label · T3/parity.test.tsx#chip · T3/client.test.tsx#chip-\*            |
| 3   | `Badge`             | 컴포넌트      | `Badge`                                          | 비island                          | —                                                                                                                                       | —                                                                                                                                                | 기존 index.test.tsx                                                                                         |
| 4   | `Switch`            | 컴포넌트      | `Switch`                                         | island(`span`, D-2)               | `podo:checked-change` `{ checked }`                                                                                                     | 없음                                                                                                                                             | T3/parity.test.tsx#switch · T3/client.test.tsx#switch                                                       |
| 5   | `Checkbox`          | 컴포넌트      | `Checkbox`                                       | 비island                          | `podo:checked-change` `{ checked }`                                                                                                     | —                                                                                                                                                | T3/client.test.tsx#delegate-checked                                                                         |
| 6   | `Radio`             | 컴포넌트      | `Radio`                                          | 비island                          | `podo:checked-change` `{ checked }`                                                                                                     | —                                                                                                                                                | T3/client.test.tsx#delegate-checked                                                                         |
| 7   | `Input`             | 컴포넌트      | `Input`                                          | 비island                          | `podo:value-change` `{ value, event }`(`input` 즉시)                                                                                    | —                                                                                                                                                | T2/index.test.tsx#input-attrs · T3/client.test.tsx#delegate-value                                           |
| 8   | `Textarea`          | 컴포넌트      | `Textarea`                                       | 비island                          | `podo:value-change` `{ value, event }`                                                                                                  | —                                                                                                                                                | T2/index.test.tsx#textarea-attrs · T3/client.test.tsx#delegate-value                                        |
| 9   | `Select`            | 컴포넌트      | `Select`                                         | island(`span`)                    | `podo:value-change` `{ value }` · `podo:values-change` `{ values }` · `podo:option-add` `{ option }`                                    | `defaultOpen`+`portal`: 메뉴가 `document.body` 에 생기고 트리거 `aria-expanded="true"`·`aria-controls` 추가(React 도 마운트 effect 뒤 같은 차이) | T1/client/dom-to-vnode.test.ts#select-prefix · T3/parity.test.tsx#select · T3/client.test.tsx#select-\*     |
| 10  | `Tooltip`           | 컴포넌트      | `Tooltip`                                        | island(`span`)                    | 없음(트리거 자체 이벤트는 `native`)                                                                                                     | 없음(닫힌 상태). 열리면 포털 말풍선·트리거 `aria-describedby` 추가                                                                               | T1/client/dom-to-vnode.test.ts#tooltip-trigger · T5/parity.test.tsx#tooltip · T5/client-t5.test.tsx#tooltip |
| 11  | `Toast`             | 컴포넌트      | `Toast`                                          | 비island                          | `podo:close` `{}`(닫기 버튼·`data-duration` 타이머, D-4)                                                                                | —                                                                                                                                                | T5/client-t5.test.tsx#toast-delegate                                                                        |
| 12  | `toast`             | 명령형 함수   | `window.podo.toast`(같은 모듈)                   | —                                 | —                                                                                                                                       | —                                                                                                                                                | T5/client-t5.test.tsx#toast-api                                                                             |
| 13  | `Toaster`           | 컴포넌트      | `Toaster`(신규)                                  | island(`span`)                    | 없음                                                                                                                                    | 없음(빈 스택). 토스트가 들어오면 카드·`data-expanded`                                                                                            | T5/parity.test.tsx#toaster · T5/client-t5.test.tsx#toaster-\*                                               |
| 14  | `Table`             | 컴포넌트      | `Table`                                          | `checkbox` 일 때 island(`div`)    | `podo:selection-change` `{ selected }`                                                                                                  | 없음(선택 열은 SSR 이 같은 모양으로 냄)                                                                                                          | T1/client/dom-to-vnode.test.ts#table-rows · T5/parity.test.tsx#table · T5/client-t5.test.tsx#table-\*       |
| 15  | `Field`             | 컴포넌트      | `Field`                                          | 비island(카운트만 위임 갱신, D-3) | —                                                                                                                                       | —                                                                                                                                                | 기존 index.test.tsx · T3/client.test.tsx#field-count                                                        |
| 16  | `Icon`              | 컴포넌트      | `Icon`                                           | 비island                          | —                                                                                                                                       | —                                                                                                                                                | 기존 index.test.tsx                                                                                         |
| 17  | `Typography`        | 컴포넌트      | `Typography`                                     | 비island                          | —                                                                                                                                       | —                                                                                                                                                | 기존 index.test.tsx                                                                                         |
| 18  | `DatePicker`        | 컴포넌트      | `DatePicker`(신규)                               | island(`span`)                    | `podo:change` `{ value }` · `podo:reset` `{}`                                                                                           | 없음(닫힌 입력). 열면 드롭다운(포털이면 body)                                                                                                    | T4/parity.test.tsx#datepicker-_ · T4/client-datepicker.test.tsx#datepicker-_                                |
| 19  | `Editor`            | 컴포넌트      | `Editor`(신규)                                   | island(`span`)                    | `podo:change` `{ content }` · `podo:image-upload-error` `{ error, file }`                                                               | effect 가 편집 영역 `innerHTML`·undo/redo 버튼 상태를 맞춤 — B 의미 단언만(A 없음, N1)                                                           | T6/client.test.tsx#editor-\*                                                                                |
| 20  | `EditorView`        | 컴포넌트      | `EditorView`(신규)                               | 비island                          | —                                                                                                                                       | —                                                                                                                                                | T2/index.test.tsx#editor-view                                                                               |
| 21  | `PodoThemeProvider` | 컴포넌트      | `renderCriticalCss({ theme, colorScheme })`      | —                                 | —                                                                                                                                       | —                                                                                                                                                | 기존 index.test.tsx(critical css)                                                                           |
| 22  | `PodoThemeContext`  | React context | 없음 — 서버가 테마 속성을 직접 렌더(문서 대응만) | —                                 | —                                                                                                                                       | —                                                                                                                                                | —                                                                                                           |
| 23  | `usePodoTheme`      | React hook    | 없음 — 서버가 테마 값을 이미 알아요(문서 대응만) | —                                 | —                                                                                                                                       | —                                                                                                                                                | —                                                                                                           |

## 3. island 컴포넌트 prop 상세

`id` 규칙은 §1.4(configure 키 = 래퍼 `data-podo-id`). `class`(Hono) ↔ `className`(React) 은 `JSON` 으로 `className` 에 넣어요.

### Select (React `index.tsx` `SelectProps`)

| prop                                                                                                                                                                   | 전달                                         | 비고                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`·`options`·`placeholder`·`size`·`multiple`·`maxChips`·`searchable`·`addable`·`addPlaceholder`·`clearable`·`portal`·`readOnly`·`invalid`·`disabled`·`name`·`aria-*` | `JSON`                                       | `id` 는 콤보박스에(§1.4). `name` 은 SSR 도 hidden·`data-name` 을 같은 모양으로 내요. 불리언 `aria-invalid`·`aria-required` 는 React 소스가 `"true"/"false"` 로 바꿔요 |
| `value` / `values`                                                                                                                                                     | `default` → `defaultValue` / `defaultValues` | `configure(id, { value })` 만 제어 모드                                                                                                                               |
| `defaultValue` / `defaultValues`                                                                                                                                       | `JSON`                                       |                                                                                                                                                                       |
| `defaultOpen`                                                                                                                                                          | `JSON`                                       | Hono 기존 `open` prop 이 이 값으로 가요                                                                                                                               |
| `prefix`                                                                                                                                                               | `slot`(`prefix`)                             |                                                                                                                                                                       |
| `onValueChange` / `onValuesChange` / `onOptionAdd`                                                                                                                     | `event`                                      |                                                                                                                                                                       |
| `onClick`·`onKeyDown` 등 DOM 핸들러                                                                                                                                    | `native`                                     |                                                                                                                                                                       |
| `Home`/`End` 키 · 옵션 그룹                                                                                                                                            | 없음                                         | **React 계약에 없음**(D-9) — 패리티 대상 아님                                                                                                                         |

### Chip (`ChipProps`)

| prop                                                | 전달                          | 비고                                                                                                        |
| --------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `id`·`theme`·`size`·`disabled`·`removeLabel`·`type` | `JSON`                        | `id` 는 루트에(§1.4)                                                                                        |
| `selected`                                          | `default` → `defaultSelected` | 제어는 `configure`                                                                                          |
| `defaultSelected`                                   | `JSON`                        |                                                                                                             |
| `children`·`prefix`·`suffix`                        | `slot`                        |                                                                                                             |
| `removable`(Hono)                                   | 브리지가 `onRemove` 주입      | removable 이 아니면 주입하지 않아요(R4)                                                                     |
| `onPress`·`onSelectedChange`·`onRemove`             | `event`                       | `podo:remove` 기본 동작: 최상위는 래퍼 제거, 중첩은 부모 자식 상태에서 제외(V7-1), `preventDefault` 면 유지 |
| `onClick`                                           | `native`                      |                                                                                                             |

### DatePicker (`DatePickerProps`, `datepicker.tsx:81`)

| prop                                                                                                                                                                                                                            | 전달                                                          | 비고                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| `mode`·`type`·`placeholder`·`disabled`·`showActions`·`align`·`minuteStep`·`hourFormat`·`disabledHours`·`hourStep`·`format`·`yearRange`·`portal`·`quickSelect`·`hideNavArrow`·`direction`·`className`·`name`·`fromName`·`toName` | `JSON`                                                        |                                             |
| `value`                                                                                                                                                                                                                         | `default` → `defaultValue`                                    | Date 는 `$date`                             |
| `defaultValue`·`minDate`·`maxDate`·`initialCalendar`                                                                                                                                                                            | `JSON`(Date 재귀)                                             |                                             |
| `disable`·`enable`                                                                                                                                                                                                              | Date·DateRange 만이면 `JSON`, 함수가 섞이면 `configure`(통째) |                                             |
| `onChange`                                                                                                                                                                                                                      | `event` `podo:change` `{ value }`                             | hidden 갱신 시점 = onChange 시점(같은 코드) |
| `onReset`                                                                                                                                                                                                                       | `event` `podo:reset` `{}`                                     |                                             |

폼 값(`@podoui/core` `formatDatePickerFormValue`): date `YYYY-MM-DD` · time `HH:mm` · datetime `YYYY-MM-DDTHH:mm`(날짜·시간 둘 다 있을 때만) · hour `HH`, 비었거나 불완전하면 `""`.

마운트 직전 상태 읽기(`readState`): hidden 이 SSR 이 쓴 값 그대로면 JSON 초기값(날짜만·시간만 있는 부분 값 포함)을 유지하고, 바뀐 hidden 만 `parseDatePickerFormValue` 로 반영해요(`""` = 비우기, 달력·시계에 없는 값 = 무시). 시작·종료 hidden 은 SSR 출력 순서로 구분해 `fromName`·`toName` 이 같아도 섞이지 않아요.

검증 근거: `client-datepicker.test.tsx` 가 instant/period × date/time/datetime/hour, `showActions` 참·거짓, 경계(min/max), 초기화(`podo:reset`), quickSelect 프리셋·이전/다음 이동, 같은 이름 기간, 부분 초기값 16개 시나리오를 React 렌더와 Hono 번들에 똑같이 돌려 최초 마운트부터 단계별 제출값·확정·초기화 횟수를 비교하고, 같은 조합마다 마운트 전후 마크업(B)을 비교해요. 시계는 양쪽 모두 고정해요.

### Tooltip (`TooltipProps`)

| prop                                  | 전달               | 비고                                                                                                  |
| ------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------- |
| `position`·`ordinal`·`theme`·`portal` | `JSON`             |                                                                                                       |
| `open`                                | `JSON`(제어)       | React 에 `defaultOpen` 이 없어 Hono `open` 은 항상 열린 제어 값 그대로                                |
| `label`                               | `slot`(`label`)    |                                                                                                       |
| `children`(트리거 1개)                | `slot`(`children`) |                                                                                                       |
| Hono `id`                             | configure 키 전용  | React 는 말풍선 id 를 `useId` 로 만들어요 — Hono 가 받던 말풍선 id 는 의미가 없어져요(CHANGELOG 대상) |

### Table (`TableProps`)

| prop                                     | 전달                                           | 비고                                                    |
| ---------------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `id`·`type`·`checkbox`·`defaultSelected` | `JSON`                                         | `id` 는 `<table>` 에(§1.4)                              |
| `children`(thead/tbody/tr)               | `slot`(`children` = `<table>` 자체)            | T1 스파이크로 변환 vnode 의 `cloneElement`·행 선택 확인 |
| `onSelectionChange`                      | `event` `podo:selection-change` `{ selected }` |                                                         |
| 그 밖 `TableHTMLAttributes`              | `JSON`(직렬화 가능분)                          |                                                         |

### Switch (`SwitchProps`, D-2)

| prop                                          | 전달                                        | 비고                                                  |
| --------------------------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `id`·`size`·`bold`·`disabled`·`type`·`aria-*` | `JSON`                                      | `id` 는 스위치 버튼에(§1.4) — Field `label[for]` 유지 |
| `checked`                                     | `default` → `defaultChecked`                | 제어는 `configure`                                    |
| `defaultChecked`                              | `JSON`                                      |                                                       |
| `label`                                       | `slot`(`label`)                             |                                                       |
| `onCheckedChange`                             | `event` `podo:checked-change` `{ checked }` |                                                       |
| `onClick`                                     | `native`                                    |                                                       |

### Toaster (`ToasterProps`) · `toast`

`position`·`duration`·`max` → `JSON`. `toast(title, options)`·`normal/success/danger/info/warning`·`dismiss(id?)` → `window.podo.toast`(React 모듈 그대로, 같은 스토어).

### Editor (`EditorProps`, `editor/types.ts`)

| prop                                                                                            | 전달                                                | 비고                                                     |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `width`·`height`·`minHeight`·`maxHeight`·`resizable`·`placeholder`·`toolbar`·`ariaLabel`·`name` | `JSON`                                              |                                                          |
| `value`                                                                                         | `default` → `defaultValue`                          | 이번 단계에서 React Editor 에 `defaultValue`·`name` 추가 |
| `defaultValue`                                                                                  | `JSON`                                              |                                                          |
| `onChange`                                                                                      | `event` `podo:change` `{ content }`                 |                                                          |
| `validator`                                                                                     | `configure`                                         | zod 인스턴스                                             |
| `onImageUpload`                                                                                 | `configure` 또는 Hono 전용 `uploadUrl`(`JSON`)      |                                                          |
| `onImageUploadError`                                                                            | `event` `podo:image-upload-error` `{ error, file }` |                                                          |

## 4. 비island 콜백 표 (R5)

`client.js` 가 `document` 에 `click`·`input`·`change` 위임 리스너를 걸고, SSR 이 루트에 찍은 `data-podo-<component>` 로 대상을 가려 의미 이벤트를 내요. 네이티브 이벤트는 그대로 일어나요.

| React 콜백                                | 원본 DOM 이벤트                                       | CustomEvent                                                   | detail                                | 대상                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| Button `onPress(event: PodoPressEvent)`   | `click`(disabled·`defaultPrevented` 제외)             | `podo:press`                                                  | `{ source: "button", originalEvent }` | `button[data-podo-button]`                                                                 |
| Button `onClick`                          | `click`                                               | 없음(`native`)                                                | —                                     | —                                                                                          |
| Input `onValueChange(value, event)`       | `input`                                               | `podo:value-change`                                           | `{ value, event }`                    | `.podo-input[data-podo-input]` 안의 `input`                                                |
| Input `onChange`                          | `input`/`change`                                      | 없음(`native`)                                                | —                                     | —                                                                                          |
| Textarea `onValueChange(value, event)`    | `input`                                               | `podo:value-change`                                           | `{ value, event }`                    | `textarea[data-podo-textarea]`                                                             |
| Checkbox `onCheckedChange(checked)`       | `change`(`defaultPrevented` 제외)                     | `podo:checked-change`                                         | `{ checked }`                         | `input[data-podo-checkbox]`                                                                |
| Radio `onCheckedChange(checked)`          | `change`                                              | `podo:checked-change`                                         | `{ checked }`                         | `input[data-podo-radio]`                                                                   |
| Toast `onClose()`                         | `.podo-toast__close` `click` · `data-duration` 타이머 | `podo:close`                                                  | `{}`                                  | `[data-podo-toast]`                                                                        |
| Field 글자 수 자동 카운트(콜백 아님, D-3) | 감싼 컨트롤 `input`                                   | 없음 — `.podo-field__count` 숫자만 `값 길이/countMax` 로 갱신 | —                                     | `countMax` 만 있고 `count` 를 받지 않은 `[data-podo-field]`(제어 `count` 면 건드리지 않음) |

Switch 는 island 라 이 표가 아니라 브리지가 `podo:checked-change` 를 내요(D-2).

## 5. 타입 export 전수표 (49)

| React 타입                                                                                                                                                                                                                          | Hono 대응                                                               | 비고                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------- |
| `PodoThemeContextValue`·`PodoThemeProviderProps`                                                                                                                                                                                    | `HonoCriticalCssOptions`                                                | 테마는 서버가 렌더               |
| `PodoPressEvent`                                                                                                                                                                                                                    | `podo:press` detail                                                     |                                  |
| `ButtonTheme`·`ButtonProps`                                                                                                                                                                                                         | `HonoButtonTheme`·`HonoButtonProps`                                     | T2: 네이티브 button 속성 전체    |
| `ChipTheme`·`ChipProps`                                                                                                                                                                                                             | `HonoChipProps`                                                         |                                  |
| `BadgeTheme`·`BadgeProps`                                                                                                                                                                                                           | `HonoBadgeProps`                                                        |                                  |
| `SwitchProps`·`CheckboxProps`·`RadioProps`                                                                                                                                                                                          | `HonoSwitchProps`·`HonoCheckboxProps`·`HonoRadioProps`                  |                                  |
| `InputProps`·`TextareaProps`                                                                                                                                                                                                        | `HonoInputProps`·`HonoTextareaProps`                                    | T2: 네이티브 속성 전체           |
| `SelectOption`·`SelectProps`                                                                                                                                                                                                        | `HonoSelectOption`·`HonoSelectProps`                                    |                                  |
| `TableProps`                                                                                                                                                                                                                        | `HonoTableProps`                                                        | T5: `checkbox`·`defaultSelected` |
| `ToastState`·`ToastProps`                                                                                                                                                                                                           | `HonoToastState`·`HonoToastProps`                                       |                                  |
| `ToasterPosition`·`ToasterProps`·`ToastOptions`                                                                                                                                                                                     | T5 신규(`HonoToasterProps`), `ToastOptions` 는 `window.podo.toast` 인자 |                                  |
| `TooltipTheme`·`TooltipPosition`·`TooltipOrdinal`·`TooltipProps`                                                                                                                                                                    | `HonoTooltipProps`                                                      | T5: 트리거 children              |
| `FieldProps`                                                                                                                                                                                                                        | `HonoFieldProps`                                                        |                                  |
| `IconProps`                                                                                                                                                                                                                         | `HonoIconProps`                                                         |                                  |
| `TypographyProps`                                                                                                                                                                                                                   | Hono `Typography` 인라인 props                                          |                                  |
| `DatePickerProps`·`DatePickerValue`·`DatePickerMode`·`DatePickerType`·`HourFormat`·`HourStep`·`QuickSelectKey`·`TimeValue`·`DateRange`·`DateCondition`·`DateTimeLimit`·`MinuteStep`·`YearRange`·`CalendarInitial`·`InitialCalendar` | T4 신규(`HonoDatePickerProps`, 값 타입은 React 와 같은 모양)            |                                  |
| `EditorImageUploadHandler`·`EditorImageUploadResult`·`EditorProps`·`ToolbarItem`·`EditorViewProps`                                                                                                                                  | T6·T2 신규(`HonoEditorProps` + `uploadUrl`, `HonoEditorViewProps`)      |                                  |

## 6. 인라인 SVG 전수 조사 (T1)

조사 명령: `grep -rn "<svg" packages/react/src packages/hono/src --include='*.tsx'`(테스트 제외). DatePicker·Editor 는 처음부터 아이콘 폰트(`podo-icon-*`)를 써서 대상이 없어요.

| 위치(HEAD `c866cae6`)                                                                                                                       | 무엇                     | 바꾼 것                                                  | 크기·색(Figma 슬롯)                  |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------- | ------------------------------------ |
| react `CHIP_CLOSE`(index.tsx:503) — 제거형 칩 X, Select 모두 해제 X                                                                         | 16px 선 X                | `podo-icon-close`                                        | 16px, 상속색                         |
| react `SELECT_CHEVRON`(:925)                                                                                                                | 24px 체브론              | `podo-icon-chevron-down`(**신규**)                       | 24px, `--podo-icon-basic`(#27272a)   |
| react `SELECT_CHECK`(:937)                                                                                                                  | 단일 선택 셀 체크        | `podo-icon-check`                                        | 16px, `--podo-icon-primary`(#426ced) |
| react `SELECT_BOX_CHECK`(:949)                                                                                                              | 다중 선택 체크박스 체크  | `podo-icon-check`                                        | 12px, 체크박스 글자색(흰색)          |
| react `TOAST_CLOSE_GLYPH`(:1768)                                                                                                            | 토스트 닫기 X            | `podo-icon-close`                                        | 24px, 상속색                         |
| react `TOOLTIP_ARROWS`(:1590~1610)                                                                                                          | 4×16 말풍선 화살표 4방향 | **아이콘 아님** — 빈 `span` + CSS `clip-path`(같은 좌표) | §7 D-5                               |
| hono `HONO_SELECT_CHEVRON`·`HONO_SELECT_CHECK`·`HONO_SELECT_BOX_CHECK`·`HONO_CHIP_CLOSE`·`HONO_TOAST_CLOSE`(raw)·`HONO_TOOLTIP_ARROWS`(raw) | React 와 같은 6종        | React 와 같은 마크업                                     | 같음                                 |

아이콘 마크업은 DatePicker 의 기존 내부 아이콘과 같은 `<i class="podo-icon podo-icon-<name>" aria-hidden="true"></i>`(data-size 없음, 크기는 감싸는 요소 CSS) 하나예요. 글리프는 `podo-ui/icons.css`(기본 아이콘 폰트)가 그려요 — 이제 Select·Chip·Toast 도 DatePicker 처럼 `icons.css` 가 필요해요(T8 CHANGELOG·README 대상).

`chevron-down` 위치: 기본 폰트 매니페스트 `packages/cli/src/index.ts` `defaultIconManifest`(코드포인트 `E220` — 문서 프로젝트 Figma 세트와 같은 값, 원본 경로는 `packages/docs/.podo/icons/svg/figma/chevron-down.svg`) → `podo-ui/icons.css`·woff. 문서 `/icon`·MCP 프로젝트 목록은 `packages/docs/.podo/icons/manifest.json` 이 원본이고 이미 `chevron-down`(E220)을 가지고 있어요.

## 7. T1 결정 기록 (총괄 판정 2026-11-17)

| ID   | 문제                                                                                                                                                                                     | 결정                                                                                                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1  | 계획 R2(래퍼가 `id` 소유)대로면 `label[for]` 가 래퍼 `span` 을 가리켜 Select 의 접근성 이름이 사라져요(React 도 `id` 를 콤보박스에 둠).                                                  | configure 키 = 래퍼 `data-podo-id`, `id` 는 React 가 받는 위치 그대로(§1.4)                                                                                                   |
| D-2  | Switch 는 `internalChecked` 상태가 있는데 계획은 비island 로 분류. Hono Switch 는 클릭해도 토글되지 않음.                                                                                | Switch = island                                                                                                                                                               |
| D-3  | Field 글자 수 자동 카운트(`autoCount`) — Hono 는 `count ?? 0` 고정.                                                                                                                      | 위임 리스너가 `input` 에서 숫자만 갱신(§4)                                                                                                                                    |
| D-4  | 계획 D7 의 `podo:dismiss` 는 콜백 이름 unverified 였고 React 실제 콜백은 `onClose`.                                                                                                      | `podo:close`(이름 규칙 우선)                                                                                                                                                  |
| D-5  | Tooltip 4×16 화살표는 아이콘이 아닌 모양.                                                                                                                                                | CSS `clip-path`(같은 좌표) 승인, 시안 확인 요청 유지                                                                                                                          |
| D-6  | 기본 폰트의 `close`·`check` 글리프는 Material 계열이라 Figma 문서 프로젝트 글리프보다 굵어 보여요.                                                                                       | 기존 아이콘 폰트 글리프 유지(폰트 교체는 범위 밖), 굵기 차이는 T7 스크린샷으로 기록                                                                                           |
| D-7  | `select.component.json` 은 HEAD 에서도 스키마 위반(`states[2].name = "completed"`).                                                                                                      | 이번 범위 밖 — todo.md 에 기록                                                                                                                                                |
| D-8  | MCP 기본 아이콘 목록(프로젝트 `.podo` 없음)은 2개짜리 견본.                                                                                                                              | 손대지 않음                                                                                                                                                                   |
| D-9  | 계획 T3 완료 조건의 Select `Home`/`End` 키·옵션 그룹(`group`)은 React Select 계약에 없어요(키 처리·옵션 타입 모두 없음).                                                                 | **React 계약에 없음** — T3 완료 조건에서 제외, 구현 안 함. React 에 추가되면 같은 소스라 Hono 에도 따라와요                                                                   |
| D-10 | DatePicker 닫힌 입력 칸의 표시 규칙(날짜 글자·시/분 옵션·비활성·프리셋 라벨·이전/다음 막힘)을 Hono SSR 이 따로 구현하면 두 벌이 돼요.                                                    | 순수 함수를 `@podoui/core` `datepicker-display.ts` 로 옮기고 React DatePicker 와 Hono `DatePicker` 가 같이 써요(React 동작 불변 리팩터, 기존 React 테스트·스냅샷 그대로 통과) |
| D-11 | React Toaster 가 CSS 변수(`--podo-toast-count`·`--podo-toast-index`)를 숫자로 넘기면 hono/jsx/dom 이 `px` 를 붙여(`0px`) `calc()` 안의 개수·순번 곱셈이 깨져요(T5 마운트 비교에서 발견). | React 소스에서 `String(...)` 으로 넘김 — React 출력은 같고(D11 선행 수정과 같은 성격) Hono island 도 단위 없는 값이에요. 총괄 사후 승인(T5 리뷰)                              |

| D-12 | Table 행의 `data-disabled={false}`(또는 `0`·`""`)는 SSR 에서 문자열(`"false"`)이 되어, 마운트 때 DOM 값을 그대로 넘기면 React Table 의 `Boolean(...)` 판정이 비활성으로 뒤집혀요(T5 리뷰 F2). | Hono Table SSR 이 거짓 원본값인 행의 `data-disabled` 를 생성 표식(`data-podo-generated="data-disabled"`)으로 달아 클라이언트가 옮기지 않아요 — 판정값(거짓)은 보존, 문자열·`true` 는 그대로. 마운트 뒤 그 행의 `data-disabled="false"` 속성은 사라져요(hono/jsx/dom 은 `false` 속성을 빼요 — React 는 `"false"` 를 남겨 `tr[data-disabled]` 스타일이 걸려요) |
| D-13 | 샘플 CSP `style-src 'self'` 가 Toaster SSR 의 `style="--podo-toast-count:0"`(React 와 같은 마크업)을 막아요(T5 리뷰 F7). | 샘플에 `style-src-attr 'unsafe-inline'` 만 추가 — 스크립트·`<style>` 요소는 계속 `'self'`. 실제 브라우저 콘솔 위반 0 은 T7 에서 확인 |

## 8. T1 선행 확인·게이트 증거

대상: 기준선 `c866cae6` + T1 미커밋 작업 트리(2026-11-17, 맥). 계획 T1 ⑩의 14건과 게이트 결과예요.

| #   | 확인                                         | 결과                                                                                                                                                                                                                                                                                                                                                                                                                                    | 근거·명령                                                                                                                      |
| --- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `build.mjs` 번들러·별칭                      | 번들러 없음 — 각 패키지 `tsc` 산출물을 복사하고 `@podoui/*` import 만 상대 경로로 바꿔요. esbuild 는 vite 를 통해 간접 설치(0.25.12)만 돼 있어 T3 가 직접 의존성으로 추가해야 해요.                                                                                                                                                                                                                                                     | `packages/podo-ui/build.mjs`, `node_modules/.pnpm/node_modules/esbuild`                                                        |
| 2   | jsdom / happy-dom                            | jsdom 29.1.1(루트 devDependency), happy-dom 없음                                                                                                                                                                                                                                                                                                                                                                                        | 루트 `package.json`                                                                                                            |
| 3   | `verify-release.mjs` 경로                    | `scripts/verify-release.mjs`(`pnpm release:verify`)                                                                                                                                                                                                                                                                                                                                                                                     | 루트 `package.json` scripts                                                                                                    |
| 4   | MCP 아이콘 목록 출처                         | 프로젝트 `.podo/icons/manifest.json`, 없으면 `packages/mcp/src/defaults.ts` 견본(2개)                                                                                                                                                                                                                                                                                                                                                   | `loadMcpProject("packages/docs")` → 152개·`chevron-down` E220, 없는 경로 → 2개·`chevron-down` 없음                             |
| 5   | docs 배포 트리거                             | `.github/workflows/deploy-docs.yml` — `main` push(+수동). push 는 T8 에서 한 번                                                                                                                                                                                                                                                                                                                                                         | 워크플로 파일                                                                                                                  |
| 6   | 레포 `CLAUDE.md`                             | 없음(`AGENTS.md` 만)                                                                                                                                                                                                                                                                                                                                                                                                                    | `ls`                                                                                                                           |
| 7   | Icon 클래스 체계                             | `<i class="podo-icon podo-icon-<name>">` — `Icon` 은 `data-size`, 컴포넌트 내부 아이콘은 `data-size` 없이 감싸는 요소 CSS 가 크기. 기본 글리프는 `packages/cli/src/index.ts` `defaultIconManifest`·`defaultIconSvgs` → `build.mjs` 가 `dist/icons-assets/PodoIcons.css`·woff 생성                                                                                                                                                       | `grep chevron-down packages/podo-ui/dist/icons-assets/PodoIcons.css` → `.podo-icon-chevron-down::before { content: "\E220"; }` |
| 8   | hono 의존                                    | `podo-ui` 일반 dependency `hono ^4.12.25`(peer 아님), 설치 4.12.25                                                                                                                                                                                                                                                                                                                                                                      | `packages/podo-ui/package.json`                                                                                                |
| 9   | tsc 경계(Editor 포함)                        | 통과 — `jsxImportSource: hono/jsx/dom` 에서 `@podoui/react` 의 Select·DatePicker·Tooltip·Table·Toaster·Editor·Chip·Switch 를 경계 파일 한 곳에서 `FC` 로 단언, Editor 렌더·`toast` 호출까지 exit 0(음성 대조 exit 2). 단 `@podoui/hono` 는 `@podoui/react` 에 의존하지 않아 T3 가 workspace devDependency(또는 경로)를 추가해야 해요                                                                                                    | §8.1 소스·명령·원출력                                                                                                          |
| 10  | hono/jsx/dom `defaultValue`/`defaultChecked` | DOM 에 반영 안 됨(`value ""`, `checked false`) → 공유 소스의 hidden 필드는 `value` 로 렌더. 계획의 「마운트 직후 써 넣는 보완」은 필요 없음. 슬롯 변환(`domToVNode`)은 현재 DOM 값(value·checked·selected)을 옮기고, 파일 입력은 fakepath `value` 대신 선택된 `FileList` 를 새 입력의 `files` 로 옮겨요                                                                                                                                 | `client/dom-to-vnode.test.ts` 「documents that hono/jsx/dom does not reflect…」                                                |
| 11  | `class`·`style` 문자열                       | 그대로 받음(`style` 은 `cssText`), `className` 도 받음                                                                                                                                                                                                                                                                                                                                                                                  | 같은 파일 「drives Table…」(`style` 유지)                                                                                      |
| 12  | 기존 Hono island 루트 `id`                   | Select: 트리거(콤보박스)와 `${id}-listbox`, Tooltip: 말풍선(`role=tooltip`), Chip·Table·Toast: `id` prop 없음 → D-1                                                                                                                                                                                                                                                                                                                     | `packages/hono/src/index.tsx`                                                                                                  |
| 13  | React 초기값·콜백                            | DatePicker `defaultValue` 있음, `onChange(value)`·`onReset()` / Chip `defaultSelected` 있음, `onSelectedChange(selected)`·`onRemove(event)`·`onPress(event)` / Editor `defaultValue` 없음 → T1 에서 추가(+`name`), `onChange(content)`·`onImageUpload(file)`·`onImageUploadError(error, file)` / Table `onSelectionChange(selected)` / Select `onValueChange(value)`·`onValuesChange(values)`·`onOptionAdd(option)` / Toast `onClose()` | React 소스                                                                                                                     |
| 14  | 단일 번들 크기                               | Editor 포함 raw 463.0KB · **gzip 105.4KB**, Editor 제외 raw 73.3KB · gzip 24.3KB. `react` import/require·react-dom 내부·`window.React` 대입 없음. 레포 esbuild 0.25.12 로 측정 — T3 실제 빌드 설정의 값은 그때 다시 재요(UNVERIFIED)                                                                                                                                                                                                    | §8.2 스크립트·원출력                                                                                                           |
| +   | R3 스파이크                                  | 통과 — 변환 vnode 로 Table 행 선택 `[[1]]`(비활성 행 제외)·Tooltip hover/focus·Chip 라벨/토글·Select prefix·hidden 값                                                                                                                                                                                                                                                                                                                   | `pnpm exec vitest run packages/hono/src/client/dom-to-vnode.test.ts`                                                           |

### 8.1 타입 경계 probe (계획 D12)

`packages/hono/.tsprobe/` 에 아래 세 파일을 두고 실행했어요(확인 뒤 삭제 — T3 가 같은 모양의 `components.ts` 를 실제로 만들어요).

`components.ts`

```ts
import type { FC } from "hono/jsx";
import {
  Chip,
  DatePicker,
  Editor,
  Select,
  Switch,
  Table,
  Toaster,
  Tooltip,
  toast,
} from "@podoui/react";

// 경계 파일 1곳에서만 React 컴포넌트를 hono FC로 단언해요(계획 D12).
type AnyProps = Record<string, unknown>;
export const components = {
  Select: Select as unknown as FC<AnyProps>,
  DatePicker: DatePicker as unknown as FC<AnyProps>,
  Tooltip: Tooltip as unknown as FC<AnyProps>,
  Table: Table as unknown as FC<AnyProps>,
  Toaster: Toaster as unknown as FC<AnyProps>,
  Editor: Editor as unknown as FC<AnyProps>,
  Chip: Chip as unknown as FC<AnyProps>,
  Switch: Switch as unknown as FC<AnyProps>,
};
export { toast };
```

`bridge.tsx`

```tsx
import { render } from "hono/jsx/dom";
import { components, toast } from "./components.js";

export function mount(element: HTMLElement, props: Record<string, unknown>): void {
  const Editor = components.Editor;
  render(<Editor {...props} />, element);
  toast.success("저장됐어요", { duration: 1000 });
}
```

`tsconfig.json`

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "composite": false,
    "declaration": false,
    "declarationMap": false,
    "rootDir": ".",
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx/dom",
    "paths": { "@podoui/react": ["../../react/dist/index.d.ts"] }
  },
  "include": ["./*.ts", "./*.tsx"]
}
```

원출력(2026-11-17, 홈 경로는 `~` 로 줄임):

```text
$ pnpm exec tsc -p packages/hono/.tsprobe/tsconfig.json --listFilesOnly | grep -E "tsprobe|react/dist/index.d.ts|jsx/dom/index.d.ts|zod"
~/project/podoui/packages/react/dist/index.d.ts
~/project/podoui/packages/hono/.tsprobe/components.ts
~/project/podoui/node_modules/.pnpm/hono@4.12.25/node_modules/hono/dist/types/jsx/dom/index.d.ts
~/project/podoui/packages/hono/.tsprobe/bridge.tsx
$ pnpm exec tsc -p packages/hono/.tsprobe/tsconfig.json; echo "exit=$?"
exit=0
```

음성 대조 — 같은 설정에 `neg.ts`(`const bad: number = "x";`)를 더하면 실제로 타입 검사가 돌아 실패해요:

```text
packages/hono/.tsprobe/neg.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.
exit=2
```

### 8.2 단일 번들 크기 측정

`measure.mjs`(레포 밖 임시 경로에 두고 레포 루트에서 실행):

```js
import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";

const repo = process.argv[2];
const { build, version } = createRequire(join(repo, "package.json"))(
  "./node_modules/.pnpm/node_modules/esbuild"
);
const P = `${repo}/packages`;
const dir = mkdtempSync(join(tmpdir(), "podo-size-"));
const entries = {
  all: "Chip, DatePicker, Editor, Select, Table, Toaster, Tooltip, toast",
  noEditor: "Chip, DatePicker, Select, Table, Toaster, Tooltip, toast",
};
for (const [name, list] of Object.entries(entries)) {
  const entry = join(dir, `${name}.tsx`);
  const outfile = join(dir, `${name}.js`);
  writeFileSync(
    entry,
    `import { render } from "hono/jsx/dom";\nimport { ${list} } from "${P}/react/src/index.tsx";\n(globalThis as any).__podo = { render, ${list} };\n`
  );
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: "iife",
    minify: true,
    jsx: "automatic",
    jsxImportSource: "hono/jsx/dom",
    logLevel: "warning",
    alias: {
      react: "hono/jsx/dom",
      "react-dom": "hono/jsx/dom",
      "react/jsx-runtime": "hono/jsx/dom/jsx-runtime",
      "react/jsx-dev-runtime": "hono/jsx/dom/jsx-dev-runtime",
      "@podoui/core": `${P}/core/src/index.ts`,
    },
    nodePaths: [`${P}/hono/node_modules`, `${P}/react/node_modules`],
  });
  const code = readFileSync(outfile);
  const text = code.toString();
  console.log(
    `${name}: raw ${(code.length / 1024).toFixed(1)}KB gzip ${(gzipSync(code).length / 1024).toFixed(1)}KB` +
      ` | react import/require: ${/\b(?:from|require\()\s*["']react(?:-dom)?["'/]/.test(text)}` +
      ` | react-dom internals: ${/__(?:SECRET|CLIENT)_INTERNALS/.test(text)}` +
      ` | window.React assigned: ${/\bwindow\.React\s*=|globalThis\.React\s*=/.test(text)}` +
      ` | esbuild ${version}`
  );
}
```

원출력(2026-11-17):

```text
$ node measure.mjs "$PWD"; echo "exit=$?"
all: raw 463.0KB gzip 105.4KB | react import/require: false | react-dom internals: false | window.React assigned: false | esbuild 0.25.12
noEditor: raw 73.3KB gzip 24.3KB | react import/require: false | react-dom internals: false | window.React assigned: false | esbuild 0.25.12
exit=0
```

게이트(T1 최종 작업 트리, 결과는 T1 보고와 커밋 본문에 기록): `pnpm check` → `pnpm build` → `pnpm release:verify` → `pnpm changeset:dry-run` 모두 exit 0 이어야 커밋해요.
