# Agent Instructions

This repository contains Podo UI v2 on the canonical `main` branch. Follow these instructions when working in this repository.

## Mission

Build Podo v2 as a JSON-spec-first TypeScript design system:

- Design tokens, component specs, icon metadata, themes, project overrides, builders, and MCP access are driven by validated JSON.
- The source planning documents are `plan.md` and `todo.md`.
- Work through `todo.md` in order unless the user explicitly changes priority.

## Required Workflow

1. Implement the next unchecked scope in `todo.md`.
2. Run local verification for that scope.
3. Ask a separate Codex reviewer agent for strict review.
4. Fix every blocking review finding.
5. Only after the Codex review passes, update `todo.md` checkboxes for the completed scope.
6. Commit the passing scope.
7. Push the branch.
8. Continue to the next scope.

Do not check a task in `todo.md` before review approval. Do not commit unreviewed implementation work unless the user explicitly asks for a checkpoint commit.

## Scope Gates

Use the Phase sections in `todo.md` as the default review gate. If a Phase is too large, split it into a smaller contiguous scope and document the split in the final message or commit body.

## Branch And Git Rules

- Work on branch `main`.
- Do not merge legacy v1 branches unless the user asks.
- You may inspect legacy refs with read-only commands such as `git show <ref>:<path>`.
- Do not run destructive git commands.
- Preserve user changes.

## Project Constraints

- Use TypeScript as the default implementation language.
- Use pnpm workspaces.
- Prefer `@podoui/*` scoped packages for v2.
- Keep JSON specs as the source of truth.
- Generated outputs must be reproducible from JSON specs and TypeScript source.
- Keep installed-project state inside `.podo`.
- CLI and MCP write operations must support dry-run and validation before writing.

## Quality Commands

Use these commands as the baseline when available:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm check
```

If a command cannot run because dependencies are not installed or the current phase has not implemented the required package yet, state that clearly in the review request and final update.

## Review Standard

The Codex review must be strict and performed by a separate reviewer agent that did not implement the scope. The reviewer must not edit files. Ask the reviewer to focus on:

- incorrect architecture decisions
- missed `todo.md` completion criteria
- broken or missing validation
- package/export/config mistakes
- generated-output reproducibility
- unsafe file writes
- migration/update risks
- test gaps that should block the current scope

Only non-blocking suggestions may remain unresolved before checking `todo.md`.

## Codex Review Invocation

Use an independent Codex reviewer agent or sub-agent with repository read access. Give it the current contiguous scope, its `todo.md` completion criteria, the complete diff, and local verification results. Use this review request as the baseline:

```text
Strictly review the current Podo v2 repository scope. Do not edit files. Inspect AGENTS.md, todo.md, the complete diff, and relevant tests. Focus on architecture, missed completion criteria, validation, package/export/config mistakes, reproducibility, unsafe writes, migration/update risks, and blocking test gaps. Return PASS only if the scope can be checked in todo.md; otherwise list every blocking finding with file paths and concrete fixes. Label non-blocking suggestions separately.
```

The implementing agent must not self-approve. If no independent Codex reviewer is available, stop before checking `todo.md`, committing, or pushing and report the review blocker.

## Hono Renderer Parity

Hono (`podo-ui/hono`) mirrors every React export. Keep these contracts when touching `packages/hono`, `packages/react`, or the sample:

- **One client entry.** `podo-ui/hono/client` (`dist/hono/client.js`) is a single classic IIFE bundling the React component sources with `react` aliased to `hono/jsx/dom` (Editor included). Do not add a second entry or a global `React`; `pnpm release:verify` enforces no react import, no `window.React`, no ESM syntax, Editor present, and a gzip cap.
- **Island protocol.** SSR wraps stateful components in `span.podo-island` (`div` only for Table) with `data-podo-island`, `data-podo-props` (JSON via `@podoui/core` `serializeProps`), and the configure key `data-podo-id`; the component `id` stays where React renders it. ReactNode props travel as `data-podo-slot` markup (or `<template data-podo-slot>`), never HTML strings. SSR-only markup carries `data-podo-generated`.
- **Nested islands and defer.** Only the outermost island mounts; inner islands become vnodes of the same React source. Non-serializable props (functions, class instances) are omitted with `data-podo-defer`, and the outer island waits until every deferred inner island receives `window.podo.client.configure(id, props)`.
- **Events.** React callbacks become bubbling `podo:*` CustomEvents (`detail` keys = React argument names; nested islands add `detail.id`). Initial values are uncontrolled `default*`; controlled values only through `configure`.
- **Source of truth.** `docs/hono-parity.md` lists every export, prop transfer rule, event, approved post-mount difference, and decision (D-1…). Update it with any behavior change.
- **Verification.** Parity tests: `packages/hono/src/parity.test.tsx` (A: Hono SSR vs React `renderToStaticMarkup`), `client*.test.tsx` (B: jsdom mount with the real bundle, C: wrapper parsing). Real-browser QA runs on `examples/hono-ssr` (strict CSP; `/overlays`, `/select-chip`, `/datepicker`, `/editor`, `/long`) with the Mac ego-browser, recording revision, exit codes, `ego_space_name`, `finish_ok`, and `spaces_remaining=0`.

## Package Publishing

- Publish `podo-ui` through `.github/workflows/notify-publish.yml`, which is registered as the npm Trusted Publisher for `podoui/podoui`.
- Prefer the GitHub Actions OIDC flow over local npm tokens or interactive `npm login`; it does not require a stored npm token or OTP.
- After the release commit is pushed, create and push the matching `v*` tag (for example, `v2.3.1`) or manually dispatch the `Publish podo-ui` workflow.
- Monitor the workflow through completion, verify the published version and integrity from the npm registry, then reinstall that exact registry version in downstream test projects.
- Do not rename `notify-publish.yml` without first updating the Trusted Publisher configuration on npm.

## Documentation Rules

- Keep `plan.md` as architecture intent.
- Keep `todo.md` as execution state.
- Put operational details in `docs/`.
- When the implementation diverges from `plan.md`, update the plan or document the decision before review.
