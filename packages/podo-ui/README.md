# podo-ui

Figma 디자인 토큰과 컴포넌트를 React, Next.js, Hono SSR, React Native에서 함께 쓰는 JSON 스펙 기반 디자인 시스템입니다.

```bash
npm install podo-ui
```

## v1 호환 유틸리티

`podo-ui/styles.css`는 `border-0`–`border-4`, `r-0`–`r-6`/`r-full`, `shadow-1`–`shadow-5`, `bg-elevation[-1|-2|-3]`, `hide[-pc|-tb|-mo]`를 포함합니다. React·Next.js·Hono·일반 HTML에서 같은 클래스를 사용하며 React Native에서는 `style`과 토큰을 사용하세요. JSON 계약과 CSS/SCSS 생성기는 `podo-ui/tokens`에서 가져올 수 있습니다.

## React와 Next.js

```tsx
"use client"; // Next.js에서 상호작용 컴포넌트를 쓸 때만 필요합니다.

import { Button, DatePicker, PodoThemeProvider } from "podo-ui/react";
import "podo-ui/styles.css";
import "podo-ui/icons.css";

export default function Page() {
  return (
    <PodoThemeProvider theme="landing" colorScheme="light">
      <Button>저장</Button>
      <DatePicker type="date" placeholder="날짜를 선택하세요" />
    </PodoThemeProvider>
  );
}
```

## Hono SSR

`podo-ui/hono`는 Button, Chip, Badge, Input, Textarea, Select, Tooltip, Toast, Table, Field, Switch, Checkbox, Radio, Icon, Typography를 서버 HTML로 출력합니다. DatePicker와 Editor는 브라우저 상태가 필요하므로 React island에서 `podo-ui/react`를 사용하세요.

```tsx
import { Hono } from "hono";
import { Button, renderCriticalCss } from "podo-ui/hono";

const app = new Hono();

app.get("/", (c) =>
  c.html(
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="/assets/podo.css" />
        {renderCriticalCss({ theme: "landing", colorScheme: "light" })}
      </head>
      <body>
        <Button>서버 렌더링 버튼</Button>
      </body>
    </html>
  )
);

export default app;
```

## React Native

컴포넌트는 최상위 export에서 바로 가져옵니다. `createNativeComponents`는 호스트를 직접 바꿔야 하는 고급 사용 사례에만 필요합니다. 아이콘은 `podo build`가 만든 TTF와 glyph map을 Provider에 연결하고, Editor는 `react-native-webview`를 전달하세요.

```tsx
import { useState } from "react";
import { WebView } from "react-native-webview";
import { DatePicker, Editor, PodoNativeThemeProvider } from "podo-ui/native";

export function Screen() {
  const [html, setHtml] = useState("<p>모바일에서도 편집할 수 있어요.</p>");
  return (
    <PodoNativeThemeProvider theme="landing" colorScheme="light" webViewComponent={WebView}>
      <DatePicker mode="period" type="date" quickSelect />
      <Editor value={html} onChange={setHtml} />
    </PodoNativeThemeProvider>
  );
}
```

## 프로젝트별 토큰

```bash
npx podo-ui init --target react --theme landing --out-dir src/podo --yes
npx podo-ui validate
npx podo-ui build --dry-run
npx podo-ui build
```

Figma 플러그인에서 보낸 디자인 시스템을 받으려면 먼저 `npx podo-ui import`를 실행하고 플러그인의 **프로젝트로 보내기**를 누릅니다. 새 Figma 파일 자체에는 플러그인의 **PODO 디자인 시스템 설치**를 사용하며 JSON 내보내기는 필요하지 않습니다.

## 서브패스

`react` · `web` · `hono` · `native` · `spec` · `tokens` · `icons` · `core` · `codegen` · `migration` · `cli` · `mcp`

전체 설치법, 컴포넌트별 import 포함 예제, DatePicker·Editor 기능표는 [podoui.com](https://podoui.com)에서 확인하세요.

> v1 컴포넌트 API를 계속 사용해야 한다면 `podo-ui@1`로 고정하세요. v1 컴포넌트와 v2는 호환되지 않으며, 위 레이아웃 유틸리티만 마이그레이션 호환 범위입니다.
