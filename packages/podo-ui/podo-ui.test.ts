import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

const packageRoot = dirname(fileURLToPath(import.meta.url));
const dist = join(packageRoot, "dist");

// Modules safe to import in a plain Node process. `native` needs a React
// Native host and is checked for existence only.
const IMPORTABLE = [
  "spec",
  "tokens",
  "icons",
  "icon-build",
  "core",
  "web",
  "react",
  "hono",
  "codegen",
  "migration",
  "mcp",
  "cli",
];

beforeAll(() => {
  // Assembles dist from the sibling packages' tsc output (built by typecheck).
  execSync("node build.mjs", { cwd: packageRoot, stdio: "pipe" });
}, 120_000);

describe("podo-ui assembled package", () => {
  it("imports every runtime subpath", { timeout: 60_000 }, async () => {
    for (const name of IMPORTABLE) {
      const module = (await import(pathToFileURL(join(dist, name, "index.js")).href)) as Record<
        string,
        unknown
      >;
      expect(Object.keys(module).length, name).toBeGreaterThan(0);
    }
    const tokensNode = (await import(pathToFileURL(join(dist, "tokens/node.js")).href)) as Record<
      string,
      unknown
    >;
    expect(Object.keys(tokensNode).length).toBeGreaterThan(0);
  });

  it("ships the native entry and executable bins", () => {
    expect(existsSync(join(dist, "native/index.js"))).toBe(true);
    for (const bin of ["cli/index.js", "mcp/index.js"]) {
      expect(statSync(join(dist, bin)).mode & 0o111, bin).toBeTruthy();
    }
  });

  it("stamps the package version for self-version reads", () => {
    const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
      version: string;
    };
    const stamped = JSON.parse(readFileSync(join(dist, "package.json"), "utf8")) as {
      version: string;
    };
    expect(stamped.version).toBe(manifest.version);
  });

  it("leaks no workspace-internal @podoui import specifiers", () => {
    // Import contexts only: `packageName = "@podoui/cli"`-style data
    // constants are expected to survive as-is.
    const importSpecifier = /(?:\bfrom|\bimport)\s*\(?\s*["']@podoui\//;
    const leaks: string[] = [];
    const scan = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          scan(entryPath);
        } else if (/\.(js|d\.ts)$/.test(entry.name)) {
          if (importSpecifier.test(readFileSync(entryPath, "utf8"))) {
            leaks.push(entryPath);
          }
        }
      }
    };
    scan(dist);
    expect(leaks).toEqual([]);
  });
});
