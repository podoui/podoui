# Podo v2 Todo

기준 문서: `plan.md`
작성일: 2026-06-11

## 진행 규칙

- [x] 각 작업은 완료 기준을 만족할 때만 체크한다.
- [x] 스펙 변경은 반드시 schema, sample JSON, validation test를 함께 수정한다.
- [x] 생성물 변경은 source JSON에서 다시 빌드 가능한 상태여야 한다.
- [x] 설치 프로젝트용 기능은 `.podo` 경로 밖의 파일을 임의로 덮어쓰지 않는다.
- [x] 사용자 프로젝트에 쓰기 작업을 하는 CLI/MCP 기능은 dry-run과 diff 확인을 먼저 제공한다.

## Phase 0: 저장소 기반 작업

- [x] pnpm workspace 기반 모노레포 초기화
  - 완료 기준: `pnpm-workspace.yaml`이 있고 `packages/*`, `examples/*`가 workspace로 인식된다.
- [x] root `package.json` 생성
  - 완료 기준: `type: module`, 공통 scripts, package manager, repository, license가 정의된다.
- [x] TypeScript 공통 설정 생성
  - 완료 기준: root `tsconfig.base.json`과 패키지별 `tsconfig.json`이 연결된다.
- [x] lint/format/test 기본 도구 결정 및 설정
  - 완료 기준: `pnpm lint`, `pnpm typecheck`, `pnpm test` 명령이 존재한다.
- [x] Changesets 초기화
  - 완료 기준: `.changeset/config.json`이 생성되고 version/publish 흐름이 문서화된다.
- [x] main 브랜치 배포 구조 분석 결과 반영
  - 완료 기준: npm `exports`, `files`, `bin`, `prepublishOnly` 설계 초안이 root 또는 docs에 반영된다.
- [x] 패키지 네이밍 최종 결정
  - 완료 기준: `@podo/*` scoped package와 단일 `podo-ui` subpath export 중 1차 배포 전략이 확정된다.

## Phase 1: 스펙 고정

### Token Schema

- [x] DTCG 기반 token JSON schema 작성
  - 완료 기준: `$type`, `$value`, `$description`, `$extensions`, alias reference를 검증한다.
- [x] Podo 전용 token extension 정의
  - 완료 기준: `$extensions.podo.themeable`, `roles`, `scope`, `deprecated`, `migration` 필드가 타입화된다.
- [x] token category 구조 정의
  - 완료 기준: `primitive`, `semantic`, `component`, `theme` 계층이 문서화되고 샘플이 있다.
- [x] typography composite token 모델 정의
  - 완료 기준: fontFamily, fontSize, lineHeight, weight, letterSpacing, paragraphSpacing를 검증한다.
- [x] spacing/radius/shadow/motion token 모델 정의
  - 완료 기준: 단위, scale, alias, theme override가 검증된다.
- [x] color token 모델 정의
  - 완료 기준: hex, alpha, semantic alias, light/dark override가 검증된다.

### Component Schema

- [x] component JSON schema 작성
  - 완료 기준: id, name, category, status, anatomy, slots, props, states, tokens, targets를 검증한다.
- [x] props type system 정의
  - 완료 기준: boolean, string, number, enum, union, object, event handler 타입을 표현한다.
- [x] slot model 정의
  - 완료 기준: default slot, named slot, required slot, repeated slot, fallback을 표현한다.
- [x] variant/state model 정의
  - 완료 기준: variant 조합, state별 token binding, disabled/loading/focusVisible 상태를 표현한다.
- [x] anatomy model 정의
  - 완료 기준: root, label, icon, helper 등 part 이름과 target별 매핑을 표현한다.
- [x] target support model 정의
  - 완료 기준: web/react/hono/native 지원 여부와 제한 사항을 스펙에 표현한다.
- [x] accessibility spec model 정의
  - 완료 기준: role, aria, keyboard interaction, focus management 요구사항을 표현한다.

### Icon Schema

- [x] icon manifest schema 작성
  - 완료 기준: fontFamily, icons, codepoint, source, tags, groups를 검증한다.
- [x] icon group schema 작성
  - 완료 기준: 그룹 추가/삭제/정렬과 아이콘 중복 포함 규칙을 검증한다.
- [x] stable codepoint lock schema 작성
  - 완료 기준: 기존 아이콘의 codepoint가 의도 없이 바뀌지 않도록 lock 파일을 검증한다.

### .podo Schema

- [x] `.podo/config.json` schema 작성
  - 완료 기준: environment, darkMode, themes, build target, outDir를 검증한다.
