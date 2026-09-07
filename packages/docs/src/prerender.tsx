import { renderToString } from "react-dom/server";
import { App } from "./App.js";
export { routes, pageMetadata, structuredData } from "./seo.js";
export function render(slug: string): string {
  return renderToString(<App initialSlug={slug} />);
}
