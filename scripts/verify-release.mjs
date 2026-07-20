#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = join(root, "packages");
const failures = [];

function fail(message) {
  failures.push(message);
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function assertFile(path, label) {
  const fileStat = await stat(path).catch(() => undefined);
  if (!fileStat?.isFile() || fileStat.size === 0) {
    fail(`${label} is missing or empty: ${relative(root, path)}`);
    return undefined;
  }
  return fileStat;
}

async function verifyDocs() {
  const docs = [
    ["README.md", "Podo UI v2"],
    ["CHANGELOG.md", "Changelog"],
    ["LICENSE", "MIT License"],
  ];

  for (const [path, marker] of docs) {
    const absolute = join(root, path);
    await assertFile(absolute, path);
    const contents = await readFile(absolute, "utf8").catch(() => "");
    if (!contents.includes(marker)) {
      fail(`${path} must include "${marker}".`);
    }
  }
}

function assertRootScripts(rootPackage) {
  const scripts = rootPackage.scripts ?? {};
  const prepublish = scripts.prepublishOnly ?? "";
  for (const required of [
    "pnpm check",
    "pnpm build",
    "pnpm release:verify",
    "pnpm changeset:dry-run",
  ]) {
    if (!prepublish.includes(required)) {
      fail(`prepublishOnly must include ${required}.`);
    }
  }
  for (const requiredScript of ["release:verify", "changeset:dry-run", "examples:build"]) {
    if (!scripts[requiredScript]) {
      fail(`Root package.json is missing ${requiredScript}.`);
    }
  }
}

async function verifyPackage(directory) {
  const packagePath = join(packagesRoot, directory, "package.json");
  const manifest = await readJson(packagePath);
  // The docs site is never verified; other @podoui/* packages are private
  // (workspace-internal — the npm @podoui scope is not published) but their
  // dist/exports still feed the published podo-ui bundle, so keep checking
  // them. `podo-ui` and `podoui` are the two packages that actually publish.
  if (manifest.name === "@podoui/docs" || !manifest.name) {
    return;
  }
  if (manifest.name === "podo-ui" || manifest.name === "podoui") {
    await verifyPublishedEntry(directory, manifest);
    return;
  }
  if (!manifest.name.startsWith("@podoui/")) {
    return;
  }

  const label = `${manifest.name} package.json`;
  if (manifest.type !== "module") {
    fail(`${label} must set type: module.`);
  }
  if (manifest.license !== "MIT") {
    fail(`${label} must use MIT license.`);
  }
  if (manifest.private !== true) {
    fail(`${label} must stay private (the @podoui npm scope is not published).`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("dist")) {
    fail(`${label} must publish an explicit files allowlist containing dist.`);
  }

  const rootExport = manifest.exports?.["."];
  if (!rootExport?.import || !rootExport?.types) {
    fail(`${label} must expose import and types entries for the root export.`);
  } else {
    await assertFile(join(packagesRoot, directory, rootExport.import), `${manifest.name} import`);
    await assertFile(join(packagesRoot, directory, rootExport.types), `${manifest.name} types`);
  }

  const distFiles = await listFiles(join(packagesRoot, directory, "dist"));
  for (const file of distFiles) {
    if (/[./](?:.+\.)?test\.(?:js|d\.ts|js\.map|d\.ts\.map)$/.test(file)) {
      fail(`${manifest.name} published dist contains test output: ${file}`);
    }
    if (file.endsWith(".tsbuildinfo")) {
      fail(`${manifest.name} published dist contains TypeScript build info: ${file}`);
    }
  }

  for (const [binName, binPath] of Object.entries(manifest.bin ?? {})) {
    const absoluteBin = join(packagesRoot, directory, binPath);
    const binStat = await assertFile(absoluteBin, `${manifest.name} bin ${binName}`);
    if (!binStat) {
      continue;
    }
    if ((binStat.mode & 0o111) === 0) {
      fail(`${manifest.name} bin ${binName} must be executable.`);
    }
    const contents = await readFile(absoluteBin, "utf8");
    if (!contents.startsWith("#!/usr/bin/env node")) {
      fail(`${manifest.name} bin ${binName} must start with a node shebang.`);
    }
  }
}

async function listFiles(directory) {
  if (!(await exists(directory))) {
    fail(`Missing dist directory: ${relative(root, directory)}`);
    return [];
  }
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolute)));
    } else {
      files.push(relative(directory, absolute));
    }
  }
  return files;
}

