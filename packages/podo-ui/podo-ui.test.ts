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

  it("bundled codegen emits consumer package specifiers, not internal/relative ones", async () => {
    const codegen = (await import(pathToFileURL(join(dist, "codegen/index.js")).href)) as {
      generateComponentFiles: (options: unknown) => { path: string; contents: string }[];
    };
    const spec = (await import(pathToFileURL(join(dist, "spec/index.js")).href)) as {
      parseComponentDocument: (input: unknown) => unknown;
    };
    const button = spec.parseComponentDocument({
      schemaVersion: "2.0.0",
      kind: "component",
      id: "button",
      name: "Button",
      category: "atom",
      status: "stable",
      anatomy: [{ name: "root" }],
      slots: [],
      props: [],
      variants: [],
      states: [],
      tokens: {},
      targets: {
        web: { supported: true, limitations: [] },
        react: { supported: true, limitations: [] },
        hono: { supported: true, limitations: [] },
        native: { supported: true, limitations: [] },
      },
      accessibility: { aria: [], keyboard: [] },
    });
    const files = codegen.generateComponentFiles({
      specs: [button],
      targets: ["react", "hono", "native"],
      outDir: "g",
    });
    for (const file of files) {
      // The e2e-found bug: the bundle assembler rewrote template strings to
      // `from "../react/index.js"`, and before that they pointed at @podoui/*.
      // Only import specifiers matter — the generated header comment may
      // mention @podoui/codegen.
      expect(file.contents, file.path).not.toMatch(/from "@podoui\//);
      expect(file.contents, file.path).not.toMatch(/from "\.\./);
      expect(file.contents, file.path).toMatch(/from "podo-ui\/(react|hono|native)"/);
    }
  });

  it("bundled react entry keeps the use client directive", () => {
    expect(readFileSync(join(dist, "react/index.js"), "utf8").startsWith('"use client";')).toBe(
      true
    );
  });

  it("ships default icon glyphs for every podo-icon-* class the react renderers reference", () => {
    const css = readFileSync(join(dist, "icons-assets/PodoIcons.css"), "utf8");
    expect(css).toContain("@font-face");
    expect(existsSync(join(dist, "icons-assets/PodoIcons.woff2"))).toBe(true);
    expect(existsSync(join(dist, "icons-assets/PodoIcons.woff"))).toBe(true);
    expect(existsSync(join(dist, "icons-assets/PodoIcons.ttf"))).toBe(true);

    // className 사용처(podo-icon-<name>)를 react 소스에서 수집한다. CSS 변수
    // (--podo-icon-*)는 [a-z] 시작 캡처에 걸리지 않는 web 패키지에만 있다.
    const referenced = new Set<string>();
    const scan = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const entryPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          scan(entryPath);
        } else if (/\.tsx?$/.test(entry.name)) {
          for (const match of readFileSync(entryPath, "utf8").matchAll(
            /podo-icon-([a-z][a-z-]*)/g
          )) {
            referenced.add(match[1] as string);
          }
        }
      }
    };
    scan(join(packageRoot, "../react/src"));
    expect(referenced.size).toBeGreaterThan(0);
    for (const name of referenced) {
      expect(css, `glyph "${name}"`).toContain(`.podo-icon-${name}::before`);
    }

    const nativeGlyphs = readFileSync(join(dist, "icons-assets/PodoIcons.native.ts"), "utf8");
    for (const name of [
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
    ]) {
      expect(css, `editor glyph "${name}"`).toContain(`.podo-icon-${name}::before`);
      expect(nativeGlyphs, `native editor glyph "${name}"`).toContain(`"${name}"`);
    }
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

describe("MCP consumer commands", () => {
  it("can import MCP and CLI from a stdin Node script", () => {
    const source = ["mcp", "cli"]
      .map(
        (name) =>
          `await import(${JSON.stringify(pathToFileURL(join(dist, name, "index.js")).href)});`
      )
      .join("\n");
    expect(execSync("node --input-type=module -", { input: source, encoding: "utf8" })).toBe("");
  });
  it(
    "connects through the package command and a symlinked podo-mcp bin",
    { timeout: 30_000 },
    async () => {
      const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
      const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
      const { mkdtemp, symlink, rm, mkdir, writeFile } = await import("node:fs/promises");
      const { tmpdir } = await import("node:os");
      const root = await mkdtemp(join(tmpdir(), "podo-mcp-consumer-"));
      try {
        const project = join(root, "project with spaces");
        await mkdir(join(project, ".podo"), { recursive: true });
        const bin = join(root, "podo-mcp");
        await symlink(join(dist, "mcp/index.js"), bin);
        for (const args of [[join(dist, "cli/menu.js"), "mcp", "--root", project], [bin]]) {
          const client = new Client({ name: "consumer-test", version: "1.0.0" });
          const transport = new StdioClientTransport({
            command: process.execPath,
            args,
            cwd: project,
            stderr: "pipe",
          });
          try {
            await client.connect(transport);
            const listed = await client.listTools();
            expect(listed.tools.map((tool) => tool.name)).toContain("get_system_overview");
            const result = await client.callTool({ name: "get_system_overview", arguments: {} });
            expect(result.isError).not.toBe(true);
            expect(JSON.stringify(result)).toContain("button");
          } finally {
            await client.close();
            await transport.close();
          }
        }
        // An explicit empty child must not inherit an ancestor's .podo.
        await mkdir(join(root, ".podo"));
        await writeFile(join(root, ".podo/config.json"), "{");
        const child = join(root, "empty child");
        await mkdir(child);
        const isolatedClient = new Client({ name: "isolation-test", version: "1.0.0" });
        const isolatedTransport = new StdioClientTransport({
          command: process.execPath,
          args: [join(dist, "cli/menu.js"), "mcp", "--root", child],
          cwd: root,
          stderr: "pipe",
        });
        try {
          await isolatedClient.connect(isolatedTransport);
          const validation = await isolatedClient.callTool({
            name: "validate_podo_project",
            arguments: {},
          });
          expect(JSON.stringify(validation)).not.toContain(".podo/config.json");
        } finally {
          await isolatedClient.close();
          await isolatedTransport.close();
        }
        // A malformed project must be read from --root even when launched elsewhere.
        await writeFile(join(project, ".podo/config.json"), "{");
        const client = new Client({ name: "root-test", version: "1.0.0" });
        const transport = new StdioClientTransport({
          command: process.execPath,
          args: [join(dist, "cli/menu.js"), "mcp", "--root", project],
          cwd: root,
          stderr: "pipe",
        });
        try {
          await client.connect(transport);
          const result = await client.callTool({ name: "validate_podo_project", arguments: {} });
          expect(JSON.stringify(result)).toContain(".podo/config.json");
        } finally {
          await client.close();
          await transport.close();
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  );
});