- [x] `.podo/lock.json` schema 작성
  - 완료 기준: package version, schema version, migration state, generated hash를 검증한다.
- [x] `.podo` override merge 규칙 정의
  - 완료 기준: package default와 project override의 우선순위가 테스트된다.

### 샘플 스펙

- [x] Button 샘플 component spec 작성
  - 완료 기준: props, slots, variants, states, tokens, examples가 포함된다.
- [x] Input 샘플 component spec 작성
  - 완료 기준: value, invalid, disabled, helper/error 상태가 포함된다.
- [x] Field 샘플 component spec 작성
  - 완료 기준: label, description, error, required, control slot이 포함된다.
- [x] Typography 샘플 token spec 작성
  - 완료 기준: landing/dashboard h1/body 값 차이가 표현된다.
- [x] Color 샘플 token spec 작성
  - 완료 기준: light/dark semantic color가 표현된다.
- [x] Icon group 샘플 spec 작성
  - 완료 기준: navigation/editor 그룹과 codepoint lock이 표현된다.

### Validation

- [x] `@podo/spec` 패키지 생성
  - 완료 기준: schema, zod parser, TypeScript type export가 포함된다.
- [x] schema validation test 작성
  - 완료 기준: valid sample은 통과하고 invalid sample은 명확한 에러를 낸다.
- [x] reference validation 구현
  - 완료 기준: 존재하지 않는 token alias, circular reference, broken component token binding을 검출한다.
- [x] schema versioning 정책 작성
  - 완료 기준: breaking/non-breaking schema change 기준이 문서화된다.

## Phase 2: 토큰과 아이콘 빌드

### Token Resolver

- [x] `@podo/tokens` 패키지 생성
  - 완료 기준: token load, merge, resolve API가 export된다.
- [x] token file loader 구현
  - 완료 기준: package default와 `.podo/tokens`를 함께 로드한다.
- [x] alias resolver 구현
  - 완료 기준: `{color.primary}` 형태 참조와 JSON Pointer 참조를 해석한다.
- [x] theme resolver 구현
  - 완료 기준: landing/dashboard/custom, light/dark 조합의 resolved token set을 만든다.
- [x] component token resolver 구현
  - 완료 기준: component token이 primitive/semantic token을 참조해 최종 값으로 풀린다.
- [x] token validation CLI API 구현
  - 완료 기준: 중복 이름, 잘못된 단위, circular alias를 에러로 표시한다.

### Token Outputs

- [x] CSS variables 생성기 구현
  - 완료 기준: theme별 `[data-podo-theme]`, `[data-color-scheme]` CSS가 생성된다.
- [x] TypeScript token object 생성기 구현
  - 완료 기준: ESM import 가능한 typed token object가 생성된다.
- [x] React Native token object 생성기 구현
  - 완료 기준: RN에서 사용할 number/string 값이 단위 변환되어 생성된다.
- [x] token JSON bundle 생성기 구현
  - 완료 기준: MCP가 읽는 resolved JSON bundle이 생성된다.
- [x] sourcemap 또는 origin metadata 생성
  - 완료 기준: resolved 값이 어느 원본 파일/토큰에서 왔는지 추적된다.

### Legacy Grid Compatibility

- [x] 기존 grid 시스템 호환 산출물 구현
  - 완료 기준: v1 `scss/layout/grid.scss`의 `.grid`, `.grid-fix-{2..6}`, `.w-*`, `.w-full`, `.w-{n}_{d}`, `.w-{n}px` 동작과 12/6/4 컬럼 규칙을 유지하는 CSS/SCSS 산출물이 생성된다.
- [x] grid 호환성 테스트 작성
  - 완료 기준: 기존 grid 클래스와 PC/tablet/mobile column/gap/padding 규칙이 snapshot으로 고정된다.

### Icon Build

- [x] `@podo/icons` 패키지 생성
  - 완료 기준: icon manifest parser와 build API가 export된다.
- [x] SVG source 규칙 정의
  - 완료 기준: viewBox, currentColor, width/height 제거 규칙이 문서화된다.
- [x] SVG optimizer 도입
  - 완료 기준: 빌드 전에 SVG가 일관된 형태로 정리된다.
- [x] SVG to WOFF 빌드 구현
  - 완료 기준: `PodoIcons.woff`와 CSS font-face가 생성된다.
- [x] WOFF2 산출 여부 결정 및 구현
  - 완료 기준: 웹 성능을 위한 `woff2` 생성 여부가 결정되고 빌드에 반영된다.
