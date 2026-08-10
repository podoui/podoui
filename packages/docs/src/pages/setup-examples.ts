import type { CodeTab } from "../components/Preview.js";

export const PROJECT_THEME_TABS: CodeTab[] = [
  {
    target: "theme-html",
    label: "HTML / CSS",
    code:
      `<!-- 준비:\n` +
      `  npx podo-ui init --target web --theme landing --out-dir public/podo --yes\n` +
      `  npx podo-ui build\n` +
      `  cp node_modules/podo-ui/styles.css public/podo/styles.css\n` +
      `  public 폴더를 사이트의 정적 루트로 제공합니다.\n` +
      `-->\n` +
      `<html lang="ko" data-podo-theme="landing" data-color-scheme="light">\n` +
      `  <head>\n` +
      `    <link rel="stylesheet" href="/podo/styles.css" />\n` +
      `    <link rel="stylesheet" href="/podo/tokens.css" />\n` +
      `    <link rel="stylesheet" href="/podo/components.css" />\n` +
      `  </head>\n` +
      `  <body>...</body>\n` +
      `</html>`,
    language: "markup",
  },
  {
    target: "theme-react",
    label: "React",
    code:
      `import { useState } from "react";\n` +
      `import { Button, PodoThemeProvider } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "./podo/tokens.css";\n\n` +
      `export function App() {\n` +
      `  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");\n` +
      `  return (\n` +
      `    <PodoThemeProvider\n` +
      `      theme="landing"\n` +
      `      colorScheme={colorScheme}\n` +
      `      applyToDocument\n` +
      `    >\n` +
      `      <Button onClick={() => setColorScheme(colorScheme === "light" ? "dark" : "light")}>\n` +
      `        테마 전환\n` +
      `      </Button>\n` +
      `    </PodoThemeProvider>\n` +
      `  );\n}`,
  },
  {
    target: "theme-next",
    label: "Next.js",
    code:
      `// app/providers.tsx\n` +
      `"use client";\n` +
      `import { PodoThemeProvider } from "podo-ui/react";\n\n` +
      `export function Providers({ children }: { children: React.ReactNode }) {\n` +
      `  return (\n` +
      `    <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>\n` +
      `      {children}\n` +
      `    </PodoThemeProvider>\n` +
      `  );\n` +
      `}\n\n` +
      `// app/layout.tsx\n` +
      `import "podo-ui/styles.css";\n` +
      `import "./podo/tokens.css";\n` +
      `import { Providers } from "./providers";\n\n` +
      `export default function RootLayout({ children }: { children: React.ReactNode }) {\n` +
      `  return (\n` +
      `    <html lang="ko" data-podo-theme="landing" data-color-scheme="light">\n` +
      `      <body><Providers>{children}</Providers></body>\n` +
      `    </html>\n` +
      `  );\n` +
      `}`,
  },
  {
    target: "theme-hono-csr",
    label: "Hono CSR",
    code:
      `// Hono HTML 셸의 #podo-root에 마운트하는 client.tsx\n` +
      `import { createRoot } from "react-dom/client";\n` +
      `import { Button, PodoThemeProvider } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "./podo/tokens.css";\n\n` +
      `function App() {\n` +
      `  return <Button>Hono의 React island</Button>;\n` +
      `}\n\n` +
      `const root = document.getElementById("podo-root");\n` +
      `if (!root) throw new Error("#podo-root를 찾을 수 없습니다.");\n` +
      `createRoot(root).render(\n` +
      `  <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>\n` +
      `    <App />\n` +
      `  </PodoThemeProvider>\n` +
      `);`,
  },
  {
    target: "theme-hono-ssr",
    label: "Hono SSR",
    code:
      `// Vite의 ?raw import로 CSS를 읽어 첫 HTML에 넣습니다.\n` +
      `import podoCss from "podo-ui/styles.css?raw";\n` +
      `import tokensCss from "./podo/tokens.css?raw";\n` +
      `import componentsCss from "./podo/components.css?raw";\n` +
      `import { Hono } from "hono";\n` +
      `import { Button, renderCriticalCss } from "podo-ui/hono";\n\n` +
      `const app = new Hono();\n` +
      `const theme = "landing";\n` +
      `const colorScheme = "light";\n\n` +
      `app.get("/", (c) => c.html(\n` +
      `  <html lang="ko" data-podo-theme={theme} data-color-scheme={colorScheme}>\n` +
      `    <head>\n` +
      `      {renderCriticalCss({\n` +
      `        theme, colorScheme,\n` +
      `        css: [podoCss, tokensCss, componentsCss].join("\\n"),\n` +
      `      })}\n` +
      `    </head>\n` +
      `    <body><Button>서버 테마</Button></body>\n` +
      `  </html>\n` +
      `));\n\n` +
      `export default app;`,
  },
  {
    target: "theme-native",
    label: "React Native",
    code:
      `import { useColorScheme } from "react-native";\n` +
      `import { Button, PodoNativeThemeProvider } from "podo-ui/native";\n` +
      `import { getPodoNativeTokens } from "./podo/tokens.native";\n\n` +
      `export function App() {\n` +
      `  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";\n` +
      `  const themeTokens = getPodoNativeTokens("landing", colorScheme);\n` +
      `  return (\n` +
      `    <PodoNativeThemeProvider\n` +
      `      theme="landing" colorScheme={colorScheme} tokens={themeTokens}\n` +
      `    >\n` +
      `      <Button>Native 테마</Button>\n` +
      `    </PodoNativeThemeProvider>\n` +
      `  );\n` +
      `}`,
  },
];

