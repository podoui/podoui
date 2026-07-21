# Installation Guide

This guide covers the first project setup path for an app that installs Podo v2.

## Install

Everything (all four runtime targets, the `podo` CLI, and the MCP server) ships as the single `podo-ui` package:

```sh
npm install podo-ui
```

`react`/`react-dom`/`react-native` are optional peer dependencies — install them only for the targets you use. The `@podoui/*` names are workspace-internal and are not published; consumers always import `podo-ui/<target>` subpaths.

## Initialize `.podo`

Run one init command per project. The CLI writes project state under `.podo`.

```sh
npx podo-ui init --target react --theme dashboard --out-dir src/podo --yes
```

Common target values:

- `web`: Custom Elements and CSS variables
- `react`: React components and provider
- `hono`: Hono TSX SSR components
- `native`: React Native components and token objects

Dark mode is configured during init:

```sh
npx podo-ui init --target web --theme landing --dark-mode --out-dir src/podo --yes
```

## Build

```sh
npx podo-ui build
npx podo-ui build --dry-run
```

`podo build --dry-run` prints the files that would be created or updated. Normal build reads package defaults plus `.podo/tokens`, `.podo/components`, and `.podo/icons`, then writes generated files to the configured `build.outDir`.

## Framework Connection

Web:

```ts
import { registerPodoElements } from "podo-ui/web";

registerPodoElements();
```

React:

```tsx
import { Button, PodoThemeProvider } from "podo-ui/react";

export function App() {
  return (
    <PodoThemeProvider theme="dashboard" colorScheme="light">
      <Button>Save</Button>
    </PodoThemeProvider>
  );
}
```

Hono:

```tsx
/** @jsxImportSource hono/jsx */
import { Button, renderCriticalCss } from "podo-ui/hono";

const css = ".podo-button{color:var(--podo-component-button-text)}";

export const page = (
  <html>
    <head>{renderCriticalCss({ theme: "dashboard", colorScheme: "light", css })}</head>
    <body>
      <Button type="submit">Save</Button>
    </body>
  </html>
);
```

React Native — 실제 RN 앱에서는 반드시 `createNativeComponents`에 RN 호스트
컴포넌트를 주입해 사용합니다 (`plan.md`의 host adapter 계약):

```tsx
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createNativeComponents, PodoNativeThemeProvider } from "podo-ui/native";

const { Button, Field, Input } = createNativeComponents({
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
});

export function App() {
  return (
    <PodoNativeThemeProvider theme="dashboard" colorScheme="light">
      <Button>Save</Button>
    </PodoNativeThemeProvider>
  );
}
```

`podo-ui/native`의 top-level export(`import { Button } from "podo-ui/native"`)는
문자열 호스트 태그(`defaultNativeHost`)에 바인딩된 테스트 렌더러 전용
편의 export입니다. react-test-renderer 류에서는 동작하지만 실제 React
Native 렌더러는 문자열 호스트를 해석하지 못하므로 앱 코드에서는 위처럼
주입 방식을 사용하세요.

## Validate

```sh
npx podo-ui validate
pnpm check
```

Run `podo validate` after editing JSON specs. Run the package manager check before publishing or committing generated output changes.