async function verifyMcpExecution() {
  const cliBin = join(root, "packages/cli/dist/index.js");
  const result = spawnSync(process.execPath, [cliBin, "mcp", "--dry-run"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0 || !result.stdout.includes("Would start Podo MCP")) {
    fail(`podo mcp --dry-run failed: ${result.stderr || result.stdout}`);
  }

  const mcpModule = await import(pathToFileURL(join(root, "packages/mcp/dist/index.js")).href);
  if (typeof mcpModule.createPodoMcpServer !== "function") {
    fail("@podoui/mcp must export createPodoMcpServer.");
    return;
  }
  mcpModule.createPodoMcpServer({ root });
}

/** Checks for the two packages that actually publish to npm. */
async function verifyPublishedEntry(directory, manifest) {
  const label = `${manifest.name} package.json`;
  if (manifest.private === true) {
    fail(`${label} must not be private.`);
  }
  if (manifest.publishConfig?.access !== "public") {
    fail(`${label} must publish with public access.`);
  }
  if (manifest.license !== "MIT") {
    fail(`${label} must use MIT license.`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes("dist")) {
    fail(`${label} must publish an explicit files allowlist containing dist.`);
  }
  for (const [entryName, relativePath] of Object.entries(manifest.bin ?? {})) {
    await assertFile(
      join(packagesRoot, directory, relativePath),
      `${manifest.name} bin "${entryName}"`
    );
  }
  for (const [subpath, entry] of Object.entries(manifest.exports ?? {})) {
    if (typeof entry === "string") {
      await assertFile(
        join(packagesRoot, directory, entry),
        `${manifest.name} exports["${subpath}"]`
      );
      continue;
    }
    for (const key of ["types", "import"]) {
      if (entry?.[key]) {
        await assertFile(
          join(packagesRoot, directory, entry[key]),
          `${manifest.name} exports["${subpath}"].${key}`
        );
      }
    }
  }
  // Workspace-internal specifiers must never leak into the published files.
  const distRoot = join(packagesRoot, directory, "dist");
  if (await exists(distRoot)) {
    const leaks = await findSpecifierLeaks(distRoot);
    if (leaks.length > 0) {
      fail(`${manifest.name} dist still references @podoui/*: ${leaks.slice(0, 3).join(", ")}`);
    }
  }
}

async function findSpecifierLeaks(directory) {
  const leaks = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      leaks.push(...(await findSpecifierLeaks(entryPath)));
      continue;
    }
    if (!/\.(js|d\.ts)$/.test(entry.name)) {
      continue;
    }
    const contents = await readFile(entryPath, "utf8");
    // Import contexts only — data strings (e.g. packageName constants) are fine.
    if (/(?:\bfrom|\bimport)\s*\(?\s*["']@podoui\//.test(contents)) {
      leaks.push(relative(root, entryPath));
    }
  }
  return leaks;
}

await verifyDocs();
assertRootScripts(await readJson(join(root, "package.json")));

const packageDirectories = await readdir(packagesRoot);
for (const directory of packageDirectories) {
  await verifyPackage(directory);
}
await verifyMcpExecution();

if (failures.length) {
  process.stderr.write("Release verification failed:\n");
  for (const failure of failures) {
    process.stderr.write(`- ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write(`Release verification passed for ${packageDirectories.length} packages.\n`);
