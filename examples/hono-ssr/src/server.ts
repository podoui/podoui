// 샘플 실행기 — 의존성을 늘리지 않으려 node:http 위에 app.fetch를 얹어요.
// `pnpm --filter @podoui/example-hono-ssr build && pnpm --filter @podoui/example-hono-ssr start`
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { app } from "./app.js";

const port = Number(process.env.PORT ?? 8787);

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) {
      headers.set(name, Array.isArray(value) ? value.join(", ") : value);
    }
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method ?? "GET",
    headers,
    ...(hasBody ? { body: Readable.toWeb(request) as ReadableStream, duplex: "half" } : {}),
  };
  void Promise.resolve(app.fetch(new Request(url, init))).then(async (result) => {
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(Buffer.from(await result.arrayBuffer()));
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`podo hono-ssr sample: http://127.0.0.1:${port}/`);
});