- [x] icon class CSS 생성
  - 완료 기준: `.podo-icon-chevron-left::before` 또는 동등한 클래스가 생성된다.
- [x] TypeScript icon name union 생성
  - 완료 기준: React/Web 컴포넌트에서 icon name 자동완성이 된다.
- [x] React Native icon 산출물 생성
  - 완료 기준: RN용 glyph map 또는 SVG component 산출물이 생성된다.
- [x] icon group build 구현
  - 완료 기준: 특정 그룹만 포함한 subset font를 만들 수 있다.
- [x] codepoint lock 검증 구현
  - 완료 기준: 기존 아이콘 codepoint 변경 시 빌드가 실패한다.

### Build 검증

- [x] landing/dashboard light/dark 토큰 빌드 테스트
  - 완료 기준: 네 조합의 CSS/TS/RN 출력 snapshot이 생성된다.
- [x] icon font snapshot 테스트
  - 완료 기준: manifest, CSS, font metadata가 안정적으로 생성된다.
- [x] 빌드 성능 기준 설정
  - 완료 기준: token/icon build 최대 실행 시간이 문서화된다.

## Phase 3: 컴포넌트 코드 생성 MVP

### 공통 Core

- [x] `@podo/core` 패키지 생성
  - 완료 기준: 공통 state, interaction, a11y helper를 export한다.
- [x] component registry 구현
  - 완료 기준: component spec을 이름/category/target으로 조회할 수 있다.
- [x] renderer contract 정의
  - 완료 기준: web/react/hono/native renderer가 구현해야 할 인터페이스가 문서화된다.
- [x] accessibility helper 구현
  - 완료 기준: id 연결, aria-describedby, focusVisible, keyboard handler를 재사용한다.
- [x] state machine 또는 behavior module 패턴 확정
  - 완료 기준: 기능성 컴포넌트가 behavior와 renderer를 분리한다.

### Web Components

- [x] `@podo/web` 패키지 생성
  - 완료 기준: Custom Element 등록 API와 CSS import가 제공된다.
- [x] Web Component 기반 기술 확정
  - 완료 기준: Lit 사용 여부와 직접 Custom Element 구현 범위가 문서화된다.
- [x] Button web renderer 구현
  - 완료 기준: slots, variants, states, CSS variables가 동작한다.
- [x] Input web renderer 구현
  - 완료 기준: value, disabled, invalid, focus 상태가 동작한다.
- [x] Field web renderer 구현
  - 완료 기준: label/helper/error/control slot과 aria 연결이 동작한다.
- [x] Icon web renderer 구현
  - 완료 기준: icon font와 group subset을 사용할 수 있다.
- [x] Typography web renderer 구현
  - 완료 기준: theme별 typography token이 적용된다.
- [x] Web Component visual tests 작성
  - 완료 기준: 기본/variant/theme/dark mode 스냅샷이 있다.

### React

- [x] `@podo/react` 패키지 생성
  - 완료 기준: React entry와 typed component exports가 제공된다.
- [x] React 구현 전략 확정
  - 완료 기준: Web Component wrapper와 native React renderer 중 MVP 전략이 결정된다.
- [x] Button React renderer 구현
  - 완료 기준: typed props, ref, event handler, icon slots가 동작한다.
- [x] Input React renderer 구현
  - 완료 기준: controlled/uncontrolled value와 a11y 연결이 동작한다.
- [x] Field React renderer 구현
  - 완료 기준: children control과 error/helper UI가 동작한다.
- [x] React hooks 또는 provider 구현
  - 완료 기준: theme provider와 color scheme 전환 API가 제공된다.
- [x] React tests 작성
  - 완료 기준: Testing Library 기반 interaction 테스트가 통과한다.

### Hono TSX

- [x] `@podo/hono` 패키지 생성
  - 완료 기준: Hono JSX에서 import 가능한 TSX 컴포넌트를 제공한다.
- [x] Hono renderer 범위 확정
  - 완료 기준: SSR/정적 컴포넌트와 interactive 컴포넌트의 경계가 문서화된다.
- [x] Button Hono renderer 구현
  - 완료 기준: class/style/token이 SSR HTML로 출력된다.
- [x] Input Hono renderer 구현
  - 완료 기준: form attribute와 a11y 속성이 SSR HTML에 반영된다.
- [x] Field Hono renderer 구현
  - 완료 기준: label/helper/error 연결이 SSR HTML에 반영된다.
- [x] Hono critical CSS helper 구현
  - 완료 기준: 초기 theme CSS와 dark mode script 삽입 방식이 제공된다.
