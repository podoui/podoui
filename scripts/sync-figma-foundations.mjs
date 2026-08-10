import console from "node:console";
import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseFig } from "openfig-core";
import { prepareFoundationArtifacts } from "./figma-foundations.mjs";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_ROOT = join(REPOSITORY_ROOT, "packages/docs");
const PODO_ROOT = join(DOCS_ROOT, ".podo");
const FIGMA_PATH = process.argv.slice(2).find((argument) => argument !== "--");

if (!FIGMA_PATH) {
  throw new Error('Usage: pnpm docs:sync-figma-foundations -- "/path/to/PODO Design System.fig"');
}

const document = await parseFig(await readFile(resolve(FIGMA_PATH)));
const compatibilityState = await readCompatibilityState();
const artifacts = prepareFoundationArtifacts({
  document,
  compatibilityNames: compatibilityState.names,
  codepointSeed: compatibilityState.codepoints,
});
await commitArtifacts(artifacts, compatibilityState.sources);

console.log(
  `Synced ${artifacts.spacing.size} spacing variables, ${artifacts.figmaIcons.size} Figma icons, and ${compatibilityState.names.length} compatibility icons (${artifacts.totalCount} total).`
);

async function readCompatibilityState() {
  const manifest = await readJsonIfPresent(join(PODO_ROOT, "icons/manifest.json"));
  const metadata = await readJsonIfPresent(
    join(DOCS_ROOT, "src/podo/icons/PodoIcons.metadata.json")
  );
  const names = manifest?.groups?.compatibility
    ? [...manifest.groups.compatibility]
    : Object.keys(metadata?.codepoints ?? {});
  const codepoints = new Map();
  for (const [name, value] of Object.entries(manifest?.codepointLock ?? {})) {
    codepoints.set(name, value);
  }
  for (const [name, value] of Object.entries(metadata?.codepoints ?? {})) {
    if (!codepoints.has(name)) codepoints.set(name, Number(value).toString(16).toUpperCase());
  }
  return { names, codepoints, sources: await findCompatibilitySources(names) };
}

async function findCompatibilitySources(names) {
  const committedDirectory = join(PODO_ROOT, "icons/svg/compatibility");
  const cacheDirectory = join(PODO_ROOT, "cache/default-icons/svg");
  const committed = await recursiveFiles(committedDirectory).catch(missingDirectoryAsEmpty);
  const cached = await recursiveFiles(cacheDirectory).catch(missingDirectoryAsEmpty);
  const byName = new Map([...cached, ...committed].map((path) => [basename(path, ".svg"), path]));
  return new Map(
    names.map((name) => {
      const path = byName.get(name);
      if (!path) throw new Error(`Cannot seed compatibility icon ${name}; no SVG was found.`);
      return [name, path];
    })
  );
}

function missingDirectoryAsEmpty(error) {
  if (error?.code === "ENOENT") return [];
  throw error;
}

async function commitArtifacts(artifacts, compatibilitySources) {
  const stageRoot = await mkdtemp(join(PODO_ROOT, ".figma-foundations-stage-"));
  const stageIcons = join(stageRoot, "icons");
  const stageToken = join(stageRoot, "figma-spacing.json");
  const liveIcons = join(PODO_ROOT, "icons");
  const backupIcons = join(PODO_ROOT, ".figma-foundations-icons-backup");
  const liveToken = join(PODO_ROOT, "tokens/figma-spacing.json");
  let backedUp = false;

  try {
    await mkdir(join(stageIcons, "svg/figma"), { recursive: true });
    await mkdir(join(stageIcons, "svg/compatibility"), { recursive: true });
    for (const [name, svg] of artifacts.figmaIcons) {
      await writeFile(join(stageIcons, `svg/figma/${name}.svg`), svg);
    }
    for (const [name, source] of compatibilitySources) {
      await cp(source, join(stageIcons, `svg/compatibility/${name}.svg`));
    }
    await writeJson(join(stageIcons, "manifest.json"), artifacts.manifest);
    await writeJson(stageToken, artifacts.tokenDocument);

    await rm(backupIcons, { recursive: true, force: true });
    try {
      await rename(liveIcons, backupIcons);
      backedUp = true;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    try {
      await rename(stageIcons, liveIcons);
      await mkdir(dirname(liveToken), { recursive: true });
      await rename(stageToken, liveToken);
    } catch (error) {
      await rm(liveIcons, { recursive: true, force: true });
      if (backedUp) await rename(backupIcons, liveIcons);
      throw error;
    }
    await rm(backupIcons, { recursive: true, force: true });
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }

  console.log(`Wrote ${relative(REPOSITORY_ROOT, liveToken)}`);
  console.log(`Wrote ${relative(REPOSITORY_ROOT, join(liveIcons, "manifest.json"))}`);
}

async function recursiveFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? recursiveFiles(path) : [path];
    })
  );
  return paths.flat().filter((path) => path.endsWith(".svg"));
}

async function readJsonIfPresent(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
