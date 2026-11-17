import { jsx } from "hono/jsx/dom";

/** A converted child: a hono/jsx/dom element or a text string. */
export type VChild = ReturnType<typeof jsx> | string;

export interface DomToVNodeOptions {
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
  for (const attribute of Array.from(element.attributes)) {
    props[attribute.name] = attribute.value;
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
  return jsx(element.localName, props, ...domToVNode(element.childNodes, options));
}
