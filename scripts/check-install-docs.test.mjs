import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = new URL("../", import.meta.url);
const installGuides = [
  "README.md",
  "packages/podo-ui/README.md",
  "packages/docs/src/pages/SetupPage.tsx",
];

describe("installation documentation", () => {
  it.each(installGuides)("keeps the executable CLI order in %s", async (path) => {
    const source = await readFile(new URL(path, repositoryRoot), "utf8");
    const init = source.indexOf("npx podo-ui init");
    const importDesign = source.indexOf("npx podo-ui import");
    const validate = source.indexOf("npx podo-ui validate");
    const dryRun = source.indexOf("npx podo-ui build --dry-run");
    const build = source.indexOf("npx podo-ui build", dryRun + 1);

    expect(init).toBeGreaterThanOrEqual(0);
    expect(importDesign).toBeGreaterThan(init);
    expect(validate).toBeGreaterThan(importDesign);
    expect(dryRun).toBeGreaterThan(validate);
    expect(build).toBeGreaterThan(dryRun);
  });

  it("does not document CSS aliases that the CLI never emits", async () => {
    const sources = await Promise.all(
      ["packages/docs/src/pages/SetupPage.tsx", "packages/docs/src/pages/setup-examples.ts"].map(
        async (path) => readFile(new URL(path, repositoryRoot), "utf8")
      )
    );
    const combined = sources.join("\n");

    expect(combined).not.toContain("/assets/podo.css");
    expect(combined).not.toContain("/assets/podo-icons.css");
    expect(combined).not.toContain("/assets/app.css");
    expect(combined).toContain("podo-ui/styles.css");
    expect(combined).toContain("podo-ui/styles.css?raw");
    expect(combined).toContain("./podo/tokens.css?raw");
    expect(combined).toContain("./podo/components.css?raw");
    expect(combined).toContain("--out-dir public/podo");
    expect(combined).toContain("/podo/tokens.css");
  });
});
