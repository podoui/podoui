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
      `npm install podo-ui\n` +
      `npx podo-ui init --target react --theme landing --dark-mode --out-dir src/podo --yes\n` +
      `npx podo-ui build --dry-run\n` +
      `npx podo-ui build\n\n` +
      `import { PodoThemeProvider } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "./podo/tokens.css";\n` +
      `import "./podo/components.css";\n` +
      `import "./podo/icons/PodoIcons.css";`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `npx podo-ui init --target web --theme landing --dark-mode --out-dir src/podo --yes\n` +
      `npx podo-ui build --dry-run && npx podo-ui build\n\n` +
      `import { registerPodoElements } from "podo-ui/web";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "./podo/tokens.css";\n` +
      `import "./podo/components.css";\n` +
      `import "./podo/icons/PodoIcons.css";\n\n` +
      `registerPodoElements();`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `npx podo-ui init --target hono --theme landing --dark-mode --out-dir src/podo --yes\n` +
      `npx podo-ui build --dry-run && npx podo-ui build\n\n` +
      `import { renderCriticalCss } from "podo-ui/hono";\n\n` +
      `renderCriticalCss({\n` +
      `  theme: "landing", colorScheme: "light",\n` +
      `  css: generatedTokensAndComponentsCss,\n` +
      `});\n` +
      `// PodoIcons.css, woff2/woff와 podo-ui/styles.css도 정적 제공`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `npx podo-ui init --target native --theme landing --dark-mode --out-dir src/podo --yes\n` +
      `npx podo-ui build --dry-run && npx podo-ui build\n\n` +
      `import { Modal, Pressable, ScrollView, Text, TextInput, View, useColorScheme } from "react-native";\n` +
      `import { WebView } from "react-native-webview";\n` +
      `import { useFonts } from "expo-font";\n` +
      `import { createNativeComponents, PodoNativeThemeProvider } from "podo-ui/native";\n` +
      `import { getPodoNativeTokens } from "./podo/tokens.native";\n` +
      `import { podoIconGlyphMap } from "./podo/icons/PodoIcons.native";\n\n` +
      `const iconGlyphs = Object.fromEntries(\n` +
      `  Object.entries(podoIconGlyphMap).map(([name, code]) => [name, String.fromCodePoint(code)])\n` +
      `);\n` +
      `const ui = createNativeComponents({ Modal, Pressable, ScrollView, Text, TextInput, View, WebView });\n\n` +
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
      `    >\n      <ui.Button>저장</ui.Button>\n    </PodoNativeThemeProvider>\n` +
      `  );\n}`,
  },
];

export function SetupPage() {
  return (
    <>
      <PageHeader
        title="설치와 토큰 적용"
        intro="공개 패키지는 podo-ui 하나이며, 프로젝트별 JSON과 생성 상태는 .podo 안에 둬요. 모든 쓰기 전에 validate와 build --dry-run으로 입력 및 변경 계획을 확인하세요."
      />

      <DocSection index={0} title="환경별 설정">
        <Preview tabs={SETUP_TABS}>
          <Button>생성 토큰이 적용된 버튼</Button>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="생성물 계약"
        description="Figma 플러그인 내보내기를 podo import로 받은 뒤 같은 build를 실행하면 토큰·컴포넌트·아이콘 출력이 함께 재생성돼요. 생성 파일을 직접 수정하지 마세요."
      >
        <SpecTable
          columns={["출력", "Web / React / Hono", "React Native"]}
          rows={[
            ["토큰", "tokens.css, tokens.ts/json", "tokens.native.ts"],
            ["컴포넌트 바인딩", "components.css + target source", "native target source"],
            [
              "아이콘",
              "PodoIcons.css + woff2/woff",
              "PodoIcons.ttf + PodoIcons.native.ts codepoint map",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        index={2}
        title="검증 순서"
        description="podo validate → podo build --dry-run → 변경 계획 검토 → podo build 순서를 지켜야 기존 생성물을 예고 없이 덮어쓰지 않아요. 실제 build가 기존 파일을 바꾸면 --force가 필요해요."
      >
        <SpecTable
          columns={["명령", "역할"]}
          rows={[
            [<code>npx podo-ui validate</code>, "JSON 스키마·참조·아이콘 입력 검증"],
            [<code>npx podo-ui build --dry-run</code>, "생성/갱신 파일 계획 확인"],
            [<code>npx podo-ui build --force</code>, "검토한 기존 생성물을 재생성"],
          ]}
        />
      </DocSection>
    </>
  );
}
