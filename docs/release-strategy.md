# Release Strategy

The v2 release flow keeps the useful parts of the existing `main` branch while switching the source of truth from SCSS and handwritten framework files to JSON specifications.

## Main Branch Patterns To Keep

The existing `main` branch already demonstrates several release patterns that remain useful:

- npm `exports` for framework-specific entry points
- npm `files` allowlist to avoid publishing development files
- package `bin` entries for MCP and CLI commands
- target-specific build scripts such as library, CDN, and MCP builds
- `prepublishOnly` as a final local safety net before publish
- MCP data packaged with the npm release

## v2 Changes

Podo v2 replaces SCSS-first build inputs with JSON-first build inputs:

1. Load package default token/component/icon specs.
2. Merge installed-project `.podo` overrides.
3. Validate all JSON specs.
4. Resolve tokens and component bindings.
5. Emit target-specific packages and generated project files.

## Versioning (2026-07-20 현행)

The only published package is **`podo-ui`** (plus its bins `podo`, `podo-ui`, `podo-mcp`); `packages/podo-ui/build.mjs` assembles it from the private workspace-internal `@podoui/*` packages. The npm `@podo` scope is third-party-owned and the `podoui` name is blocked by npm's similarity rule, which is why nothing else publishes.

Version bumps are manual edits to `packages/podo-ui/package.json` (internal packages may stay behind). Changesets remains for status/dry-run tooling with base branch `main`; **`changeset publish` is not used** because it does not rewrite `workspace:` protocol ranges — `pnpm publish` does, so `pnpm release` ends with `pnpm --filter podo-ui publish --access public`. The final publish step requires an npm 2FA OTP.

## Release Verification

Run the release gate before publishing:

```sh
pnpm check
pnpm build
pnpm release:verify
pnpm changeset:dry-run
```

`pnpm release:verify` checks package `exports`, TypeScript declaration entries, npm `files` allowlists, CLI/MCP bin shebangs and executable bits, root README/CHANGELOG/LICENSE files, and a dry-run MCP launch path. `pnpm changeset:dry-run` runs `changeset status --verbose` and `pnpm --filter './packages/*' pack --dry-run` to inspect version impact and tarball contents without publishing.

## Canary Policy

Canary releases use npm dist-tags and must not replace `latest`.

1. Run the release gate above on `main`.
2. Set a snapshot version (e.g. `2.1.0-canary.0`) in `packages/podo-ui/package.json` on a disposable branch.
3. Run `pnpm build && pnpm release:verify && pnpm changeset:dry-run`.
4. Publish with `pnpm --filter podo-ui publish --access public --tag canary`.
5. Install in a sample project with `npm install podo-ui@canary` and run `npx podo init`, `npx podo build --dry-run`, and `npx podo validate`.

Installing directly from `main` is allowed only for canary validation. Reproducible project installs should use npm versions or explicit git tags.
