import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("hono-ssr sample app", () => {
  it("serves pages with a strict CSP and only external assets", async () => {
    const response = await app.request("/form");
    expect(response.status).toBe(200);
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    const html = await response.text();
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/);
    expect(html).not.toContain("<style");
    expect(html).toContain('type="date"');
    expect(html).toContain('formaction="/echo"');
    // 동작 스크립트는 외부 정적 파일 하나(CSP 'self').
    expect(html).toContain('<script defer="" src="/assets/client.js"></script>');
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