- [x] Hono examples 작성
  - 완료 기준: Hono 앱에서 `c.render` 또는 JSX 응답으로 동작한다.

### React Native

- [x] `@podo/native` 패키지 생성
  - 완료 기준: RN entry와 typed component exports가 제공된다.
- [x] RN token adapter 구현
  - 완료 기준: px/rem 등 웹 단위가 RN number/string으로 변환된다.
- [x] RN theme provider 구현
  - 완료 기준: landing/dashboard, light/dark 전환이 가능하다.
- [x] Button native renderer 구현
  - 완료 기준: Pressable 기반 variants/states가 동작한다.
- [x] Input native renderer 구현
  - 완료 기준: TextInput 기반 value/error/disabled가 동작한다.
- [x] Field native renderer 구현
  - 완료 기준: label/helper/error와 accessibilityLabel 연결이 동작한다.
- [x] Icon native renderer 구현
  - 완료 기준: SVG 또는 glyph map 방식으로 아이콘이 표시된다.
- [x] RN example app 작성
  - 완료 기준: Expo 또는 RN 샘플에서 기본 컴포넌트가 렌더링된다.

### Codegen

- [x] `@podo/codegen` 또는 내부 codegen 모듈 생성
  - 완료 기준: component spec에서 target별 파일을 생성할 수 있다.
- [x] codegen template 구조 작성
  - 완료 기준: renderer별 template와 shared helper가 분리된다.
- [x] generated file header 정책 작성
  - 완료 기준: 생성 파일임을 표시하고 수동 수정 금지 안내가 들어간다.
- [x] codegen idempotency 테스트 작성
  - 완료 기준: 같은 입력으로 두 번 빌드해도 diff가 없다.

## Phase 4: CLI와 `.podo`

### CLI Foundation

- [x] `@podo/cli` 패키지 생성
  - 완료 기준: `podo` bin이 로컬에서 실행된다.
- [x] CLI command router 구현
  - 완료 기준: `init`, `build`, `validate`, `update`, `migrate`, `mcp` 명령이 등록된다.
- [x] project root 탐색 구현
  - 완료 기준: package.json 또는 git root 기준으로 설치 프로젝트 루트를 찾는다.
- [x] config loader 구현
  - 완료 기준: `.podo/config.json`이 없을 때 명확한 안내를 출력한다.
- [x] CLI logging/error format 정의
  - 완료 기준: validation error, warning, next action이 읽기 쉽게 출력된다.

### Init

- [x] `podo init` 인터랙티브 wizard 구현
  - 완료 기준: environment, theme, dark mode, outDir를 설정한다.
- [x] non-interactive init 옵션 구현
  - 완료 기준: CI나 템플릿에서 `podo init --target react --theme dashboard`가 동작한다.
- [x] `.podo` 디렉토리 생성 구현
  - 완료 기준: config, lock, tokens, themes, components, icons, generated, cache 구조를 만든다.
- [x] framework 감지 구현
  - 완료 기준: React, Hono, React Native 프로젝트를 package.json 기반으로 추정한다.
- [x] framework별 bootstrap 파일 생성
  - 완료 기준: React provider, Hono CSS helper, RN provider 연결 예시를 만든다.

### Build

- [x] `podo build` 구현
  - 완료 기준: config target에 맞춰 token/icon/component build를 실행한다.
- [x] target별 build 옵션 구현
  - 완료 기준: `--target web|react|hono|native`가 동작한다.
- [x] outDir 쓰기 정책 구현
  - 완료 기준: `.podo/generated`와 프로젝트 지정 outDir 중 선택 가능하다.
- [x] build dry-run 구현
  - 완료 기준: 생성/수정/삭제될 파일 목록을 실제 쓰기 전에 볼 수 있다.
- [x] build cache 구현
  - 완료 기준: 입력 hash가 같으면 불필요한 재생성을 건너뛴다.

### Validate

- [x] `podo validate` 구현
  - 완료 기준: `.podo` config, tokens, themes, components, icons를 모두 검증한다.
- [x] validation report 파일 출력 옵션 구현
  - 완료 기준: JSON report를 CI에서 사용할 수 있다.
- [x] schema mismatch 감지 구현
  - 완료 기준: lock schema version이 현재 패키지와 다르면 migrate 안내를 한다.

## Phase 6: MCP

### MCP Server

- [x] `@podo/mcp` 패키지 생성
  - 완료 기준: MCP stdio server가 실행된다.
