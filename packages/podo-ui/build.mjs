#!/usr/bin/env node

/**
 * Assemble the self-contained `podo-ui` package.
 *
 * The workspace builds 13 internal `@podoui/*` packages (never published —
 * the npm scope is not ours). This script copies each package's `dist` into
 * `dist/<name>/` and rewrites every `@podoui/<name>[/<sub>]` import specifier
 * in .js/.d.ts files to a RELATIVE path inside this package, so the published
 * tarball has no dependency on the internal names. `dist/package.json` is
 * written for modules that read their own version via `../package.json`
 * (@podoui/cli, @podoui/mcp).
 */

import { cp, chmod, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const packagesRoot = resolve(root, "..");
const outRoot = join(root, "dist");

/** Internal package -> subpath entry files (specifier suffix -> file). */
const MODULES = [
  "spec",
  "tokens",
  "icons",
  "icon-build",
  "core",
  "web",
  "react",
  "hono",
  "native",
  "codegen",
  "migration",
  "mcp",
  "cli",
];

/** `@podoui/<name>` resolves to `dist/<name>/index.js`; deeper specifiers
 * (`@podoui/tokens/node`) resolve to `dist/<name>/<sub>.js`. */
function targetFor(specifier) {
  const [, name, ...sub] = specifier.split("/");
  if (!MODULES.includes(name)) {
    throw new Error(`Unknown internal specifier "${specifier}".`);
  }
  return posix.join(name, sub.length > 0 ? `${sub.join("/")}.js` : "index.js");
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });

for (const name of MODULES) {
  await cp(join(packagesRoot, name, "dist"), join(outRoot, name), {
    recursive: true,
    filter: (source) => !source.endsWith(".tsbuildinfo"),
  });
}

// Only rewrite IMPORT specifiers (`from "..."`, `import("...")`,
// side-effect `import "..."`) — data strings like the migration manifest's
// default packageName must pass through untouched.
const SPECIFIER = /((?:\bfrom|\bimport)\s*\(?\s*)(["'])(@podoui\/[a-z0-9-]+(?:\/[a-z0-9-]+)*)\2/g;

async function rewriteDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteDirectory(entryPath);
      continue;
    }
    if (!/\.(js|d\.ts)$/.test(entry.name)) {
      continue;
    }
    const original = await readFile(entryPath, "utf8");
    const fileDir = relative(outRoot, dirname(entryPath)).split("\\").join("/");
    const rewritten = original.replace(SPECIFIER, (_match, lead, quote, specifier) => {
      let relativePath = posix.relative(fileDir, targetFor(specifier));
      if (!relativePath.startsWith(".")) {
        relativePath = `./${relativePath}`;
      }
      return `${lead}${quote}${relativePath}${quote}`;
    });
    if (rewritten !== original) {
      await writeFile(entryPath, rewritten);
    }
  }
}

await rewriteDirectory(outRoot);

// @podoui/cli and @podoui/mcp read `../package.json` for their version;
// from dist/<name>/index.js that resolves to this file.
const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
await writeFile(
  join(outRoot, "package.json"),
  `${JSON.stringify({ name: "podo-ui", version, type: "module" }, null, 2)}\n`
);

await chmod(join(outRoot, "cli/index.js"), 0o755);
await chmod(join(outRoot, "cli/menu.js"), 0o755);
await chmod(join(outRoot, "mcp/index.js"), 0o755);

process.stdout.write(`Assembled podo-ui dist from ${MODULES.length} internal packages.\n`);
