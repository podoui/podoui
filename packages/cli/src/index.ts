#!/usr/bin/env node

import { createHash } from "node:crypto";
import { realpathSync, type Dirent } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as nodeStdin, stdout as nodeStdout } from "node:process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseComponentDocument,
  parseIconManifest,
  parsePageDocument,
  parsePodoConfig,
  parsePodoLock,
  parseTokenDocument,
  validateComponentTokenBindings,
  validateIconManifest,
  validatePageComponents,
  collectTokenPaths,
  PODO_SCHEMA_VERSION,
  type ComponentDocument,
  type IconManifest,
  type PageDocument,
  type PodoConfig,
  type PodoLock,
  type TokenDocument,
  type ValidationIssue,
} from "@podoui/spec";
import {
  emitCssVariables,
  emitReactNativeTokens,
  emitTokenJsonBundle,
  emitTypeScriptTokens,
  mergeTokenDocuments,
  resolveTokenDocument,
  validateTokenBuild,
  type TokenSource,
} from "@podoui/tokens";
import { loadTokenDocuments } from "@podoui/tokens/node";
import { buildIconAssets, emitIconCss, emitIconTypes, emitNativeGlyphMap } from "@podoui/icons";
import {
  emitComponentTokenCss,
  generateComponentFiles,
  generateIndexFile,
  type CodegenTarget,
} from "@podoui/codegen";
import {
  createDefaultMigrationManifest,
  hashJson as hashMigrationJson,
  parseMigrationManifest,
  runMigrationPlan,
  updateLockAfterMigration,
  validateMigrationFile,
  type MigrationFile,
  type MigrationManifest,
  type MigrationPlan,
} from "@podoui/migration";
import { findProjectRoot as findMcpProjectRoot, startMcpServer } from "@podoui/mcp";
import { importProject } from "./figma-import.js";

export const packageName = "@podoui/cli";

export type CliCommandName =
  | "init"
  | "build"
  | "validate"
  | "update"
  | "migrate"
  | "import"
  | "mcp";

export interface CliIO {
  cwd: string;
  stdout: Pick<typeof console, "log">;
  stderr: Pick<typeof console, "error">;
  stdin?: NodeJS.ReadStream;
}

export interface ParsedArgs {
  command?: CliCommandName | undefined;
  options: Record<string, string | boolean>;
  positionals: string[];
}

export interface InitOptions {
  environment: PodoConfig["environment"];
  target: CodegenTarget;
  theme: string;
  darkMode: boolean;
  outDir: string;
  force: boolean;
}

export interface BuildPlan {
  dryRun: boolean;
  skipped: boolean;
  hash: string;
  files: Array<{ path: string; action: "create" | "update"; preview?: string }>;
}

export interface ValidationReport {
  ok: boolean;
  root: string;
  issues: ValidationIssue[];
}

const commandNames: CliCommandName[] = [
  "init",
  "build",
  "validate",
  "update",
  "migrate",
  "import",
  "mcp",
];

export async function runCli(
  argv = process.argv.slice(2),
  io: CliIO = defaultIo()
): Promise<number> {
  const args = parseArgs(argv);
  if (!args.command || args.options.help) {
    io.stdout.log(helpText());
    return 0;
  }

  try {
    if (args.command === "init") {
      await initProject(args, io);
      return 0;
    }
    if (args.command === "build") {
      await buildProject(args, io);
      return 0;
    }
    if (args.command === "validate") {
      // validateProject already logs the success line; don't log it twice.
      const report = await validateProject(args, io);
      if (!report.ok) {
        logIssues(report.issues, io);
        return 1;
      }
      return 0;
    }
    if (args.command === "update") {
      await updateProject(args, io);
      return 0;
    }
    if (args.command === "migrate") {
      await migrateProject(args, io);
      return 0;
    }
    if (args.command === "import") {
      await importProject(args, io);
      return 0;
    }
    if (args.command === "mcp") {
      await startMcp(args, io);
      return 0;
    }
    return 0;
  } catch (error) {
    io.stderr.error(formatError(args.command, error));
    return 1;
  }
}

export function parseArgs(argv: string[]): ParsedArgs {
  const [maybeCommand, ...rest] = argv;
  const command = commandNames.includes(maybeCommand as CliCommandName)
    ? (maybeCommand as CliCommandName)
    : undefined;
  const tokens = command ? rest : argv;
  const options: Record<string, string | boolean> = {};
  const positionals: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token?.startsWith("--")) {
      if (token) {
        positionals.push(token);
      }
      continue;
    }

    const key = token.slice(2);
    const next = tokens[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    options[key] = next;
    index += 1;
  }

  return { command, options, positionals };
}

export async function findProjectRoot(start: string): Promise<string> {
  let current = resolve(start);
  while (true) {
    if ((await exists(join(current, "package.json"))) || (await exists(join(current, ".git")))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return resolve(start);
    }
    current = parent;
  }
}

export async function loadConfig(root: string): Promise<PodoConfig> {
  const configPath = join(root, ".podo/config.json");
  if (!(await exists(configPath))) {
    throw new Error(
      ".podo/config.json was not found. Run `podo init --target react --theme dashboard` first."
    );
  }

  return parsePodoConfig(JSON.parse(await readFile(configPath, "utf8")));
}

export async function initProject(args: ParsedArgs, io: CliIO): Promise<void> {
  const root = await findProjectRoot(io.cwd);
  const options = await resolveInitOptions(args, root, io);
  const podoRoot = join(root, ".podo");
  const directories = [
    podoRoot,
    join(podoRoot, "tokens"),
    join(podoRoot, "themes"),
    join(podoRoot, "components"),
    join(podoRoot, "icons"),
    join(podoRoot, "icons/svg"),
    join(podoRoot, "generated"),
    join(podoRoot, "cache"),
    join(podoRoot, "bootstrap"),
  ];

  for (const directory of directories) {
    await mkdir(directory, { recursive: true });
  }

  const config: PodoConfig = {
    schemaVersion: PODO_SCHEMA_VERSION,
    environment: options.environment,
    darkMode: {
      enabled: options.darkMode,
      strategy: options.environment === "react-native" ? "native" : "data-attribute",
    },
    themes: {
      default: options.theme,
      available: ["landing", "dashboard", "custom"],
    },
    build: {
      targets: [options.target],
      outDir: options.outDir,
    },
  };
  const lock: PodoLock = {
    schemaVersion: PODO_SCHEMA_VERSION,
    packageVersion: await cliPackageVersion(),
    migrations: [],
    generatedHash: hashJson(config),
  };

  await writeJson(join(podoRoot, "config.json"), config, options.force);
  await writeJson(join(podoRoot, "lock.json"), lock, options.force);
  await writeBootstrapFiles(root, options, options.force);
  io.stdout.log(formatInfo("init", `Initialized .podo for ${options.environment}.`));
}

export async function buildProject(args: ParsedArgs, io: CliIO): Promise<BuildPlan> {
  const root = await findProjectRoot(io.cwd);
  const config = await loadConfig(root);
  const targetOption = stringOption(args, "target");
  const targets = targetOption ? [toTarget(targetOption)] : config.build.targets.map(toTarget);
  const outDir = stringOption(args, "out-dir") ?? config.build.outDir;
  const dryRun = Boolean(args.options["dry-run"]);
  const force = Boolean(args.options.force);
  const absoluteOutDir = resolve(root, outDir);
  const podoRoot = join(root, ".podo");
  const tokenSources = await loadBuildTokenSources(root);
  const tokenIssues = validateTokenBuild(tokenSources);
  if (tokenIssues.length) {
    throw new Error(`Token build failed:\n${tokenIssues.map((issue) => issue.message).join("\n")}`);
  }

  const merged = mergeTokenDocuments(tokenSources);
  const resolved = resolveTokenDocument(merged);
  const components = await loadBuildComponents(root);
  // Validate against the MERGED token tree, not the union of source paths: a
  // project token can shadow a package subtree, so a path present in some source
  // may not exist after merge/resolve (and thus not in tokens.css).
  const componentTokenPaths = collectTokenPaths(merged.tokens);
  const componentIssues = components.flatMap((component) =>
    validateComponentTokenBindings(component, componentTokenPaths)
  );
  if (componentIssues.length) {
    throw new Error(
      `Component build failed:\n${componentIssues.map((issue) => issue.message).join("\n")}`
    );
  }
  const pages = await loadBuildPages(root);
  const pageIssues = pages.flatMap((page) => validatePageComponents(page, components));
  if (pageIssues.length) {
    throw new Error(`Page build failed:\n${pageIssues.map((issue) => issue.message).join("\n")}`);
  }
  const iconManifest = await loadBuildIconManifest(root);
  const inlineIconManifest = Object.values(iconManifest.icons).every((icon) => icon.svg != null);
  const iconFontTypes: Array<"ttf" | "woff" | "woff2"> = inlineIconManifest
    ? ["ttf", "woff2"]
    : ["ttf", "woff", "woff2"];
  const webIconFontTypes = iconFontTypes.filter((type): type is "woff" | "woff2" => type !== "ttf");
  const generated = [
    {
      path: join(absoluteOutDir, "tokens.css"),
      contents: emitCssVariables(resolved, {
        themes: config.themes.available,
        colorSchemes: config.darkMode.enabled ? ["light", "dark"] : ["light"],
      }),
    },
    { path: join(absoluteOutDir, "tokens.ts"), contents: emitTypeScriptTokens(resolved) },
    {
      path: join(absoluteOutDir, "tokens.native.ts"),
      contents: emitReactNativeTokens(resolved, "tokens", {
        themes: config.themes.available,
        colorSchemes: config.darkMode.enabled ? ["light", "dark"] : ["light"],
      }),
    },
    { path: join(absoluteOutDir, "tokens.json"), contents: emitTokenJsonBundle(resolved) },
    {
      path: join(absoluteOutDir, "icons/PodoIcons.css"),
      contents: emitIconCss(iconManifest, { fontTypes: webIconFontTypes }),
    },
    {
      path: join(absoluteOutDir, "icons/PodoIcons.icons.ts"),
      contents: emitIconTypes(Object.keys(iconManifest.icons).sort()),
    },
    {
      path: join(absoluteOutDir, "icons/PodoIcons.native.ts"),
      contents: emitNativeGlyphMap(iconManifest),
    },
    ...generateComponentFiles({
      specs: components,
      targets,
      outDir: join(outDir, "components"),
    }).map((file) => ({ path: resolve(root, file.path), contents: file.contents })),
    // Always emit pages.json (empty array when there are no pages) so deleting
    // all pages reflects in the build output rather than leaving a stale bundle.
    { path: join(absoluteOutDir, "pages.json"), contents: `${JSON.stringify(pages, null, 2)}\n` },
    // Spec-driven component token CSS: variant/state token edits reflect here.
    { path: join(absoluteOutDir, "components.css"), contents: emitComponentTokenCss(components) },
  ];
  generated.push({
    path: resolve(root, join(outDir, "components/index.ts")),
    contents: generateIndexFile(
      generated
        .filter((file) => file.path.includes(`${outDir}/components/`))
        .map((file) => ({ path: relativePath(root, file.path), contents: file.contents })),
      join(outDir, "components")
    ).contents,
  });

  const buildHash = hashJson({
    config,
    targets,
    iconInput: await readIconInputHash(root, iconManifest),
    generated: generated.map((file) => file.contents),
  });
  const cachePath = join(podoRoot, "cache/build.json");
  const cached = await readJson<{ hash?: string }>(cachePath);
  const plan: BuildPlan = {
    dryRun,
    skipped: !force && cached?.hash === buildHash,
    hash: buildHash,
    files: await Promise.all(
      [
        ...generated.map((file) => ({ path: file.path, preview: file.contents.slice(0, 4000) })),
        ...iconFontTypes.map((type) => ({
          path: join(absoluteOutDir, `icons/PodoIcons.${type}`),
        })),
        { path: join(absoluteOutDir, "icons/PodoIcons.metadata.json") },
      ].map(async (file) => ({
        path: relativePath(root, file.path),
        action: (await exists(file.path)) ? "update" : "create",
        ...("preview" in file && typeof file.preview === "string" ? { preview: file.preview } : {}),
      }))
    ),
  };

  if (plan.skipped) {
    io.stdout.log(formatInfo("build", "Skipped because input hash did not change."));
    return plan;
  }

  if (dryRun) {
    io.stdout.log(formatInfo("build", `Dry run planned ${plan.files.length} files.`));
    for (const file of plan.files) {
      io.stdout.log(`[podo:plan] ${file.action} ${file.path}`);
    }
    return plan;
  }

  const updates = plan.files.filter((file) => file.action === "update");
  if (updates.length && !force) {
    throw new Error(
      `Build would update ${updates.length} existing file${
        updates.length === 1 ? "" : "s"
      }. Run \`podo build --dry-run\` and rerun with \`--force\` after reviewing the file plan.`
    );
  }

  await mkdir(absoluteOutDir, { recursive: true });
  for (const file of generated) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.contents);
  }
  const iconSvgRoot = await resolveIconSvgRoot(root, iconManifest);
  await buildIconAssets({
    manifest: iconManifest,
    svgRoot: iconSvgRoot,
    outDir: join(absoluteOutDir, "icons"),
    fontTypes: iconFontTypes,
  });
  await writeJson(cachePath, { hash: buildHash, files: plan.files }, true);
  await writeJson(
    join(podoRoot, "lock.json"),
    {
      schemaVersion: PODO_SCHEMA_VERSION,
      packageVersion: await cliPackageVersion(),
      migrations: [],
      generatedHash: buildHash,
    } satisfies PodoLock,
    true
  );
  io.stdout.log(formatInfo("build", `Generated ${plan.files.length} files in ${outDir}.`));
  return plan;
}

