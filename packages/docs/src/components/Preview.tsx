import { useState, type ReactNode } from "react";

export interface CodeTab {
  /** Target key, e.g. "react" | "web" | "hono" | "native". */
  target: string;
  label: string;
  code: string;
}

interface PreviewProps {
  tabs: CodeTab[];
  children: ReactNode;
}

/** Live component render on top, per-target code tabs with copy below. */
export function Preview({ tabs, children }: PreviewProps) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = tabs[active] ?? tabs[0];

  async function copy() {
    if (!current) {
      return;
    }
    try {
      await navigator.clipboard.writeText(current.code);
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
        {tabs.map((tab, index) => (
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
        <pre>
          <code>{current?.code}</code>
        </pre>
      </div>
    </div>
  );
}
