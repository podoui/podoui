import { Hono } from "hono";

export interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Bindings {
  ASSETS: AssetsBinding;
}

function isDocumentRoute(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return false;
  }

  const pathname = new URL(request.url).pathname;
  const lastSegment = pathname.split("/").at(-1) ?? "";
  return !lastSegment.includes(".");
}

export const app = new Hono<{ Bindings: Bindings }>();

app.all("*", async (context) => {
  const assetResponse = await context.env.ASSETS.fetch(context.req.raw);
  if (assetResponse.status !== 404 || !isDocumentRoute(context.req.raw)) {
    return assetResponse;
  }

  const indexUrl = new URL(context.req.url);
  indexUrl.pathname = "/";
  return context.env.ASSETS.fetch(new Request(indexUrl, context.req.raw));
});

export default app;