export async function validateProject(args: ParsedArgs, io: CliIO): Promise<ValidationReport> {
  const root = await findProjectRoot(io.cwd);
  const issues: ValidationIssue[] = [];
  const podoRoot = join(root, ".podo");
  await validateJsonFile(join(podoRoot, "config.json"), "podo.config", parsePodoConfig, issues);
  const rawLock = await readJson<Record<string, unknown>>(join(podoRoot, "lock.json"));
  if (rawLock?.schemaVersion && rawLock.schemaVersion !== PODO_SCHEMA_VERSION) {
    issues.push({
      code: "podo.lock.schemaMismatch",
      path: ".podo/lock.json",
      message: `Lock schema ${String(rawLock.schemaVersion)} does not match ${PODO_SCHEMA_VERSION}. Run podo migrate.`,
    });
  } else {
    await validateJsonFile(join(podoRoot, "lock.json"), "podo.lock", parsePodoLock, issues);
  }

  const tokenSources = await loadBuildTokenSources(root);
  issues.push(...validateTokenBuild(tokenSources));

  const components = await loadBuildComponents(root);
  // Validate against the merged token tree so shadowed package paths are not
  // counted as available (consistent with buildProject + the emitted tokens).
  const tokenPaths = collectTokenPaths(mergeTokenDocuments(tokenSources).tokens);
  for (const component of components) {
    issues.push(...validateComponentTokenBindings(component, tokenPaths));
  }

  try {
    const pages = await loadBuildPages(root);
    for (const page of pages) {
      issues.push(...validatePageComponents(page, components));
    }
  } catch (error) {
    issues.push({
      code: "podo.page.invalid",
      path: ".podo/pages",
      message: error instanceof Error ? error.message : "A page document is invalid.",
    });
  }

  const manifest = await loadBuildIconManifest(root);
  issues.push(...validateIconManifest(manifest));

  const report = { ok: issues.length === 0, root, issues };
  const reportPath = stringOption(args, "report");
  if (reportPath) {
    await mkdir(dirname(resolve(root, reportPath)), { recursive: true });
    await writeFile(resolve(root, reportPath), `${JSON.stringify(report, null, 2)}\n`);
  }
  if (report.ok) {
    io.stdout.log(formatInfo("validate", "No validation issues found."));
  }
  return report;
}

export async function startMcp(args: ParsedArgs, io: CliIO): Promise<void> {
  const requestedRoot = stringOption(args, "root");
  if (args.options.root !== undefined && !requestedRoot?.trim()) {
    throw new Error("--root requires a project directory.");
  }
  const root = requestedRoot ? resolve(io.cwd, requestedRoot) : await findMcpProjectRoot(io.cwd);
  if (!(await stat(root)).isDirectory()) {
    throw new Error("--root must point to a directory.");
  }
  if (args.options["dry-run"]) {
    io.stdout.log(formatInfo("mcp", `Would start Podo MCP stdio server for ${root}.`));
    return;
  }
  await startMcpServer({ root });
}

export async function updateProject(args: ParsedArgs, io: CliIO): Promise<MigrationPlan> {
  const root = await findProjectRoot(io.cwd);
  const plan = await createProjectMigrationPlan(root, args, true);
  logMigrationPlan("update", plan, io);
  const reportPath = stringOption(args, "report");
  if (reportPath) {
    await writeMigrationReport(root, reportPath, plan);
  }
  io.stdout.log(formatInfo("update", "Dry-run only. Run `podo migrate` to apply changes."));
  return plan;
}

export async function migrateProject(args: ParsedArgs, io: CliIO): Promise<MigrationPlan> {
  const root = await findProjectRoot(io.cwd);
  const dryRun = Boolean(args.options["dry-run"]);
  const plan = await createProjectMigrationPlan(root, args, dryRun);
  logMigrationPlan("migrate", plan, io);
  const reportPath = stringOption(args, "report");
  if (reportPath) {
    await writeMigrationReport(root, reportPath, plan);
  }
  const blocking = plan.conflicts.filter((conflict) => conflict.severity === "blocking");
  if (blocking.length) {
    throw new Error(
      `Migration has ${blocking.length} blocking conflict${blocking.length === 1 ? "" : "s"}.`
    );
  }
  if (dryRun) {
    return plan;
  }

  for (const file of plan.files.filter((item) => item.action === "update")) {
    const filePath = resolvePodoFilePath(root, file.path);
    await writeFile(filePath, `${JSON.stringify(file.after, null, 2)}\n`);
  }

  const lockPath = resolvePodoFilePath(root, ".podo/lock.json");
  const lock = await readJson<PodoLock>(lockPath);
  if (!lock) {
    throw new Error(".podo/lock.json was not found. Run `podo init` first.");
  }
  const migratedLock = updateLockAfterMigration({
    lock,
    manifest: plan.manifest,
    generatedHash: hashMigrationJson({
      manifest: plan.manifest,
      files: plan.files.map((file) => ({ path: file.path, afterHash: file.afterHash })),
    }),
  });
  await writeFile(lockPath, `${JSON.stringify(migratedLock, null, 2)}\n`);
  io.stdout.log(
    formatInfo("migrate", `Applied migration ${plan.manifest.from} -> ${plan.manifest.to}.`)
  );
  return plan;
}

async function createProjectMigrationPlan(
  root: string,
  args: ParsedArgs,
  dryRun: boolean
): Promise<MigrationPlan> {
  const lockPath = resolvePodoFilePath(root, ".podo/lock.json");
  const lock = await readJson<PodoLock>(lockPath);
  if (!lock) {
    throw new Error(".podo/lock.json was not found. Run `podo init` first.");
  }

  const manifest = await loadProjectMigrationManifest(root, args, lock);
  const files = await loadProjectMigrationFiles(root);
  const issues = files.flatMap(validateMigrationFile);
  if (issues.length) {
    throw new Error(
      `Migration input validation failed:\n${issues
        .map((issue) => `${issue.path}: ${issue.message}`)
        .join("\n")}`
    );
  }
  return runMigrationPlan({ manifest, files, dryRun });
}

async function loadProjectMigrationManifest(
  root: string,
  args: ParsedArgs,
  lock: PodoLock
): Promise<MigrationManifest> {
  const manifestPath = stringOption(args, "manifest") ?? args.positionals[0];
  if (manifestPath) {
    const manifest = await readJson<unknown>(resolve(root, manifestPath));
    if (!manifest) {
      throw new Error(`Migration manifest was not found at ${manifestPath}.`);
    }
    return parseMigrationManifest(manifest);
  }

  const targetVersion = stringOption(args, "to") ?? lock.packageVersion;
  return createDefaultMigrationManifest({
    from: lock.packageVersion,
    to: targetVersion,
    packageVersion: targetVersion,
  });
}

async function loadProjectMigrationFiles(root: string): Promise<MigrationFile[]> {
  const files: MigrationFile[] = [];
  for (const relative of [".podo/config.json", ".podo/lock.json", ".podo/icons/manifest.json"]) {
    const document = await readJson<unknown>(resolvePodoFilePath(root, relative));
    if (document !== undefined) {
      files.push({ path: relative, document });
    }
  }

  files.push(
    ...(await readProjectJsonFiles(root, ".podo/tokens")),
    ...(await readProjectJsonFiles(root, ".podo/themes")),
    ...(await readProjectJsonFiles(root, ".podo/components"))
  );
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

async function readProjectJsonFiles(
  root: string,
  relativeDirectory: string
): Promise<MigrationFile[]> {
  const directory = resolvePodoFilePath(root, relativeDirectory);
  const entries = await readdir(directory, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return [] as Dirent[];
      }
      throw error;
    }
  );
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = join(directory, entry.name);
      const relative = relativePath(root, absolute);
      if (entry.isDirectory()) {
        return readProjectJsonFiles(root, relative);
      }
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        return [] as MigrationFile[];
      }
      return [{ path: relative, document: JSON.parse(await readFile(absolute, "utf8")) }];
    })
  );
  return nested.flat();
}

