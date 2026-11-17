import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("hono-ssr sample app", () => {
  it("serves pages with a strict CSP and only external assets", async () => {
    const response = await app.request("/form");
    expect(response.status).toBe(200);
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe/);
    const html = await response.text();
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/);
    expect(html).not.toContain("<style");
    expect(html).toContain('type="date"');
    expect(html).toContain('formaction="/echo"');
    // 동작 스크립트는 외부 정적 파일 하나(CSP 'self').
    expect(html).toContain('<script defer="" src="/assets/client.js"></script>');
  });

  it("keeps inline style attributes within style-src-attr (T5 F7)", async () => {
    // 인라인 style 속성은 style-src-attr로만 허용돼요 — <style> 요소·인라인 스크립트는 없어요.
    const response = await app.request("/overlays");
    const csp = response.headers.get("content-security-policy") ?? "";
    const html = await response.text();
    expect(html).toContain('class="podo-toaster" data-position="top-right" style=');
    expect(csp).toContain("style-src-attr 'unsafe-inline'");
    expect(html).not.toContain("<style");
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/);
  });

  it("renders the island pages", async () => {
    for (const [path, island] of [
      ["/select-chip", "Select"],
      ["/datepicker", "DatePicker"],
      ["/overlays", "Table"],
    ] as const) {
      const response = await app.request(path);
      expect(response.status, path).toBe(200);
      expect(await response.text()).toContain(`data-podo-island="${island}"`);
    }
  });

  it("echoes submitted GET form values", async () => {
    const response = await app.request("/echo?title=a&day=2026-11-17&action=link");
    const html = await response.text();
    expect(html).toContain("<dt>day</dt><dd>2026-11-17</dd>");
    expect(html).toContain("<dt>action</dt><dd>link</dd>");
  });

  it("serves the shipped stylesheet and icon font assets", async () => {
    for (const [path, type] of [
      ["/assets/styles.css", "text/css"],
      ["/assets/PodoIcons.css", "text/css"],
      ["/assets/PodoIcons.woff2", "font/woff2"],
      ["/assets/client.js", "text/javascript"],
    ] as const) {
      const response = await app.request(path);
      expect(response.status, path).toBe(200);
      expect(response.headers.get("content-type")).toContain(type);
    }
    expect((await app.request("/assets/..%2Fpackage.json")).status).toBe(404);
  });
});