- [x] `podo mcp` CLI 연결
  - 완료 기준: `npx podo mcp` 또는 동등한 명령으로 서버가 시작된다.
- [x] MCP data loader 구현
  - 완료 기준: package default와 설치 프로젝트 `.podo` 정보를 함께 읽는다.
- [x] MCP tool registration 구조 구현
  - 완료 기준: 도구별 파일이 분리되고 테스트 가능하다.

### Read Tools

- [x] `get_system_overview` 구현
  - 완료 기준: version, targets, themes, components, config summary를 반환한다.
- [x] `search_tokens` 구현
  - 완료 기준: 이름, 역할, 타입, 값으로 토큰을 검색한다.
- [x] `get_token` 구현
  - 완료 기준: 원본 값, resolved 값, theme별 값, origin metadata를 반환한다.
- [x] `search_components` 구현
  - 완료 기준: name, category, slot, prop, target으로 검색한다.
- [x] `get_component_spec` 구현
  - 완료 기준: 특정 컴포넌트의 JSON 스펙을 반환한다.
- [x] `get_component_example` 구현
  - 완료 기준: web/react/hono/native별 사용 예시를 반환한다.
- [x] `validate_podo_project` 구현
  - 완료 기준: `.podo` 검증 결과를 MCP 응답으로 반환한다.
- [x] `explain_migration` 구현
  - 완료 기준: update 시 변경점과 충돌 가능성을 설명한다.

### Write/Suggest Tools

- [x] `suggest_component_spec` 구현
  - 완료 기준: 사용자 요구를 기반으로 component spec 초안을 반환하되 파일은 쓰지 않는다.
- [x] write tool 정책 작성
  - 완료 기준: `write_*` 도구는 dry-run, 경로 제한, validation을 반드시 거친다.
- [x] MCP 보안 가이드 작성
  - 완료 기준: Claude Code/Codex 등록 방법과 안전한 사용 범위를 문서화한다.

### AI 사용성

- [x] Claude Code 등록 문서 작성
  - 완료 기준: `claude mcp add podo -- npx podo mcp` 흐름이 검증된다.
- [x] Codex 사용 문서 작성
  - 완료 기준: MCP 또는 JSON fallback 경로가 문서화된다.
- [x] AI prompt examples 작성
  - 완료 기준: 컴포넌트 생성, 토큰 조회, migration 설명 예시가 있다.

## Phase 7: 업데이트와 마이그레이션

- [x] migration manifest schema 작성
  - 완료 기준: from/to version, operations, risk level, notes를 검증한다.
- [x] JSON Patch 기반 migration runner 구현
  - 완료 기준: renameToken, moveComponentProp, removeDeprecatedToken 등 기본 op가 동작한다.
- [x] `podo update --dry-run` 구현
  - 완료 기준: 새 버전과 현재 `.podo` 차이를 쓰기 없이 보고한다.
- [x] conflict detector 구현
  - 완료 기준: 사용자 override와 새 기본 스펙 변경이 충돌하면 명확히 표시한다.
- [x] lockfile update 구현
  - 완료 기준: migration 성공 후 `.podo/lock.json`이 갱신된다.
- [x] rollback 전략 문서화
  - 완료 기준: migration 전 backup 또는 git diff 기반 복구 방법이 안내된다.

## Phase 9: 예제와 문서

- [x] web example 작성
  - 완료 기준: Custom Elements와 icon font, theme switching이 보인다.
- [x] React example 작성
  - 완료 기준: Provider, Button/Input/Field, dark mode가 보인다.
- [x] Hono example 작성
  - 완료 기준: SSR HTML, critical CSS, form example이 보인다.
- [x] React Native example 작성
  - 완료 기준: theme provider와 기본 컴포넌트가 보인다.
- [x] 설치 가이드 작성
  - 완료 기준: npm install, `podo init`, `podo build`, framework 연결이 설명된다.
- [x] 토큰 작성 가이드 작성
  - 완료 기준: DTCG 형식, alias, theme override, naming rule이 설명된다.
- [x] 컴포넌트 스펙 작성 가이드 작성
  - 완료 기준: props, slots, variants, states, a11y, target support 작성법이 설명된다.
- [x] 아이콘 가이드 작성
  - 완료 기준: SVG 준비, group, codepoint lock, woff build 사용법이 설명된다.
- [x] 업데이트/마이그레이션 가이드 작성
  - 완료 기준: `podo update`, dry-run, conflict 처리 방법이 설명된다.
