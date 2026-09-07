# podo-ui

Figma의 디자인 규칙을 React, Next.js, Hono, React Native 앱에서 함께 쓰기
위한 Podo UI 공식 패키지입니다. 기본 테마로 바로 시작한 뒤, 필요할 때 팀의
토큰과 아이콘을 연결할 수 있습니다.

## 먼저 화면 하나 띄우기

```bash
npm install podo-ui
```

```tsx
import { Button, PodoThemeProvider } from "podo-ui/react";
import "podo-ui/styles.css";
import "podo-ui/icons.css";

export function App() {
  return (
    <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>
      <Button>저장</Button>
    </PodoThemeProvider>
  );
}
```

Next.js는 같은 React API를 사용합니다. Hono는 정적 UI를 `podo-ui/hono`에서
서버 렌더링하고, DatePicker나 Editor처럼 상태가 필요한 부분만 React island로
붙일 수 있습니다. 환경별 전체 예제는 [설치 안내](https://podoui.com/setup)에서
바로 복사할 수 있습니다.

## 앱 전체에서 디자인 토큰 쓰기

`podo build`가 만든 `tokens.css`를 앱 시작점에서 한 번 불러오면 일반 CSS,
React, Next.js, Hono CSR/SSR 모두 같은 전역 변수를 사용합니다.

```css
.account-card {
  color: var(--podo-text-basic);
  background: var(--podo-elevation-basic);
  padding: var(--podo-spacing-scale-8);
  border-radius: var(--podo-radius-control-md);
  font-size: var(--podo-typography-body-medium-fontSize);
}
```

React Native에서는 생성된 객체를 Provider에 넣고 훅으로 꺼냅니다.

```tsx
import { PodoNativeThemeProvider, usePodoNativeTokens } from "podo-ui/native";
import { getPodoNativeTokens } from "./podo/tokens.native";

type AppTokens = ReturnType<typeof getPodoNativeTokens>;

function Card() {
  const tokens = usePodoNativeTokens<AppTokens>();
  // tokens.spacing.scale[8], tokens.text.basic처럼 사용합니다.
  return null;
}

const tokens = getPodoNativeTokens("landing", "light");

export function App() {
  return (
    <PodoNativeThemeProvider theme="landing" colorScheme="light" tokens={tokens}>
      <Card />
    </PodoNativeThemeProvider>
  );
}
```

## 팀 토큰 연결하기

기본 디자인만 쓴다면 별도 설정은 필요 없습니다. Figma에서 받은 프로젝트
토큰이 필요할 때만 아래 순서로 생성하세요.

```bash
npx podo-ui init --target react --theme landing --out-dir src/podo --yes
npx podo-ui import
npx podo-ui validate
npx podo-ui build --dry-run
npx podo-ui build
```

정확한 순서는 `init → import → validate → build --dry-run → build`입니다.
`init`이 `.podo/config.json`을 만든 뒤에야 `import`가 동작합니다. Next.js와
Hono CSR은 `--target react`, Hono SSR은 `--target hono`, React Native는
`--target native`를 사용하세요. `import`를 실행한 뒤 Figma 플러그인의
**프로젝트로 보내기**를 누르면 변경 계획을 확인하고 `.podo`에 적용할 수
있습니다. 생성된 파일 대신 `.podo`의 JSON을 수정해야 다음 빌드에서도 결과가
유지됩니다.

## 어떤 경로를 가져오면 되나요?

| 목적                       | import                                            |
| -------------------------- | ------------------------------------------------- |
| React · Next.js · Hono CSR | `podo-ui/react`                                   |
| Hono SSR                   | `podo-ui/hono`                                    |
| React Native               | `podo-ui/native`                                  |
| JSON 계약과 생성기         | `podo-ui/spec`, `podo-ui/tokens`, `podo-ui/icons` |
| CLI와 MCP                  | `podo-ui/cli`, `podo-ui/mcp`                      |

v1 컴포넌트가 필요한 프로젝트는 `podo-ui@1`로 고정하세요. v2의
`styles.css`에는 단계적 이전을 위한 `border-*`, `r-*`, `shadow-*`,
`bg-elevation*`, `hide-*` 유틸리티가 포함되어 있습니다.

[전체 설명서](https://podoui.com) ·
[GitHub](https://github.com/podoui/podoui) · MIT

## AI 도구 연결 (로컬 MCP)

Node.js 22 이상과 npm이 있으면 전역 설치 없이 실행할 수 있습니다.

```sh
npx -y podo-ui mcp
```

터미널에서는 출력 없이 stdio 연결을 기다립니다. 실제 사용은 아래 명령으로 AI 도구에 한 번 등록하세요. 프로젝트 절대 경로를 바꾼 뒤 도구를 다시 시작하면 서버가 자동 실행됩니다.

```sh
# Claude Code
claude mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"

# Codex
codex mcp add podo -- npx -y podo-ui mcp --root "/absolute/path/to/project"
```

기본 디자인 토큰과 컴포넌트 스펙을 조회하며, `.podo`가 있으면 프로젝트 설정도 읽습니다. MCP 도구는 파일을 수정하지 않습니다.

[전체 연결 안내와 사용 예시](https://podoui.com/mcp)
