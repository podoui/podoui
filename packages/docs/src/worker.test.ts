import { describe, expect, it } from "vitest";
import { app, type AssetsBinding } from "./worker.js";

function createAssets(): AssetsBinding {
  return {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/") {
        return new Response('<!doctype html><div id="root"></div>', {
          headers: { "content-type": "text/html; charset=UTF-8" },
        });
      }
      if (pathname === "/assets/app.js") {
        return new Response("console.log('podo')", {
          headers: { "content-type": "text/javascript" },
        });
      }
      return new Response("Not found", { status: 404 });
    },
  };
}

describe("docs Hono worker", () => {
  it("serves existing static assets unchanged", async () => {
    const response = await app.request(
      "https://podoui.com/assets/app.js",
      {},
      { ASSETS: createAssets() }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
  });

  it("falls back clean document paths to the React app shell", async () => {
    const response = await app.request("https://podoui.com/button", {}, { ASSETS: createAssets() });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(await response.text()).toContain('id="root"');
  });

  it("keeps missing file requests as 404 responses", async () => {
    const response = await app.request(
      "https://podoui.com/assets/missing.js",
      {},
      { ASSETS: createAssets() }
    );

    expect(response.status).toBe(404);
  });
});
