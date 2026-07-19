# Podo UI v2

Podo UI v2 is a JSON-spec-first TypeScript design system. Design tokens, component specifications, icon metadata, themes, project overrides, builders, and MCP access are built around validated JSON contracts.

## Packages

- `@podoui/spec`: JSON schemas, parsers, and TypeScript contracts.
- `@podoui/tokens`: token loading, merging, resolving, and target emitters.
- `@podoui/icons`: icon manifest validation and font/native asset builders.
- `@podoui/core`: shared behavior, accessibility, registry, and state helpers.
- `@podoui/web`, `@podoui/react`, `@podoui/hono`, `@podoui/native`: runtime component targets.
- `@podoui/cli`: `podo` project setup/build/update command.
- `@podoui/mcp`: Model Context Protocol server for AI tool access to Podo specs.

## Local Workflow

```sh
pnpm install
pnpm check
pnpm build
pnpm release:verify
```

Use `pnpm examples:build` to compile only the example projects. Use `pnpm changeset:dry-run` before publishing to inspect Changesets version impact and npm tarball contents without publishing.

## Installed Projects

```sh
podo init --target react --theme dashboard
podo build --dry-run
podo build
```

Project-local Podo state lives under `.podo`. The CLI and MCP tools must validate JSON specs before writing and keep generated outputs reproducible from JSON source.

## Documentation

See [plan.md](./plan.md) and [todo.md](./todo.md) for the current architecture and execution checklist. Operational guides live in [docs](./docs).
