# Podo UI v2

Podo UI는 Figma의 디자인 토큰과 컴포넌트를 React, Next.js, Hono SSR, React Native에서 같은 규칙으로 사용할 수 있게 해 주는 TypeScript 디자인 시스템입니다. 토큰·컴포넌트 명세·아이콘·테마·프로젝트 오버라이드의 원본은 검증된 JSON이며, 생성 결과는 언제든 같은 입력에서 다시 만들 수 있습니다.

> v1 컴포넌트 API와 v2는 호환되지 않습니다. 기존 v1 프로젝트는 `podo-ui@1`로 고정하세요. Border·Radius·Elevation·Display 유틸리티 클래스는 마이그레이션을 위해 v2에서도 호환 제공합니다.

## 가장 빠르게 시작하기

```bash
npm install podo-ui
```

```tsx
import { Button, PodoThemeProvider } from "podo-ui/react";
import "podo-ui/styles.css";
import "podo-ui/icons.css";

export function App() {
  return (
    <PodoThemeProvider theme="landing" colorScheme="light">
      <Button theme="solid-primary">저장</Button>
    </PodoThemeProvider>
  );
}
```

패키지 기본 토큰과 아이콘으로 바로 사용할 수 있습니다. Figma 토큰이나 프로젝트 전용 테마가 필요한 경우에만 아래 CLI 흐름을 추가하면 됩니다.

## v1 호환 유틸리티

`podo-ui/styles.css`에는 v1의 실제 SCSS 계약에서 복원한 다음 클래스가 포함됩니다.

- 테두리: `border-0`–`border-4`
- 반경: `r-0`–`r-6`, `r-full`
- 그림자·배경: `shadow-1`–`shadow-5`, `bg-elevation`, `bg-elevation-1`–`bg-elevation-3`
- 반응형 숨김: `hide`, `hide-pc`, `hide-tb`, `hide-mo`

React·Next.js·Hono CSR/SSR·일반 HTML은 동일한 CSS 클래스를 사용합니다. React Native는 CSS 클래스를 지원하지 않으므로 `style`과 Podo 토큰을 사용하세요. 계약 JSON과 재현 가능한 CSS/SCSS 생성기는 `podo-ui/tokens`의 `legacyUtilitiesContract`, `emitLegacyUtilitiesCss`, `emitLegacyUtilitiesScss`로도 제공합니다.

## 환경별 선택

| 환경            | import           | DatePicker     | Editor          | 렌더링 방식            |
| --------------- | ---------------- | -------------- | --------------- | ---------------------- |
| React           | `podo-ui/react`  | 전체 지원      | 전체 지원       | Client React           |
| Next.js         | `podo-ui/react`  | `"use client"` | `"use client"`  | SSR + Client Component |
| Hono            | `podo-ui/hono`   | React island   | React island    | 15개 컴포넌트 순수 SSR |
| React Native    | `podo-ui/native` | Native modal   | WebView WYSIWYG | Native UI              |
| Custom Elements | `podo-ui/web`    | —              | —               | 브라우저 표준 요소     |

