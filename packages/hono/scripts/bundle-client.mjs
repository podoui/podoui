// podo-ui/hono/client 번들(계획 D1·D8) — packages/react/src TSX를 react → hono/jsx/dom
// 별칭으로 묶은 단일 IIFE. 배포 빌드(packages/podo-ui/build.mjs)와 테스트가 같은 설정을 써요.
import { build } from "esbuild";
import { URL, fileURLToPath } from "node:url";

const packages = fileURLToPath(new URL("../../", import.meta.url));

/**
 * @param {{ outfile?: string; version?: string }} [options]
 *   outfile이 있으면 파일로 쓰고, 없으면 번들 코드를 문자열로 돌려줘요.
 * @returns {Promise<string | undefined>}
 */
export async function bundleHonoClient({ outfile, version = "dev" } = {}) {
  const result = await build({
    entryPoints: [`${packages}hono/src/client/index.ts`],
    bundle: true,
    format: "iife",
    minify: true,
    target: "es2020",
    legalComments: "none",
    jsx: "automatic",
    jsxImportSource: "hono/jsx/dom",
    alias: {
      react: "hono/jsx/dom",
      "react-dom": "hono/jsx/dom",
      "react/jsx-runtime": "hono/jsx/dom/jsx-runtime",
      "react/jsx-dev-runtime": "hono/jsx/dom/jsx-dev-runtime",
      "@podoui/react": `${packages}react/src/index.tsx`,
      "@podoui/core": `${packages}core/src/index.ts`,
    },
    // React 소스(packages/react/src)에서도 hono를 packages/hono 의존성 하나로 찾게 해요.
    nodePaths: [`${packages}hono/node_modules`, `${packages}react/node_modules`],
    define: { __PODO_CLIENT_VERSION__: JSON.stringify(version) },
    logLevel: "silent",
    write: outfile !== undefined,
    ...(outfile !== undefined ? { outfile } : {}),
  });
  return outfile === undefined ? result.outputFiles[0].text : undefined;
}
