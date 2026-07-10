import type { ReactNode } from "react";

/** Foundation-page header: title (h1) + intro paragraph. */
export function PageHeader({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <>
      <h1>{title}</h1>
      {intro ? <p className="lead">{intro}</p> : null}
    </>
  );
}
