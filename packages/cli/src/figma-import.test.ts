import { existsSync } from "node:fs";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  parsePodoCloneDocument,
  parseTokenDocument,
  type ComponentDocument,
  type TokenDocument,
} from "@podoui/spec";
import { convertPodoClone } from "./figma-convert.js";
import { runCli, validateProject, parseArgs, type CliIO } from "./index.js";

const SAMPLE_PATH = fileURLToPath(
  new URL("../../spec/samples/podo-clone.sample.json", import.meta.url)
);
// Local-only 12MB export (gitignored); the committed sample is the
// reproducible fixture and the full snapshot an extra local check.
const SNAPSHOT_PATH = fileURLToPath(
  new URL("../../../figma-plugin/snapshot.json", import.meta.url)
);

const BLUE = { r: 66 / 255, g: 108 / 255, b: 237 / 255, a: 1 };

function fixtureDocument(): Record<string, unknown> {
  return {
    format: "podo-clone",
    version: 1,
    source: { fileName: "PODO Design System", exportedAt: "2026-07-16T06:47:42.411Z" },
    fonts: [{ family: "Pretendard", style: "SemiBold" }],
    variables: [
      {
        id: "C1",
        name: "primitive",
        defaultModeId: "m1",
        modes: [{ modeId: "m1", name: "Value" }],
        hiddenFromPublishing: false,
        variables: [
          {
            id: "V:blue",
            name: "color/blue/50",
            description: "",
            resolvedType: "COLOR",
            scopes: ["ALL_SCOPES"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: { m1: { kind: "value", value: BLUE } },
          },
          {
            id: "V:radius",
            name: "radius/md",
            description: "",
            resolvedType: "FLOAT",
            scopes: ["CORNER_RADIUS"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: { m1: { kind: "value", value: 8 } },
          },
          {
            id: "V:flag",
            name: "flag/on",
            description: "",
            resolvedType: "BOOLEAN",
            scopes: ["ALL_SCOPES"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: { m1: { kind: "value", value: true } },
          },
        ],
      },
      {
        id: "C2",
        name: "theme",
        defaultModeId: "light",
        modes: [
          { modeId: "light", name: "light" },
          { modeId: "dark", name: "dark" },
        ],
        hiddenFromPublishing: false,
        variables: [
          {
            id: "V:text",
            name: "text/basic",
            description: "",
            resolvedType: "COLOR",
            scopes: ["TEXT_FILL"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: {
              light: { kind: "value", value: { r: 0.1, g: 0.1, b: 0.1, a: 1 } },
              dark: { kind: "value", value: { r: 1, g: 1, b: 1, a: 1 } },
            },
          },
          {
            id: "V:surface",
            name: "surface/raised",
            description: "",
            resolvedType: "COLOR",
            scopes: ["FRAME_FILL"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: {
              light: { kind: "alias", id: "V:blue" },
              dark: { kind: "alias", id: "V:blue" },
            },
          },
        ],
      },
      {
        id: "C3",
        name: "responsive",
        defaultModeId: "pc",
        modes: [
          { modeId: "pc", name: "pc" },
          { modeId: "tb", name: "tb" },
          { modeId: "mo", name: "mo" },
        ],
        hiddenFromPublishing: false,
        variables: [
          {
            id: "V:body",
            name: "font-size/body",
            description: "",
            resolvedType: "FLOAT",
            scopes: ["FONT_SIZE"],
            codeSyntax: {},
            hiddenFromPublishing: false,
            valuesByMode: {
              pc: { kind: "value", value: 16 },
              tb: { kind: "value", value: 15 },
              mo: { kind: "value", value: 14 },
            },
          },
        ],
      },
    ],
    styles: {
      text: [
        {
          id: "S:h1",
          name: "heading/h1",
          description: "",
          fontName: { family: "Pretendard", style: "SemiBold" },
          fontSize: 28,
          letterSpacing: { unit: "PERCENT", value: 0 },
          lineHeight: { unit: "PERCENT", value: 130.00000476837158 },
          paragraphIndent: 0,
          paragraphSpacing: 0,
          textCase: "ORIGINAL",
          textDecoration: "NONE",
        },
      ],
      effect: [
        {
          id: "S:shadow",
          name: "shadow.1",
          description: "",
          effects: [
            {
              type: "DROP_SHADOW",
              value: {
                type: "DROP_SHADOW",
                color: { r: 0, g: 0, b: 0, a: 0.0784313753247261 },
                offset: { x: 0, y: 1 },
                radius: 4,
                spread: 0,
                visible: true,
                blendMode: "NORMAL",
              },
            },
          ],
        },
      ],
      paint: [],
      grid: [],
    },
    pages: [
      {
        pageId: "1:1",
        pageName: "Component",
        items: [
          { x: 0, y: 0, node: buttonSetNode() },
          { x: 100, y: 0, node: { ...buttonSetNode(), id: "20:0" } },
          { x: 200, y: 0, node: iconSetNode() },
        ],
      },
    ],
    images: {},
    warnings: ["export-side warning"],
  };
}

function buttonSetNode(): Record<string, unknown> {
  return {
    id: "10:0",
    type: "COMPONENT_SET",
    name: "PrimaryButton",
    props: {},
    width: 120,
    height: 42,
    relativeTransform: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    componentSet: {
      description: "Primary action button",
      documentationLinks: [],
      key: "setkey",
      propertyDefs: [
        {
          name: "type",
          type: "VARIANT",
          defaultValue: "solid",
          variantOptions: ["solid", "outline"],
        },
        { name: "icon#1:2", type: "BOOLEAN", defaultValue: false },
        { name: "Slot#3:4", type: "INSTANCE_SWAP", defaultValue: "125:769" },
      ],
    },
    children: [
      {
        id: "10:1",
        type: "COMPONENT",
        name: "type=solid",
        props: {},
        width: 120,
        height: 42,
        relativeTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        fills: [
          { type: "SOLID", color: { r: BLUE.r, g: BLUE.g, b: BLUE.b }, bound: { color: "V:blue" } },
        ],
        bound: {
          topLeftRadius: "V:radius",
          topRightRadius: "V:radius",
          bottomLeftRadius: "V:radius",
          bottomRightRadius: "V:radius",
        },
        children: [
          {
            id: "10:2",
            type: "TEXT",
            name: "label",
            props: {},
            width: 60,
            height: 20,
            relativeTransform: [
              [1, 0, 30],
              [0, 1, 11],
            ],
            fills: [
              { type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 }, bound: { color: "V:text" } },
            ],
            text: { characters: "Button", segments: [] },
          },
        ],
      },
      {
        id: "10:3",
        type: "COMPONENT",
        name: "type=outline",
        props: {},
        width: 120,
        height: 42,
        relativeTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        fills: [],
        children: [],
      },
    ],
  };
}

function iconSetNode(): Record<string, unknown> {
  // Podo 아이콘 원본 형태: 열린 centerline + stroke (fills 없음).
  const vector = (id: string, tx: number) => ({
    id,
    type: "VECTOR",
    name: "Vector",
    props: { strokeWeight: 1.2000000476837158, strokeCap: "ROUND", strokeJoin: "ROUND" },
    width: 16,
    height: 16,
    relativeTransform: [
      [1, 0, tx],
      [0, 1, 4],
    ],
    fills: [],
    strokes: [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.16 } }],
    vector: { vectorPaths: [{ windingRule: "NONE", data: "M0 0L16 16" }] },
  });
  const variant = (id: string, name: string, children: unknown[]) => ({
    id,
    type: "COMPONENT",
    name,
    props: {},
    width: 24,
    height: 24,
    relativeTransform: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    children,
  });
  return {
    id: "30:0",
    type: "COMPONENT_SET",
    name: "Icon-arrow",
    props: {},
    width: 120,
    height: 24,
    relativeTransform: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    componentSet: {
      description: "",
      documentationLinks: [],
      key: "iconkey",
      propertyDefs: [
        { name: "name", type: "VARIANT", defaultValue: "left", variantOptions: ["left", "right"] },
        { name: "size", type: "VARIANT", defaultValue: "24", variantOptions: ["24", "16"] },
      ],
    },
    children: [
      variant("30:1", "name=left, size=24", [vector("30:2", 4)]),
      // right = left를 90° 회전한 변형 (rt [[0,-1,16],[1,0,0]]).
      variant("30:3", "name=right, size=24", [
        {
          ...vector("30:4", 0),
          relativeTransform: [
            [0, -1, 16],
            [1, 0, 0],
          ],
        },
      ]),
      variant("30:5", "name=left, size=16", [vector("30:6", 0)]),
    ],
  };
}

function fileBy(result: ReturnType<typeof convertPodoClone>, path: string) {
  const file = result.files.find((item) => item.path === path);
  expect(file, `expected ${path} in ${result.files.map((f) => f.path).join(", ")}`).toBeDefined();
  return file!;
}

function tokenAt(document: TokenDocument, path: string): { $type: string; $value: unknown } {
  let cursor: unknown = document.tokens;
  for (const segment of path.split(".")) {
    cursor = (cursor as Record<string, unknown>)[segment];
    expect(cursor, `missing token segment "${segment}" of "${path}"`).toBeDefined();
  }
  return cursor as { $type: string; $value: unknown };
}

describe("convertPodoClone", () => {
  const document = parsePodoCloneDocument(fixtureDocument());
  const result = convertPodoClone(document);

  it("converts a single-mode collection with scope-based token types", () => {
    const file = fileBy(result, ".podo/tokens/figma-primitive.json");
    const tokens = file.document as TokenDocument;
    expect(tokens.category).toBe("primitive");
    expect(tokenAt(tokens, "color.blue.50")).toEqual({ $type: "color", $value: "#426ced" });
    expect(tokenAt(tokens, "radius.md")).toEqual({ $type: "radius", $value: "8px" });
    expect(result.warnings.some((warning) => warning.includes('"flag/on"'))).toBe(true);
  });

  it("converts light/dark collections into theme documents with base aliases", () => {
    const file = fileBy(result, ".podo/themes/figma-theme.json");
    const tokens = file.document as TokenDocument;
    expect(tokens.category).toBe("theme");
    expect(tokenAt(tokens, "light.text.basic").$value).toBe("#1a1a1a");
    expect(tokenAt(tokens, "dark.text.basic").$value).toBe("#ffffff");
    expect(tokenAt(tokens, "text.basic").$value).toBe("{light.text.basic}");
    expect(tokenAt(tokens, "light.surface.raised").$value).toBe("{color.blue.50}");
  });

  it("emits custom-mode collections under mode prefixes with a warning", () => {
    const file = fileBy(result, ".podo/tokens/figma-responsive.json");
    const tokens = file.document as TokenDocument;
    expect(tokenAt(tokens, "pc.font-size.body").$value).toBe("16px");
    expect(tokenAt(tokens, "mo.font-size.body").$value).toBe("14px");
    expect(tokenAt(tokens, "font-size.body").$value).toBe("{pc.font-size.body}");
    expect(result.warnings.some((warning) => warning.includes('Collection "responsive"'))).toBe(
      true
    );
  });

  it("converts text and effect styles into typography/shadow tokens", () => {
    const file = fileBy(result, ".podo/tokens/figma-styles.json");
    const tokens = file.document as TokenDocument;
    expect(tokenAt(tokens, "typography.heading.h1")).toEqual({
      $type: "typography",
      $value: {
        fontFamily: "Pretendard",
        fontSize: "28px",
        lineHeight: "130%",
        fontWeight: 600,
        letterSpacing: "0em",
      },
    });
    expect(tokenAt(tokens, "shadow.shadow-1").$value).toMatchObject({
      x: "0px",
      y: "1px",
      blur: "4px",
      spread: "0px",
    });
  });

  it("converts component sets into draft specs with token bindings", () => {
    const file = fileBy(result, ".podo/components/local/primary-button.component.json");
    const component = file.document as ComponentDocument;
    expect(component.status).toBe("draft");
    expect(component.variants).toEqual([
      { name: "type", values: ["solid", "outline"], default: "solid" },
    ]);
    expect(component.props).toMatchObject([{ name: "icon", type: { kind: "boolean" } }]);
    expect(component.slots).toMatchObject([{ name: "slot", required: false }]);
    expect(component.tokens).toEqual({
      "root.background": "{color.blue.50}",
      "root.radius": "{radius.md}",
      "label.color": "{text.basic}",
    });
  });

  it("imports Icon-* sets into an inline-svg icon manifest, not component specs", () => {
    const file = fileBy(result, ".podo/icons/manifest.json");
    const manifest = file.document as {
      icons: Record<string, { source: string; codepoint: string }>;
      codepointLock: Record<string, string>;
      groups: Record<string, string[]>;
    };
    // size 축은 기본값(24)만: left/right 두 아이콘, 16 사이즈 변형은 제외.
    expect(Object.keys(manifest.icons).sort()).toEqual(["arrow-left", "arrow-right"]);
    expect(manifest.icons["arrow-left"]!.source).toBe("figma/arrow-left.svg");
    const svgFile = fileBy(result, ".podo/icons/svg/figma/arrow-left.svg");
    expect(svgFile.contents).toContain('viewBox="0 0 24 24"');
    // stroke 아이콘은 centerline을 유지한다 (폰트 빌드가 fill로 확장).
    expect(svgFile.contents).toContain('fill="none" stroke="currentColor" stroke-width="1.2"');
    expect(svgFile.contents).toContain('stroke-linecap="round" stroke-linejoin="round"');
    // 오프셋(4,4)은 transform 속성이 아니라 path 데이터에 직접 구워진다.
    expect(svgFile.contents).toContain('d="M4 4L20 20"');
    expect(svgFile.contents).not.toContain("transform=");
    // 회전 변형(90°)도 행렬 합성으로 path에 구워진다: (0,0)→(16,0), (16,16)→(0,16).
    const rotated = fileBy(result, ".podo/icons/svg/figma/arrow-right.svg");
    expect(rotated.contents).toContain('d="M16 0L0 16"');
    expect(manifest.codepointLock["arrow-left"]).toBe("E001");
    expect(manifest.groups.figma).toEqual(["arrow-left", "arrow-right"]);
    // 컴포넌트 스펙으로는 생성되지 않는다.
    expect(result.files.some((item) => item.path.includes("icon-arrow.component"))).toBe(false);
  });

  it("suffixes duplicate component names and forwards export warnings", () => {
    expect(
      result.files.some(
        (file) => file.path === ".podo/components/local/primary-button-2.component.json"
      )
    ).toBe(true);
    expect(result.warnings).toContain("figma export: export-side warning");
  });

  it("is idempotent for the same input", () => {
    const again = convertPodoClone(parsePodoCloneDocument(fixtureDocument()));
    expect(JSON.stringify(again)).toBe(JSON.stringify(result));
  });

  it("converts the committed plugin export sample deterministically", async () => {
    const raw = parsePodoCloneDocument(JSON.parse(await readFile(SAMPLE_PATH, "utf8")));
    const converted = convertPodoClone(raw);
    expect(converted.files.length).toBeGreaterThan(3);
    // Every emitted token document must round-trip the spec parser.
    for (const file of converted.files) {
      if (file.document.kind === "tokens") {
        expect(() => parseTokenDocument(file.document)).not.toThrow();
      }
    }
    const again = convertPodoClone(raw);
    expect(JSON.stringify(again.files)).toBe(JSON.stringify(converted.files));
  });

  it.skipIf(!existsSync(SNAPSHOT_PATH))(
    "converts the full local plugin snapshot when present",
    { timeout: 120_000 },
    async () => {
      const raw = parsePodoCloneDocument(JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")));
      const converted = convertPodoClone(raw);
      expect(converted.files.length).toBeGreaterThan(10);
      const again = convertPodoClone(raw);
      expect(JSON.stringify(again.files)).toBe(JSON.stringify(converted.files));
    }
  );
});

describe("podo import", () => {
  it("plans without writing on --dry-run and applies with --yes", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);

    const exportPath = join(root, "export.json");
    await writeFile(exportPath, JSON.stringify(fixtureDocument()));

    await expect(runCli(["import", "--file", exportPath, "--dry-run"], io)).resolves.toBe(0);
    expect(
      io.out.some((line) => line.includes("[podo:plan] create .podo/tokens/figma-primitive.json"))
    ).toBe(true);
    await expect(stat(join(root, ".podo/tokens/figma-primitive.json"))).rejects.toThrow();

    await expect(runCli(["import", "--file", exportPath, "--yes"], io)).resolves.toBe(0);
    const written = JSON.parse(
      await readFile(join(root, ".podo/themes/figma-theme.json"), "utf8")
    ) as TokenDocument;
    expect(tokenAt(written, "dark.text.basic").$value).toBe("#ffffff");
    await expect(
      stat(join(root, ".podo/components/local/primary-button.component.json"))
    ).resolves.toBeDefined();

    // The imported project must validate cleanly (tokens + component bindings).
    const report = await validateProject(parseArgs(["validate"]), io);
    expect(report.issues).toEqual([]);

    // Re-import over existing files reports updates, not creates.
    const rerunIo = createIo(root);
    await expect(runCli(["import", "--file", exportPath, "--yes"], rerunIo)).resolves.toBe(0);
    expect(
      rerunIo.out.some((line) =>
        line.includes("[podo:plan] update .podo/tokens/figma-primitive.json")
      )
    ).toBe(true);
  });

  it("rejects invalid payloads without writing", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);
    const exportPath = join(root, "broken.json");
    await writeFile(exportPath, JSON.stringify({ format: "podo-clone", version: 999 }));

    await expect(runCli(["import", "--file", exportPath, "--yes"], io)).resolves.toBe(1);
    expect(io.err.some((line) => line.includes("schema validation"))).toBe(true);
    await expect(stat(join(root, ".podo/tokens/figma-primitive.json"))).rejects.toThrow();
  });

  it("requires --yes when not attached to a terminal", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);
    const exportPath = join(root, "export.json");
    await writeFile(exportPath, JSON.stringify(fixtureDocument()));

    await expect(runCli(["import", "--file", exportPath], io)).resolves.toBe(1);
    expect(io.err.some((line) => line.includes("--yes"))).toBe(true);
    await expect(stat(join(root, ".podo/tokens/figma-primitive.json"))).rejects.toThrow();
  });

  it("errors when --file is passed without a path", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);

    await expect(runCli(["import", "--file"], io)).resolves.toBe(1);
    expect(io.err.some((line) => line.includes("--file requires a path"))).toBe(true);
  });

  it("receives a plugin payload over the bridge and applies after interactive confirmation", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);

    const stdin = fakeTtyStdin();
    // --yes must NOT auto-apply network payloads; the prompt still gates it.
    const run = runCli(["import", "--yes"], { ...io, stdin });
    const port = await waitForListeningPort(io);

    const response = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fixtureDocument()),
    });
    expect(response.status).toBe(200);
    stdin.push("yes\n");
    await expect(run).resolves.toBe(0);
    expect(io.out.some((line) => line.includes("--yes is ignored"))).toBe(true);
    await expect(stat(join(root, ".podo/tokens/figma-primitive.json"))).resolves.toBeDefined();
  });

  it("refuses unattended network imports without a terminal", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);

    const run = runCli(["import", "--yes"], io); // io.stdin is undefined (no TTY)
    const port = await waitForListeningPort(io);
    const response = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fixtureDocument()),
    });
    expect(response.status).toBe(200);
    await expect(run).resolves.toBe(1);
    expect(io.err.some((line) => line.includes("interactive confirmation"))).toBe(true);
    await expect(stat(join(root, ".podo/tokens/figma-primitive.json"))).rejects.toThrow();
  });

  it("rejects foreign origins and invalid payloads while continuing to wait", async () => {
    const root = await createProject();
    const io = createIo(root);
    await runCli(["init", "--target", "react", "--yes"], io);

    const stdin = fakeTtyStdin();
    const run = runCli(["import"], { ...io, stdin });
    const port = await waitForListeningPort(io);

    const preflight = await fetch(`http://127.0.0.1:${port}/import`, { method: "OPTIONS" });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe("*");

    // A drive-by web page (real Origin header) is refused.
    const foreign = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify(fixtureDocument()),
    });
    expect(foreign.status).toBe(403);

    // An invalid payload is refused without tearing the session down.
    const invalid = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nope: true }),
    });
    expect(invalid.status).toBe(400);

    // The real plugin request (Origin: null) still succeeds afterwards.
    const valid = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "null" },
      body: JSON.stringify(fixtureDocument()),
    });
    expect(valid.status).toBe(200);
    stdin.push("yes\n");
    await expect(run).resolves.toBe(0);
    await expect(stat(join(root, ".podo/tokens/figma-primitive.json"))).resolves.toBeDefined();
  });
});

function fakeTtyStdin(): NodeJS.ReadStream {
  const stream = new Readable({ read() {} }) as unknown as NodeJS.ReadStream;
  (stream as { isTTY: boolean }).isTTY = true;
  return stream;
}

async function waitForListeningPort(io: { out: string[] }): Promise<number> {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const line = io.out.find((entry) => entry.includes("Waiting for the Figma plugin"));
    const match = line?.match(/localhost:(\d+)/);
    if (match) {
      return Number.parseInt(match[1]!, 10);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 25));
  }
  throw new Error("import listener did not start");
}

async function createProject(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "podo-import-"));
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ name: "fixture", type: "module", dependencies: { react: "^19.0.0" } }, null, 2)}\n`
  );
  return root;
}

function createIo(root: string): CliIO & { out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return {
    cwd: root,
    stdout: { log: (message: string) => out.push(message) },
    stderr: { error: (message: string) => err.push(message) },
    out,
    err,
  };
}