DatePicker는 단일/기간, 날짜/시간/datetime/hour, 경계·비활성 조건·빠른 기간 선택을 지원합니다. Editor는 문단, 서식, 색상, 정렬, 목록, 표, 링크, 이미지, YouTube, HTML 편집을 지원합니다. 자세한 예제와 prop 표는 [공식 설명서](https://podoui.com)에서 확인할 수 있습니다.

## React Native

공개 컴포넌트는 실제 React Native 호스트에 이미 연결되어 있으므로 `createNativeComponents` 없이 바로 가져옵니다. 아이콘은 생성된 TTF를 로드해야 하며, WYSIWYG Editor를 쓰려면 `react-native-webview`를 Provider에 전달합니다.

```tsx
import { useFonts } from "expo-font";
import { WebView } from "react-native-webview";
import { useState } from "react";
import { Button, Editor, PodoNativeThemeProvider } from "podo-ui/native";
import { podoIconGlyphMap } from "./podo/icons/PodoIcons.native";

const iconGlyphs = Object.fromEntries(
  Object.entries(podoIconGlyphMap).map(([name, code]) => [name, String.fromCodePoint(code)])
);

export function App() {
  const [html, setHtml] = useState("<p>모바일 에디터</p>");
  const [loaded] = useFonts({ PodoIcons: require("./podo/icons/PodoIcons.ttf") });
  if (!loaded) return null;

  return (
    <PodoNativeThemeProvider
      theme="landing"
      colorScheme="light"
      iconGlyphs={iconGlyphs}
      iconFontFamily="PodoIcons"
      webViewComponent={WebView}
    >
      <Button>저장</Button>
      <Editor value={html} onChange={setHtml} />
    </PodoNativeThemeProvider>
  );
}
```

## Figma에서 새 파일에 설치하기

최신 플러그인은 PODO 디자인 시스템 스냅샷을 자체 포함합니다.

1. 빈 Figma Design 파일에서 PODO 플러그인을 엽니다.
2. **PODO 디자인 시스템 설치**를 누릅니다.
3. 플러그인이 `_podo` 페이지와 변수, 스타일, 컴포넌트를 설치할 때까지 기다립니다.

일반 설치에는 JSON 내보내기가 필요하지 않습니다. **JSON 내보내기/가져오기**는 백업·복원용 고급 도구입니다.

## Figma 내용을 코드 프로젝트로 가져오기

```bash
npx podo-ui import
```

1. 프로젝트 터미널에서 위 명령을 실행합니다. 수신기는 `localhost:4141`부터 사용 가능한 포트를 엽니다.
2. 현재 Figma 파일에서 플러그인의 **프로젝트로 보내기**를 누릅니다.
3. 터미널의 파일·경고·충돌 계획을 확인하고 적용합니다.
4. 아래 검증 순서로 생성합니다.

```bash
npx podo-ui validate
npx podo-ui build --dry-run
npx podo-ui build
```

프로젝트 상태는 `.podo` 안에 보관됩니다. 생성된 `tokens.css`, `tokens.native.ts`, 컴포넌트 바인딩, 아이콘 CSS/폰트는 직접 수정하지 말고 JSON 원본을 바꾼 뒤 다시 빌드하세요.

## 패키지 구성

- `podo-ui/react`, `podo-ui/web`, `podo-ui/hono`, `podo-ui/native`: 환경별 런타임
- `podo-ui/spec`, `podo-ui/tokens`, `podo-ui/icons`: JSON 계약과 생성기
- `podo-ui/core`, `podo-ui/codegen`, `podo-ui/migration`: 공통 동작·코드 생성·마이그레이션
- `podo-ui/cli`, `podo-ui/mcp`: CLI와 MCP 서버 API
- 실행 파일: `podo`, `podo-ui`, `podo-mcp`

## 기여자

| 이름   | 역할           | 이메일                                              |
| ------ | -------------- | --------------------------------------------------- |
| 전예진 | Main Designer  | [yenny.uxui@gmail.com](mailto:yenny.uxui@gmail.com) |
| 권오수 | Designer       | [rnjsdhtn95@gmail.com](mailto:rnjsdhtn95@gmail.com) |
| 이은규 | Main Developer | [tarucy@gmail.com](mailto:tarucy@gmail.com)         |
| 정호성 | Developer      | [innerbloo@gmail.com](mailto:innerbloo@gmail.com)   |
| 장수호 | Developer      | [jangs4339@gmail.com](mailto:jangs4339@gmail.com)   |

## 저장소 개발

```bash
pnpm install
pnpm build
pnpm check
pnpm release:verify
```

`packages/*`의 `@podoui/*` 패키지는 workspace 내부 모듈이며, 소비자는 하나의 공개 패키지 `podo-ui`만 설치합니다. 아키텍처 의도는 [plan.md](./plan.md), 진행 상태는 [todo.md](./todo.md), 운영 기록은 [docs](./docs)에서 확인할 수 있습니다.

릴리스는 npm Trusted Publisher(OIDC)를 사용하는 GitHub Actions로 진행합니다. 버전 커밋과 태그를 푸시한 뒤 `Publish podo-ui` 워크플로를 실행하며 로컬 npm 토큰이나 OTP를 사용하지 않습니다.
