import { Hono } from "hono";

export interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Bindings {
  ASSETS: AssetsBinding;
}

export const app = new Hono<{ Bindings: Bindings }>();

app.all("*", async (context) => {
  const assetResponse = await context.env.ASSETS.fetch(context.req.raw);
  if (
    assetResponse.status !== 404 ||
    !["GET", "HEAD"].includes(context.req.method) ||
    new URL(context.req.url).pathname.split("/").at(-1)?.includes(".")
  ) {
    return assetResponse;
  }
  const notFoundUrl = new URL("/404", context.req.url);
  const notFound = await context.env.ASSETS.fetch(new Request(notFoundUrl));
  return new Response(context.req.method === "HEAD" ? null : await notFound.text(), {
    status: 404,
    headers: { "content-type": "text/html; charset=UTF-8", "x-robots-tag": "noindex" },
  });
});

export default app;
