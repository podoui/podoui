#!/usr/bin/env node

import { createHash } from "node:crypto";
import { realpathSync, type Dirent } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as nodeStdin, stdout as nodeStdout } from "node:process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
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
import { startMcpServer } from "@podoui/mcp";
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
  const generated = [
    {
      path: join(absoluteOutDir, "tokens.css"),
      contents: emitCssVariables(resolved, {
        themes: config.themes.available,
        colorSchemes: config.darkMode.enabled ? ["light", "dark"] : ["light"],
      }),
    },
    { path: join(absoluteOutDir, "tokens.ts"), contents: emitTypeScriptTokens(resolved) },
    { path: join(absoluteOutDir, "tokens.native.ts"), contents: emitReactNativeTokens(resolved) },
    { path: join(absoluteOutDir, "tokens.json"), contents: emitTokenJsonBundle(resolved) },
    {
      path: join(absoluteOutDir, "icons/PodoIcons.css"),
      contents: emitIconCss(iconManifest),
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
        { path: join(absoluteOutDir, "icons/PodoIcons.woff") },
        { path: join(absoluteOutDir, "icons/PodoIcons.woff2") },
        { path: join(absoluteOutDir, "icons/PodoIcons.metadata.json") },
      ].map(async (file) => ({
        path: relativePath(root, file.path),
        action: (await exists(file.path)) ? "update" : "create",
        ...("preview" in file ? { preview: file.preview } : {}),
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
    fontTypes: ["woff", "woff2"],
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
  const root = await findProjectRoot(io.cwd);
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
    ...[...projectTokens, ...projectThemes].filter((source) => source.tier === "project")
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
    "  mcp        Start the Podo MCP stdio server",
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
  return filePath.replace(resolve(root), "").replace(/^\/+/, "");
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

// chevron-right/calendar/time/refresh는 podo-ui/react DatePicker가 참조하는
// 글리프(podo-icon-*)라 기본 빌드에서 빠지면 소비 프로젝트에서 빈 아이콘이 된다.
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
  },
  groups: {
    navigation: ["menu", "chevron-left", "chevron-right"],
    datetime: ["calendar", "time"],
    action: ["refresh", "check", "close", "search"],
  },
  codepointLock: {
    menu: "E001",
    "chevron-left": "E002",
    "chevron-right": "E003",
    calendar: "E004",
    time: "E005",
    refresh: "E006",
    check: "E007",
    close: "E008",
    search: "E009",
  },
};

export const defaultIconSvgs = {
  "navigation/menu.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/></svg>',
  "navigation/chevron-left.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 5 8.5 12l7 7-1.5 1.5L5.5 12 14 3.5 15.5 5z"/></svg>',
  "navigation/chevron-right.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.5 5 15.5 12l-7 7 1.5 1.5L18.5 12 10 3.5 8.5 5z"/></svg>',
  "datetime/calendar.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8v10H5V10h14z"/></svg>',
  "datetime/time.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3h2v5.6l3.8 2.2-1 1.7L11 13V7z"/></svg>',
  "action/refresh.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
  "action/check.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.55 17.6 4.2 12.25l1.6-1.6 3.75 3.75 8.65-8.65 1.6 1.6z"/></svg>',
  "action/close.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
  "action/search.svg":
    '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/></svg>',
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
