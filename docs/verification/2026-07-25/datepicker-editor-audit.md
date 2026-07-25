# DatePicker · Editor v1/Figma/platform audit

검증일: 2026-07-25 (Asia/Seoul)

## 기준 소스

- 원본 Figma: `PODO Design System`, version `2379926299344168757`, last modified `2026-07-16T06:57:44Z`
- Figma Datepicker section: `586:30927`; component set: `490:8489`
- Figma Editor section: `539:5713`; component: `539:10519`
- v1 회귀 기준: npm/Git tag `podo-ui@1.2.1`

Figma Datepicker는 single(약 300×358)과 multiple(약 712×349), preset/controller boolean variant를 정의한다. 날짜 셀 상태는 normal, today, selected, connector, disabled, hover, pressed이다. Editor는 920×52 툴바에서 정렬, 문단, 목록, 줄높이, 글자/배경색, bold/underline/italic/strikethrough, image, link, table, indent, divider, quote, code를 보여 준다.

Figma preset 예시는 다음 주·다음 달·연도 항목을 포함하지만, 공개 v1 API는 `today`, `yesterday`, `thisWeek`, `lastWeek`, `last7Days`, `last30Days`, `thisMonth`, `lastMonth`이다. v1 호환성을 위해 공개 API 의미를 유지하고 Figma는 레이아웃과 상태 표현의 기준으로 사용했다.

## DatePicker 기능 결과

| 영역 | 검증 기능 | 결과 |
| --- | --- | --- |
| 값 계약 | controlled/uncontrolled, instant/period, apply/cancel/reset, `onReset` | PASS |
| 타입 | date, time, datetime, hour | PASS |
| 날짜 제한 | disable, enable, min/max, yearRange, initialCalendar | PASS |
| 시간 제한 | minuteStep, hourFormat 12/24, hourStep, disabledHours | PASS |
| 빠른 기간 | 8개 v1 preset, 이전/다음 기간, hideNavArrow | PASS |
| 오버레이 | align, portal, direction up/down/auto, 외부 클릭, Escape | PASS |
| 반응형 | 600px 단일 달력, 390px preset 유지, 화면 경계 보정 | PASS |
| 시각 상태 | today/selected/range/disabled/hover/pressed | PASS |

## Editor 기능 결과

| 그룹/흐름 | 검증 기능 | 결과 |
| --- | --- | --- |
| undo-redo | 툴바, Ctrl/Cmd+Z·Y, 에디터 밖 단축키 비간섭 | PASS |
| paragraph/text-style | 제목·본문, bold/italic/underline/strike | PASS |
| color | 글자/배경 팔레트, 단일/다중 block selection | PASS |
| align/list/hr/format | 정렬, 목록, 구분선, 서식 지우기 | PASS |
| table | 1~10 grid, 키보드 삽입, 행·열 변경, 선택 셀, context menu | PASS |
| link | 선택 삽입, target, 클릭 후 편집/삭제 팝업 | PASS |
| image | 파일/URL/paste/drop, 크기·정렬·alt, 클릭 편집/삭제 | PASS |
| YouTube | URL 변환, embed 속성, 크기·정렬, 편집/삭제 | PASS |
| code/validation | HTML 전환·즉시 onChange, Zod 성공/오류 | PASS |
| 모바일 | 40px touch target, 모든 insert/edit/context popup 경계 보정 | PASS |

## 플랫폼 계약

| 환경 | DatePicker | Editor | 검증 방식 |
| --- | --- | --- | --- |
| React 19 + Vite | 전체 지원 | 전체 지원 | 새 tarball 소비 앱 typecheck/build, 390px Chrome 상호작용 |
| Next.js 16 App Router | 전체 지원 (`use client`) | 전체 지원 (`use client`) | 새 tarball 소비 앱 production build/static prerender, Chrome 상호작용 |
| Hono 4 | React island에서 전체 지원 | React island에서 전체 지원 | Hono static SSR renderer 응답 + 별도 client island build/Chrome |
| React Native 0.86 | 미지원 | 미지원 | native entry typecheck/Xcode build/iPhone 17 Pro 실행; 지원하지 않는 DOM API를 export하지 않음 |

Hono server renderer는 hydration 없는 정적 HTML이 목표이므로 DOM 상태를 요구하는 두 컴포넌트를 직접 제공하지 않는다. React Native는 `contenteditable`, DOM Selection/Clipboard, CSS overlay가 없으므로 v1과 동일한 계약을 거짓으로 노출하지 않는다. Native의 기존 provider/Field/Input/Button는 실제 RN host component로 iOS에서 렌더링된다.

## 발견 및 수정한 결함

1. DatePicker v2에 빠져 있던 hour, hourFormat/hourStep/disabledHours, quickSelect, portal, hideNavArrow, direction, onReset을 복원했다.
2. 400px 이하에서 quickSelect 패널이 숨겨지던 규칙을 압축형 표시로 변경했다.
3. 화면 오른쪽에 있는 DatePicker dropdown을 실제 렌더 폭으로 측정해 뷰포트 안으로 이동했다.
4. Editor 모바일 링크/표/이미지/YouTube 및 편집 팝업을 네 방향으로 클램프하고 터치 영역을 확대했다.
5. 소비자 앱의 CSS reset에 의존하던 popup box sizing을 컴포넌트 내부에서 보장했다.
6. React Native 기본 host가 문자열 태그라 RN 0.86 New Architecture에서 발생하던 ViewConfig render error를 실제 RN component 참조로 수정했다.
7. DatePicker 문서를 전체 v1 API로 갱신하고 누락됐던 Editor 문서 페이지와 정확한 플랫폼 지원 표를 추가했다.
8. 릴리스 검증기가 macOS 메타데이터 파일을 패키지로 오인하던 문제를 실제 디렉터리만 열거하도록 수정하고 회귀 테스트를 추가했다.

## 증거

- [Figma DatePicker](./screenshots/figma-datepicker.png)
- [Figma Editor](./screenshots/figma-editor.png)
- [DatePicker desktop](./screenshots/datepicker-desktop.png)
- [DatePicker mobile 390px](./screenshots/datepicker-mobile.png)
- [Editor desktop](./screenshots/editor-desktop.png)
- [Editor mobile 390px](./screenshots/editor-mobile.png)
- [React Native iPhone 17 Pro](./screenshots/react-native-ios.png)

브라우저 검증은 각 popup의 bounding box, document/client width, console/page error를 수집했다. desktop 1440×1000과 mobile 390×844 모두 가로 overflow 0, product console/page error 0이었다.
