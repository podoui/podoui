export function utilityTabs(className: string, label: string) {
  return [
    {
      target: "html",
      label: "HTML",
      language: "markup" as const,
      code: `<link rel="stylesheet" href="/assets/podo-ui/styles.css" />\n\n<div class="${className}">${label}</div>`,
    },
    {
      target: "react",
      label: "React",
      code: `export function Example() {\n  return <div className="${className}">${label}</div>;\n}`,
    },
    {
      target: "hono",
      label: "Hono SSR",
      code:
        `import { Hono } from "hono";\n\n` +
        `import { html } from "hono/html";\n\n` +
        `const app = new Hono();\n` +
        `app.get("/", (c) => c.html(html\`\n` +
        `  <!doctype html>\n` +
        `  <link rel="stylesheet" href="/assets/podo-ui/styles.css" />\n` +
        `  <div class="${className}">${label}</div>\n` +
        `\`));`,
    },
  ];
}

export const UTILITY_PLATFORM_ROWS = [
  ["HTML / CSS", "지원", 'podo-ui/styles.css를 로드하고 class="…" 사용'],
  ["React · Next.js", "지원", 'className="…" 사용'],
  ["Hono CSR", "지원", "React island에서 className 사용"],
  ["Hono SSR", "지원", "서버 HTML에 class를 직접 출력"],
  ["React Native", "미지원", "CSS class 대신 style prop과 Podo 토큰 사용"],
] as const;
