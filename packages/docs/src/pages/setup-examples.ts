import type { CodeTab } from "../components/Preview.js";

export const PROJECT_THEME_TABS: CodeTab[] = [
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
      `import { Hono } from "hono";\n` +
      `import { Button, renderCriticalCss } from "podo-ui/hono";\n\n` +
      `const app = new Hono();\n` +
      `const theme = "landing";\n` +
      `const colorScheme = "light";\n\n` +
      `app.get("/", (c) => c.html(\n` +
      `  <html lang="ko" data-podo-theme={theme} data-color-scheme={colorScheme}>\n` +
      `    <head>\n` +
      `      <link rel="stylesheet" href="/assets/podo.css" />\n` +
      `      <link rel="stylesheet" href="/assets/tokens.css" />\n` +
      `      {renderCriticalCss({ theme, colorScheme })}\n` +
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

export const COLOR_TOKEN_TABS: CodeTab[] = [
  {
    target: "color-react",
    label: "React",
    code:
      `import "./podo/tokens.css";\n\n` +
      `export function SuccessMessage() {\n` +
      `  return (\n` +
      `    <p style={{\n` +
      `      color: "var(--podo-text-success)",\n` +
      `      backgroundColor: "var(--podo-foreground-success-light)",\n` +
      `    }}>저장되었습니다.</p>\n` +
      `  );\n` +
      `}`,
  },
  {
    target: "color-next",
    label: "Next.js",
    code:
      `// app/layout.tsx에서 ./podo/tokens.css를 한 번 import합니다.\n` +
      `export default function Notice() {\n` +
      `  return (\n` +
      `    <aside style={{\n` +
      `      color: "var(--podo-text-primary)",\n` +
      `      borderColor: "var(--podo-border-primary)",\n` +
      `    }}>서버 컴포넌트에서도 CSS 토큰을 사용합니다.</aside>\n` +
      `  );\n` +
      `}`,
  },
  {
    target: "color-hono-csr",
    label: "Hono CSR",
    code:
      `// React island 번들에서 생성된 tokens.css를 import합니다.\n` +
      `import "./podo/tokens.css";\n\n` +
      `export function Warning() {\n` +
      `  return <strong style={{ color: "var(--podo-text-warning)" }}>확인이 필요합니다.</strong>;\n` +
      `}`,
  },
  {
    target: "color-hono-ssr",
    label: "Hono SSR",
    code:
      `// public/app.css\n` +
      `.status {\n` +
      `  color: var(--podo-text-danger);\n` +
      `  background: var(--podo-foreground-danger-light);\n` +
      `}\n\n` +
      `// server.tsx — HTML head에서 생성된 tokens.css와 app.css를 로드하세요.\n` +
      `export const Status = () => <p class="status">처리하지 못했습니다.</p>;`,
    language: "tsx",
  },
  {
    target: "color-native",
    label: "React Native",
    code:
      `import { Text, View, useColorScheme } from "react-native";\n` +
      `import { getPodoNativeTokens } from "./podo/tokens.native";\n\n` +
      `export function SuccessMessage() {\n` +
      `  const scheme = useColorScheme() === "dark" ? "dark" : "light";\n` +
      `  const colors = getPodoNativeTokens("landing", scheme);\n` +
      `  return (\n` +
      `    <View style={{ backgroundColor: colors.foreground["success-light"] }}>\n` +
      `      <Text style={{ color: colors.text.success }}>저장되었습니다.</Text>\n` +
      `    </View>\n` +
      `  );\n` +
      `}`,
  },
];
