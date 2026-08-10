import { Button } from "@podoui/react";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { SpecTable } from "../components/SpecTable.js";
import { GLOBAL_TOKEN_TABS, PROJECT_THEME_TABS } from "./setup-examples.js";

export const SETUP_TABS: CodeTab[] = [
  {
    target: "setup-react",
    label: "React",
    code:
      `// 터미널: npm i podo-ui\n` +
      `import { Button, PodoThemeProvider } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "podo-ui/icons.css";\n\n` +
      `export function App() {\n` +
      `  return (\n` +
      `    <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>\n` +
      `      <Button theme="solid-primary">저장</Button>\n` +
      `    </PodoThemeProvider>\n` +
      `  );\n}`,
  },
  {
    target: "setup-next",
    label: "Next.js",
    code:
      `// app/layout.tsx\n` +
      `import "podo-ui/styles.css";\n` +
      `import "podo-ui/icons.css";\n` +
      `import { Providers } from "./providers";\n\n` +
      `export default function RootLayout({ children }: { children: React.ReactNode }) {\n` +
      `  return (\n` +
      `    <html lang="ko" data-podo-theme="landing" data-color-scheme="light">\n` +
      `      <body><Providers>{children}</Providers></body>\n` +
      `    </html>\n` +
      `  );\n` +
      `}\n\n` +
      `// app/providers.tsx\n` +
      `"use client";\n` +
      `import { PodoThemeProvider } from "podo-ui/react";\n` +
      `export function Providers({ children }: { children: React.ReactNode }) {\n` +
      `  return <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>{children}</PodoThemeProvider>;\n` +
      `}`,
  },
  {
    target: "setup-hono-csr",
    label: "Hono CSR",
    code:
      `// client.tsx — Hono가 내려 준 #podo-root에 React를 붙입니다.\n` +
      `import { createRoot } from "react-dom/client";\n` +
      `import { Button, PodoThemeProvider } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n\n` +
      `const root = document.getElementById("podo-root");\n` +
      `if (!root) throw new Error("#podo-root를 찾을 수 없습니다.");\n` +
      `createRoot(root).render(\n` +
      `  <PodoThemeProvider theme="landing" colorScheme="light" applyToDocument>\n` +
      `    <Button>클라이언트 화면</Button>\n` +
      `  </PodoThemeProvider>\n` +
      `);`,
  },
  {
    target: "setup-hono-ssr",
    label: "Hono SSR",
    code:
      `// Vite의 ?raw import로 패키지 CSS를 첫 HTML에 넣습니다.\n` +
      `import podoCss from "podo-ui/styles.css?raw";\n` +
      `import { Hono } from "hono";\n` +
      `import { Button, renderCriticalCss } from "podo-ui/hono";\n\n` +
      `const app = new Hono();\n\n` +
      `app.get("/", (c) => c.html(\n` +
      `  <html lang="ko" data-podo-theme="landing" data-color-scheme="light">\n` +
      `    <head>\n` +
      `      {renderCriticalCss({ theme: "landing", colorScheme: "light", css: podoCss })}\n` +
      `    </head>\n` +
      `    <body><Button>서버에서 렌더링</Button></body>\n` +
      `  </html>\n` +
      `));\n\nexport default app;`,
  },
  {
    target: "setup-native",
    label: "React Native",
    code:
      `import { Button, PodoNativeThemeProvider } from "podo-ui/native";\n` +
      `\n` +
      `export function App() {\n` +
      `  return (\n` +
      `    <PodoNativeThemeProvider theme="landing" colorScheme="light">\n` +
      `      <Button>저장</Button>\n` +
      `    </PodoNativeThemeProvider>\n` +
      `  );\n}`,
  },
];

