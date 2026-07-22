# podo-ui

Podo UI v2 — JSON 스펙 기반 디자인 시스템. 하나의 패키지로 web(Custom
Elements), React, Hono(SSR), React Native 렌더러와 `podo` CLI, MCP 서버까지
제공합니다.

> **v1(SCSS 기반)과 v2는 호환되지 않습니다.** v1을 계속 사용하려면
> `podo-ui@1`로 고정하세요.

## 설치

```bash
npm install podo-ui
```

React/React Native는 peer(선택)라서 쓰는 환경에서만 설치돼 있으면 됩니다.

## 사용

```ts
import { Button, Field, Input, PodoThemeProvider } from "podo-ui/react";
```

| 서브패스            | 내용                                       |
| ------------------- | ------------------------------------------ |
| `podo-ui/web`       | 표준 Custom Elements 렌더러                |
| `podo-ui/react`     | React 컴포넌트                             |
| `podo-ui/hono`      | Hono TSX SSR 컴포넌트                      |
| `podo-ui/native`    | React Native 컴포넌트                      |
| `podo-ui/spec`      | 토큰/컴포넌트 JSON schema와 파서           |
| `podo-ui/tokens`    | 토큰 resolver와 CSS/TS/RN 출력기 (`/node`) |
| `podo-ui/icons`     | 아이콘 manifest와 WOFF 빌드                |
| `podo-ui/core`      | 공통 behavior/a11y 헬퍼                    |
| `podo-ui/codegen`   | 컴포넌트 코드 생성기                       |
| `podo-ui/migration` | `.podo` 마이그레이션 러너                  |
| `podo-ui/cli`       | CLI 진입점 (`runCli`)                      |
| `podo-ui/mcp`       | MCP 서버 (`createPodoMcpServer`)           |

React Native 앱에서는 `createNativeComponents({ Pressable, ScrollView, Text, TextInput, View })`에
`react-native`의 실제 컴포넌트를 주입해 사용하세요. `podo-ui/native`의
top-level 컴포넌트 export는 문자열 호스트(`defaultNativeHost`) 기반의
테스트 렌더러 전용 편의 export입니다 (자세한 예시: docs/installation-guide.md).

## 스타일

```ts
import "podo-ui/styles.css"; // 컴포넌트 CSS (라이트 폴백 내장)
import "podo-ui/icons.css"; // 기본 아이콘 글리프 폰트 (PodoIcons)
```

`podo init && podo build`를 쓰는 프로젝트는 빌드가 생성한
`tokens.css`/`components.css`/`icons/PodoIcons.css`를 함께 import 하세요 —
`.podo` 오버라이드(테마, 아이콘 그룹 포함)가 그 산출물에 반영됩니다.
`podo-ui/icons.css`는 빌드 없이 쓰는 소비자를 위한 기본 아이콘 세트입니다.

다크 모드(`data-color-scheme="dark"`): 기본 토큰 문서가 Figma theme
컬렉션의 light/dark 값(112개 변수 — text/border/foreground/elevation/
icon/table/button)을 그대로 내장하므로, `podo build`가 생성한 tokens.css를
import하면 `data-podo-theme`+`data-color-scheme` 속성 전환만으로 전체
컴포넌트가 다크로 재스타일됩니다. 프로젝트 `.podo` 토큰으로 값을
오버라이드할 수 있고, v1 이식 컴포넌트(DatePicker/Editor)는 자체 다크
스타일을 포함합니다.

## CLI

```bash
npx podo-ui init      # .podo 생성 (또는: npx podo-ui — 인터랙티브 메뉴)
npx podo-ui build     # 토큰/아이콘/컴포넌트 산출물 생성
npx podo-ui import    # 피그마 플러그인에서 디자인 시스템 가져오기
npx podo-ui validate
```

## MCP

```bash
claude mcp add podo -- npx podo-ui mcp
```

문서: https://podoui.com
