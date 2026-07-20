import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "**/dist/**",
      "coverage/**",
      "**/coverage/**",
      "node_modules/**",
      "**/node_modules/**",
      ".changeset/**",
      "pnpm-lock.yaml",
      "figma-plugin/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // v1에서 포팅한 vendor 소스 — 미사용 심볼/any 정리는 후속 리팩토링에서.
    files: ["packages/react/src/datepicker.tsx", "packages/react/src/editor/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
    },
  }
);