- [x] MCP 사용 가이드 작성
  - 완료 기준: Claude Code/Codex에서 사용할 수 있는 도구와 예시가 설명된다.

## Phase 10: 테스트와 품질 기준

- [x] unit test 기준 수립
  - 완료 기준: schema, resolver, codegen, CLI 핵심 로직에 테스트가 있다.
- [x] visual regression test 기준 수립
  - 완료 기준: web/react 컴포넌트의 theme/variant snapshot이 있다.
- [x] accessibility test 기준 수립
  - 완료 기준: 기본 컴포넌트에 role/aria/keyboard interaction 테스트가 있다.
- [x] build output snapshot 기준 수립
  - 완료 기준: token/icon/component 산출물이 snapshot으로 검증된다.
- [x] cross-target parity test 작성
  - 완료 기준: 같은 spec이 web/react/hono/native에서 의미상 같은 props와 token을 사용한다.
- [x] CLI e2e test 작성
  - 완료 기준: temp project에서 `podo init/build/validate/update`가 실행된다.
- [x] MCP integration test 작성
  - 완료 기준: MCP tools가 sample `.podo` 프로젝트에서 올바른 응답을 반환한다.
- [x] package size budget 설정
  - 완료 기준: web/react/native/cli/mcp 패키지의 목표 크기가 문서화된다.
- [x] performance budget 설정
  - 완료 기준: token build, component build 목표 시간이 문서화된다.

## Phase 11: 문서 사이트 (Docs Site)

기준: shadcn/ui 스타일 문서 사이트. `@podo/react`를 그대로 렌더링하는 라이브 프리뷰. 정적(Vite) 빌드.

- [ ] `@podo/docs` 패키지 뼈대
  - 완료 기준: `packages/docs`가 pnpm workspace로 인식되고 `@podo/react`를 workspace 의존성으로 import한다.
  - 완료 기준: Vite + React로 dev 서버 실행과 정적 `dist` 빌드가 된다.
  - 완료 기준: 헤더, 사이드바 내비게이션, 콘텐츠 레이아웃, 컴포넌트별 라우팅 틀이 있어 컴포넌트 추가가 라우트/사이드바 항목 추가만으로 가능하다.
- [ ] Button 문서 페이지
  - 완료 기준: 현재 `@podo/react`의 Button을 실제로 렌더링하는 라이브 프리뷰가 있다(hover/disabled 동작).
  - 완료 기준: react/web/hono/native 4타깃 코드 스니펫을 탭으로 보여준다. react/web은 `button.component.json`의 examples와, hono/native는 각 렌더러 사용법과 일치한다.
  - 완료 기준: variant(solid/soft/outline/ghost) × size(sm/md/lg)와 disabled/loading을 보여주는 variants 쇼케이스가 있다.
  - 완료 기준: variant/size/disabled/loading/onPress를 담은 props 테이블이 있고, 값이 `button.component.json`과 일치한다.

## 릴리스 준비 체크리스트

- [x] 모든 package `exports` 검증
- [x] ESM/CJS 지원 범위 결정 및 문서화
- [x] TypeScript declaration 출력 검증
- [x] npm `files` 필드 검증
- [x] bin 실행 권한 검증
- [x] `prepublishOnly` 또는 CI publish pipeline 검증
- [x] Changesets version/publish dry-run 검증
- [x] README 작성
- [x] CHANGELOG 생성
- [x] license 포함
- [x] example projects build 검증
- [x] MCP 패키지 실행 검증
- [x] canary 배포 전략 문서화

## 1차 MVP 완료 기준

- [x] JSON token/component/icon/config schema가 있다.
- [x] Button, Input, Field, Icon, Typography 샘플 스펙이 있다.
- [x] landing/dashboard와 light/dark token build가 된다.
- [x] icon woff와 manifest가 생성된다.
- [x] web/react/hono/native 중 최소 web/react/hono Button이 렌더링된다.
- [x] `podo init`, `podo validate`, `podo build`가 동작한다.
- [x] `.podo` 설정이 생성되고 build 산출물에 반영된다.
- [x] MCP read tools로 token/component 조회가 가능하다.
- [x] 설치 가이드와 MCP 사용 가이드가 있다.

## 2차 MVP 완료 기준

- [x] React Native 기본 컴포넌트가 동작한다.
- [x] `podo update --dry-run`과 migration report가 동작한다.
- [x] Claude Code/Codex가 MCP로 Podo 스펙을 조회해 코드 작성에 활용할 수 있다.

## 보류하거나 나중에 결정할 항목

