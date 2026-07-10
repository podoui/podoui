/**
 * "base" marker (Figma component 95:375): a small dot on top, a vertical line
 * dropping from it to a rounded "base" pill below. Shared by the Color and
 * Button foundation pages so both render identically.
 */
export function BaseMarker() {
  return (
    <span className="base-marker">
      <span className="base-marker__dot" />
      <span className="base-marker__line" />
      <span className="base-marker__pill">base</span>
    </span>
  );
}
