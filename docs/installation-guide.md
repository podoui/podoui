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

React Native — DatePicker의 overlay에는 `Modal`, WYSIWYG Editor에는
`react-native-webview`가 필요합니다:

```tsx
import { Modal, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import { useFonts } from "expo-font";
import { createNativeComponents, PodoNativeThemeProvider } from "podo-ui/native";
import { getPodoNativeTokens } from "./podo/tokens.native";
import { podoIconGlyphMap } from "./podo/icons/PodoIcons.native";

const { Button, Field, Icon, Input } = createNativeComponents({
  Pressable,
  Modal,
  ScrollView,
  Text,
  TextInput,
  View,
  WebView,
});
const iconGlyphs = Object.fromEntries(
  Object.entries(podoIconGlyphMap).map(([name, code]) => [name, String.fromCodePoint(code)])
);

export function App() {
  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const [fontsLoaded] = useFonts({
    PodoIcons: require("./podo/icons/PodoIcons.ttf"),
  });
  if (!fontsLoaded) return null;

  return (
    <PodoNativeThemeProvider
      theme="dashboard"
      colorScheme={colorScheme}
      tokens={getPodoNativeTokens("dashboard", colorScheme)}
      iconGlyphs={iconGlyphs}
      iconFontFamily="PodoIcons"
    >
      <Button prefix={<Icon name="check" />}>Save</Button>
    </PodoNativeThemeProvider>
  );
}
```

`podo build`는 native 타깃에 `tokens.native.ts`, 코드포인트 맵, 실제 기기에서
로드할 `PodoIcons.ttf`를 함께 생성합니다. Expo가 아닌 bare React Native라면 같은
TTF를 앱 자산으로 링크한 뒤 등록한 family 이름을 `iconFontFamily`에 전달하세요.
Editor를 사용하는 앱은 `pnpm add react-native-webview` 후 iOS pod도 설치해야 합니다.

`podo-ui/native`의 top-level export는 React Native 기본 host에 바로 연결됩니다.
Editor를 top-level export로 사용할 때는 Provider에
`webViewComponent={WebView}`를 전달하세요. 커스텀 host adapter는 위처럼
`createNativeComponents`의 `WebView`에 직접 전달할 수도 있습니다.

## Validate

```sh
npx podo-ui validate
pnpm check
```

Run `podo validate` after editing JSON specs. Run the package manager check before publishing or committing generated output changes.
