import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  emitCssVariables,
  emitReactNativeTokens,
  emitTokenJsonBundle,
  emitTypeScriptTokens,
  mergeTokenDocuments,
  resolveTokenDocument,
  selectThemeTokens,
  validateTokenBuild,
  type ResolvedTokenBundle,
  type TokenSource,
} from "./index.js";
import { loadTokenDocuments } from "./node.js";

// Repo-relative so the origin filePaths captured in snapshots are stable across machines.
const specSamples = join("packages", "spec", "samples", "tokens");

describe("@podo/tokens", () => {
  it("loads package token files and project .podo overrides", async () => {
    const projectRoot = await mkdir(join(tmpdir(), `podo-tokens-${Date.now()}`), {
      recursive: true,
    });
    const projectTokensDir = join(projectRoot, ".podo/tokens");
    await mkdir(projectTokensDir, { recursive: true });
    await writeFile(
      join(projectTokensDir, "override.tokens.json"),
      JSON.stringify({
        schemaVersion: "2.0.0",
        kind: "tokens",
        category: "semantic",
        tokens: {
          color: {
            palette: {
              purple: {
                "600": {
                  $type: "color",
                  $value: "#111111",
                  $extensions: { podo: { scope: "primitive" } },
                },
              },
            },
          },
          semantic: {
            color: {
              action: {
                "project-primary": {
                  $type: "color",
                  $value: "{color.palette.purple.600}",
                  $extensions: { podo: { scope: "semantic" } },
                },
              },
            },
          },
        },
      })
    );

    const sources = await loadTokenDocuments({
      packageTokensDir: specSamples,
      projectTokensDir,
    });
    const merged = mergeTokenDocuments(sources);
    const resolved = resolveTokenDocument(merged);
    const issues = validateTokenBuild(sources);

    expect(issues).toEqual([]);
    expect(sources.some((source) => source.tier === "project")).toBe(true);
    expect(resolved.tokens["color.palette.purple.600"]?.value).toBe("#111111");
    expect(resolved.tokens["semantic.color.action.project-primary"]?.value).toBe("#111111");
    expect(resolved.origins["color.palette.purple.600"]?.tier).toBe("project");
  });

  it("resolves aliases, JSON pointers, component tokens, and theme selections", async () => {
    const sources = await loadTokenDocuments({ packageTokensDir: specSamples });
    const merged = mergeTokenDocuments(sources);
    const issues = validateTokenBuild(sources);
    const bundle = resolveTokenDocument(merged);
    const landing = selectThemeTokens(bundle, { theme: "landing", colorScheme: "light" });
    const dashboard = selectThemeTokens(bundle, { theme: "dashboard", colorScheme: "dark" });

    expect(issues).toEqual([]);
    expect(bundle.tokens["component.button.background"]?.value).toBe("#426CED");
    // Figma 538:6691 field column gap (spacing/3).
    expect(bundle.tokens["spacing.component.field-gap"]?.value).toBe("6px");
    expect(bundle.tokens["motion.transition.fast"]?.value).toEqual({
      duration: "120ms",
      easing: [0.2, 0, 0, 1],
    });
    expect(landing.tokens["component.input.background"]?.value).toBe("#FFFFFF");
    expect(dashboard.tokens["component.input.background"]?.value).toBe("#18181B");
    expect(dashboard.tokens["component.input.background"]?.references).toEqual([
      "semantic.color.surface",
    ]);
    // Typography is theme-independent now (size-only scale); fontSize is responsive.
    expect(landing.tokens["typography.display.xlarge"]?.value).toMatchObject({
      fontSize: { pc: "60px", tablet: "48px", mobile: "36px" },
    });
    expect(dashboard.tokens["typography.body.medium"]?.value).toMatchObject({
      fontSize: { pc: "16px" },
    });
  });

  it("lets the most specific selected theme and color-scheme token override base tokens", () => {
    const bundle = {
      origins: {},
      tokens: {
        "typography.h1": token("typography.h1", "base"),
        "typography.h1.landing": token("typography.h1.landing", "landing"),
        "typography.h1.dark": token("typography.h1.dark", "dark"),
        "typography.h1.landing.dark": token("typography.h1.landing.dark", "landing-dark"),
        "typography.h1.dashboard.dark": token("typography.h1.dashboard.dark", "dashboard-dark"),
      },
    } satisfies ResolvedTokenBundle;

    const selected = selectThemeTokens(bundle, { theme: "landing", colorScheme: "dark" });

    expect(selected.tokens["typography.h1"]?.value).toBe("landing-dark");
    expect(Object.keys(selected.tokens)).toEqual(["typography.h1"]);
  });

  it("emits CSS, TypeScript, React Native, and JSON bundles", async () => {
    const bundle = resolveTokenDocument(
      mergeTokenDocuments(await loadTokenDocuments({ packageTokensDir: specSamples }))
    );
    const css = emitCssVariables(bundle, {
      themes: ["landing", "dashboard"],
      colorSchemes: ["light", "dark"],
    });
    const ts = emitTypeScriptTokens(bundle);
    const rn = emitReactNativeTokens(
      selectThemeTokens(bundle, { theme: "dashboard", colorScheme: "light" })
    );
    const json = emitTokenJsonBundle(bundle);

    // Four base theme×scheme blocks (anchored to column 0; media-query overrides
    // also carry the selector but are indented).
    expect(css.match(/^\[data-podo-theme=/gm)).toHaveLength(4);
    expect(css).toContain('[data-podo-theme="landing"][data-color-scheme="light"]');
    // Responsive type scale: pc value is the base var; tablet/mobile are media queries.
    expect(css).toContain("--podo-typography-display-xlarge-fontSize: 60px;");
    expect(css).toContain("@media screen and (min-width: 768px) and (max-width: 1279px)");
    expect(css).toContain("--podo-typography-display-xlarge-fontSize: 48px;");
    expect(css).toContain("--podo-typography-display-xlarge-fontSize: 36px;");
    expect(css).toMatchSnapshot("theme-css");
    expect(ts).toMatchSnapshot("typescript-tokens");
    expect(rn).toMatchSnapshot("react-native-tokens");
    expect(json).toMatchSnapshot("json-bundle");
    expect(ts).toContain("export type TokenPath");
    expect(rn).toContain('"pc": 60');
    expect(json).toContain('"origin"');
  });

  it("reports duplicate token names in the same source tier", async () => {
    const sources = await loadTokenDocuments({ packageTokensDir: specSamples });
    const duplicate = sources.find((source) => source.filePath.endsWith("color.tokens.json"));
    expect(duplicate).toBeDefined();
    expect(validateTokenBuild([...sources, duplicate!])).toEqual([
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.0" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.gray.100" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.primary.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.secondary.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.accent.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.error.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.warning.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.success.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.info.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.orange.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.5" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.10" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.20" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.30" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.40" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.50" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.60" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.70" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.80" }),
      expect.objectContaining({ code: "token.duplicate", path: "color.palette.purple.90" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.text.default" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.text.inverse" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.text.subtle" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.text.muted" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.text.danger" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.action.primary" }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "semantic.color.action.primary-hover",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "semantic.color.action.primary-pressed",
      }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.surface" }),
      expect.objectContaining({ code: "token.duplicate", path: "semantic.color.dark.surface" }),
      expect.objectContaining({ code: "token.duplicate", path: "component.button.background" }),
      expect.objectContaining({ code: "token.duplicate", path: "component.button.text" }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-primary.background",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-primary.background-hover",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-primary.background-pressed",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-primary.text",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-assistive.background",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-assistive.text",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-white.background",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.solid-white.text",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-primary.background",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-primary.border",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-primary.text",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-assistive.background",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-assistive.border",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-assistive.text",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-white.background",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-white.border",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.outline-white.text",
      }),
      expect.objectContaining({
        code: "token.duplicate",
        path: "component.button.disabled.background",
      }),
      expect.objectContaining({ code: "token.duplicate", path: "component.button.disabled.text" }),
      expect.objectContaining({ code: "token.duplicate", path: "component.input.background" }),
      expect.objectContaining({ code: "token.duplicate", path: "component.input.border" }),
    ]);
  });

  it("reports circular aliases after package and project sources are merged", () => {
    const source: TokenSource = {
      filePath: "/project/.podo/tokens/circular.tokens.json",
      tier: "project",
      document: {
        schemaVersion: "2.0.0",
        kind: "tokens",
        category: "semantic",
        tokens: {
          semantic: {
            a: { $type: "string", $value: "{semantic.b}" },
            b: { $type: "string", $value: "{semantic.a}" },
          },
        },
      },
    };

    expect(validateTokenBuild([source])).toEqual([
      expect.objectContaining({ code: "token.reference.circular", path: "semantic.a" }),
    ]);
  });
});

function token(path: string, value: string): ResolvedTokenBundle["tokens"][string] {
  return {
    path,
    type: "string",
    value,
    rawValue: value,
    references: [],
  };
}
