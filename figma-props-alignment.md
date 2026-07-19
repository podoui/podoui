# Figma 시안 props ↔ 코드 props 정합 전략

작성일: 2026-07-13
상태: 계획 (미착수) — Code Connect 등록 작업 대기

## 1. 문제 상황

Podo의 주 사용 시나리오는 **사용자가 Claude Code 등 AI 도구에 피그마 시안을 첨부해
바이브코딩하는 것**이다. 이때 AI는 피그마 컴포넌트의 variant 속성을 그대로 읽는데,
피그마 variant와 실제 코드 API가 다르면 존재하지 않는 props로 코드를 생성한다.

예: Button 시안(538:6690)을 첨부하면 AI가 다음처럼 쓸 위험이 있다.

```tsx
// 피그마 variant를 그대로 옮긴 잘못된 코드
<Button state="pressed" layout="prefix" prefixIcon>저장</Button>

// 실제 API
<Button prefix={<Icon name="..." />}>저장</Button>  // pressed는 :active가 처리
```

## 2. 갭의 분류 — 전부 같은 성질이 아니다

| 유형                       | 예시                                               | 방침                                                                                     |
| -------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 이름·값이 같을 수 있는 것  | `theme=solid-primary`, `size=md`                   | ✅ 코드도 동일하게 유지 (기존 "시안 기준" 원칙)                                          |
| 케이스 변환만 다른 것      | `sub-label`→`subLabel`, `helper-text`→`helperText` | ⚠️ JSX 제약상 kebab→camel 기계 변환만 허용. 스펙 JSON의 `slots.targets`가 번역표         |
| 인터랙션 상태              | `state=hover/pressed/focused`                      | ❌ 코드 prop으로 만들지 않는다 — 플랫폼(:hover/:active/:focus)이 처리. `disabled`만 prop |
| 불리언 토글 vs 콘텐츠 슬롯 | `prefixIcon=true`                                  | ❌ 코드는 어떤 아이콘인지(ReactNode)가 필요 — 슬롯 유지                                  |

**결론: 위 두 줄은 계속 시안과 맞추고, 아래 두 줄은 맞추면 오히려 잘못된 API가
되므로 "번역 계층"(Figma Code Connect)으로 잇는다.**

## 3. 해결책: Figma Code Connect

피그마 컴포넌트에 실코드 스니펫 + variant→prop 변환 규칙을 등록하는 기능.
등록하면 `get_design_context`(MCP)가 raw variant 대신 **번역된 실코드**를 반환한다.

```
[등록 전] 시안 첨부 → Tailwind 재구성 + 피그마 variant 이름 → AI가 API 추측 ❌
[등록 후] 시안 첨부 → import { Button } from "@podoui/react";
                     <Button theme="solid-primary" prefix={<Icon/>}>저장</Button> ✅
```

이 피그마 파일의 docs용 컴포넌트(Value/Base 등)는 이미 Code Connect가 걸려 있어
design context에 `CodeConnectSnippet`으로 내려오는 것을 확인했다.

### 매핑 예시 (Button)

```tsx
// packages/react/src/button.figma.tsx
import figma from "@figma/code-connect";
import { Button, Icon } from "@podoui/react";

figma.connect(Button, "https://www.figma.com/design/Rznr8B3.../?node-id=<Button컴포넌트셋>", {
  props: {
    theme: figma.enum("theme", { "solid-primary": "solid-primary" /* ... */ }),
    size: figma.enum("size", { xs: "xs", sm: "sm", md: "md", lg: "lg" }),
    disabled: figma.enum("state", { disabled: true }), // hover/pressed는 의도적으로 떨어뜨림
    prefix: figma.boolean("prefixIcon", { true: <Icon name="placeholder" />, false: undefined }),
    label: figma.string("label"),
  },
  example: ({ theme, size, disabled, prefix, label }) => (
    <Button theme={theme} size={size} disabled={disabled} prefix={prefix}>
      {label}
    </Button>
  ),
});
```

### 두 가지 등록 경로

|           | ① MCP 도구 (즉시)                           | ② 공식 publish (영구)                                  |
| --------- | ------------------------------------------- | ------------------------------------------------------ |
| 방법      | 데스크톱 Figma MCP의 `add_code_connect_map` | 레포에 `.figma.tsx` 작성 + `npx figma connect publish` |
| 표현력    | 컴포넌트↔파일 연결 위주                     | variant→prop 변환 규칙까지 완전한 번역                 |
| 적용 범위 | MCP 사용 환경                               | Dev Mode·MCP 쓰는 모든 사람                            |
| 요구사항  | 없음                                        | **Figma Organization/Enterprise 플랜** + 액세스 토큰   |

## 4. 실행 계획

- [ ] 팀 Figma 플랜 확인 (Org/Enterprise 여부) → publish 가능 여부 결정
- [x] `.figma.tsx` 작성 (컴포넌트 추가마다 갱신, 현재 8개):
      `packages/react/src/{button,chip,input,field,switch,textarea,table,checkbox}.figma.tsx`
  - 실제 컴포넌트(셋) 노드: Button `287:443`, Input `302:607`, Chip `328:14276`, Field `334:1049`,
    Switch(Toggle) `566:12693`, Textarea `380:3867`, Table `474:1795`, Checkbox `328:18039`
    (538:66xx 노드들은 문서 페이지라 매핑 대상 아님)
  - 조사에서 확인된 어휘 갭 → 매핑에 반영됨:
    - Button의 레이아웃 variant 실제 이름은 `type`(text/prefix/suffix)
    - Chip 컴포넌트셋 size는 `lg/md` — 코드로는 lg→`md`, md→`sm` 번역
- [x] `figma connect parse` 검증을 게이트에 편입 — `pnpm figma:check` (`pnpm check`에 포함).
      매핑이 코드 API와 어긋나면 실패
- [ ] 플랜 확인 후: `FIGMA_ACCESS_TOKEN=... npx figma connect publish` (토큰 스코프 code_connect:write)
- [ ] AGENTS.md에 어휘 규칙 명문화: "피그마 variant 이름·값은 코드와 동일하게,
      단 kebab→camel 변환과 인터랙션 상태/아이콘 토글 제외"
- [ ] 컴포넌트 작업 체크리스트에 5단계 추가: 스펙 → 렌더러 → 테스트 → docs → **figma.tsx 갱신+재게시**

참고: ① MCP `add_code_connect_map` 경로는 ②(publish)가 되면 불필요한 과도기 수단이라,
`.figma.tsx`가 이미 준비된 지금은 건너뛰고 publish만 남았다.

## 5. 관련

- 스펙 JSON의 `slots.targets`가 이미 피그마 어휘→타깃별 이름 번역표 역할
  (`packages/spec/samples/components/*.component.json`)
- `@podoui/mcp`의 `get_component_spec`/`get_component_example`은 Code Connect가 없는
  환경의 보완재 — 소비 프로젝트에 `claude mcp add podo -- npx podo mcp` 연결 문서화
- 보류 중인 "Figma 동기화(동기화 버튼)" 논의의 코드→디자인 방향 다리가 Code Connect다
  (메모: memory/figma-sync-design-deferred.md)
