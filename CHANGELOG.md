# Changelog

## 2.3.11 (2026-11-17)

- Hono: 클라이언트 스크립트가 React `autoFocus`를 마운트 뒤 포커스로 반영한다(검색형 Select
  입력·Editor 팝업 입력). 마운트 때 되돌린 사용자 포커스가 우선이다. 표 셀 안 Chip을
  제거해도 그 행 선택이 바뀌지 않는다.
- Styles: Toaster 카드가 전역 `box-sizing` 리셋 없는 앱에서도 스택 폭을 넘지 않는다
  (`.podo-toaster .podo-toast { box-sizing: border-box }`). Hono Editor SSR 셸의 툴바 자리는
  마운트 전에도 실제 툴바 높이(49px)를 잡아 본문이 밀리지 않는다.
- Icons: Select·Chip·Toast 내부 아이콘을 인라인 SVG 대신 PODO 아이콘 폰트(`close`·`check`,
  신규 `chevron-down`)로 렌더한다. 이제 이 컴포넌트들도 `podo-ui/icons.css`가 필요하다.
  Tooltip 화살표는 CSS `clip-path`로 그린다.
- React: Select `name`(선택 값마다 hidden input, 루트 `data-name`), DatePicker
  `name`·`fromName`·`toName`(hidden, `YYYY-MM-DD`·`HH:mm`·`YYYY-MM-DDTHH:mm`·`HH`),
  Editor `defaultValue`·`name`(숨은 textarea)을 추가한다. 지정하지 않으면 출력은 그대로다.
- Hono: Button·Input·Textarea가 네이티브 속성(`form`·`formaction`·`type`·`min`·`accept`·
  `rows` 등)을 그대로 전달한다. 클라이언트 위임용 `data-podo-button`·`data-podo-input`·
  `data-podo-textarea`·`data-podo-checkbox`·`data-podo-radio`·`data-podo-toast`
  (Field는 자동 글자 수 카운트일 때 `data-podo-field`) 표식을 추가한다.
- Hono: React `EditorView`와 같은 마크업의 `EditorView`를 추가한다.
- Hono: 클라이언트 동작용 정적 스크립트 `podo-ui/hono/client`를 추가한다. React 컴포넌트
  소스를 `hono/jsx/dom`으로 묶은 단일 IIFE로, SSR island 래퍼(`span.podo-island`,
  `data-podo-island`·`data-podo-props`·`data-podo-id`) 자리에 Select·Chip·Switch를 같은 React
  코드로 마운트하고 콜백을 `podo:*` CustomEvent로 낸다(`podo:value-change`·`podo:values-change`·
  `podo:selected-change`·`podo:remove`·`podo:checked-change`·`podo:press`). 함수 등은
  `window.podo.client.configure(id, props)`로 넘기고, 설치가 끝나면 `podo:ready`가 한 번 온다.
- Hono: `Toaster`를 추가하고 `window.podo.toast`(React `toast`와 같은 함수·스토어:
  `normal/success/danger/info/warning`·`dismiss`)를 내보낸다. 서버 flash `Toast`는
  `closable` X·`duration` 자동 닫힘을 클라이언트가 처리하고 취소 가능한 `podo:close`를 낸다.
- Hono: `Tooltip`에 트리거 `children`·`open`·`portal`을 받아 island로 동작한다(hover/focus,
  aria-describedby, body 포탈). children 없는 기존 정적 말풍선은 그대로다.
- Hono: `Table`에 `checkbox`·`defaultSelected`·`id`를 추가한다 — 선택 열·전체 선택·행 클릭·드래그
  범위 선택(`podo:selection-change`). 셀 안 Chip·Tooltip·DatePicker 등 중첩 island는 바깥
  Table이 함께 마운트하고(중첩 Chip 제거는 표에서만 빠짐, 안쪽 함수 조건은 Table 마운트를
  configure까지 미룸), 안쪽 이벤트는 `detail.id`로 구분한다.
- React: Table 행 클릭 선택이 편집 가능한 영역(`contenteditable`, 예: 셀 안 Editor 본문) 클릭은
  무시한다 — 입력·버튼 등 기존 제외 대상과 같다.
- React: Toaster의 CSS 변수(`--podo-toast-count`·`--podo-toast-index`)를 단위 없는 문자열로
  넘긴다(출력 동일, hono/jsx/dom 호환).
