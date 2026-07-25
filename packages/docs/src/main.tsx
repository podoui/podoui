import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
