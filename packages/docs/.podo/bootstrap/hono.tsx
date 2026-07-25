import { renderCriticalCss } from "podo-ui/hono";

export function podoHead() {
  return renderCriticalCss({ theme: "landing", colorScheme: "light" });
}
