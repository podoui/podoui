import { jsx } from "hono/jsx/dom";

/** A converted child: a hono/jsx/dom element or a text string. */
export type VChild = ReturnType<typeof jsx> | string;

/** id를 참조하는 속성 — SSR 전용 id 토큰을 뺄 때 봐요. */
export const ID_REF_PROPS = [
  "aria-describedby",
  "aria-labelledby",
  "aria-controls",
  "aria-activedescendant",
  "aria-owns",
];

// 마운트 뒤 살아 있는 flash Toast → 그 카드를 만든 SSR 원본. 바깥 island가 다시 렌더할 땐
// 원본에서 다시 변환하므로, 닫힌 카드는 원본을 잊어야 되살아나지 않아요(T5 F5).
const sources = new WeakMap<Element, Element>();
const forgotten = new WeakSet<Element>();

/** 살아 있는 요소가 닫혀 빠질 때 불러요 — 이후 재렌더에서 그 원본을 옮기지 않아요. */
export function forgetSource(live: Element): void {
  const source = sources.get(live);
  if (source) {
    forgotten.add(source);
  }
}

export interface DomToVNodeOptions {
  /** SSR이 만든 요소의 id(마운트 뒤엔 없음) — id 참조 속성에서 이 토큰을 빼요. */
  dropIds?: Set<string>;
  /**
   * Called for a nested `[data-podo-island]` wrapper instead of copying its
   * markup — returns the shared component element that replaces it (the
   * island protocol owns that conversion), or null to drop it.
   */
  island?: (wrapper: Element) => VChild | null;
}

/**
 * Rebuilds server-rendered slot markup as hono/jsx/dom elements so a shared
 * React component can receive it as `children`/slot props (no HTML strings).
 * Attributes pass through by their DOM names (`class`, `style` strings, `for`,
 * `aria-*`, `data-*`) — hono/jsx/dom applies them as-is. Form state is read
 * from live DOM properties (value/checked/selected, and the selected FileList
 * of file inputs) because a server-rendered boolean attribute (`checked=""`)
 * would set the property to "" (false), and the user may already have changed
 * it before the script loaded. Comments and other node types are dropped.
 */
export function domToVNode(nodes: Iterable<Node>, options: DomToVNodeOptions = {}): VChild[] {
  const out: VChild[] = [];
  for (const node of nodes) {
    if (node.nodeType === 3) {
      out.push((node as Text).data);
      continue;
    }
    if (node.nodeType !== 1) {
      continue;
    }
    const element = node as Element;
    // SSR 전용 마크업은 공유 컴포넌트가 다시 그려요 — 슬롯 정의(<template>)와
    // 생성 표식(data-podo-generated="")이 붙은 요소는 옮기지 않아요.
    if (
      element.localName === "template" ||
      element.getAttribute("data-podo-generated") === "" ||
      forgotten.has(element)
    ) {
      continue;
    }
    if (options.island && element.hasAttribute("data-podo-island")) {
      const replaced = options.island(element);
      if (replaced != null) {
        out.push(replaced);
      }
      continue;
    }
    out.push(elementToVNode(element, options));
  }
  return out;
}

function elementToVNode(element: Element, options: DomToVNodeOptions): VChild {
  const props: Record<string, unknown> = {};
  // data-podo-generated="a b"는 SSR이 공유 컴포넌트 대신 단 속성 목록이에요(예: Table 행의
  // data-selected) — 컴포넌트가 상태로 다시 정하므로 옮기지 않아요. 슬롯 표식도 마찬가지예요.
  const generated = (element.getAttribute("data-podo-generated") ?? "").split(/\s+/);
  for (const attribute of Array.from(element.attributes)) {
    if (
      generated.includes(attribute.name) ||
      attribute.name === "data-podo-generated" ||
      attribute.name.startsWith("data-podo-slot")
    ) {
      continue;
    }
    props[attribute.name] = attribute.value;
  }
  if (options.dropIds?.size) {
    for (const name of ID_REF_PROPS) {
      const value = props[name];
      if (typeof value === "string") {
        const kept = value
          .split(/\s+/)
          .filter((token) => token && !options.dropIds!.has(token))
          .join(" ");
        if (kept) {
          props[name] = kept;
        } else {
          delete props[name];
        }
      }
    }
  }
  if (element instanceof HTMLInputElement) {
    if (element.type === "file") {
      // A file input's value is a "C:\\fakepath\\…" string that may only be set to
      // "" (anything else throws InvalidStateError), so never copy it — move
      // the selected FileList to the new input instead.
      delete props.value;
      const files = element.files;
      if (files && files.length > 0) {
        props.ref = (node: HTMLInputElement | null) => {
          if (node) {
            node.files = files;
          }
        };
      }
      return jsx("input", props);
    }
    props.value = element.value;
    props.checked = element.checked;
    return jsx("input", props);
  }
  if (element instanceof HTMLTextAreaElement) {
    return jsx("textarea", { ...props, value: element.value });
  }
  if (element instanceof HTMLOptionElement) {
    props.selected = element.selected;
  }
  if (element.hasAttribute("data-podo-toast")) {
    props.ref = (node: Element | null) => {
      if (node) {
        sources.set(node, element);
      }
    };
  }
  return jsx(element.localName, props, ...domToVNode(element.childNodes, options));
}