- [x] Web Component 구현을 Lit으로 고정할지 직접 Custom Element로 갈지 결정
- [x] React를 Web Component wrapper로 만들지 native React renderer로 만들지 결정
- [x] Hono에서 Declarative Shadow DOM을 공식 지원 범위에 넣을지 결정
- [x] React Native 아이콘을 font glyph로 갈지 SVG component로 갈지 결정
- [x] 단일 `podo-ui` 패키지와 `@podo/*` 멀티 패키지 배포 중 1차 전략 결정
- [x] Figma 연동을 plugin, REST sync, GitHub Action 중 어디까지 1차 지원할지 결정

## Claude 보고서 기반 보정 작업

- [x] P1: 테마와 기존 grid 반영 보강
  - 완료 기준: v2 수정 범위의 기본 color scheme은 `light`, `dark`, `auto`로 명확히 제한한다.
  - 완료 기준: 기존 v1 grid 시스템은 새 토큰 재설계 없이 호환 산출물/문서/테스트 기준으로 유지된다.
- [x] P2: Button spec 완성
  - 완료 기준: 기존 Button의 theme, variant, size, state, alignment 조합이 JSON spec과 test에 반영된다.
  - 완료 기준: Button 기본값과 token binding이 v1 문서/SCSS 기준과 충돌하지 않는다.
- [x] P3: 기존 컴포넌트 spec fixture 확장
  - 완료 기준: v1 `public/ai/components`에 있던 주요 컴포넌트가 최소 JSON spec fixture로 이식된다.
  - 완료 기준: 누락 컴포넌트 목록과 의도적으로 보류한 범위가 문서화된다.
- [x] P4: 설치 프로젝트 반영 플로우 연결 검증
  - 완료 기준: `.podo` 기반 project override/build/update 흐름 경로가 CLI 문서와 테스트로 검증된다.
  - 완료 기준: dry-run, validation, diff 확인 없이 설치 프로젝트 파일을 덮어쓰지 않는다.

## 백로그: 다음 작업 (2026-07-13 기준)

세션 진행 중 확인된 미결 항목. 우선순위 순이 아니라 영역별 분류.

### A. 배포·인프라

- [ ] 원격 push 권한 해결
  - 현재 `git push`가 403 (계정 `innerbloo`에 `podoui/podoui` 쓰기 권한 없음). 로컬 `main`이 원격보다 다수 커밋 앞선 상태.
  - 완료 기준: 권한 부여 또는 계정 전환 후 `origin/main`이 로컬과 동기화된다.
- [ ] npm 배포 파이프라인 가동
  - 전 패키지가 `0.0.0` 미배포라 외부 프로젝트에서 설치 불가. Changesets 인프라는 준비됨.
  - 완료 기준: 빈 외부 프로젝트에서 `npm install @podo/react @podo/cli`가 동작한다.
- [ ] 배포 후 docs를 "진짜 소비자"로 전환
  - 현재 `packages/docs`의 `theme.css`는 컴포넌트 CSS 수동 미러, `data/colors.ts`·`typography.ts`는 토큰 값 복제.
  - 완료 기준: docs가 `podo build` 산출물(tokens.css, components.css)을 소비하고 수동 미러·값 복제가 제거된다.
- [ ] `examples/react`를 실행 가능한 소비자 앱으로 복구
  - 현재 옛 Button API를 쓰는 타입체크용 스텁 (dev 서버 없음, 실행 불가).
  - 완료 기준: `podo init && podo build` 실사용 후 dev 서버에서 새 API 컴포넌트가 렌더된다.

### B. Figma 정합 (상세: figma-props-alignment.md)

- [ ] Code Connect publish
  - `.figma.tsx` 12개(button/chip/input/field/switch/textarea/table/checkbox/radio/toast/tooltip/badge) 작성·parse 검증 완료. 남은 것: 팀 Figma 플랜(Org/Enterprise) 확인 → 토큰 발급 → `npx figma connect publish`.
