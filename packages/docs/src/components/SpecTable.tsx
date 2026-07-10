import type { ReactNode } from "react";

/**
 * Generic spec table used by foundation pages (e.g. the typography size/weight
 * tables). Reuses the `.spec-table` styling shared with the component props table.
 */
export function SpecTable({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
  return (
    <table className="spec-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
