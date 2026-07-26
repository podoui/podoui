import { Button } from "@podoui/react";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { SpecTable } from "../components/SpecTable.js";

const SETUP_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React / Next.js",
    code:
      `// 터미널: npm i podo-ui\n` +
      `// Next.js App Router라면 이 파일 맨 위에 "use client"를 추가하세요.\n` +
      `import { Button, PodoThemeProvider } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "podo-ui/icons.css";\n\n` +
      `export function App() {\n` +
      `  return (\n` +
      `    <PodoThemeProvider theme="landing" colorScheme="light">\n` +
      `      <Button theme="solid-primary">저장</Button>\n` +
      `    </PodoThemeProvider>\n` +
      `  );\n}`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `// 터미널: npm i podo-ui\n` +
      `import { registerPodoElements } from "podo-ui/web";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "podo-ui/icons.css";\n\n` +
      `registerPodoElements();\n\n` +
      `document.body.innerHTML = \`\n` +
      `  <podo-button theme="solid-primary">저장</podo-button>\n` +
      `\`;`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Hono } from "hono";\n` +
      `import { Button, renderCriticalCss } from "podo-ui/hono";\n\n` +
      `const app = new Hono();\n\n` +
      `app.get("/", (c) => c.html(\n` +
      `  <html lang="ko">\n` +
      `    <head>\n` +
      `      <link rel="stylesheet" href="/assets/podo.css" />\n` +
      `      <link rel="stylesheet" href="/assets/podo-icons.css" />\n` +
      `      {renderCriticalCss({ theme: "landing", colorScheme: "light" })}\n` +
      `    </head>\n` +
      `    <body><Button>서버에서 렌더링</Button></body>\n` +
      `  </html>\n` +
      `));\n\nexport default app;`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `import { useColorScheme } from "react-native";\n` +
      `import { WebView } from "react-native-webview";\n` +
      `import { useFonts } from "expo-font";\n` +
      `import { Button, PodoNativeThemeProvider } from "podo-ui/native";\n` +
      `import { getPodoNativeTokens } from "./podo/tokens.native";\n` +
      `import { podoIconGlyphMap } from "./podo/icons/PodoIcons.native";\n\n` +
      `const iconGlyphs = Object.fromEntries(\n` +
      `  Object.entries(podoIconGlyphMap).map(([name, code]) => [name, String.fromCodePoint(code)])\n` +
      `);\n` +
      `export function App() {\n` +
      `  const colorScheme = useColorScheme() === "dark" ? "dark" : "light";\n` +
      `  const [fontsLoaded] = useFonts({\n` +
      `    PodoIcons: require("./podo/icons/PodoIcons.ttf"),\n` +
      `  });\n` +
      `  if (!fontsLoaded) return null;\n\n` +
      `  return (\n` +
      `    <PodoNativeThemeProvider\n` +
      `      theme="landing" colorScheme={colorScheme}\n` +
      `      tokens={getPodoNativeTokens("landing", colorScheme)}\n` +
      `      iconGlyphs={iconGlyphs} iconFontFamily="PodoIcons"\n` +
      `      webViewComponent={WebView}\n` +
      `    >\n      <Button>저장</Button>\n    </PodoNativeThemeProvider>\n` +
      `  );\n}`,
  },
];

export function SetupPage() {
  return (
    <>
      <PageHeader
        title="설치와 토큰 적용"
        intro="처음에는 npm 패키지만 설치해 바로 사용할 수 있어요. Figma 토큰이나 프로젝트별 테마가 필요할 때만 CLI로 .podo를 만들고, 검증과 미리보기를 거쳐 생성물을 적용하세요."
      />

      <DocSection index={0} title="환경별 설정">
        <Preview tabs={SETUP_TABS}>
          <Button>생성 토큰이 적용된 버튼</Button>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="Figma 플러그인의 최신 사용 흐름"
        description="플러그인은 최신 PODO 디자인 시스템 스냅샷을 자체 포함합니다. 새 Figma 파일에서는 내보내기 없이 ‘PODO 디자인 시스템 설치’를 누르세요. JSON 내보내기·가져오기는 고급 도구이며 일반 설치 절차가 아닙니다."
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
              "npx podo-ui import → 프로젝트로 보내기",
              ".podo 입력과 검토 가능한 변경 계획",
            ],
            ["파일로 백업·복원", "고급 도구 → JSON 내보내기/가져오기", ".podo-export.json"],
          ]}
        />
      </DocSection>

      <DocSection
        index={2}
        title="프로젝트 토큰 생성과 검증"
        description="아래 명령은 Figma에서 받은 JSON과 프로젝트 오버라이드를 재현 가능한 CSS·TypeScript·폰트로 만듭니다. 생성 파일을 직접 수정하지 말고 .podo의 원본 JSON을 바꾸세요."
      >
        <SpecTable
          columns={["명령", "역할"]}
          rows={[
            [<code>npx podo-ui validate</code>, "JSON 스키마·참조·아이콘 입력 검증"],
            [<code>npx podo-ui init --target react</code>, ".podo와 대상별 기본 설정 생성"],
            [<code>npx podo-ui build --dry-run</code>, "생성/갱신 파일 계획 확인"],
            [<code>npx podo-ui build --force</code>, "검토한 기존 생성물을 재생성"],
          ]}
        />
      </DocSection>

      <DocSection
        index={3}
        title="환경별 지원 범위"
        description="React와 Next.js는 동일한 React 컴포넌트를 사용합니다. Hono는 15개 컴포넌트를 순수 SSR로 출력하고, DatePicker와 Editor처럼 브라우저 상태가 필요한 기능은 React island로 붙입니다. React Native는 네이티브 UI와 WebView 기반 Editor를 제공합니다."
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