- Hono: `DatePicker`를 추가한다. SSR은 React DatePicker의 닫힌 입력 칸과 같은 마크업과 폼 hidden
  (`name` 또는 `fromName`/`toName`)을 내고, 달력·시간 패널은 `podo-ui/hono/client`가 같은 React
  코드로 마운트한다(확정 시 `podo:change`, 초기화 `podo:reset`). `Date` 값은 로컬 벽시계로 옮기고,
  함수 조건이 섞인 `disable`/`enable`은 `id`와 함께 `configure`로 넘긴다.
- Hono: `Editor`를 추가한다. SSR은 루트·툴바 자리·편집 영역(초기 HTML, 마운트 전엔 편집 불가)·
  숨은 textarea(`name`) 셸을 내고, 같은 `podo-ui/hono/client`(단일 파일, Editor 포함)가 React Editor를 마운트한다
  (`podo:change { content }`·`podo:image-upload-error { error, file }`). Hono 전용 `uploadUrl`은
  이미지를 FormData `file`로 POST하고 JSON `{ url }`(http(s)·상대 경로·`data:image/*`만)을 넣으며, `configure(id, { onImageUpload })`
  함수가 있으면 그쪽이 우선한다. `validator`(zod 등)는 `configure`로 넘기고 그때까지 마운트를
  미룬다. 표 셀 안 Editor도 다른 중첩 island처럼 Table과 함께 마운트된다.
- Hono: Select·Chip·Switch SSR이 island 래퍼로 감싸지고 React 첫 렌더와 같은 마크업을 낸다
  (Select 값 영역 `.podo-select__value-content`, 인라인 메뉴의 리스트박스·셀 id, Switch
  `data-disabled`, 제거 버튼 `tabindex`). Select는 `searchable`·`portal`(기본 true)·`name`
  (hidden input, `data-name`)을 받는다 — 기본 portal에서는 `open` 메뉴가 클라이언트 마운트 뒤
  body에 나타나므로 SSR에 펼친 메뉴가 필요하면 `portal={false}`를 준다. 기존 prop은 그대로이고, `value`·`values`·`selected`·`checked`는 클라이언트에서 비제어
  초기값이 된다. Field 자동 글자 수는 컨트롤 초기값 길이에서 시작하고 입력에 따라 갱신된다.

## 2.3.10 (2026-09-07)

- MCP: 로컬 실행을 단순화한다 — 프로젝트 루트를 명시적으로 지정할 수 있고, 설치된 MCP
  bin이 바로 시작된다. AI 클라이언트 등록과 문제 해결을 담은 사이트 안내(`/mcp`)를 추가한다.
- Docs: 문서 페이지를 미리 렌더링해 검색·공유 메타데이터와 sitemap을 제공하고, 없는 경로는
  HTTP 404를 돌려준다. Google Analytics·Search Console 연결을 설정값으로 켤 수 있다.

## 2.3.9 (2026-08-11)

- Native: 생성 토큰의 정확한 타입을 유지하며 앱 어디서나 Provider 토큰을 읽는
  `usePodoNativeTokens` 훅을 추가한다.
- Docs: 일반 HTML/CSS, React, Next.js, Hono CSR/SSR, React Native의 앱 루트
  테마 설정과 색상·간격·반경·타이포그래피 전역 토큰 사용 예제를 추가한다.
- Docs: 루트 README, npm README, 사이트 설치 안내를 첫 설치부터 프로젝트
  토큰 생성까지 자연스럽게 이어지는 사용자 중심 흐름으로 전면 개편한다.

## 2.3.8 (2026-08-10)

- Utilities: v1의 Border, Radius, Shadow/Elevation, Display/Visibility 계약을
  검증된 JSON 원본과 재현 가능한 CSS/SCSS 생성기로 이식하고
  `podo-ui/styles.css`에 호환 클래스를 포함한다.
- Docs: 실제 배포 클래스를 사용하는 네 유틸리티 페이지, 전체 값 표,
  React·Next.js·Hono CSR/SSR·HTML 예제와 React Native 지원 경계를 추가한다.
- Repo: Podo v2 개발 이력을 canonical `main` 브랜치로 통합하고 이후 작업과
  배포 기준을 `main`으로 변경한다.

## 2.3.7 (2026-08-10)

- Editor: React·Next.js·Hono CSR에서 파일 선택·붙여넣기·드롭 이미지를
  `onImageUpload`으로 외부 저장소에 처리하고 반환 URL을 삽입할 수 있다.
  React Native도 picker 결과를 같은 방식의 공개 URI로 교체하며, 양쪽 모두
  실패 콜백과 기존 인라인/data URL 동작을 유지한다.
