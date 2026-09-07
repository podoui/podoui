import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App.js";
// Pretendard 셀프호스팅 (CDN 미사용) — 동적 서브셋 CSS와 woff2가 번들에 포함된다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "podo-ui/styles.css";
// Real consumer output from this package's committed .podo configuration.
import "./podo/tokens.css";
import "./podo/components.css";
import "./podo/icons/PodoIcons.css";
import "./site.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

const initialSlug = root.getAttribute("data-page-slug");
const app = (
  <StrictMode>
    <App {...(initialSlug === null ? {} : { initialSlug })} />
  </StrictMode>
);
if (initialSlug === null) {
  createRoot(root).render(app);
} else {
  hydrateRoot(root, app);
}
