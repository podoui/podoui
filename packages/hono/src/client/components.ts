import type { FC } from "hono/jsx";
import { Chip, DatePicker, Select, Switch, Table, Toaster, Tooltip, toast } from "@podoui/react";

/**
 * 타입 경계 파일(계획 D12) — React 컴포넌트 소스를 hono FC로 단언하는 유일한 곳이에요.
 * 배포 번들은 react → hono/jsx/dom 별칭으로 같은 소스를 묶어서 이 값들이 그대로
 * hono 컴포넌트가 돼요. 등록 이름은 SSR 래퍼의 data-podo-island 값이에요.
 */
export type IslandComponent = FC<Record<string, unknown>>;

export const islandComponents: Record<string, IslandComponent> = {
  Select: Select as unknown as IslandComponent,
  Chip: Chip as unknown as IslandComponent,
  Switch: Switch as unknown as IslandComponent,
  DatePicker: DatePicker as unknown as IslandComponent,
  Tooltip: Tooltip as unknown as IslandComponent,
  Table: Table as unknown as IslandComponent,
  Toaster: Toaster as unknown as IslandComponent,
  // T6 Editor
};

/** React toast(같은 스토어) — window.podo.toast로 내보내요. */
export { toast };