async function writeMigrationReport(
  root: string,
  reportPath: string,
  plan: MigrationPlan
): Promise<void> {
  const filePath = resolvePodoFilePath(root, reportPath);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(plan, null, 2)}\n`);
}

function logMigrationPlan(scope: "update" | "migrate", plan: MigrationPlan, io: CliIO): void {
  const changed = plan.files.filter((file) => file.action === "update");
  const blocking = plan.conflicts.filter((conflict) => conflict.severity === "blocking");
  io.stdout.log(
    formatInfo(
      scope,
      `${plan.dryRun ? "Dry run planned" : "Planned"} ${changed.length} file update${
        changed.length === 1 ? "" : "s"
      } for ${plan.manifest.from} -> ${plan.manifest.to}.`
    )
  );
  for (const file of changed) {
    io.stdout.log(`[podo:plan] update ${file.path} (${file.operations.length} patches)`);
  }
  for (const conflict of plan.conflicts) {
    const log = conflict.severity === "blocking" ? io.stderr.error : io.stdout.log;
    log(
      `[podo:conflict] ${conflict.severity} ${conflict.code} ${conflict.path} - ${conflict.message}`
    );
  }
  if (blocking.length) {
    io.stderr.error("[podo:next] Resolve blocking conflicts before running `podo migrate`.");
  }
}

export function resolvePodoFilePath(root: string, unsafePath: string): string {
  const normalized = unsafePath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (normalized !== ".podo" && !normalized.startsWith(".podo/")) {
    throw new Error(`Podo migration writes are limited to .podo paths. Received ${unsafePath}.`);
  }
  const podoRoot = resolve(root, ".podo");
  const absolute = resolve(root, normalized);
  if (absolute !== podoRoot && !absolute.startsWith(`${podoRoot}${sep}`)) {
    throw new Error(`Path escapes .podo: ${unsafePath}.`);
  }
  return absolute;
}

export function detectFramework(packageJson: Record<string, unknown>): InitOptions["target"] {
  const dependencies = {
    ...(isRecord(packageJson.dependencies) ? packageJson.dependencies : {}),
    ...(isRecord(packageJson.devDependencies) ? packageJson.devDependencies : {}),
  };
  if ("react-native" in dependencies || "expo" in dependencies) {
    return "native";
  }
  if ("hono" in dependencies) {
    return "hono";
  }
  if ("react" in dependencies) {
    return "react";
  }
  return "web";
}

async function resolveInitOptions(args: ParsedArgs, root: string, io: CliIO): Promise<InitOptions> {
  const packageJson = (await readJson<Record<string, unknown>>(join(root, "package.json"))) ?? {};
  const detected = detectFramework(packageJson);
  const target = toTarget(stringOption(args, "target") ?? detected);
  const base: InitOptions = {
    target,
    environment: target === "native" ? "react-native" : target,
    theme: stringOption(args, "theme") ?? "dashboard",
    darkMode: parseBooleanOption(args.options["dark-mode"], true),
    outDir: stringOption(args, "out-dir") ?? "src/podo",
    force: Boolean(args.options.force),
  };

  if (args.options.yes || args.options.target || !io.stdin?.isTTY) {
    return base;
  }

  const rl = createInterface({ input: io.stdin, output: nodeStdout });
  try {
    const targetAnswer = await rl.question(`Target (${base.target}): `);
    const themeAnswer = await rl.question(`Theme (${base.theme}): `);
    const darkAnswer = await rl.question(`Dark mode (${base.darkMode ? "yes" : "no"}): `);
    const outDirAnswer = await rl.question(`Out dir (${base.outDir}): `);
    const interactiveTarget = toTarget(targetAnswer.trim() || base.target);
    return {
      target: interactiveTarget,
      environment: interactiveTarget === "native" ? "react-native" : interactiveTarget,
      theme: themeAnswer.trim() || base.theme,
      darkMode: parseBooleanOption(darkAnswer.trim() || undefined, base.darkMode),
      outDir: outDirAnswer.trim() || base.outDir,
      force: base.force,
    };
  } finally {
    rl.close();
  }
}

export async function loadBuildTokenSources(root: string): Promise<TokenSource[]> {
  const projectTokensDir = join(root, ".podo/tokens");
  const projectThemesDir = join(root, ".podo/themes");
  const sources: TokenSource[] = [
    {
      document: parseTokenDocument(defaultTokenDocument),
      filePath: "podo:default-tokens",
      tier: "package",
    },
  ];
  const projectTokens = await loadTokenDocuments({
    packageTokensDir: "__podo_missing_package_tokens__",
    projectTokensDir,
  });
  const projectThemes = await loadTokenDocuments({
    packageTokensDir: "__podo_missing_package_tokens__",
    projectTokensDir: projectThemesDir,
  });
  sources.push(
    ...[...projectTokens, ...projectThemes]
      .filter((source) => source.tier === "project")
      .map((source) => ({ ...source, filePath: relativePath(root, source.filePath) }))
  );
  return sources;
}

async function loadBuildComponents(root: string): Promise<ComponentDocument[]> {
  const localComponents = await readJsonFiles(join(root, ".podo/components"));
  const components = new Map<string, ComponentDocument>();
  for (const document of defaultComponentDocuments) {
    const component = parseComponentDocument(document);
    components.set(component.id, component);
  }
  for (const document of localComponents) {
    const component = parseComponentDocument(document);
    components.set(component.id, component);
  }
  return [...components.values()];
}

async function loadBuildPages(root: string): Promise<PageDocument[]> {
  const records = await readJsonFiles(join(root, ".podo/pages"));
  const pages = new Map<string, PageDocument>();
  for (const record of records) {
    const page = parsePageDocument(record);
    pages.set(page.id, page);
  }
  return [...pages.values()].sort((a, b) => a.id.localeCompare(b.id));
}

async function loadBuildIconManifest(root: string): Promise<IconManifest> {
  const projectManifest = await readJson<unknown>(join(root, ".podo/icons/manifest.json"));
  return parseIconManifest(projectManifest ?? defaultIconManifest);
}

async function resolveIconSvgRoot(root: string, manifest: IconManifest): Promise<string> {
  const projectSvgRoot = join(root, ".podo/icons/svg");
  if (await hasIconSources(projectSvgRoot, manifest)) {
    return projectSvgRoot;
  }

  return ensureDefaultIconSvgs(root);
}

async function ensureDefaultIconSvgs(root: string): Promise<string> {
  const svgRoot = join(root, ".podo/cache/default-icons/svg");
  for (const [file, contents] of Object.entries(defaultIconSvgs)) {
    const filePath = join(svgRoot, file);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, contents);
  }
  return svgRoot;
}

async function readIconInputHash(root: string, manifest: IconManifest): Promise<string> {
  const projectSvgRoot = join(root, ".podo/icons/svg");
  if (await hasIconSources(projectSvgRoot, manifest)) {
    const files = await Promise.all(
      Object.values(manifest.icons)
        .map((icon) => icon.source)
        .filter((source): source is string => source != null)
        .sort()
        .map(async (source) => [source, await readFile(join(projectSvgRoot, source), "utf8")])
    );
    return hashJson({ manifest, files });
  }

  return hashJson({ manifest, files: defaultIconSvgs });
}

async function hasIconSources(svgRoot: string, manifest: IconManifest): Promise<boolean> {
  // Inline (browser-edited) manifests carry their SVG in `svg`, not on disk; only
  // a fully file-path manifest can be hashed from project SVG files.
  const sources: string[] = [];
  for (const icon of Object.values(manifest.icons)) {
    if (icon.source == null) {
      return false;
    }
    sources.push(join(svgRoot, icon.source));
  }
  if (sources.length === 0) {
    return false;
  }
  return (await Promise.all(sources.map((source) => exists(source)))).every(Boolean);
}

async function writeBootstrapFiles(
  root: string,
  options: InitOptions,
  force: boolean
): Promise<void> {
  const base = join(root, ".podo/bootstrap");
  // Bootstrap files land in CONSUMER projects: import from the published
  // "podo-ui/<target>" subpaths, never the workspace-internal @podoui names
  // (consumers don't have them, and the podo-ui bundle assembler rewrites
  // @podoui import-shaped strings). Specifiers are built via JSON.stringify
  // to stay out of import-shaped positions in this file too.
  const runtime = (target: string) => JSON.stringify(`podo-ui/${target}`);
  const files: Record<string, string> = {
    "react.tsx": `import { PodoThemeProvider } from ${runtime("react")};\n\nexport const podoTheme = { theme: ${JSON.stringify(
      options.theme
    )}, colorScheme: "light" as const };\n\nexport { PodoThemeProvider };\n`,
    "hono.tsx": `import { renderCriticalCss } from ${runtime("hono")};\n\nexport function podoHead() {\n  return renderCriticalCss({ theme: ${JSON.stringify(
      options.theme
    )}, colorScheme: "light" });\n}\n`,
    "native.tsx": `import { PodoNativeThemeProvider } from ${runtime("native")};\n\nexport const podoNativeTheme = { theme: ${JSON.stringify(
      options.theme
    )}, colorScheme: "light" as const };\n\nexport { PodoNativeThemeProvider };\n`,
    "web.ts": `import { registerPodoElements } from ${runtime("web")};\n\nexport function registerPodo() {\n  registerPodoElements();\n}\n`,
  };
  for (const [file, contents] of Object.entries(files)) {
    await writeText(join(base, file), contents, force);
  }
}

async function validateJsonFile<T>(
  filePath: string,
  code: string,
  parser: (value: unknown) => T,
  issues: ValidationIssue[]
): Promise<void> {
  try {
    parser(JSON.parse(await readFile(filePath, "utf8")));
  } catch (error) {
    issues.push({
      code,
      path: filePath,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function logIssues(issues: ValidationIssue[], io: CliIO): void {
  for (const issue of issues) {
    io.stderr.error(`[podo:error] ${issue.code} ${issue.path} - ${issue.message}`);
  }
  io.stderr.error("[podo:next] Fix validation errors and rerun `podo validate`.");
}

function formatInfo(scope: string, message: string): string {
  return `[podo:${scope}] ${message}`;
}

function formatError(scope: string | undefined, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `[podo:error] ${scope ?? "cli"} - ${message}\n[podo:next] Run \`podo --help\` for available commands.`;
}

function helpText(): string {
  return [
    "podo <command> [options]",
    "",
    "Commands:",
    "  init       Create .podo config, lock, directories, and bootstrap files",
    "  build      Build tokens, icons, and component target files",
    "  validate   Validate .podo config, tokens, components, and icons",
    "  update     Plan package/schema migrations without writing files",
    "  migrate    Apply reviewed migrations to .podo specs and lockfile",
    "  import     Receive a Figma plugin export (or --file) and write .podo specs",
    "  mcp        Start the Podo MCP stdio server (--root <directory>, --dry-run)",
  ].join("\n");
}

function toTarget(value: string): CodegenTarget {
  if (value === "web" || value === "react" || value === "hono" || value === "native") {
    return value;
  }
  if (value === "react-native") {
    return "native";
  }
  throw new Error(`Unsupported target "${value}". Use web, react, hono, or native.`);
}

function stringOption(args: ParsedArgs, key: string): string | undefined {
  const value = args.options[key];
  return typeof value === "string" ? value : undefined;
}

function parseBooleanOption(value: string | boolean | undefined, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true" || value === "yes") {
    return true;
  }
  if (value === "false" || value === "no") {
    return false;
  }
  return fallback;
}

async function writeJson(filePath: string, value: unknown, force: boolean): Promise<void> {
  await writeText(filePath, `${JSON.stringify(value, null, 2)}\n`, force);
}

async function writeText(filePath: string, contents: string, force: boolean): Promise<void> {
  if (!force && (await exists(filePath))) {
    return;
  }
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, contents);
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function readJsonFiles(dir: string): Promise<unknown[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return [] as Dirent[];
      }
      throw error;
    }
  );
  // Sort entries so traversal order is deterministic regardless of the OS
  // readdir order; this makes id-based overrides (e.g. duplicate component ids
  // across .podo files) and the build output reproducible.
  const ordered = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  const files = await Promise.all(
    ordered.map(async (entry) => {
      const entryPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return readJsonFiles(entryPath);
      }
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        return [];
      }
      return [JSON.parse(await readFile(entryPath, "utf8"))];
    })
  );
  return files.flat();
}

let packageVersionCache: string | undefined;

