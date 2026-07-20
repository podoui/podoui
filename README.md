# Podo UI v2

Podo UI v2 is a JSON-spec-first TypeScript design system. Design tokens, component specifications, icon metadata, themes, project overrides, builders, and MCP access are built around validated JSON contracts.

## Install (consumers)

Everything ships as the single npm package [`podo-ui`](https://www.npmjs.com/package/podo-ui):

```sh
npm install podo-ui
npx podo init --target react --theme dashboard
npx podo build
```

```ts
import { Button, PodoThemeProvider } from "podo-ui/react";
```

- Subpaths: `podo-ui/web · react · hono · native · spec · tokens · icons · core · codegen · migration · cli · mcp`
- Bins: `podo` (CLI), `podo-ui` (interactive menu, Figma import entry), `podo-mcp` (MCP server)
- `react` / `react-dom` / `react-native` are optional peers — install only what your target needs.
- v1 (SCSS-based) is incompatible with v2; pin `podo-ui@1` to stay on v1.

## Figma → project import

The [Figma plugin](./figma-plugin) can send the design system (variables, styles, components) straight into a project:

1. In the project terminal run `npx podo-ui` → "피그마에서 가져오기" (or `npx podo import`). The CLI listens on `http://localhost:4141-4145`.
2. In Figma open the PODO plugin and press **프로젝트로 보내기**.
3. Review the plan (files, warnings, conflicts) in the terminal, confirm, then run `podo build`.

## Workspace layout

`packages/*` are pnpm workspace packages named `@podoui/*`. They are **private/workspace-internal** — the npm `@podo` scope is owned by a third party and `podoui` is blocked by npm's name-similarity rule, so `packages/podo-ui` assembles all of them into the one published `podo-ui` package (see `packages/podo-ui/build.mjs`).

- `@podoui/spec`: JSON schemas, parsers, and TypeScript contracts (including the Figma `podo-clone` export schema).
- `@podoui/tokens`: token loading, merging, resolving, and target emitters.
- `@podoui/icons` + `@podoui/icon-build`: icon manifest validation and font/native asset builders.
- `@podoui/core`: shared behavior, accessibility, registry, and state helpers.
- `@podoui/web`, `@podoui/react`, `@podoui/hono`, `@podoui/native`: runtime component targets.
- `@podoui/codegen`, `@podoui/migration`: component file generation and `.podo` migrations.
- `@podoui/cli`: `podo` command (init/build/validate/update/migrate/import/mcp) and the `podo-ui` menu.
- `@podoui/mcp`: Model Context Protocol server for AI tool access to Podo specs.
- `@podoui/docs`: static docs site (not published).
- `podo-ui`: the published bundle of all of the above.

## Local workflow

```sh
pnpm install
pnpm check            # typecheck, lint, tests, format, figma connect parse
pnpm build
pnpm release:verify
```

Use `pnpm examples:build` to compile only the example projects. Releasing: bump `packages/podo-ui/package.json`, then `pnpm release` (publishes `podo-ui` only; the final `npm publish` step needs a 2FA OTP).

## Installed projects

Project-local Podo state lives under `.podo`. The CLI and MCP tools must validate JSON specs before writing and keep generated outputs reproducible from JSON source. Writes outside `.podo` never happen without a dry-run/diff confirmation.

## Documentation

See [plan.md](./plan.md) and [todo.md](./todo.md) for the current architecture and execution checklist. Operational guides live in [docs](./docs).
