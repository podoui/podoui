# podo-ui

Podo UI v2 — JSON 스펙 기반 디자인 시스템. 이 패키지는 기존 `podo-ui` 사용자용
메타 패키지로, `@podoui/*` 패키지들을 서브패스로 재수출합니다.

> v1(SCSS 기반)과 v2는 호환되지 않습니다. v1을 계속 사용하려면 `podo-ui@1`로
> 고정하세요.

## 설치

```bash
npm install podo-ui        # 전체 (react/web/hono/native 포함)
# 또는 필요한 것만
npm install @podoui/react
```

## 사용

```ts
import { Button, Field, Input, PodoThemeProvider } from "podo-ui/react";
// 동일: import { ... } from "@podoui/react";
```

| 서브패스         | 동일 패키지      |
| ---------------- | ---------------- |
| `podo-ui/spec`   | `@podoui/spec`   |
| `podo-ui/tokens` | `@podoui/tokens` |
| `podo-ui/icons`  | `@podoui/icons`  |
| `podo-ui/core`   | `@podoui/core`   |
| `podo-ui/web`    | `@podoui/web`    |
| `podo-ui/react`  | `@podoui/react`  |
| `podo-ui/hono`   | `@podoui/hono`   |
| `podo-ui/native` | `@podoui/native` |

## CLI / MCP

```bash
npx podoui        # 인터랙티브 메뉴 (피그마 가져오기, init, build, validate)
npx podoui init && npx podoui build
claude mcp add podo -- npx podoui mcp
```

문서: https://podoui.com