export function SetupPage() {
  return (
    <>
      <PageHeader
        title="설치와 토큰 적용"
        intro="Podo UI는 기본 디자인으로 바로 시작할 수 있고, 준비가 되면 같은 코드를 유지한 채 팀의 Figma 토큰으로 바꿀 수 있어요. 먼저 아래에서 사용하는 환경을 고르고 첫 화면을 띄워 보세요."
      />

      <DocSection
        index={0}
        title="1. 패키지를 설치하고 첫 화면 띄우기"
        description="모든 환경에서 설치 명령은 npm i podo-ui 하나입니다. 탭을 고른 뒤 코드를 앱의 시작점에 넣으세요. Next.js와 Hono는 첫 HTML에도 테마 속성을 넣어 두면 화면이 뜨는 순간부터 올바른 색이 보입니다."
      >
        <Preview tabs={SETUP_TABS}>
          <Button>첫 Podo 버튼</Button>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="2. 앱 전체에 테마 한 번 적용하기"
        description="화면마다 테마를 반복하지 않아도 됩니다. 앱 루트에서 landing 또는 dashboard와 light 또는 dark를 한 번 정하세요. React의 applyToDocument는 모달처럼 body로 이동하는 UI도 같은 토큰을 쓰게 하고, 서버 렌더링은 HTML에 속성을 미리 넣어 첫 화면의 깜빡임을 막습니다."
      >
        <Preview tabs={PROJECT_THEME_TABS}>
          <Button>프로젝트 테마가 적용된 버튼</Button>
        </Preview>
      </DocSection>

      <DocSection
        index={2}
        title="3. 어디서든 디자인 토큰 사용하기"
        description="Podo 컴포넌트 밖의 화면도 같은 디자인 언어로 만들 수 있어요. 웹에서는 생성된 tokens.css를 시작점에서 한 번 불러오고 --podo-* CSS 변수를 사용하세요. 색상뿐 아니라 간격, 반경, 타이포그래피까지 루트 테마를 따라 자동으로 바뀝니다. React Native에서는 Provider에 넣은 토큰을 usePodoNativeTokens로 꺼냅니다."
      >
        <Preview tabs={GLOBAL_TOKEN_TABS}>
          <p
            style={{
              color: "var(--podo-text-basic)",
              background: "var(--podo-elevation-basic)",
              padding: "var(--podo-spacing-scale-8)",
              borderRadius: "var(--podo-radius-control-md)",
              fontFamily: "var(--podo-typography-body-medium-fontFamily)",
              fontSize: "var(--podo-typography-body-medium-fontSize)",
            }}
          >
            전역 토큰으로 만든 계정 카드
          </p>
        </Preview>
      </DocSection>

      <DocSection
        index={3}
        title="4. 팀 디자인을 가져오고 싶을 때"
        description="기본 테마만 쓴다면 여기까지면 충분합니다. 팀 토큰이 필요하면 먼저 npx podo-ui init --target react --theme landing --out-dir src/podo --yes로 .podo를 만드세요. 그다음 import를 대기시킨 뒤 플러그인에서 ‘프로젝트로 보내기’를 누르면 CLI가 변경 내용을 먼저 보여 줍니다. Next.js와 Hono CSR도 target react를, Hono SSR은 hono를, React Native는 native를 사용합니다."
      >
        <SpecTable
          columns={["하려는 일", "순서", "결과"]}
          rows={[
            [
              "새 Figma 파일에 설치",
              "플러그인 → PODO 디자인 시스템 설치",
              "_podo 페이지, 변수·스타일·컴포넌트",
            ],
            [
              "코드 프로젝트에 적용",
              "npx podo-ui init → npx podo-ui import → 프로젝트로 보내기",
              ".podo 입력과 검토 가능한 변경 계획",
            ],
            ["파일로 백업·복원", "고급 도구 → JSON 내보내기/가져오기", ".podo-export.json"],
          ]}
        />
      </DocSection>

      <DocSection
        index={4}
        title="5. 변경 내용을 확인하고 토큰 만들기"
        description="먼저 검증하고, dry-run으로 바뀔 파일을 살펴본 다음 실제 생성하세요. 만들어진 CSS·TypeScript·폰트는 언제든 .podo의 JSON에서 다시 만들 수 있으므로 직접 고치지 않는 것이 안전합니다."
      >
        <SpecTable
          columns={["명령", "역할"]}
          rows={[
            [
              <code>npx podo-ui init --target react --theme landing --out-dir src/podo --yes</code>,
              "처음 한 번 .podo 작업 공간 만들기",
            ],
            [<code>npx podo-ui import</code>, "Figma 변경 계획을 받고 확인 후 적용"],
            [<code>npx podo-ui validate</code>, "JSON 스키마·참조·아이콘 입력 검증"],
            [<code>npx podo-ui build --dry-run</code>, "생성/갱신 파일 계획 확인"],
            [<code>npx podo-ui build</code>, "확인한 토큰·컴포넌트·아이콘 생성"],
          ]}
        />
      </DocSection>

      <DocSection
        index={5}
        title="환경마다 어디까지 쓸 수 있나요?"
        description="React와 Next.js는 같은 컴포넌트를 사용합니다. Hono의 기본 UI는 서버에서 바로 만들 수 있고, DatePicker와 Editor처럼 브라우저 상태가 필요한 화면만 React island로 붙입니다. React Native는 네이티브 UI와 WebView 기반 Editor를 제공합니다. 전역 토큰은 아래 모든 환경과 일반 HTML/CSS에서 사용할 수 있습니다."
      >
        <SpecTable
          columns={["환경", "기본 컴포넌트", "DatePicker", "Editor"]}
          rows={[
            ["React", "전체", "전체", "전체"],
            ["Next.js", "전체 (SSR/Client)", "use client", "use client"],
            ["Hono", "15개 정적 SSR", "React island", "React island"],
            ["React Native", "Native UI", "Native modal", "react-native-webview"],
          ]}
        />
      </DocSection>
    </>
  );
}
