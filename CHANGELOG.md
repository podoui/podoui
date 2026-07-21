# Changelog

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
