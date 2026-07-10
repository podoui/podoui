import type { ReactNode } from "react";
import { BaseMarker } from "./BaseMarker.js";

/**
 * Bordered content card used across all foundation/component pages.
 *
 * - default: children flow directly (Color scales, Typography samples).
 * - `plain`: stacks rows with gaps (base-color list).
 * - `stage`: centers children in a row sample stage (component previews).
 */
export function Card({
  plain = false,
  stage = false,
  children,
}: {
  plain?: boolean;
  stage?: boolean;
  children: ReactNode;
}) {
  const classes = ["doc-card", plain ? "doc-card--plain" : ""].filter(Boolean).join(" ");
  if (stage) {
    return (
      <div className={classes}>
        <div className="doc-card__stage">{children}</div>
      </div>
    );
  }
  return <div className={classes}>{children}</div>;
}

/**
 * A stage sample that optionally carries a "base" marker centered directly
 * below it (used for the size scale on component pages). Because the marker is
 * anchored to the sample itself, it stays aligned regardless of stage width or
 * the varying widths of neighboring samples.
 */
export function StageItem({ base = false, children }: { base?: boolean; children: ReactNode }) {
  return (
    <span className="stage-item">
      {children}
      {base ? (
        <span className="stage-item__base">
          <BaseMarker />
        </span>
      ) : null}
    </span>
  );
}
