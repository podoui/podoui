import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it } from "vitest";
const execFile = promisify(execFileCallback);
const temporary: string[] = [];

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "podo-search-"));
  temporary.push(root);
  await mkdir(join(root, "scripts"));
  await mkdir(join(root, "dist/server"), { recursive: true });
  await writeFile(join(root, "package.json"), '{"type":"module"}');
  await copyFile(new URL("./prerender.mjs", import.meta.url), join(root, "scripts/prerender.mjs"));
  await writeFile(
    join(root, "dist/index.html"),
    await readFile(new URL("../index.html", import.meta.url))
  );
  await writeFile(
    join(root, "dist/server/prerender.js"),
    `
    export const routes = [{slug:'',title:'Home',description:'Intro'}, {slug:'button',title:'Button',description:'Usage',group:'Components'}];
    export const render = slug => '<main><h1>' + (slug || 'Home') + '</h1><p>Visible content</p></main>';
    export const pageMetadata = slug => ({ title:'Title & <test>', description:'Useful "description"', url:'https://podoui.com/'+slug, robots: slug==='404' ? 'noindex,follow' : 'index,follow' });
    export const structuredData = slug => ({name:'</script><script>bad</script>',url:slug});
  `
  );
  return root;
}

async function build(root: string, env: Record<string, string> = {}) {
  return execFile(process.execPath, [join(root, "scripts/prerender.mjs")], {
    env: { ...process.env, GOOGLE_ANALYTICS_ID: "", GOOGLE_SITE_VERIFICATION: "", ...env },
  });
}

afterEach(async () => {
  await Promise.all(temporary.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("search artifact generation", () => {
  it("writes crawlable pages and discovery files without duplicate or unsafe metadata", async () => {
    const root = await fixture();
    await build(root);
    for (const name of ["index", "button", "404"]) {
      const document = new JSDOM(await readFile(join(root, `dist/${name}.html`), "utf8")).window
        .document;
      expect(document.querySelector("main h1")).not.toBeNull();
      expect(document.querySelectorAll("title")).toHaveLength(1);
      expect(document.title).toBe("Title & <test>");
      expect(document.querySelectorAll('meta[name="description"]')).toHaveLength(1);
      expect(document.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
      expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
        'Useful "description"'
      );
      expect(JSON.parse(document.querySelector("#page-schema")!.textContent!).name).toContain(
        "</script>"
      );
      expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
      expect(document.documentElement.outerHTML).not.toContain("window.dataLayer");
    }
    expect(await readFile(join(root, "dist/sitemap.xml"), "utf8")).toContain(
      "<loc>https://podoui.com/button</loc>"
    );
    expect(await readFile(join(root, "dist/robots.txt"), "utf8")).toContain(
      "Sitemap: https://podoui.com/sitemap.xml"
    );
    expect(await readFile(join(root, "dist/llms.txt"), "utf8")).toContain(
      "https://podoui.com/button"
    );
    await expect(readFile(join(root, "dist/server/prerender.js"))).rejects.toThrow();
  });
  it("injects only validated Google identifiers", async () => {
    const root = await fixture();
    await expect(build(root, { GOOGLE_ANALYTICS_ID: 'G-123"<script>' })).rejects.toThrow();
    await expect(build(root, { GOOGLE_SITE_VERIFICATION: '"><script>' })).rejects.toThrow();
    await build(root, {
      GOOGLE_ANALYTICS_ID: "G-ABC123",
      GOOGLE_SITE_VERIFICATION: "token_123-test",
    });
    const html = await readFile(join(root, "dist/index.html"), "utf8");
    const document = new JSDOM(html).window.document;
    expect(
      document.querySelector('meta[name="google-site-verification"]')?.getAttribute("content")
    ).toBe("token_123-test");
    expect(html).toContain("send_page_view:false");
    expect(html).toContain("location.origin === 'https://podoui.com'");
    expect(html).toContain("gtag/js?id=G-ABC123");
  });
  it("rejects invalid route data before writing files", async () => {
    for (const replacement of ["../outside", 'button"bad', "404", "index", ""]) {
      const root = await fixture();
      const source = join(root, "dist/server/prerender.js");
      await writeFile(
        source,
        (await readFile(source, "utf8")).replace(
          "slug:'button'",
          `slug:${JSON.stringify(replacement)}`
        )
      );
      await expect(build(root)).rejects.toThrow();
    }
    const root = await fixture();
    const source = join(root, "dist/server/prerender.js");
    await writeFile(
      source,
      (await readFile(source, "utf8")).replace("group:'Components'", "group:''")
    );
    await expect(build(root)).rejects.toThrow();
  });
  it("preserves adjacent metadata with HTML-style tags and accepts root whitespace", async () => {
    const root = await fixture();
    const template = join(root, "dist/index.html");
    await writeFile(
      template,
      (await readFile(template, "utf8"))
        .replaceAll("/>", ">")
        .replace('<div id="root"></div>', '<div id="root">  </div>')
    );
    await build(root);
    const document = new JSDOM(await readFile(template, "utf8")).window.document;
    expect(document.querySelector('meta[name="theme-color"]')).not.toBeNull();
    expect(document.querySelector('meta[property="og:site_name"]')).not.toBeNull();
    expect(document.querySelector("#root")?.getAttribute("data-page-slug")).toBe("");
    expect(document.querySelector("main h1")).not.toBeNull();
  });
  it("fails explicitly when the template root changes", async () => {
    const root = await fixture();
    const template = join(root, "dist/index.html");
    await writeFile(template, (await readFile(template, "utf8")).replace('id="root"', 'id="app"'));
    await expect(build(root)).rejects.toThrow();
  });
});
