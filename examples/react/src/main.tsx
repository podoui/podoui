import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

// Package-shipped component chrome + packaged icon font.
import "podo-ui/styles.css";
import "podo-ui/icons.css";
// Project build output from the podo CLI (`podo init` + `podo build`).
// Regenerate commands are documented at the top of ./App.tsx.
import "./podo/tokens.css";
import "./podo/components.css";
import "./podo/icons/PodoIcons.css";
// Example-app page chrome.
import "./example.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
