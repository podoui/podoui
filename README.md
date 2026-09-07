# Podo UI

Podo UI v2는 Figma에서 정한 색, 간격, 글꼴과 컴포넌트 규칙을 React, Next.js,
Hono, React Native 앱까지 이어 주는 디자인 시스템입니다. 처음에는 준비된 기본
테마로 바로 화면을 만들고, 팀 디자인이 준비되면 코드를 갈아엎지 않고 프로젝트
토큰으로 바꿀 수 있습니다.

## 5분 안에 첫 화면 만들기

먼저 패키지 하나를 설치합니다.

```bash
npm install podo-ui
```

React 앱의 시작점에서 스타일을 한 번 불러오고 Provider로 앱을 감싸세요.
`applyToDocument`를 켜면 모달처럼 `body`에 렌더되는 UI도 같은 테마를 사용합니다.

```tsx
import { Button, PodoThemeProvider } from "podo-ui/react";
import "podo-ui/styles.css";
import "podo-ui/icons.css";

export function App() {
  return (
    <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>
      <Button theme="solid-primary">저장</Button>
    </PodoThemeProvider>
  );
}
```

이 상태로 Button, DatePicker, Editor를 포함한 Podo 컴포넌트를 사용할 수 있습니다.
Next.js, Hono CSR/SSR, React Native의 처음부터 실행 가능한 예제는
[설치와 토큰 적용 안내](https://podoui.com/setup)에 모아 두었습니다.

## Podo 컴포넌트 밖에서도 같은 토큰 쓰기

프로젝트 토큰을 만들었다면 생성된 `tokens.css`를 앱 시작점에서 한 번만
불러오세요. 이후 일반 CSS, CSS Module, React `style`, Next.js Server Component,
Hono가 렌더한 HTML 어디서든 같은 CSS 변수를 사용할 수 있습니다.

```css
.account-card {
  color: var(--podo-text-basic);
  background: var(--podo-elevation-basic);
  padding: var(--podo-spacing-scale-8);
  border-radius: var(--podo-radius-control-md);
  font-family: var(--podo-typography-body-medium-fontFamily);
  font-size: var(--podo-typography-body-medium-fontSize);
}
```

루트의 `data-podo-theme`과 `data-color-scheme`이 바뀌면 이 변수들도 함께
바뀝니다. 색상만이 아니라 간격, 반경, 타이포그래피까지 직접 값으로 복사하지
않고 사용할 수 있습니다.

React Native에서는 생성된 객체를 Provider에 한 번 넣고, 필요한 화면에서
`usePodoNativeTokens`로 꺼냅니다. 생성 함수의 반환 타입을 넘기면 프로젝트의
정확한 토큰 경로가 자동 완성됩니다.

```tsx
import { Text, View } from "react-native";
import { PodoNativeThemeProvider, usePodoNativeTokens } from "podo-ui/native";
import { getPodoNativeTokens } from "./podo/tokens.native";

type AppTokens = ReturnType<typeof getPodoNativeTokens>;

function AccountCard() {
  const tokens = usePodoNativeTokens<AppTokens>();
  return (
    <View
      style={{
        backgroundColor: tokens.elevation.basic,
        padding: tokens.spacing.scale[8],
        borderRadius: tokens.radius.control.md,
      }}
    >
      <Text style={{ color: tokens.text.basic }}>계정 정보</Text>
    </View>
  );
}

export function App() {
  const tokens = getPodoNativeTokens("landing", "light");
  return (
    <PodoNativeThemeProvider theme="landing" colorScheme="light" tokens={tokens}>
      <AccountCard />
    </PodoNativeThemeProvider>
  );
}
```

## 팀의 Figma 디자인을 연결할 때

기본 테마로 충분하면 이 단계는 건너뛰어도 됩니다. 프로젝트 전용 변수와
아이콘이 필요할 때 다음 순서로 진행하세요.

1. `npx podo-ui init`으로 프로젝트와 생성 폴더를 정합니다.
2. 프로젝트 터미널에서 `npx podo-ui import`를 실행해 수신을 기다립니다.
3. Figma 플러그인에서 **프로젝트로 보내기**를 누릅니다.
4. 터미널에 표시된 파일과 충돌 내용을 확인한 뒤 적용합니다.
5. 검증과 미리보기를 거쳐 생성합니다.

```bash
npx podo-ui init --target react --theme landing --out-dir src/podo --yes
npx podo-ui import
npx podo-ui validate
npx podo-ui build --dry-run
npx podo-ui build
```

정확한 순서는 `init → import → validate → build --dry-run → build`입니다. `init`은
`.podo/config.json`을 만들기 때문에 새 프로젝트에서는 반드시 먼저 실행해야
합니다. Next.js와 Hono CSR은 `--target react`, Hono SSR은 `--target hono`,
React Native는 `--target native`를 사용하세요.

원본은 `.podo`에, 생성된 CSS·TypeScript·아이콘 폰트는 설정한 출력 폴더에
보관됩니다. 생성 파일을 직접 수정하지 말고 `.podo`의 JSON을 바꾼 뒤 다시
빌드하면 같은 결과를 재현할 수 있습니다.

새 Figma 파일 자체에 Podo 디자인 시스템을 설치하려는 경우에는 플러그인의
**PODO 디자인 시스템 설치**만 누르면 됩니다. JSON 내보내기와 가져오기는
백업·복원용 고급 기능입니다.

## 환경별 선택 기준

| 환경          | 시작 import         | 알아둘 점                                                                  |
| ------------- | ------------------- | -------------------------------------------------------------------------- |
| React         | `podo-ui/react`     | Provider에서 전역 테마를 적용합니다.                                       |
| Next.js       | `podo-ui/react`     | 루트 HTML에 초기 테마를 넣고 상호작용 UI만 Client Component로 둡니다.      |
| Hono SSR      | `podo-ui/hono`      | 기본 UI는 서버 HTML로, DatePicker와 Editor는 React island로 렌더합니다.    |
| Hono CSR      | `podo-ui/react`     | Hono가 내려 준 HTML 셸에 React island를 마운트합니다.                      |
| React Native  | `podo-ui/native`    | 네이티브 Provider에 생성 토큰을 전달합니다. Editor는 WebView를 사용합니다. |
| 일반 HTML/CSS | 생성된 `tokens.css` | 루트 테마 속성과 `--podo-*` 변수를 사용합니다.                             |

## v1에서 옮겨오는 중이라면

v1 컴포넌트 API는 v2와 호환되지 않으므로 기존 앱은 마이그레이션 전까지
`podo-ui@1`로 고정하세요. 다만 자주 쓰던 `border-*`, `r-*`, `shadow-*`,
`bg-elevation*`, `hide-*` 유틸리티는 v2의 `podo-ui/styles.css`에도 들어 있어
레이아웃을 단계적으로 옮길 수 있습니다.

## 저장소에서 개발하기

```bash
pnpm install
pnpm build
pnpm check
pnpm release:verify
```

검증된 JSON이 토큰, 컴포넌트 명세, 아이콘, 테마와 프로젝트 오버라이드의
원본입니다. 설계 의도는 [plan.md](./plan.md), 작업 상태는 [todo.md](./todo.md),
운영 기록은 [docs](./docs)에서 확인할 수 있습니다.

## 함께 만든 사람들

| 이름   | 역할           | 이메일                                              |
| ------ | -------------- | --------------------------------------------------- |
| 전예진 | Main Designer  | [yenny.uxui@gmail.com](mailto:yenny.uxui@gmail.com) |
| 권오수 | Designer       | [rnjsdhtn95@gmail.com](mailto:rnjsdhtn95@gmail.com) |
| 이은규 | Main Developer | [tarucy@gmail.com](mailto:tarucy@gmail.com)         |
| 정호성 | Developer      | [innerbloo@gmail.com](mailto:innerbloo@gmail.com)   |
| 장수호 | Developer      | [jangs4339@gmail.com](mailto:jangs4339@gmail.com)   |

MIT License · [공식 설명서](https://podoui.com) ·
[문제 제보](https://github.com/podoui/podoui/issues)

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
