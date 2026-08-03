import { readFile } from "node:fs/promises";
import { argv, stdout } from "node:process";
import { pathToFileURL, URL } from "node:url";

const repositoryRoot = new URL("../", import.meta.url);

function normalizeMarkdownCell(value) {
  return value
    .trim()
    .replace(/^`|`$/g, "")
    .replace(/^\[([^\]]+)]\([^)]*\)$/g, "$1");
}

export function parseContributorTable(markdown, path = "Markdown") {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) =>
    /^\|\s*이름\s*\|\s*역할\s*\|\s*(?:이메일|Figma 계정 검색 이메일)\s*\|$/.test(line.trim())
  );

  if (headerIndex === -1) {
    throw new Error(`${path} contributor table header was not found.`);
  }

  const separator = lines[headerIndex + 1]?.trim() ?? "";
  if (!/^\|(?:\s*:?-{3,}:?\s*\|){3}$/.test(separator)) {
    throw new Error(`${path} contributor table separator is invalid.`);
  }

  const rows = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith("|")) break;
    const cells = line.trim().split("|").slice(1, -1).map(normalizeMarkdownCell);
    if (cells.length !== 3) {
      throw new Error(`${path} contributor table row must contain exactly three cells.`);
    }
    rows.push({ name: cells[0], roleEn: cells[1], email: cells[2] });
  }

  return rows;
}

export function assertContributorTable(markdown, contributors, path = "Markdown") {
  const actual = parseContributorTable(markdown, path);
  const expected = contributors.map(({ name, roleEn, email }) => ({ name, roleEn, email }));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${path} contributor rows do not exactly match the docs contributor source.`);
  }
}

export async function checkContributorMetadata(root = repositoryRoot) {
  async function readJson(path) {
    return JSON.parse(await readFile(new URL(path, root), "utf8"));
  }

  const contributors = await readJson("packages/docs/src/data/contributors.json");

  if (!Array.isArray(contributors) || contributors.length === 0) {
    throw new Error("Contributor source must contain at least one contributor.");
  }

  const seenEmails = new Set();
  for (const contributor of contributors) {
    for (const field of ["name", "roleKo", "roleEn", "email"]) {
      if (typeof contributor[field] !== "string" || contributor[field].trim() === "") {
        throw new Error(`Contributor field ${field} must be a non-empty string.`);
      }
    }
    if (seenEmails.has(contributor.email)) {
      throw new Error(`Duplicate contributor email: ${contributor.email}`);
    }
    seenEmails.add(contributor.email);
  }

  const expectedPackageContributors = contributors.map(
    ({ name, roleEn, email }) => `${name} (${roleEn}) <${email}>`
  );

  for (const path of [
    "package.json",
    "packages/podo-ui/package.json",
    "figma-plugin/package.json",
  ]) {
    const packageJson = await readJson(path);
    if (JSON.stringify(packageJson.contributors) !== JSON.stringify(expectedPackageContributors)) {
      throw new Error(`${path} contributors do not match the docs contributor source.`);
    }
  }

  for (const path of ["README.md", "figma-plugin/community/README.md"]) {
    const markdown = await readFile(new URL(path, root), "utf8");
    assertContributorTable(markdown, contributors, path);
  }

  return contributors.length;
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const contributorCount = await checkContributorMetadata();
  stdout.write(`Contributor metadata verified for ${contributorCount} people.\n`);
}