- [ ] AGENTS.md에 어휘 규칙 명문화 + 컴포넌트 작업 체크리스트에 figma.tsx 갱신 단계 추가
- [ ] 디자이너에게 시안 수정 요청 (코드는 시안 픽셀 그대로 반영해 둔 상태)
  - Chip `outline-strong`의 selected가 solid와 동일 렌더 (외곽선 없음) — 수정되면 web CSS/theme.css/native의 "pending a design fix" 주석 지점 갱신
  - Chip 문서(538:6615) size 태그가 `sm/md` ↔ 컴포넌트셋·코드는 `md/lg` — 문서 태그 정리 필요 (코드는 md(base)/lg로 셋과 정렬 완료)
  - Chip 테마 태그 오타 `soild`
  - Input state 태그에 `hover` 누락 (본문·프리뷰엔 있음)
  - Button 문서 용어 `layout` ↔ 컴포넌트 variant 실명 `type` — 통일 필요
  - Tooltip 문서(541:8679) 인트로 문단이 토스트 설명 복붙 — 툴팁 설명으로 교체 필요 (코드 문서에는 툴팁용 인트로를 새로 작성해 둠)
  - Tooltip 셋(388:2125) theme 어휘가 뒤집힘: 팀 기준 default는 어두운 배경인데 셋 변형명은 어두운 쪽이 `reverse`, 문서 설명 문구도 반대 — 코드가 번역 중(figma.tsx), 셋 어휘 정리 필요
  - Badge 문서(541:11262) 색상 표기·도트 두 곳의 properties 태그 오타 `rad` → `red`
  - Badge red 도트 색이 accent.50(#F15764) ↔ 같은 테마의 텍스트는 error.50(#F23B3B) — 다른 도트는 모두 자기 테마의 50 강도를 쓰는데 red만 어긋남. 의도 확인 필요 (코드는 시안 그대로 accent.50 반영, "pending a design check" 주석 지점: web CSS/theme.css/native)
  - Badge 셋(474:3218)의 `state` 불리언이 theme에서 유도되는 중복 속성 (natural~info는 항상 true, gray~orange는 항상 false) — 셋에서 제거하면 변형 관리가 단순해짐 (코드는 theme+dot만 매핑)
  - Input/Textarea 시안에 danger+focused 조합 상태가 없음 — 코드는 "danger 테두리 색 유지 + 두께만 2px(포커스 표시)"로 결정 (유효성 실패 자동 포커스 시 danger가 파란 포커스 색에 덮이지 않도록). 시안에 해당 조합 추가/확정 요청. Select도 동일 규칙 적용됨
  - Select Menu-cell 셋(328:11855)에 hover/pressed 변형이 없음 — 코드는 hover·키보드 활성 셀에 gray.10(#F4F4F5) 배경을 임시 적용. 셀 hover 스펙 확정 요청
  - Select 다중 선택 칩이 많을 때의 처리 시안 규정 없음 — 코드는 "+N" 축약(기본 3개, maxChips)으로 결정, 표기는 14px subtil(#50555E) 텍스트. 확정 요청
  - Select 메뉴 최대 높이 규정 없음 — 코드는 10줄(474px)에서 잘라 내부 스크롤로 결정. 확정 요청
  - Select 상태 섹션(523:14405) 설명 오타 "사용지가" → "사용자가" (코드 문서에는 교정해서 반영)
  - Select 다중 선택 "모두 해제" 표시 시안 규정 없음 — 코드는 clearable prop으로 체브론 앞 ✕ 버튼(gray.50, hover gray.60)으로 결정. 확정 요청
- [ ] (보류) Figma→코드 동기화 파이프라인 (`podo figma-sync`, 트리거 버튼) — 이전 논의 기록은 auto-memory 참고

### C. 컴포넌트·품질

- [ ] 다음 컴포넌트 시안 작업 계속 (Button/Chip/Input/Field 완료; 워크플로: 스펙 → 4렌더러 → 테스트 → docs → figma.tsx)
- [ ] Pretendard 폰트 자산 확정
  - 토큰의 `fontAsset.dataUrl`이 `"AAAA"` 플레이스홀더. docs는 임시로 jsDelivr CDN 로드 중.
  - 완료 기준: 실제 woff2 임베드 또는 CDN 전략 확정이 토큰/빌드에 반영된다.
- [ ] 옛 primary(#5B5BD6) 잔재 정리 여부 결정
  - 남은 위치: `plan.md`(설계 기록), `packages/mcp/src/defaults.ts`, `packages/cli/src/index.ts` (bootstrap 기본 brand 색).
  - 완료 기준: 새 프로젝트 bootstrap 기본색을 #426CED로 바꿀지 결정하고 반영한다.
- [ ] 스펙 데이터화 (렌더러 하드코딩 제거)
  - size 수치(xs 32/sm 36/md 42/lg 52 등)가 스펙에 설명 문자열로만 있고 실값은 각 렌더러 CSS에 중복.
  - 완료 기준: 스펙 JSON이 수치를 데이터로 갖고 codegen이 렌더러 타입/CSS를 생성해 enum·수치 중복이 사라진다.
