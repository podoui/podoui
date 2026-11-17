import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// hono/jsx/dom의 ESM 빌드 — 별칭 대상은 packages/hono가 의존하는 hono 하나로
// 고정해 테스트 코드와 React 소스가 같은 런타임 인스턴스를 공유하게 해요.
const honoRoot = realpathSync(new URL("./packages/hono/node_modules/hono", import.meta.url));
const honoClientTests = "packages/hono/src/client/**/*.test.{ts,tsx}";

export default defineConfig({
  resolve: {
    alias: {
      "react-native": fileURLToPath(new URL("./test/react-native-stub.ts", import.meta.url)),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/e2e/**"],
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "default",
          exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/e2e/**", honoClientTests],
        },
      },
      {
        // Hono 클라이언트 island는 packages/react 소스를 hono/jsx/dom 위에서 돌려요
        // (배포 번들과 같은 별칭) — 이 프로젝트의 테스트만 react를 갈아 끼워요.
        extends: true,
        resolve: {
          alias: [
            { find: /^react$/, replacement: `${honoRoot}/dist/jsx/dom/index.js` },
            { find: /^react-dom$/, replacement: `${honoRoot}/dist/jsx/dom/index.js` },
            {
              find: /^react\/jsx-runtime$/,
              replacement: `${honoRoot}/dist/jsx/dom/jsx-runtime.js`,
            },
            {
              find: /^react\/jsx-dev-runtime$/,
              replacement: `${honoRoot}/dist/jsx/dom/jsx-dev-runtime.js`,
            },
          ],
        },
        test: {
          name: "hono-client",
          include: [honoClientTests],
          environment: "jsdom",
        },
      },
    ],
  },
});
