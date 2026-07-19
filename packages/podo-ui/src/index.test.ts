import { describe, expect, it } from "vitest";

describe("podo-ui meta package", () => {
  it("re-exports every @podoui subpath with a non-empty surface", async () => {
    const modules = await Promise.all([
      import("./spec.js"),
      import("./tokens.js"),
      import("./icons.js"),
      import("./core.js"),
      import("./web.js"),
      import("./react.js"),
      import("./hono.js"),
      import("./native.js"),
    ]);
    for (const module of modules) {
      expect(Object.keys(module).length).toBeGreaterThan(0);
    }
  });
});
