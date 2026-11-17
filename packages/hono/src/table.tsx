/** @jsxImportSource hono/jsx */

import { cloneElement, isValidElement, type Child } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import { createCheckboxBehavior } from "@podoui/core";
import { Island } from "./island.js";

export interface HonoTableProps {
  children: Child;
  /** grid: bordered frame with per-cell rules; horizon: row rules only. */
  type?: "grid" | "horizon";
  /**
   * 체크박스 선택 열(Figma) — 있으면 island가 돼요. 전체 선택·행 클릭·체크 열 드래그
   * 범위 선택은 podo-ui/hono/client가 같은 React Table로 처리해요(podo:selection-change).
   */
  checkbox?: boolean;
  /** 처음 선택된 tbody 행 인덱스(0부터). 비활성 행(data-disabled)은 빠져요. */
  defaultSelected?: number[];
  /** `<table>` id(React와 같은 위치) — checkbox island면 configure 키이기도 해요. */
  id?: string;
  class?: string;
}

export function Table({
  children,
  type = "horizon",
  checkbox,
  defaultSelected,
  id,
  class: className,
}: HonoTableProps): JSX.Element {
  const classes = className ? `podo-table ${className}` : "podo-table";
  if (!checkbox) {
    return (
      <table id={id} class={classes} data-type={type}>
        {children}
      </table>
    );
  }
  return (
    <Island
      name="Table"
      id={id}
      block
      props={{ id, type, checkbox: true, defaultSelected, className }}
    >
      <table
        id={id}
        class={classes}
        data-type={type}
        data-checkbox="true"
        data-podo-slot="children"
      >
        {withSelectionColumn(children, defaultSelected)}
      </table>
    </Island>
  );
}

const flatten = (child: Child): Child[] =>
  Array.isArray(child) ? child.flatMap(flatten) : [child];
const props = (element: unknown) => (element as { props: Record<string, unknown> }).props;
const tagOf = (element: unknown) => (element as { tag: unknown }).tag;

/**
 * React Table(checkbox) 첫 렌더의 선택 열 — 첫 thead 행에 전체 선택, tbody 행마다 행
 * 선택 칸을 앞에 붙여요. 이 칸과 행의 data-selected는 SSR 생성 표식이라 클라이언트가
 * 옮기지 않고 React가 상태로 다시 그려요.
 */
function withSelectionColumn(children: Child, defaultSelected: number[] = []): Child[] {
  const sections = flatten(children);
  const disabled = new Set<number>();
  let scan = 0;
  for (const section of sections) {
    if (isValidElement(section) && tagOf(section) === "tbody") {
      for (const row of flatten(props(section).children as Child)) {
        if (isValidElement(row)) {
          if (props(row)["data-disabled"]) {
            disabled.add(scan);
          }
          scan += 1;
        }
      }
    }
  }
  const selectable = Array.from({ length: scan }, (_, index) => index).filter(
    (index) => !disabled.has(index)
  );
  const selected = new Set(defaultSelected.filter((index) => !disabled.has(index)));
  const allSelected = selectable.length > 0 && selectable.every((index) => selected.has(index));
  const someSelected = selectable.some((index) => selected.has(index));

  let headerWired = false;
  let bodyIndex = 0;
  return sections.map((section) => {
    if (!isValidElement(section)) {
      return section;
    }
    if (tagOf(section) === "thead" && !headerWired) {
      headerWired = true;
      let firstRow = true;
      const rows = flatten(props(section).children as Child).map((row) => {
        if (!isValidElement(row) || !firstRow) {
          return row;
        }
        firstRow = false;
        return cloneElement(
          row,
          {},
          <th class="podo-table__check" data-podo-generated="">
            {checkboxMarkup("전체 선택", allSelected, !allSelected && someSelected, false)}
          </th>,
          ...flatten(props(row).children as Child)
        );
      });
      return cloneElement(section, {}, ...rows);
    }
    if (tagOf(section) === "tbody") {
      const rows = flatten(props(section).children as Child).map((row) => {
        if (!isValidElement(row)) {
          return row;
        }
        const index = bodyIndex++;
        const rowSelected = selected.has(index);
        // SSR이 단 속성은 생성 표식으로 — 클라이언트가 옮기지 않고 React가 다시 정해요.
        // data-disabled가 거짓(false·0·"")이면 DOM 문자열("false")이 참으로 읽히므로 같이
        // 빼요(T5 F2) — React Table은 Boolean(props["data-disabled"])로 판정해요.
        const generated = [
          ...(rowSelected ? ["data-selected"] : []),
          ...("data-disabled" in props(row) && !props(row)["data-disabled"]
            ? ["data-disabled"]
            : []),
        ];
        return cloneElement(
          row,
          {
            ...(rowSelected ? { "data-selected": "true" } : {}),
            ...(generated.length > 0 ? { "data-podo-generated": generated.join(" ") } : {}),
          },
          <td class="podo-table__check" data-podo-generated="">
            {checkboxMarkup(`행 ${index + 1} 선택`, rowSelected, false, disabled.has(index))}
          </td>,
          ...flatten(props(row).children as Child)
        );
      });
      return cloneElement(section, {}, ...rows);
    }
    return section;
  });
}

/** React Checkbox(라벨 없음)의 SSR 마크업. */
function checkboxMarkup(
  label: string,
  checked: boolean,
  indeterminate: boolean,
  disabled: boolean
): JSX.Element {
  const behavior = createCheckboxBehavior({ checked, indeterminate, disabled });
  return (
    <input
      aria-label={label}
      {...behavior.dataState}
      type="checkbox"
      class="podo-checkbox"
      checked={checked}
      disabled={disabled}
    />
  );
}
