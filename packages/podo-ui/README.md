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

## CLI

```bash
npx podo init      # .podo 생성 (또는: npx podo-ui — 인터랙티브 메뉴)
npx podo build     # 토큰/아이콘/컴포넌트 산출물 생성
npx podo import    # 피그마 플러그인에서 디자인 시스템 가져오기
npx podo validate
```

## MCP

```bash
claude mcp add podo -- npx podo mcp
```

문서: https://podoui.com