- Docs: 플랫폼별 외부 이미지 업로드 예제와 Hono SSR 경계를 설명하고,
  DatePicker Usage 팝업을 body 포털로 렌더링해 예제 프레임에 잘리지 않게 한다.

## 2.3.6 (2026-08-10)

- React: `PodoThemeProvider applyToDocument`를 추가해 앱 전체와 body 포털이
  같은 `data-podo-theme`·`data-color-scheme` 토큰 범위를 사용하도록 지원한다.
- Docs: Hono Cloudflare Worker 기반 clean URL, 페이지 전환 스크롤 초기화,
  기존 `#/` 주소 자동 이전과 React·Next.js·Hono CSR/SSR·React Native별
  프로젝트 테마 및 의미 기반 색상 예제를 추가한다.

## 2.3.0 (2026-07-22)

- 다크 모드 지원: 원본 Figma 파일의 theme 컬렉션(112개 변수, light/dark
  모드)을 기본 토큰 문서에 이식 — `podo build`의 tokens.css가 스킴별 값을
  발행해 `data-color-scheme="dark"` 전환만으로 전 컴포넌트가 재스타일된다
  (알파 값은 #RRGGBBAA). styles.css의 라이트 폴백은 그대로 유지되어
  빌드 없이 쓰는 소비자의 라이트 렌더는 변하지 않는다.

## 2.2.0 (2026-07-21)

- native: Chip `defaultSelected`, Switch/Checkbox/Radio `defaultChecked`,
  Select `defaultValue`/`defaultValues` 비제어 상태 API (제어 프롭이 항상
  우선, 콜백은 양쪽 모드에서 동일하게 발화) — 스펙 패리티 완성
- native: Field 라벨 press가 감싼 컨트롤을 포커스 (`inputRef` 병합 전달,
  disabled Field에선 no-op)
- spec: Typography variant 기본값이 `as`에서 유도되는 공통 동작(react/hono)을
  스펙 문서에 명문화
- repo: examples/react를 `podo init/build` 실사용 Vite 소비자 앱으로 복구,
  2026-07 검증 캠페인 증거(리포트·명령 로그·codex 리뷰 6라운드)를
  docs/verification/2026-07에 보관

## 2.1.0 (2026-07-21)

전 컴포넌트를 React/Next.js/Hono/React Native 실소비 하니스에서 브라우저
검증하고 6라운드 적대적 리뷰를 거치며 약 80건의 결함을 수정했다
(워크스페이스 테스트 177 → 340). 주요 변경:

- 신규 API: Icon `size`(sm/md/lg)·`decorative` (web/react/hono/native),
  DatePicker `defaultValue`(비제어 모드), `podo-ui/icons.css` 기본 글리프
  export, `NativeHost.ScrollView`, provider `iconGlyphs`, hono Select/
  Tooltip/Checkbox/Radio/Switch/Button의 id·aria 배선 프롭
- 기본 빌드: 타이포그래피 스케일·컬러 팔레트·Badge 컴포넌트 문서가 CLI
  기본값에 포함 — styles.css가 소비하는 토큰/바인딩 변수를 기본 빌드가
  실제로 발행한다. 기본 아이콘 9종(메뉴·체브론·달력·시계·새로고침·체크·
  닫기·검색)
- Select: SSR 안전(defaultOpen)·ARIA 동기화·뷰포트 플립·검색 모드
  콤보박스 배선·disabled/readOnly 잠금·키보드 칩 제거
- DatePicker: 12개 모드 조합 커밋 보장, 제약 인지 키보드 그리드, min/max
  클램프, 비제어 렌더링
- Editor: 스코프 키보드, 블록 안전 색상 적용, 코드뷰 라이브 onChange/검증,
  인스턴스별 안정 id, 이미지/표/유튜브 편집 플로우 정리
- Native: Button/Chip pressed·disabled 트리트먼트, Select 리스트박스
  키보드 계약(+RNW Enter 합성 가드), Toast status/alert role, 폼 컨트롤
  키보드 활성화, Field 전파(OR)·useId id
- Field(공통): disabled/invalid가 감싼 컨트롤을 강제(OR), 라벨-명시적
  id 연결, 제어 값 카운터 동기화

## 0.0.0

- Initial Podo v2 workspace in progress.
- JSON-first design token, component, icon, theme, CLI, and MCP foundations are tracked through Changesets before the first public release.
