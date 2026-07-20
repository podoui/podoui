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
npx podo init --target react --theme dashboard --out-dir src/podo --yes
```

Common target values:

- `web`: Custom Elements and CSS variables
- `react`: React components and provider
- `hono`: Hono TSX SSR components
- `native`: React Native components and token objects

Dark mode is configured during init:

```sh
npx podo init --target web --theme landing --dark-mode --out-dir src/podo --yes
```

## Build

```sh
npx podo build
npx podo build --dry-run
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

React Native:

```tsx
import { Button, PodoNativeThemeProvider } from "podo-ui/native";

export function App() {
  return (
    <PodoNativeThemeProvider theme="dashboard" colorScheme="light">
      <Button>Save</Button>
    </PodoNativeThemeProvider>
  );
}
```

## Validate

```sh
npx podo validate
pnpm check
```

Run `podo validate` after editing JSON specs. Run the package manager check before publishing or committing generated output changes.
