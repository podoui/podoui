import type { ReactNode } from "react";

/**
 * A titled documentation section: divider (except the first) + h2 + optional
 * description + content. Matches the section rhythm in the Figma foundation pages.
 */
export function DocSection({
  index,
  title,
  description,
  children,
}: {
  /** 0-based section index; a divider is drawn before every section after the first. */
  index: number;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      {index > 0 ? <hr className="doc-divider" /> : null}
      <h2>{title}</h2>
      {description ? <p className="lead">{description}</p> : null}
      {children}
    </section>
  );
}
