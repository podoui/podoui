import { useState, type ReactNode } from "react";
import { Highlight, themes, type Language } from "prism-react-renderer";

export interface CodeTab {
  /** Target key, e.g. "react" | "next" | "hono" | "native". */
  target: string;
  label: string;
  code: string;
  /** Prism language. Component examples default to TSX. */
  language?: Language;
}

interface PreviewProps {
  tabs: CodeTab[];
  children: ReactNode;
}

/** Live component render on top, per-target code tabs with copy below. */
export function Preview({ tabs, children }: PreviewProps) {
  const visibleTabs = normalizeTabs(tabs);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = visibleTabs[active] ?? visibleTabs[0];
  const code = current ? completeExample(current) : "";

  async function copy() {
    if (!current) {
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard blocked (e.g. insecure context) — leave the button as-is.
    }
  }

  return (
    <div className="preview">
      <div className="preview__stage">{children}</div>
      <div className="preview__tabs" role="tablist" aria-label="Code targets">
        {visibleTabs.map((tab, index) => (
          <button
            key={tab.target}
            className="preview__tab"
            role="tab"
            aria-selected={index === active}
            onClick={() => setActive(index)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="preview__code">
        <button className="copy-btn" onClick={copy} type="button">
          {copied ? "Copied" : "Copy"}
        </button>
        <Highlight theme={themes.nightOwl} code={code} language={current?.language ?? "tsx"}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={style}
              tabIndex={0}
              aria-label={`${current?.label ?? ""} 예제 코드`}
            >
              <code>
                {tokens.map((line, lineIndex) => (
                  <span key={lineIndex} {...getLineProps({ line })}>
                    <span className="code-line__number" aria-hidden="true">
                      {lineIndex + 1}
                    </span>
                    <span className="code-line__content">
                      {line.map((token, tokenIndex) => (
                        <span key={tokenIndex} {...getTokenProps({ token })} />
                      ))}
                    </span>
                  </span>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}

/**
 * The public docs describe framework integrations, not the low-level Custom
 * Elements renderer. React and Next.js are intentionally separate so a copied
 * Next.js sample always includes its client-boundary requirement.
 */
function normalizeTabs(tabs: CodeTab[]): CodeTab[] {
  return tabs.flatMap((tab) => {
    if (tab.target === "web") return [];
    if (tab.target === "hono") {
      return [{ ...tab, target: "hono-ssr", label: "Hono SSR" }];
    }
    if (tab.target !== "react") return [tab];

    const frameworkNeutralCode = tab.code
      .replace(/^\s*["']use client["'];\s*/m, "")
      .replace(/^.*Next\.js App Router.*\n/m, "");
    return [
      { ...tab, target: "react", label: "React", code: frameworkNeutralCode },
      {
        ...tab,
        target: "next",
        label: "Next.js",
        code: `"use client";\n\n${frameworkNeutralCode}`,
      },
      {
        ...tab,
        target: "hono-csr",
        label: "Hono CSR",
        code: frameworkNeutralCode,
      },
    ];
  });
}

/**
 * Short component examples remain easy to maintain in their page files while
 * the rendered and copied example is complete enough to paste into a project.
 */
function completeExample(tab: CodeTab): string {
  if (tab.target === "hono-csr") {
    return completeHonoCsrExample(tab.code);
  }

  if (/^\s*import\s/m.test(tab.code)) {
    return tab.code;
  }

  if (tab.target === "react" || tab.target === "next") {
    const components = Array.from(
      new Set(Array.from(tab.code.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g), (match) => match[1]))
    );
    if (components.length > 0) {
      const componentCode =
        tab.target === "next" ? tab.code.replace(/^\s*["']use client["'];\s*/m, "") : tab.code;
      const source = `import { ${components.join(", ")} } from "podo-ui/react";\nimport "podo-ui/styles.css";\n\n${componentCode}`;
      return tab.target === "next" ? `"use client";\n\n${source}` : source;
    }
  }

  return tab.code;
}

/**
 * Hono's client-side option is a React island mounted into the HTML shell that
 * Hono serves. Keep it distinct from podo-ui/hono's static SSR renderer so the
 * two runtime contracts are never presented as interchangeable.
 */
function completeHonoCsrExample(code: string): string {
  const shellComment =
    `// Hono 응답에 <div id="podo-root"></div>와\n` +
    `// <script type="module" src="/src/podo-client.tsx"></script>를 포함하세요.\n`;
  const rootImport = `import { createRoot } from "react-dom/client";\n`;
  const componentName = code.match(
    /(?:export\s+default\s+|export\s+)?function\s+([A-Z][A-Za-z0-9]*)\s*\(/
  )?.[1];

  if (componentName) {
    const source = completeReactExample(code);
    return (
      shellComment +
      rootImport +
      source +
      `\n\nconst root = document.getElementById("podo-root");\n` +
      `if (!root) throw new Error("#podo-root를 찾을 수 없습니다.");\n` +
      `createRoot(root).render(<${componentName} />);`
    );
  }

  const importMatches = Array.from(code.matchAll(/^import\s+.*;$/gm));
  const lastImport = importMatches.at(-1);
  if (lastImport?.index !== undefined) {
    const importEnd = lastImport.index + lastImport[0].length;
    const imports = code.slice(0, importEnd).trim();
    const jsx = code.slice(importEnd).trim();
    return createHonoIsland(shellComment, rootImport, imports, jsx);
  }

  const components = Array.from(
    new Set(Array.from(code.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g), (match) => match[1]))
  );
  const imports =
    components.length > 0
      ? `import { ${components.join(", ")} } from "podo-ui/react";\nimport "podo-ui/styles.css";`
      : `import "podo-ui/styles.css";`;
  return createHonoIsland(shellComment, rootImport, imports, code.trim());
}

function completeReactExample(code: string): string {
  if (/^\s*import\s/m.test(code)) {
    return code;
  }

  const components = Array.from(
    new Set(Array.from(code.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g), (match) => match[1]))
  );
  if (components.length === 0) {
    return code;
  }

  return `import { ${components.join(", ")} } from "podo-ui/react";\nimport "podo-ui/styles.css";\n\n${code}`;
}

function createHonoIsland(
  shellComment: string,
  rootImport: string,
  imports: string,
  jsx: string
): string {
  const leadingComments: string[] = [];
  const jsxLines = jsx.split("\n");
  while (jsxLines[0]?.trimStart().startsWith("//")) {
    leadingComments.push(jsxLines.shift()!.trim());
  }
  const commentBlock = leadingComments.length > 0 ? `${leadingComments.join("\n")}\n` : "";

  return (
    shellComment +
    rootImport +
    imports +
    `\n\n${commentBlock}function PodoIsland() {\n` +
    `  return (\n    <>\n${indent(jsxLines.join("\n").trim(), 6)}\n    </>\n  );\n}\n\n` +
    `const root = document.getElementById("podo-root");\n` +
    `if (!root) throw new Error("#podo-root를 찾을 수 없습니다.");\n` +
    `createRoot(root).render(<PodoIsland />);`
  );
}

function indent(value: string, spaces: number): string {
  const prefix = " ".repeat(spaces);
  return value
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}
