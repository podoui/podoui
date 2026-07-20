#!/usr/bin/env node

/**
 * Source imports the workspace-internal `@podoui/cli` (for types and tsc
 * project references); the published package depends on `podo-ui`, whose
 * `./cli` subpath is the same module. Rewrite the emitted specifier.
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "dist");
for (const file of ["index.js", "index.d.ts"]) {
  const path = join(dist, file);
  const contents = await readFile(path, "utf8");
  await writeFile(path, contents.replaceAll("@podoui/cli", "podo-ui/cli"));
}
