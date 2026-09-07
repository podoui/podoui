// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NAV } from "./nav.js";
import { pageMetadata, routes, structuredData, updatePageMetadata } from "./seo.js";

describe("docs search metadata", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });
  it("covers each public navigation route once", () => {
    expect(routes.map((route) => route.slug)).toEqual(["", ...NAV.map((item) => item.slug)]);
    expect(new Set(routes.map((route) => route.slug)).size).toBe(routes.length);
  });
  it("updates canonical, social metadata and schema when navigating", () => {
    updatePageMetadata("button");
    updatePageMetadata("setup");
    expect(document.title).toBe("설치와 토큰 적용 | Podo UI");
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://podoui.com/setup"
    );
    expect(document.head.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      "https://podoui.com/setup"
    );
    expect(JSON.parse(document.getElementById("page-schema")!.textContent!)).toEqual(
      structuredData("setup")
    );
    updatePageMetadata("missing");
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex,follow"
    );
    expect(pageMetadata("").robots).toContain("index,follow");
  });
  it("does not send analytics from local and preview origins", () => {
    const gtag = vi.fn();
    Object.assign(window, { gtag });
    updatePageMetadata("button");
    expect(gtag).not.toHaveBeenCalled();
    Reflect.deleteProperty(window, "gtag");
  });
  it("tracks initial, forward and backward visits once with sanitized URLs", async () => {
    vi.resetModules();
    const gtag = vi.fn();
    vi.stubGlobal("window", { location: { origin: "https://podoui.com" }, gtag });
    try {
      const { updatePageMetadata: update } = await import("./seo.js");
      update("button");
      update("button");
      update("setup");
      update("button");
      expect(gtag).toHaveBeenCalledTimes(3);
      expect(gtag.mock.calls[0]).toEqual([
        "event",
        "page_view",
        {
          page_title: "Button | Podo UI",
          page_location: "https://podoui.com/button",
          page_referrer: "",
        },
      ]);
      expect(gtag.mock.calls[2]?.[2].page_referrer).toBe("https://podoui.com/setup");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