export const GLOBAL_TOKEN_TABS: CodeTab[] = [
  {
    target: "tokens-html",
    label: "HTML / CSS",
    code:
      `/* tokens.css를 HTML에서 한 번 불러온 뒤 어느 스타일시트에서나 사용합니다. */\n` +
      `.account-card {\n` +
      `  color: var(--podo-text-basic);\n` +
      `  background: var(--podo-elevation-basic);\n` +
      `  border: 1px solid var(--podo-border-gary);\n` +
      `  border-radius: var(--podo-radius-control-md);\n` +
      `  padding: var(--podo-spacing-scale-8);\n` +
      `  font-family: var(--podo-typography-body-medium-fontFamily);\n` +
      `  font-size: var(--podo-typography-body-medium-fontSize);\n` +
      `  line-height: var(--podo-typography-body-medium-lineHeight);\n` +
      `}`,
    language: "css",
  },
  {
    target: "tokens-react",
    label: "React",
    code:
      `// main.tsx에서 ./podo/tokens.css를 한 번 import한 뒤\n` +
      `// 모든 컴포넌트의 style, CSS Module, styled API에서 같은 변수를 씁니다.\n` +
      `export function AccountCard() {\n` +
      `  return (\n` +
      `    <article style={{\n` +
      `      color: "var(--podo-text-basic)",\n` +
      `      background: "var(--podo-elevation-basic)",\n` +
      `      padding: "var(--podo-spacing-scale-8)",\n` +
      `      borderRadius: "var(--podo-radius-control-md)",\n` +
      `      fontSize: "var(--podo-typography-body-medium-fontSize)",\n` +
      `    }}>계정 정보</article>\n` +
      `  );\n` +
      `}`,
  },
  {
    target: "tokens-next",
    label: "Next.js",
    code:
      `// app/layout.tsx에서 ./podo/tokens.css를 한 번 import합니다.\n` +
      `// CSS 변수는 Server Component와 Client Component에서 똑같이 동작합니다.\n` +
      `export default function AccountCard() {\n` +
      `  return (\n` +
      `    <article className="account-card">서버 컴포넌트도 전역 토큰을 상속합니다.</article>\n` +
      `  );\n` +
      `}\n\n` +
      `/* app/globals.css */\n` +
      `.account-card {\n` +
      `  color: var(--podo-text-primary);\n` +
      `  padding: var(--podo-spacing-scale-8);\n` +
      `  border: 1px solid var(--podo-border-primary);\n` +
      `  border-radius: var(--podo-radius-control-md);\n` +
      `}`,
  },
  {
    target: "tokens-hono-csr",
    label: "Hono CSR",
    code:
      `// React island의 진입 파일에서 생성된 tokens.css를 한 번 import합니다.\n` +
      `import "./podo/tokens.css";\n\n` +
      `export function AccountCard() {\n` +
      `  return <section style={{\n` +
      `    color: "var(--podo-text-basic)",\n` +
      `    padding: "var(--podo-spacing-scale-8)",\n` +
      `    borderRadius: "var(--podo-radius-control-md)",\n` +
      `  }}>React island도 문서 루트의 토큰을 상속합니다.</section>;\n` +
      `}`,
  },
  {
    target: "tokens-hono-ssr",
    label: "Hono SSR",
    code:
      `// public/app.css\n` +
      `.account-card {\n` +
      `  color: var(--podo-text-basic);\n` +
      `  background: var(--podo-elevation-basic);\n` +
      `  padding: var(--podo-spacing-scale-8);\n` +
      `  border-radius: var(--podo-radius-control-md);\n` +
      `}\n\n` +
      `// server.tsx — HTML head에서 생성된 tokens.css와 app.css를 로드하세요.\n` +
      `export const AccountCard = () => <section class="account-card">서버 토큰</section>;`,
    language: "tsx",
  },
  {
    target: "tokens-native",
    label: "React Native",
    code:
      `import { Text, View } from "react-native";\n` +
      `import { usePodoNativeTokens } from "podo-ui/native";\n` +
      `import { getPodoNativeTokens } from "./podo/tokens.native";\n\n` +
      `type AppTokens = ReturnType<typeof getPodoNativeTokens>;\n\n` +
      `export function AccountCard() {\n` +
      `  const tokens = usePodoNativeTokens<AppTokens>();\n` +
      `  return (\n` +
      `    <View style={{\n` +
      `      backgroundColor: tokens.elevation.basic,\n` +
      `      padding: tokens.spacing.scale[8],\n` +
      `      borderRadius: tokens.radius.control.md,\n` +
      `    }}>\n` +
      `      <Text style={{\n` +
      `        color: tokens.text.basic,\n` +
      `        fontFamily: tokens.typography.body.medium.fontFamily,\n` +
      `        fontSize: tokens.typography.body.medium.fontSize.mobile,\n` +
      `      }}>계정 정보</Text>\n` +
      `    </View>\n` +
      `  );\n` +
      `}`,
  },
];