/** The published @podoui/cli version — stamped into `.podo/lock.json`. */
async function cliPackageVersion(): Promise<string> {
  if (!packageVersionCache) {
    const pkg = JSON.parse(
      await readFile(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")
    ) as { version?: string };
    packageVersionCache = pkg.version ?? "0.0.0";
  }
  return packageVersionCache;
}

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    });
}

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function relativePath(root: string, filePath: string): string {
  return relative(resolve(root), resolve(filePath)).split(sep).join("/");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function defaultIo(): CliIO {
  return { cwd: process.cwd(), stdout: console, stderr: console, stdin: nodeStdin };
}

const defaultTokenDocument: TokenDocument = {
  schemaVersion: PODO_SCHEMA_VERSION,
  kind: "tokens",
  category: "theme",
  tokens: {
    color: {
      brand: { $type: "color", $value: "#426CED" },
      text: { $type: "color", $value: "#18181B" },
      inverse: { $type: "color", $value: "#FFFFFF" },
      danger: { $type: "color", $value: "#F23B3B" },
      // Badge 기본 컴포넌트 문서의 토큰 바인딩이 참조하는 팔레트 —
      // 값은 Figma 팔레트(packages/spec/samples/tokens/color.tokens.json)와
      // podo-ui styles.css의 폴백 hex를 그대로 미러한다.
      palette: {
        gray: {
          "5": { $type: "color", $value: "#F9F9F9" },
          "10": { $type: "color", $value: "#F4F4F5" },
          "70": { $type: "color", $value: "#3E424B" },
          "90": { $type: "color", $value: "#18181B" },
        },
        error: {
          "5": { $type: "color", $value: "#FEF1F1" },
          "50": { $type: "color", $value: "#F23B3B" },
        },
        success: {
          "5": { $type: "color", $value: "#ECF8EF" },
          "50": { $type: "color", $value: "#3EA856" },
        },
        warning: {
          "5": { $type: "color", $value: "#FFF7E6" },
          "50": { $type: "color", $value: "#FFAA00" },
        },
        info: {
          "5": { $type: "color", $value: "#EBF5FF" },
          "50": { $type: "color", $value: "#0095FF" },
        },
        purple: {
          "5": { $type: "color", $value: "#F8F5FF" },
          "50": { $type: "color", $value: "#8E51FF" },
        },
        orange: {
          "5": { $type: "color", $value: "#FFF4F0" },
          "50": { $type: "color", $value: "#FF6A33" },
        },
        accent: {
          "50": { $type: "color", $value: "#F15764" },
        },
      },
    },
    // ===== Figma theme 컬렉션 (Variables Documentation - theme, 16244:181609) =====
    // podo-ui styles.css가 소비하는 --podo-<group>-<name> 변수의 원천.
    // light/dark 두 모드 값을 원본 문서 표에서 그대로 이식 (2026-07-22,
    // 알파 값은 #RRGGBBAA로 표기). 이름의 'gary' 오타는 Figma 원본 그대로다.
    border: {
      danger: {
        light: { $type: "color", $value: "#F23B3B" },
        dark: { $type: "color", $value: "#F56666" },
      },
      disabled: {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      gary: {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "gray-darker": {
        light: { $type: "color", $value: "#9FA2AD" },
        dark: { $type: "color", $value: "#FFFFFF4C" },
      },
      "gray-deep": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
      info: {
        light: { $type: "color", $value: "#0095FF" },
        dark: { $type: "color", $value: "#56ACFF" },
      },
      natural: {
        light: { $type: "color", $value: "#9FA2AD" },
        dark: { $type: "color", $value: "#50555E" },
      },
      "natural-darker": {
        light: { $type: "color", $value: "#27272A" },
        dark: { $type: "color", $value: "#F9F9F9" },
      },
      "natural-deep": {
        light: { $type: "color", $value: "#767985" },
        dark: { $type: "color", $value: "#767985" },
      },
      primary: {
        light: { $type: "color", $value: "#426CED" },
        dark: { $type: "color", $value: "#577DEF" },
      },
      success: {
        light: { $type: "color", $value: "#3EA856" },
        dark: { $type: "color", $value: "#57C16F" },
      },
      warning: {
        light: { $type: "color", $value: "#FFAA00" },
        dark: { $type: "color", $value: "#FFBB33" },
      },
    },
    button: {
      "background-disabled": {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "background-outline-assistive": {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      "background-outline-assistive-hover": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "background-outline-assistive-pressed": {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
      "background-outline-danger": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#27272A" },
      },
      "background-outline-danger-hover": {
        light: { $type: "color", $value: "#FEF1F1" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      "background-outline-danger-pressed": {
        light: { $type: "color", $value: "#FFE0DF" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "background-outline-primary": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#27272A" },
      },
      "background-outline-primary-hover": {
        light: { $type: "color", $value: "#F1F4FD" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      "background-outline-primary-pressed": {
        light: { $type: "color", $value: "#D0DBFB" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "background-outline-white": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#3E424B" },
      },
      "background-outline-white-hover": {
        light: { $type: "color", $value: "#0000000D" },
        dark: { $type: "color", $value: "#50555E" },
      },
      "background-outline-white-pressed": {
        light: { $type: "color", $value: "#0000001A" },
        dark: { $type: "color", $value: "#767985" },
      },
      "background-solid-assistive": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "background-solid-assistive-hover": {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
      "background-solid-assistive-pressed": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#FFFFFF4C" },
      },
      "background-solid-danger": {
        light: { $type: "color", $value: "#F23B3B" },
        dark: { $type: "color", $value: "#F23B3B" },
      },
      "background-solid-danger-hover": {
        light: { $type: "color", $value: "#EE1818" },
        dark: { $type: "color", $value: "#F56666" },
      },
      "background-solid-danger-pressed": {
        light: { $type: "color", $value: "#CD0404" },
        dark: { $type: "color", $value: "#FF8985" },
      },
      "background-solid-primary": {
        light: { $type: "color", $value: "#426CED" },
        dark: { $type: "color", $value: "#426CED" },
      },
      "background-solid-primary-hover": {
        light: { $type: "color", $value: "#1245E2" },
        dark: { $type: "color", $value: "#577DEF" },
      },
      "background-solid-primary-pressed": {
        light: { $type: "color", $value: "#123BBA" },
        dark: { $type: "color", $value: "#819EF3" },
      },
      "background-solid-white": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#3E424B" },
      },
      "background-solid-white-hover": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#50555E" },
      },
      "background-solid-white-pressed": {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#767985" },
      },
      "border-assistive": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
      "border-danger": {
        light: { $type: "color", $value: "#F23B3B" },
        dark: { $type: "color", $value: "#F56666" },
      },
      "border-disabled": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "border-primary": {
        light: { $type: "color", $value: "#426CED" },
        dark: { $type: "color", $value: "#577DEF" },
      },
      "border-white": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
    },
    elevation: {
      basic: {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#18181B" },
      },
      "basic-reverse": {
        light: { $type: "color", $value: "#18181B" },
        dark: { $type: "color", $value: "#FFFFFF" },
      },
      dim: {
        light: { $type: "color", $value: "#00000080" },
        dark: { $type: "color", $value: "#00000080" },
      },
      gray: {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#27272A" },
      },
      nesting: {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      outline: {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      static: {
        light: { $type: "color", $value: "#27272A" },
        dark: { $type: "color", $value: "#27272A" },
      },
      "static-invert": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#FFFFFF" },
      },
    },
    foreground: {
      basic: {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      "basic-reverse": {
        light: { $type: "color", $value: "#3E424B" },
        dark: { $type: "color", $value: "#E4E4E7" },
      },
      danger: {
        light: { $type: "color", $value: "#F23B3B" },
        dark: { $type: "color", $value: "#F56666" },
      },
      "danger-light": {
        light: { $type: "color", $value: "#FEF1F1" },
        dark: { $type: "color", $value: "#FFADAD" },
      },
      disabled: {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "disabled-dark": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#00000033" },
      },
      gray: {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      "gray-dark": {
        light: { $type: "color", $value: "#D1D2D6" },
        dark: { $type: "color", $value: "#50555E" },
      },
      "gray-light": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "gray-lightdeep": {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
      info: {
        light: { $type: "color", $value: "#0095FF" },
        dark: { $type: "color", $value: "#56ACFF" },
      },
      "info-light": {
        light: { $type: "color", $value: "#EBF5FF" },
        dark: { $type: "color", $value: "#8FC8FF" },
      },
      mono: {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#000000" },
      },
      "mono-reverse": {
        light: { $type: "color", $value: "#000000" },
        dark: { $type: "color", $value: "#FFFFFF" },
      },
      natural: {
        light: { $type: "color", $value: "#3E424B" },
        dark: { $type: "color", $value: "#767985" },
      },
      "natural-light": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#50555E" },
      },
      "natural-lightdeep": {
        light: { $type: "color", $value: "#767985" },
        dark: { $type: "color", $value: "#9FA2AD" },
      },
      point: {
        light: { $type: "color", $value: "#F15764" },
        dark: { $type: "color", $value: "#F66F7A" },
      },
      primary: {
        light: { $type: "color", $value: "#426CED" },
        dark: { $type: "color", $value: "#577DEF" },
      },
      "primary-light": {
        light: { $type: "color", $value: "#F1F4FD" },
        dark: { $type: "color", $value: "#ABBEF7" },
      },
      static: {
        light: { $type: "color", $value: "#18181B" },
        dark: { $type: "color", $value: "#18181B" },
      },
      "static-invert": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#FFFFFF" },
      },
      success: {
        light: { $type: "color", $value: "#3EA856" },
        dark: { $type: "color", $value: "#57C16F" },
      },
      "success-light": {
        light: { $type: "color", $value: "#ECF8EF" },
        dark: { $type: "color", $value: "#A9DEB4" },
      },
      warning: {
        light: { $type: "color", $value: "#FFAA00" },
        dark: { $type: "color", $value: "#FFBB33" },
      },
      "warning-light": {
        light: { $type: "color", $value: "#FFF7E6" },
        dark: { $type: "color", $value: "#FFD88A" },
      },
    },
    icon: {
      basic: {
        light: { $type: "color", $value: "#27272A" },
        dark: { $type: "color", $value: "#F9F9F9" },
      },
      "basic-reverse": {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#27272A" },
      },
      danger: {
        light: { $type: "color", $value: "#F23B3B" },
        dark: { $type: "color", $value: "#F56666" },
      },
      disabled: {
        light: { $type: "color", $value: "#9FA2AD" },
        dark: { $type: "color", $value: "#FFFFFF4C" },
      },
      "icon-hover": {
        light: { $type: "color", $value: "#4A78B5" },
        dark: { $type: "color", $value: "#76A0D8" },
      },
      "icon-pressed": {
        light: { $type: "color", $value: "#34547E" },
        dark: { $type: "color", $value: "#A0C2EE" },
      },
      info: {
        light: { $type: "color", $value: "#0095FF" },
        dark: { $type: "color", $value: "#56ACFF" },
      },
      point: {
        light: { $type: "color", $value: "#F15764" },
        dark: { $type: "color", $value: "#F66F7A" },
      },
      primary: {
        light: { $type: "color", $value: "#426CED" },
        dark: { $type: "color", $value: "#577DEF" },
      },
      static: {
        light: { $type: "color", $value: "#27272A" },
        dark: { $type: "color", $value: "#27272A" },
      },
      "static-invert": {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#F9F9F9" },
      },
      subtil: {
        light: { $type: "color", $value: "#767985" },
        dark: { $type: "color", $value: "#9FA2AD" },
      },
      success: {
        light: { $type: "color", $value: "#3EA856" },
        dark: { $type: "color", $value: "#57C16F" },
      },
      warning: {
        light: { $type: "color", $value: "#FFAA00" },
        dark: { $type: "color", $value: "#FFBB33" },
      },
    },
    table: {
      "table-bg": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#27272A" },
      },
      "table-outline": {
        light: { $type: "color", $value: "#E4E4E7" },
        dark: { $type: "color", $value: "#3E424B" },
      },
      "table-th": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#18181B" },
      },
      "table-tr-disabled": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
      "table-tr-focused": {
        light: { $type: "color", $value: "#F4F4F5" },
        dark: { $type: "color", $value: "#FFFFFF1A" },
      },
      "table-tr-hover": {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#FFFFFF0D" },
      },
    },
    text: {
      basic: {
        light: { $type: "color", $value: "#18181B" },
        dark: { $type: "color", $value: "#F9F9F9" },
      },
      "basic-reverse": {
        light: { $type: "color", $value: "#F9F9F9" },
        dark: { $type: "color", $value: "#18181B" },
      },
      danger: {
        light: { $type: "color", $value: "#F23B3B" },
        dark: { $type: "color", $value: "#F56666" },
      },
      disabled: {
        light: { $type: "color", $value: "#9FA2AD" },
        dark: { $type: "color", $value: "#FFFFFF33" },
      },
      info: {
        light: { $type: "color", $value: "#0095FF" },
        dark: { $type: "color", $value: "#56ACFF" },
      },
      placeholder: {
        light: { $type: "color", $value: "#9FA2AD" },
        dark: { $type: "color", $value: "#FFFFFF66" },
      },
      point: {
        light: { $type: "color", $value: "#F15764" },
        dark: { $type: "color", $value: "#F66F7A" },
      },
      primary: {
        light: { $type: "color", $value: "#426CED" },
        dark: { $type: "color", $value: "#577DEF" },
      },
      static: {
        light: { $type: "color", $value: "#18181B" },
        dark: { $type: "color", $value: "#18181B" },
      },
      "static-invert": {
        light: { $type: "color", $value: "#FFFFFF" },
        dark: { $type: "color", $value: "#FFFFFF" },
      },
      subtil: {
        light: { $type: "color", $value: "#50555E" },
        dark: { $type: "color", $value: "#9FA2AD" },
      },
      "subtil-reverse": {
        light: { $type: "color", $value: "#9FA2AD" },
        dark: { $type: "color", $value: "#50555E" },
      },
      success: {
        light: { $type: "color", $value: "#3EA856" },
        dark: { $type: "color", $value: "#57C16F" },
      },
      "text-hover": {
        light: { $type: "color", $value: "#4A78B5" },
        dark: { $type: "color", $value: "#76A0D8" },
      },
      "text-pressed": {
        light: { $type: "color", $value: "#34547E" },
        dark: { $type: "color", $value: "#A0C2EE" },
      },
      warning: {
        light: { $type: "color", $value: "#FFAA00" },
        dark: { $type: "color", $value: "#FFBB33" },
      },
    },
    semantic: {
      color: {
        text: {
          default: { $type: "color", $value: "{color.text}" },
          inverse: { $type: "color", $value: "{color.inverse}" },
          danger: { $type: "color", $value: "{color.danger}" },
        },
      },
    },
    component: {
      button: {
        background: { $type: "color", $value: "{color.brand}" },
        text: { $type: "color", $value: "{color.inverse}" },
      },
      input: {
        background: { $type: "color", $value: "{color.inverse}" },
        border: { $type: "color", $value: "{color.text}" },
      },
    },
    spacing: {
      scale: {
        "1": { $type: "spacing", $value: "4px" },
        "2": { $type: "spacing", $value: "8px" },
      },
      component: {
        "field-gap": { $type: "spacing", $value: "{spacing.scale.2}" },
      },
    },
    radius: {
      control: {
        md: { $type: "radius", $value: "8px" },
      },
    },
    typography: {
      h1: {
        landing: {
          $type: "typography",
          $value: {
            fontFamily: "Pretendard",
            fontSize: "64px",
            lineHeight: "72px",
            fontWeight: 700,
            letterSpacing: "0px",
          },
        },
        dashboard: {
          $type: "typography",
          $value: {
            fontFamily: "Pretendard",
            fontSize: "28px",
            lineHeight: "36px",
            fontWeight: 600,
            letterSpacing: "0px",
          },
        },
      },
      // podo-ui styles.css의 .podo-text--h1/.podo-text--body가 소비하는 변수
      // (--podo-typography-heading-xlarge-* / --podo-typography-body-medium-*).
      // 값은 Figma 타입 스케일(538:6695)을 미러하는
      // packages/spec/samples/tokens/typography.tokens.json과 동일해야 한다.
      heading: {
        xlarge: {
          $type: "typography",
          $value: {
            fontFamily: "Pretendard",
            fontSize: { pc: "32px", tablet: "28px", mobile: "24px" },
            lineHeight: "120%",
            fontWeight: 700,
            letterSpacing: "0px",
          },
        },
      },
      body: {
        medium: {
          $type: "typography",
          $value: {
            fontFamily: "Pretendard",
            fontSize: { pc: "16px", tablet: "16px", mobile: "14px" },
            lineHeight: "160%",
            fontWeight: 400,
            letterSpacing: "0px",
          },
        },
      },
    },
  },
};

const defaultComponentDocuments: unknown[] = [
  // Badge — styles.css가 소비하는 --podo-badge-* 바인딩 변수를 기본 빌드가
  // 발행하도록 스펙 샘플 badge.component.json을 그대로 내장한다.
  {
    schemaVersion: "2.0.0",
    kind: "component",
    id: "badge",
    name: "Badge",
    category: "atom",
    status: "experimental",
    description:
      "Count/status pill attached next to icons, menus, and list items (Figma 474:3218). System-state themes (natural — base, danger, success, warning, info) use a strong fill with light text for alerts the user must notice; color-label themes (gray, red, green, yellow, blue, purple, orange) use a soft fill with matching text to tag categories without competing with content. dot collapses the badge to a 6px presence dot (color themes only in the spec). Layout: min-width 22, 0/6 padding, 14px/1.6 text, fully rounded.",
    anatomy: [
      {
        name: "root",
      },
      {
        name: "label",
        parent: "root",
      },
      {
        name: "dot",
        parent: "root",
      },
    ],
    slots: [
      {
        name: "children",
        fallback: "99",
        description: "Count or short status text. Ignored when dot is set.",
      },
    ],
    props: [
      {
        name: "dot",
        type: {
          kind: "boolean",
        },
        default: false,
        description:
          "숫자·텍스트 없이 6px 점만 표시 (Figma dot). 정확한 값이 필요 없는 알림 유무·상태 표시용.",
      },
    ],
    variants: [
      {
        name: "theme",
        values: [
          "natural",
          "danger",
          "success",
          "warning",
          "info",
          "gray",
          "red",
          "green",
          "yellow",
          "blue",
          "purple",
          "orange",
        ],
        default: "natural",
        valueTokens: {
          natural: {
            "root.background": "{color.palette.gray.70}",
            "label.color": "{color.palette.gray.5}",
          },
          danger: {
            "root.background": "{color.palette.error.50}",
            "label.color": "{color.palette.gray.5}",
          },
          success: {
            "root.background": "{color.palette.success.50}",
            "label.color": "{color.palette.gray.5}",
          },
          warning: {
            "root.background": "{color.palette.warning.50}",
            "label.color": "{color.palette.gray.5}",
          },
          info: {
            "root.background": "{color.palette.info.50}",
            "label.color": "{color.palette.gray.5}",
          },
          gray: {
            "root.background": "{color.palette.gray.10}",
            "label.color": "{color.palette.gray.90}",
            "dot.color": "{color.palette.gray.70}",
          },
          red: {
            "root.background": "{color.palette.error.5}",
            "label.color": "{color.palette.error.50}",
            "dot.color": "{color.palette.accent.50}",
          },
          green: {
            "root.background": "{color.palette.success.5}",
            "label.color": "{color.palette.success.50}",
            "dot.color": "{color.palette.success.50}",
          },
          yellow: {
            "root.background": "{color.palette.warning.5}",
            "label.color": "{color.palette.warning.50}",
            "dot.color": "{color.palette.warning.50}",
          },
          blue: {
            "root.background": "{color.palette.info.5}",
            "label.color": "{color.palette.info.50}",
            "dot.color": "{color.palette.info.50}",
          },
          purple: {
            "root.background": "{color.palette.purple.5}",
            "label.color": "{color.palette.purple.50}",
            "dot.color": "{color.palette.purple.50}",
          },
          orange: {
            "root.background": "{color.palette.orange.5}",
            "label.color": "{color.palette.orange.50}",
            "dot.color": "{color.palette.orange.50}",
          },
        },
      },
    ],
    tokens: {
      "root.background": "{color.palette.gray.70}",
      "label.color": "{color.palette.gray.5}",
    },
    targets: {
      web: {
        supported: true,
        limitations: [],
      },
      react: {
        supported: true,
        limitations: [],
      },
      hono: {
        supported: true,
        limitations: [],
      },
      native: {
        supported: true,
        limitations: [],
      },
    },
    accessibility: {
      aria: ["aria-label (dot처럼 텍스트가 없을 때 의미를 이름으로 제공)"],
      keyboard: [],
      focusManagement: "Badge is a static display element and never receives focus.",
    },
    examples: [
      {
        target: "react",
        title: "Unread count on a menu item",
        code: '<Badge theme="danger">99</Badge>',
      },
      {
        target: "react",
        title: "Presence dot",
        code: '<Badge theme="green" dot aria-label="온라인" />',
      },
    ],
  },
  {
    schemaVersion: PODO_SCHEMA_VERSION,
    kind: "component",
    id: "button",
    name: "Button",
    category: "atom",
    status: "stable",
    anatomy: [{ name: "root" }, { name: "label" }],
    slots: [{ name: "children", required: true }],
    props: [{ name: "disabled", type: { kind: "boolean" }, default: false }],
    variants: [
      { name: "variant", values: ["solid", "soft", "outline", "ghost"], default: "solid" },
    ],
    states: [{ name: "disabled" }, { name: "loading" }],
    tokens: {
      "root.background": "{component.button.background}",
      "label.color": "{component.button.text}",
    },
    targets: supportedTargets(),
    accessibility: { role: "button", aria: ["aria-disabled"], keyboard: ["Enter", "Space"] },
  },
  {
    schemaVersion: PODO_SCHEMA_VERSION,
    kind: "component",
    id: "input",
    name: "Input",
    category: "atom",
    status: "stable",
    anatomy: [{ name: "root" }, { name: "control" }],
    slots: [],
    props: [{ name: "value", type: { kind: "string" } }],
    variants: [],
    states: [{ name: "disabled" }, { name: "invalid" }],
    tokens: {
      "root.background": "{component.input.background}",
      "root.borderColor": "{component.input.border}",
    },
    targets: supportedTargets(),
    accessibility: { aria: ["aria-invalid", "aria-required", "aria-describedby"] },
  },
  {
    schemaVersion: PODO_SCHEMA_VERSION,
    kind: "component",
    id: "field",
    name: "Field",
    category: "molecule",
    status: "stable",
    anatomy: [{ name: "root" }, { name: "label" }, { name: "control" }, { name: "error" }],
    slots: [
      { name: "label", required: true },
      { name: "control", required: true },
    ],
    props: [{ name: "invalid", type: { kind: "boolean" }, default: false }],
    variants: [],
    states: [{ name: "invalid" }],
    tokens: {
      "label.color": "{semantic.color.text.default}",
      "description.color": "{semantic.color.text.default}",
      "error.color": "{semantic.color.text.danger}",
    },
    targets: supportedTargets(),
    accessibility: { aria: ["aria-describedby", "aria-invalid", "aria-required"] },
  },
];

// chevron-right/calendar/time/refresh는 podo-ui/react DatePicker가, chevron-down/check/close는
// Select·Chip·Toast가 참조하는 글리프(podo-icon-*)라 기본 빌드에서 빠지면 소비 프로젝트에서 빈 아이콘이 된다.
export const defaultIconManifest: IconManifest = {
  schemaVersion: PODO_SCHEMA_VERSION,
  kind: "icons",
  fontFamily: "PodoIcons",
  icons: {
    menu: {
      codepoint: "E001",
      source: "navigation/menu.svg",
      tags: ["navigation"],
    },
    "chevron-left": {
      codepoint: "E002",
      source: "navigation/chevron-left.svg",
      tags: ["navigation"],
    },
    "chevron-right": {
      codepoint: "E003",
      source: "navigation/chevron-right.svg",
      tags: ["navigation"],
    },
    // Select 펼침 표시 — podo-ui/react·hono Select가 참조해요. 코드포인트는
    // 문서 프로젝트(Figma 원본 아이콘 세트)의 chevron-down과 같아요.
    "chevron-down": {
      codepoint: "E220",
      source: "navigation/chevron-down.svg",
      tags: ["navigation"],
    },
    calendar: {
      codepoint: "E004",
      source: "datetime/calendar.svg",
      tags: ["datetime"],
    },
    time: {
      codepoint: "E005",
      source: "datetime/time.svg",
      tags: ["datetime"],
    },
    refresh: {
      codepoint: "E006",
      source: "action/refresh.svg",
      tags: ["action"],
    },
    check: {
      codepoint: "E007",
      source: "action/check.svg",
      tags: ["action"],
    },
    close: {
      codepoint: "E008",
      source: "action/close.svg",
      tags: ["action"],
    },
    search: {
      codepoint: "E009",
      source: "action/search.svg",
      tags: ["action"],
    },
    undo: {
      codepoint: "E115",
      source: "editor/undo.svg",
      tags: ["editor"],
    },
    redo: {
      codepoint: "E116",
      source: "editor/redo.svg",
      tags: ["editor"],
    },
    bold: {
      codepoint: "E101",
      source: "editor/bold.svg",
      tags: ["editor"],
    },
    italic: {
      codepoint: "E102",
      source: "editor/italic.svg",
      tags: ["editor"],
    },
    underline: {
      codepoint: "E105",
      source: "editor/underline.svg",
      tags: ["editor"],
    },
    strikethrough: {
      codepoint: "E106",
      source: "editor/strikethrough.svg",
      tags: ["editor"],
    },
    "font-color": {
      codepoint: "E107",
      source: "editor/font-color.svg",
      tags: ["editor"],
    },
    highlight: {
      codepoint: "E108",
      source: "editor/highlight.svg",
      tags: ["editor"],
    },
    "align-left": {
      codepoint: "E109",
      source: "editor/align-left.svg",
      tags: ["editor"],
    },
    "align-center": {
      codepoint: "E10A",
      source: "editor/align-center.svg",
      tags: ["editor"],
    },
    "align-right": {
      codepoint: "E10B",
      source: "editor/align-right.svg",
      tags: ["editor"],
    },
    "list-ul": {
      codepoint: "E10C",
      source: "editor/list-ul.svg",
      tags: ["editor"],
    },
    "list-ol": {
      codepoint: "E10D",
      source: "editor/list-ol.svg",
      tags: ["editor"],
    },
    table: {
      codepoint: "E10E",
      source: "editor/table.svg",
      tags: ["editor"],
    },
    link: {
      codepoint: "E10F",
      source: "editor/link.svg",
      tags: ["editor"],
    },
    image: {
      codepoint: "E110",
      source: "editor/image.svg",
      tags: ["editor"],
    },
    youtube: {
      codepoint: "E111",
      source: "editor/youtube.svg",
      tags: ["editor"],
    },
    hr: {
      codepoint: "E112",
      source: "editor/hr.svg",
      tags: ["editor"],
    },
    eraser: {
      codepoint: "E113",
      source: "editor/eraser.svg",
      tags: ["editor"],
    },
    code: {
      codepoint: "E114",
      source: "editor/code.svg",
      tags: ["editor"],
    },
  },
  groups: {
    navigation: ["menu", "chevron-left", "chevron-right", "chevron-down"],
    datetime: ["calendar", "time"],
    action: ["refresh", "check", "close", "search"],
    editor: [
      "undo",
      "redo",
      "bold",
      "italic",
      "underline",
      "strikethrough",
      "font-color",
      "highlight",
      "align-left",
      "align-center",
      "align-right",
      "list-ul",
      "list-ol",
      "table",
      "link",
      "image",
      "youtube",
      "hr",
      "eraser",
      "code",
    ],
  },
  codepointLock: {
    menu: "E001",
    "chevron-left": "E002",
    "chevron-right": "E003",
    "chevron-down": "E220",
    calendar: "E004",
    time: "E005",
    refresh: "E006",
    check: "E007",
    close: "E008",
    search: "E009",
    undo: "E115",
    redo: "E116",
    bold: "E101",
    italic: "E102",
    underline: "E105",
    strikethrough: "E106",
    "font-color": "E107",
    highlight: "E108",
    "align-left": "E109",
    "align-center": "E10A",
    "align-right": "E10B",
    "list-ul": "E10C",
    "list-ol": "E10D",
    table: "E10E",
    link: "E10F",
    image: "E110",
    youtube: "E111",
    hr: "E112",
    eraser: "E113",
    code: "E114",
  },
};

// 문서 프로젝트(packages/docs/.podo/icons/manifest.json)와 이름이 같은 아이콘은 그 원본 SVG
// (figma/·compatibility/)와 같은 path를 써요 — 기본 빌드와 podoui.com 글리프가 같아야 해요.
export const defaultIconSvgs = {
  "editor/undo.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M125.7 160H176c17.7 0 32 14.3 32 32s-14.3 32-32 32H48c-17.7 0-32-14.3-32-32V64c0-17.7 14.3-32 32-32s32 14.3 32 32v51.2L97.6 97.6c87.5-87.5 229.3-87.5 316.8 0s87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3s-163.8-62.5-226.3 0L125.7 160z"/></svg>',
  "editor/redo.svg":
    '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="m386.3 160h-50.3c-17.7 0-32 14.3-32 32s14.3 32 32 32h128c17.7 0 32-14.3 32-32v-128c0-17.7-14.3-32-32-32s-32 14.3-32 32v51.2l-17.6-17.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8 229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3 163.8-62.5 226.3 0z"/></svg>',
  "editor/bold.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5.5 3.5C4.95 3.5 4.5 3.95 4.5 4.5 4.5 5.05 4.95 5.5 5.5 5.5L5.5 4.5 5.5 3.5ZM5.5 18.5C4.95 18.5 4.5 18.95 4.5 19.5 4.5 20.05 4.95 20.5 5.5 20.5L5.5 19.5 5.5 18.5ZM7.36 12L7.36 13 14.75 13 14.75 12 14.75 11 7.36 11 7.36 12ZM14.75 19.5L14.75 18.5 7.36 18.5 7.36 19.5 7.36 20.5 14.75 20.5 14.75 19.5ZM7.36 19.5L8.36 19.5 8.36 12 7.36 12 6.36 12 6.36 19.5 7.36 19.5ZM7.36 4.5L7.36 5.5 13.86 5.5 13.86 4.5 13.86 3.5 7.36 3.5 7.36 4.5ZM13.86 12L13.86 11 7.36 11 7.36 12 7.36 13 13.86 13 13.86 12ZM7.36 12L8.36 12 8.36 4.5 7.36 4.5 6.36 4.5 6.36 12 7.36 12ZM17.57 8.25L16.57 8.25C16.57 9.78 15.35 11 13.86 11L13.86 12 13.86 13C16.47 13 18.57 10.86 18.57 8.25L17.57 8.25ZM13.86 4.5L13.86 5.5C15.35 5.5 16.57 6.72 16.57 8.25L17.57 8.25 18.57 8.25C18.57 5.64 16.47 3.5 13.86 3.5L13.86 4.5ZM7.36 4.5L7.36 3.5 5.5 3.5 5.5 4.5 5.5 5.5 7.36 5.5 7.36 4.5ZM7.36 19.5L7.36 18.5 5.5 18.5 5.5 19.5 5.5 20.5 7.36 20.5 7.36 19.5ZM18.5 15.75L17.5 15.75C17.5 17.27 16.27 18.5 14.75 18.5L14.75 19.5 14.75 20.5C17.37 20.5 19.5 18.37 19.5 15.75L18.5 15.75ZM14.75 12L14.75 13C16.27 13 17.5 14.23 17.5 15.75L18.5 15.75 19.5 15.75C19.5 13.13 17.37 11 14.75 11L14.75 12Z"/></svg>',
  "editor/italic.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.56 4.21C15.68 3.9 15.52 3.55 15.21 3.44 14.9 3.32 14.55 3.48 14.44 3.79L15 4 15.56 4.21ZM8.44 19.79C8.32 20.1 8.48 20.45 8.79 20.56 9.1 20.68 9.45 20.52 9.56 20.21L9 20 8.44 19.79ZM12 3.4C11.67 3.4 11.4 3.67 11.4 4 11.4 4.33 11.67 4.6 12 4.6L12 4 12 3.4ZM18 4.6C18.33 4.6 18.6 4.33 18.6 4 18.6 3.67 18.33 3.4 18 3.4L18 4 18 4.6ZM6 19.4C5.67 19.4 5.4 19.67 5.4 20 5.4 20.33 5.67 20.6 6 20.6L6 20 6 19.4ZM12 20.6C12.33 20.6 12.6 20.33 12.6 20 12.6 19.67 12.33 19.4 12 19.4L12 20 12 20.6ZM15 4L14.44 3.79 8.44 19.79 9 20 9.56 20.21 15.56 4.21 15 4ZM12 4L12 4.6 18 4.6 18 4 18 3.4 12 3.4 12 4ZM6 20L6 20.6 12 20.6 12 20 12 19.4 6 19.4 6 20Z"/></svg>',
  "editor/underline.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.1 4C7.1 3.67 6.83 3.4 6.5 3.4 6.17 3.4 5.9 3.67 5.9 4L6.5 4 7.1 4ZM18.1 4C18.1 3.67 17.83 3.4 17.5 3.4 17.17 3.4 16.9 3.67 16.9 4L17.5 4 18.1 4ZM5 3.4C4.67 3.4 4.4 3.67 4.4 4 4.4 4.33 4.67 4.6 5 4.6L5 4 5 3.4ZM8 4.6C8.33 4.6 8.6 4.33 8.6 4 8.6 3.67 8.33 3.4 8 3.4L8 4 8 4.6ZM16 3.4C15.67 3.4 15.4 3.67 15.4 4 15.4 4.33 15.67 4.6 16 4.6L16 4 16 3.4ZM19 4.6C19.33 4.6 19.6 4.33 19.6 4 19.6 3.67 19.33 3.4 19 3.4L19 4 19 4.6ZM4 19.4C3.67 19.4 3.4 19.67 3.4 20 3.4 20.33 3.67 20.6 4 20.6L4 20 4 19.4ZM20 20.6C20.33 20.6 20.6 20.33 20.6 20 20.6 19.67 20.33 19.4 20 19.4L20 20 20 20.6ZM17.5 4L16.9 4 16.9 11.5 17.5 11.5 18.1 11.5 18.1 4 17.5 4ZM6.5 11.5L7.1 11.5 7.1 4 6.5 4 5.9 4 5.9 11.5 6.5 11.5ZM5 4L5 4.6 8 4.6 8 4 8 3.4 5 3.4 5 4ZM16 4L16 4.6 19 4.6 19 4 19 3.4 16 3.4 16 4ZM4 20L4 20.6 20 20.6 20 20 20 19.4 4 19.4 4 20ZM12 17L12 16.4C9.29 16.4 7.1 14.21 7.1 11.5L6.5 11.5 5.9 11.5C5.9 14.87 8.63 17.6 12 17.6L12 17ZM17.5 11.5L16.9 11.5C16.9 14.21 14.71 16.4 12 16.4L12 17 12 17.6C15.37 17.6 18.1 14.87 18.1 11.5L17.5 11.5Z"/></svg>',
  "editor/strikethrough.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 11.4C2.67 11.4 2.4 11.67 2.4 12 2.4 12.33 2.67 12.6 3 12.6L3 12 3 11.4ZM21 12.6C21.33 12.6 21.6 12.33 21.6 12 21.6 11.67 21.33 11.4 21 11.4L21 12 21 12.6ZM7.46 17.62C7.25 17.36 6.87 17.33 6.62 17.54 6.36 17.75 6.33 18.13 6.54 18.38L7 18 7.46 17.62ZM12.09 11.41C11.76 11.36 11.45 11.59 11.41 11.91 11.36 12.24 11.59 12.55 11.91 12.59L12 12 12.09 11.41ZM7 8L6.4 8 7 8ZM12.42 4L12.42 4.6 12.42 4.6 12.42 4ZM16.54 6.38C16.75 6.64 17.13 6.67 17.38 6.46 17.64 6.25 17.67 5.87 17.46 5.62L17 6 16.54 6.38ZM11.91 12.59C12.24 12.64 12.55 12.41 12.59 12.09 12.64 11.76 12.41 11.45 12.09 11.41L12 12 11.91 12.59ZM3 12L3 12.6 21 12.6 21 12 21 11.4 3 11.4 3 12ZM17 16L16.4 16C16.4 17.43 15.9 18.22 15.13 18.69 14.31 19.2 13.1 19.4 11.58 19.4L11.58 20 11.58 20.6C13.15 20.6 14.65 20.4 15.76 19.71 16.94 18.99 17.6 17.78 17.6 16L17 16ZM11.58 20L11.58 19.4C9.34 19.4 8.2 18.5 7.46 17.62L7 18 6.54 18.38C7.47 19.5 8.93 20.6 11.58 20.6L11.58 20ZM12 12L11.91 12.59C13.6 12.84 14.72 13.26 15.42 13.83 16.08 14.36 16.4 15.06 16.4 16L17 16 17.6 16C17.6 14.73 17.15 13.68 16.17 12.89 15.23 12.13 13.86 11.66 12.09 11.41L12 12ZM7 8L7.6 8C7.6 6.57 8.1 5.78 8.87 5.31 9.69 4.8 10.9 4.6 12.42 4.6L12.42 4 12.42 3.4C10.85 3.4 9.35 3.6 8.24 4.29 7.06 5.01 6.4 6.22 6.4 8L7 8ZM12.42 4L12.42 4.6C14.66 4.6 15.8 5.5 16.54 6.38L17 6 17.46 5.62C16.53 4.5 15.07 3.4 12.42 3.4L12.42 4ZM12 12L12.09 11.41C10.4 11.16 9.28 10.74 8.58 10.17 7.92 9.64 7.6 8.94 7.6 8L7 8 6.4 8C6.4 9.27 6.85 10.32 7.83 11.11 8.77 11.87 10.14 12.34 11.91 12.59L12 12Z"/></svg>',
  "editor/font-color.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M254 52.8C249.3 40.3 237.3 32 224 32s-25.3 8.3-30 20.8L57.8 416H32c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32h-1.8l18-48H303.8l18 48H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H390.2L254 52.8zM279.8 304H168.2L224 155.1 279.8 304z"/></svg>',
  "editor/highlight.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M315 315l158.4-215L444.1 70.6 229 229 315 315zm-187 5l0 0V248.3c0-15.3 7.2-29.6 19.5-38.6L420.6 8.4C428 2.9 437 0 446.2 0c11.4 0 22.4 4.5 30.5 12.6l54.8 54.8c8.1 8.1 12.6 19 12.6 30.5c0 9.2-2.9 18.2-8.4 25.6L334.4 396.5c-9 12.3-23.4 19.5-38.6 19.5H224l-25.4 25.4c-12.5 12.5-32.8 12.5-45.3 0l-50.7-50.7c-12.5-12.5-12.5-32.8 0-45.3L128 320zM7 466.3l63-63 70.6 70.6-31 31c-4.5 4.5-10.6 7-17 7H24c-13.3 0-24-10.7-24-24v-4.7c0-6.4 2.5-12.5 7-17z"/></svg>',
  "editor/align-left.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M288 64c0 17.7-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32H256c17.7 0 32 14.3 32 32zm0 256c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H256c17.7 0 32 14.3 32 32zM0 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>',
  "editor/align-center.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M352 64c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32H320c17.7 0 32-14.3 32-32zm96 128c0-17.7-14.3-32-32-32H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32zM0 448c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H32c-17.7 0-32 14.3-32 32zM352 320c0-17.7-14.3-32-32-32H128c-17.7 0-32 14.3-32 32s14.3 32 32 32H320c17.7 0 32-14.3 32-32z"/></svg>',
  "editor/align-right.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M448 64c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32zm0 256c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32zM0 192c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 448c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z"/></svg>',
  "editor/list-ul.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M64 144a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM64 464a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm48-208a48 48 0 1 0 -96 0 48 48 0 1 0 96 0z"/></svg>',
  "editor/list-ol.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M24 56c0-13.3 10.7-24 24-24H80c13.3 0 24 10.7 24 24V176h16c13.3 0 24 10.7 24 24s-10.7 24-24 24H40c-13.3 0-24-10.7-24-24s10.7-24 24-24H56V80H48C34.7 80 24 69.3 24 56zM86.7 341.2c-6.5-7.4-18.3-6.9-24 1.2L51.5 357.9c-7.7 10.8-22.7 13.3-33.5 5.6s-13.3-22.7-5.6-33.5l11.1-15.6c23.7-33.2 72.3-35.6 99.2-4.9c21.3 24.4 20.8 60.9-1.1 84.7L86.8 432H120c13.3 0 24 10.7 24 24s-10.7 24-24 24H32c-9.5 0-18.2-5.6-22-14.4s-2.1-18.9 4.3-25.9l72-78c5.3-5.8 5.4-14.6 .3-20.5zM224 64H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32zm0 160H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H224c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>',
  "editor/table.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5.5L4 6.1 20 6.1 20 5.5 20 4.9 4 4.9 4 5.5ZM21 6.5L20.4 6.5 20.4 8.5 21 8.5 21.6 8.5 21.6 6.5 21 6.5ZM21 8.5L21 7.9 3 7.9 3 8.5 3 9.1 21 9.1 21 8.5ZM3 8.5L3.6 8.5 3.6 6.5 3 6.5 2.4 6.5 2.4 8.5 3 8.5ZM3 8.5L3 9.1 12 9.1 12 8.5 12 7.9 3 7.9 3 8.5ZM12 8.5L11.4 8.5 11.4 13.5 12 13.5 12.6 13.5 12.6 8.5 12 8.5ZM12 13.5L12 12.9 3 12.9 3 13.5 3 14.1 12 14.1 12 13.5ZM3 13.5L3.6 13.5 3.6 8.5 3 8.5 2.4 8.5 2.4 13.5 3 13.5ZM12 13.5L11.4 13.5 11.4 18.5 12 18.5 12.6 18.5 12.6 13.5 12 13.5ZM12 18.5L12 17.9 4 17.9 4 18.5 4 19.1 12 19.1 12 18.5ZM3 17.5L3.6 17.5 3.6 13.5 3 13.5 2.4 13.5 2.4 17.5 3 17.5ZM4 18.5L4 17.9C3.78 17.9 3.6 17.72 3.6 17.5L3 17.5 2.4 17.5C2.4 18.38 3.12 19.1 4 19.1L4 18.5ZM12 8.5L12 9.1 21 9.1 21 8.5 21 7.9 12 7.9 12 8.5ZM21 8.5L20.4 8.5 20.4 13.5 21 13.5 21.6 13.5 21.6 8.5 21 8.5ZM21 13.5L21 12.9 12 12.9 12 13.5 12 14.1 21 14.1 21 13.5ZM21 13.5L20.4 13.5 20.4 17.5 21 17.5 21.6 17.5 21.6 13.5 21 13.5ZM20 18.5L20 17.9 12 17.9 12 18.5 12 19.1 20 19.1 20 18.5ZM21 17.5L20.4 17.5C20.4 17.72 20.22 17.9 20 17.9L20 18.5 20 19.1C20.88 19.1 21.6 18.38 21.6 17.5L21 17.5ZM20 5.5L20 6.1C20.22 6.1 20.4 6.28 20.4 6.5L21 6.5 21.6 6.5C21.6 5.62 20.88 4.9 20 4.9L20 5.5ZM4 5.5L4 4.9C3.12 4.9 2.4 5.62 2.4 6.5L3 6.5 3.6 6.5C3.6 6.28 3.78 6.1 4 6.1L4 5.5Z"/></svg>',
  "editor/link.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.1573 7.3373C9.9273 7.5673 9.9273 7.9473 10.1573 8.1773 10.3973 8.4173 10.7773 8.4173 11.0073 8.1773L10.5873 7.7573 10.1573 7.3373ZM13.4173 4.9273L12.9873 4.5073 12.9873 4.5073 13.4173 4.9273ZM4.9273 13.4173L4.5073 12.9873 4.5073 12.9873 4.9273 13.4173ZM8.1773 11.0073C8.4173 10.7773 8.4173 10.3973 8.1773 10.1573 7.9473 9.9273 7.5673 9.9273 7.3373 10.1573L7.7573 10.5873 8.1773 11.0073ZM13.8373 16.6673C14.0773 16.4373 14.0773 16.0573 13.8373 15.8173 13.6073 15.5873 13.2273 15.5873 12.9873 15.8173L13.4173 16.2473 13.8373 16.6673ZM10.5873 19.0673L11.0073 19.4973 11.0073 19.4973 10.5873 19.0673ZM19.0673 10.5873L19.4973 11.0073 19.4973 11.0073 19.0673 10.5873ZM15.8173 12.9873C15.5873 13.2273 15.5873 13.6073 15.8173 13.8373 16.0573 14.0773 16.4373 14.0773 16.6673 13.8373L16.2473 13.4173 15.8173 12.9873ZM15.2573 9.5973C15.4873 9.3573 15.4873 8.9773 15.2573 8.7473 15.0173 8.5173 14.6373 8.5173 14.4073 8.7473L14.8273 9.1673 15.2573 9.5973ZM8.7473 14.4073C8.5173 14.6373 8.5173 15.0173 8.7473 15.2573 8.9773 15.4873 9.3573 15.4873 9.5973 15.2573L9.1673 14.8273 8.7473 14.4073ZM10.5873 7.7573L11.0073 8.1773 13.8373 5.3573 13.4173 4.9273 12.9873 4.5073 10.1573 7.3373 10.5873 7.7573ZM4.9273 13.4173L5.3573 13.8373 8.1773 11.0073 7.7573 10.5873 7.3373 10.1573 4.5073 12.9873 4.9273 13.4173ZM13.4173 16.2473L12.9873 15.8173 10.1573 18.6473 10.5873 19.0673 11.0073 19.4973 13.8373 16.6673 13.4173 16.2473ZM19.0673 10.5873L18.6473 10.1573 15.8173 12.9873 16.2473 13.4173 16.6673 13.8373 19.4973 11.0073 19.0673 10.5873ZM4.9273 19.0673L5.3573 18.6473C4.0273 17.3173 4.0273 15.1673 5.3573 13.8373L4.9273 13.4173 4.5073 12.9873C2.7073 14.7873 2.7073 17.6973 4.5073 19.4973L4.9273 19.0673ZM4.9273 19.0673L4.5073 19.4973C6.2973 21.2873 9.2173 21.2873 11.0073 19.4973L10.5873 19.0673 10.1573 18.6473C8.8373 19.9773 6.6773 19.9773 5.3573 18.6473L4.9273 19.0673ZM19.0673 4.9273L18.6473 5.3573C19.9773 6.6773 19.9773 8.8373 18.6473 10.1573L19.0673 10.5873 19.4973 11.0073C21.2873 9.2173 21.2873 6.2973 19.4973 4.5073L19.0673 4.9273ZM19.0673 4.9273L19.4973 4.5073C17.6973 2.7073 14.7873 2.7073 12.9873 4.5073L13.4173 4.9273 13.8373 5.3573C15.1673 4.0273 17.3173 4.0273 18.6473 5.3573L19.0673 4.9273ZM14.8273 9.1673L14.4073 8.7473 8.7473 14.4073 9.1673 14.8273 9.5973 15.2573 15.2573 9.5973 14.8273 9.1673Z"/></svg>',
  "editor/image.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/></svg>',
  "editor/youtube.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>',
  "editor/hr.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M0 224c0-17.7 14.3-32 32-32H608c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32z"/></svg>',
  "editor/eraser.svg":
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M290.7 57.4L57.4 290.7c-25 25-25 65.5 0 90.5l80 80c12 12 28.3 18.7 45.3 18.7H288h9.4H512c17.7 0 32-14.3 32-32s-14.3-32-32-32H387.9L518.6 285.3c25-25 25-65.5 0-90.5L381.3 57.4c-25-25-65.5-25-90.5 0zM297.4 416H288l-105.4 0-80-80L227.3 211.3 364.7 348.7 297.4 416z"/></svg>',
  "editor/code.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14.58 4.15C14.66 3.82 14.47 3.5 14.15 3.42 13.82 3.34 13.5 3.53 13.42 3.85L14 4 14.58 4.15ZM9.42 19.85C9.34 20.18 9.53 20.5 9.85 20.58 10.18 20.66 10.5 20.47 10.58 20.15L10 20 9.42 19.85ZM7.42 8.42C7.66 8.19 7.66 7.81 7.42 7.58 7.19 7.34 6.81 7.34 6.58 7.58L7 8 7.42 8.42ZM3 12L2.58 11.58C2.34 11.81 2.34 12.19 2.58 12.42L3 12ZM6.58 16.42C6.81 16.66 7.19 16.66 7.42 16.42 7.66 16.19 7.66 15.81 7.42 15.58L7 16 6.58 16.42ZM17.42 7.58C17.19 7.34 16.81 7.34 16.58 7.58 16.34 7.81 16.34 8.19 16.58 8.42L17 8 17.42 7.58ZM21 12L21.42 12.42C21.66 12.19 21.66 11.81 21.42 11.58L21 12ZM16.58 15.58C16.34 15.81 16.34 16.19 16.58 16.42 16.81 16.66 17.19 16.66 17.42 16.42L17 16 16.58 15.58ZM14 4L13.42 3.85 9.42 19.85 10 20 10.58 20.15 14.58 4.15 14 4ZM7 8L6.58 7.58 2.58 11.58 3 12 3.42 12.42 7.42 8.42 7 8ZM3 12L2.58 12.42 6.58 16.42 7 16 7.42 15.58 3.42 11.58 3 12ZM17 8L16.58 8.42 20.58 12.42 21 12 21.42 11.58 17.42 7.58 17 8ZM21 12L20.58 11.58 16.58 15.58 17 16 17.42 16.42 21.42 12.42 21 12Z"/></svg>',
  "navigation/menu.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>',
  "navigation/chevron-left.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14.58 18.42C14.81 18.66 15.19 18.66 15.42 18.42 15.66 18.19 15.66 17.81 15.42 17.58L15 18 14.58 18.42ZM9 12L8.58 11.58C8.34 11.81 8.34 12.19 8.58 12.42L9 12ZM15.42 6.42C15.66 6.19 15.66 5.81 15.42 5.58 15.19 5.34 14.81 5.34 14.58 5.58L15 6 15.42 6.42ZM15 18L15.42 17.58 9.42 11.58 9 12 8.58 12.42 14.58 18.42 15 18ZM9 12L9.42 12.42 15.42 6.42 15 6 14.58 5.58 8.58 11.58 9 12Z"/></svg>',
  "navigation/chevron-right.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.58 17.58C8.34 17.81 8.34 18.19 8.58 18.42 8.81 18.66 9.19 18.66 9.42 18.42L9 18 8.58 17.58ZM15 12L15.42 12.42C15.66 12.19 15.66 11.81 15.42 11.58L15 12ZM9.42 5.58C9.19 5.34 8.81 5.34 8.58 5.58 8.34 5.81 8.34 6.19 8.58 6.42L9 6 9.42 5.58ZM9 18L9.42 18.42 15.42 12.42 15 12 14.58 11.58 8.58 17.58 9 18ZM15 12L15.42 11.58 9.42 5.58 9 6 8.58 6.42 14.58 12.42 15 12Z"/></svg>',
  "navigation/chevron-down.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.42 8.58C6.19 8.34 5.81 8.34 5.58 8.58 5.34 8.81 5.34 9.19 5.58 9.42L6 9 6.42 8.58ZM12 15L11.58 15.42C11.69 15.54 11.84 15.6 12 15.6 12.16 15.6 12.31 15.54 12.42 15.42L12 15ZM18.42 9.42C18.66 9.19 18.66 8.81 18.42 8.58 18.19 8.34 17.81 8.34 17.58 8.58L18 9 18.42 9.42ZM6 9L5.58 9.42 11.58 15.42 12 15 12.42 14.58 6.42 8.58 6 9ZM12 15L12.42 15.42 18.42 9.42 18 9 17.58 8.58 11.58 14.58 12 15Z"/></svg>',
  "datetime/calendar.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 18.5107L3.4 18.5107 4 18.5107ZM4.52 19.7507L4.1 20.1807 4.1 20.1807 4.52 19.7507ZM19.48 5.5207L19.9 5.0907 19.9 5.0907 19.48 5.5207ZM4.52 5.5207L4.1 5.0907 4.1 5.0907 4.52 5.5207ZM4 6.7507L4.6 6.7507 4 6.7507ZM9.04 3.2607C9.04 2.9307 8.78 2.6607 8.44 2.6607 8.11 2.6607 7.84 2.9307 7.84 3.2607L8.44 3.2607 9.04 3.2607ZM7.84 6.7507C7.84 7.0807 8.11 7.3507 8.44 7.3507 8.78 7.3507 9.04 7.0807 9.04 6.7507L8.44 6.7507 7.84 6.7507ZM16.16 3.2607C16.16 2.9307 15.89 2.6607 15.56 2.6607 15.22 2.6607 14.96 2.9307 14.96 3.2607L15.56 3.2607 16.16 3.2607ZM14.96 6.7507C14.96 7.0807 15.22 7.3507 15.56 7.3507 15.89 7.3507 16.16 7.0807 16.16 6.7507L15.56 6.7507 14.96 6.7507ZM4 9.6507C3.67 9.6507 3.4 9.9107 3.4 10.2507 3.4 10.5807 3.67 10.8507 4 10.8507L4 10.2507 4 9.6507ZM20 10.8507C20.33 10.8507 20.6 10.5807 20.6 10.2507 20.6 9.9107 20.33 9.6507 20 9.6507L20 10.2507 20 10.8507ZM4 18.5107L3.4 18.5107C3.4 19.1407 3.65 19.7407 4.1 20.1807L4.52 19.7507 4.94 19.3207C4.72 19.1007 4.6 18.8107 4.6 18.5107L4 18.5107ZM4.52 19.7507L4.1 20.1807C4.55 20.6207 5.15 20.8607 5.78 20.8607L5.78 20.2607 5.78 19.6607C5.46 19.6607 5.16 19.5407 4.94 19.3207L4.52 19.7507ZM20 6.7507L20.6 6.7507C20.6 6.1307 20.35 5.5307 19.9 5.0907L19.48 5.5207 19.06 5.9507C19.28 6.1607 19.4 6.4507 19.4 6.7507L20 6.7507ZM19.48 5.5207L19.9 5.0907C19.45 4.6507 18.85 4.4107 18.22 4.4107L18.22 5.0107 18.22 5.6107C18.54 5.6107 18.84 5.7307 19.06 5.9507L19.48 5.5207ZM18.22 5.0107L18.22 4.4107 5.78 4.4107 5.78 5.0107 5.78 5.6107 18.22 5.6107 18.22 5.0107ZM5.78 5.0107L5.78 4.4107C5.15 4.4107 4.55 4.6507 4.1 5.0907L4.52 5.5207 4.94 5.9507C5.16 5.7307 5.46 5.6107 5.78 5.6107L5.78 5.0107ZM4.52 5.5207L4.1 5.0907C3.65 5.5307 3.4 6.1307 3.4 6.7507L4 6.7507 4.6 6.7507C4.6 6.4507 4.72 6.1607 4.94 5.9507L4.52 5.5207ZM4 6.7507L3.4 6.7507 3.4 18.5107 4 18.5107 4.6 18.5107 4.6 6.7507 4 6.7507ZM18.07 20.2607L18.07 20.8607C19.46 20.8607 20.6 19.7507 20.6 18.3607L20 18.3607 19.4 18.3607C19.4 19.0707 18.81 19.6607 18.07 19.6607L18.07 20.2607ZM8.44 3.2607L7.84 3.2607 7.84 6.7507 8.44 6.7507 9.04 6.7507 9.04 3.2607 8.44 3.2607ZM15.56 3.2607L14.96 3.2607 14.96 6.7507 15.56 6.7507 16.16 6.7507 16.16 3.2607 15.56 3.2607ZM4 10.2507L4 10.8507 20 10.8507 20 10.2507 20 9.6507 4 9.6507 4 10.2507ZM5.78 20.2607L5.78 20.8607 18.07 20.8607 18.07 20.2607 18.07 19.6607 5.78 19.6607 5.78 20.2607ZM20 18.3607L20.6 18.3607 20.6 6.7507 20 6.7507 19.4 6.7507 19.4 18.3607 20 18.3607Z"/></svg>',
  "datetime/time.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.21 7C12.21 6.7 11.97 6.46 11.67 6.46 11.37 6.46 11.13 6.7 11.13 7L11.67 7 12.21 7ZM11.67 12.5L11.13 12.5C11.13 12.69 11.23 12.87 11.4 12.97L11.67 12.5ZM15.73 15.47C15.99 15.62 16.32 15.53 16.47 15.27 16.62 15.01 16.53 14.68 16.27 14.53L16 15 15.73 15.47ZM12 21L12 21.54C17.25 21.54 21.54 17.25 21.54 12L21 12 20.46 12C20.46 16.65 16.65 20.46 12 20.46L12 21ZM21 12L21.54 12C21.54 6.75 17.25 2.46 12 2.46L12 3 12 3.54C16.65 3.54 20.46 7.35 20.46 12L21 12ZM12 3L12 2.46C6.75 2.46 2.46 6.75 2.46 12L3 12 3.54 12C3.54 7.35 7.35 3.54 12 3.54L12 3ZM3 12L2.46 12C2.46 17.25 6.75 21.54 12 21.54L12 21 12 20.46C7.35 20.46 3.54 16.65 3.54 12L3 12ZM11.67 12.5L11.4 12.97 15.73 15.47 16 15 16.27 14.53 11.94 12.03 11.67 12.5ZM11.67 7L11.13 7 11.13 10.7 11.67 10.7 12.21 10.7 12.21 7 11.67 7ZM11.67 10.7L11.13 10.7 11.13 12.5 11.67 12.5 12.21 12.5 12.21 10.7 11.67 10.7Z"/></svg>',
  "action/refresh.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.6 12C20.6 11.67 20.33 11.4 20 11.4 19.67 11.4 19.4 11.67 19.4 12L20 12 20.6 12ZM18.17 7.91C18.35 8.18 18.72 8.26 19 8.08 19.27 7.89 19.35 7.52 19.17 7.24L18.67 7.58 18.17 7.91ZM15 7.4C14.67 7.4 14.4 7.67 14.4 8 14.4 8.33 14.67 8.6 15 8.6L15 8 15 7.4ZM19 8L19 8.6 19.6 8.6 19.6 8 19 8ZM19.6 4C19.6 3.67 19.33 3.4 19 3.4 18.67 3.4 18.4 3.67 18.4 4L19 4 19.6 4ZM20 12L19.4 12C19.4 16.09 16.09 19.4 12 19.4L12 20 12 20.6C16.75 20.6 20.6 16.75 20.6 12L20 12ZM12 20L12 19.4C7.91 19.4 4.6 16.09 4.6 12L4 12 3.4 12C3.4 16.75 7.25 20.6 12 20.6L12 20ZM4 12L4.6 12C4.6 7.91 7.91 4.6 12 4.6L12 4 12 3.4C7.25 3.4 3.4 7.25 3.4 12L4 12ZM12 4L12 4.6C14.57 4.6 16.84 5.91 18.17 7.91L18.67 7.58 19.17 7.24C17.63 4.93 14.99 3.4 12 3.4L12 4ZM15 8L15 8.6 19 8.6 19 8 19 7.4 15 7.4 15 8ZM19 8L19.6 8 19.6 4 19 4 18.4 4 18.4 8 19 8Z"/></svg>',
  "action/check.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.42 6.42C20.66 6.19 20.66 5.81 20.42 5.58 20.19 5.34 19.81 5.34 19.58 5.58L20 6 20.42 6.42ZM9 17L8.58 17.42C8.81 17.66 9.19 17.66 9.42 17.42L9 17ZM4.42 11.58C4.19 11.34 3.81 11.34 3.58 11.58 3.34 11.81 3.34 12.19 3.58 12.42L4 12 4.42 11.58ZM20 6L19.58 5.58 8.58 16.58 9 17 9.42 17.42 20.42 6.42 20 6ZM9 17L9.42 16.58 4.42 11.58 4 12 3.58 12.42 8.58 17.42 9 17Z"/></svg>',
  "action/close.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.42 6.42C18.66 6.19 18.66 5.81 18.42 5.58 18.19 5.34 17.81 5.34 17.58 5.58L18 6 18.42 6.42ZM5.58 17.58C5.34 17.81 5.34 18.19 5.58 18.42 5.81 18.66 6.19 18.66 6.42 18.42L6 18 5.58 17.58ZM6.42 5.58C6.19 5.34 5.81 5.34 5.58 5.58 5.34 5.81 5.34 6.19 5.58 6.42L6 6 6.42 5.58ZM17.58 18.42C17.81 18.66 18.19 18.66 18.42 18.42 18.66 18.19 18.66 17.81 18.42 17.58L18 18 17.58 18.42ZM18 6L17.58 5.58 5.58 17.58 6 18 6.42 18.42 18.42 6.42 18 6ZM6 6L5.58 6.42 17.58 18.42 18 18 18.42 17.58 6.42 5.58 6 6Z"/></svg>',
  "action/search.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.58 19.43C18.81 19.66 19.19 19.66 19.43 19.42 19.66 19.19 19.66 18.81 19.42 18.57L19 19 18.58 19.43ZM15.8 15C15.56 14.77 15.18 14.77 14.95 15 14.72 15.24 14.72 15.62 14.96 15.85L15.38 15.43 15.8 15ZM17 11L16.4 11C16.4 13.98 13.98 16.4 11 16.4L11 17 11 17.6C14.65 17.6 17.6 14.65 17.6 11L17 11ZM11 17L11 16.4C8.02 16.4 5.6 13.98 5.6 11L5 11 4.4 11C4.4 14.65 7.35 17.6 11 17.6L11 17ZM5 11L5.6 11C5.6 8.02 8.02 5.6 11 5.6L11 5 11 4.4C7.35 4.4 4.4 7.35 4.4 11L5 11ZM11 5L11 5.6C13.98 5.6 16.4 8.02 16.4 11L17 11 17.6 11C17.6 7.35 14.65 4.4 11 4.4L11 5ZM19 19L19.42 18.57 15.8 15 15.38 15.43 14.96 15.85 18.58 19.43 19 19Z"/></svg>',
};

function supportedTargets(): ComponentDocument["targets"] {
  return {
    web: { supported: true, limitations: [] },
    react: { supported: true, limitations: [] },
    hono: { supported: true, limitations: [] },
    native: { supported: true, limitations: [] },
  };
}

// npm installs bins as symlinks (node_modules/.bin/podo → dist/index.js), so
// the main-module check must compare realpaths or `npx podo` silently no-ops.
if (process.argv[1] && fileURLToPath(import.meta.url) === safeRealpath(process.argv[1])) {
  runCli().then((code) => {
    process.exitCode = code;
  });
}

function safeRealpath(path: string): string | undefined {
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
}
