/**
 * "properties" label + value pills row (Figma 538:6690 component pages).
 * Lists the values of a component variant axis.
 */
export function PropertyTags({ values }: { values: string[] }) {
  return (
    <div className="prop-tags">
      <span className="prop-tags__label">properties</span>
      {values.map((v) => (
        <span className="prop-tags__value" key={v}>
          {v}
        </span>
      ))}
    </div>
  );
}
