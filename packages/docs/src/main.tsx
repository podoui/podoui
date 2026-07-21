import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
// Pretendard 셀프호스팅 (CDN 미사용) — 동적 서브셋 CSS와 woff2가 번들에 포함된다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./site.css";
import "podo-ui/styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
