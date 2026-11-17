import { jsx, render, useState } from "hono/jsx/dom";
import { reviveProps } from "@podoui/core";
import { islandComponents } from "./components.js";
import { domToVNode, type VChild } from "./dom-to-vnode.js";
import { emitEvent, islandCallbacks } from "./events.js";
import { readState } from "./read-state.js";
import { slotElements } from "./slots.js";

/** island 래퍼 하나(바깥이든 안쪽이든)의 파싱 결과. */
interface IslandNode {
  element: Element;
  name: string;
  id: string | undefined;
  /** data-podo-props 복원값. */
  props: Record<string, unknown>;
  /** readState가 읽은 default* 키(JSON 위에 덮어요). */
  defaults: Record<string, unknown>;
  /** configure로 받은 값(가장 우선). */
  configured: Record<string, unknown>;
  slots: Map<string, Element>;
  /** 중첩 Chip이 제거됐으면 부모 렌더에서 빠져요(V7-1). */
  removed: boolean;
  outer: OuterIsland;
}

/** 마운트 단위 = 가장 바깥 island(계획 R6). 안쪽 island는 이 트리에 vnode로 들어가요. */
interface OuterIsland {
  node: IslandNode;
  /** 이 바깥 island가 소유한 모든 노드(자기 + 안쪽). */
  members: IslandNode[];
  /** 아직 configure 안 된 defer id(V7-2) — 비어야 마운트해요. */
  pending: Set<string>;
  /** id 없는 defer가 있으면 영원히 마운트하지 않아요. */
  blocked: boolean;
  mounted: boolean;
  refresh: () => void;
}

const ISLAND = "[data-podo-island]";
const nodes = new WeakMap<Element, IslandNode>();
const byId = new Map<string, IslandNode>();

/** 동적으로 추가된 래퍼(또는 그것을 담은 요소)를 마운트해요. */
export function mount(root: ParentNode): void {
  for (const wrapper of outermostWrappers(root)) {
    const outer = prepare(wrapper);
    if (outer) {
      tryMount(outer);
    }
  }
}

/** 함수·비직렬화 값이나 제어 값을 island에 넘겨요(래퍼 data-podo-id 기준). */
export function configure(id: string, partial: Record<string, unknown>): void {
  const node = byId.get(id);
  if (!node || typeof partial !== "object" || partial === null) {
    return;
  }
  node.configured = { ...node.configured, ...partial };
  const outer = node.outer;
  outer.pending.delete(id);
  if (outer.mounted) {
    outer.refresh();
  } else {
    tryMount(outer);
  }
}

function outermostWrappers(root: ParentNode): Element[] {
  const candidates = root instanceof Element && root.matches(ISLAND) ? [root] : [];
  candidates.push(...Array.from(root.querySelectorAll(ISLAND)));
  return candidates.filter(
    (element) => !element.parentElement?.closest(ISLAND) && !nodes.has(element)
  );
}

// 오류 정책(계획 D14): 깨진 JSON·모르는 컴포넌트·루트 누락은 그 바깥 island만
// 조용히 건너뛰어요(반쪽 트리 없음, console 출력 없음).
function prepare(wrapper: Element): OuterIsland | undefined {
  const outer = { pending: new Set<string>(), blocked: false, mounted: false } as OuterIsland;
  outer.refresh = () => undefined;
  let parsed: IslandNode[];
  try {
    parsed = [wrapper, ...Array.from(wrapper.querySelectorAll(ISLAND))].map((element) =>
      parseNode(element, outer)
    );
  } catch {
    return undefined;
  }
  outer.node = parsed[0]!;
  outer.members = parsed;
  for (const node of parsed) {
    nodes.set(node.element, node);
    // 같은 id는 먼저 등록된 살아 있는 island가 가져요 — 제거돼 문서에서 빠진
    // 소유자는 자리를 넘겨요(F4).
    const existing = node.id === undefined ? undefined : byId.get(node.id);
    if (node.id !== undefined && (!existing || !existing.outer.node.element.isConnected)) {
      byId.set(node.id, node);
    }
    if (node.element.hasAttribute("data-podo-defer")) {
      if (node.id === undefined) {
        outer.blocked = true;
      } else {
        outer.pending.add(node.id);
      }
    }
  }
  return outer;
}

function parseNode(element: Element, outer: OuterIsland): IslandNode {
  const name = element.getAttribute("data-podo-island") ?? "";
  if (!islandComponents[name] || !element.firstElementChild) {
    throw new Error(`unknown island ${name}`);
  }
  const props = reviveProps(element.getAttribute("data-podo-props") ?? "{}");
  return {
    element,
    name,
    id: element.getAttribute("data-podo-id") ?? undefined,
    props,
    defaults: {},
    configured: {},
    slots: slotElements(element),
    removed: false,
    outer,
  };
}

function tryMount(outer: OuterIsland): void {
  if (outer.mounted || outer.blocked || outer.pending.size > 0) {
    return;
  }
  const wrapper = outer.node.element;
  const active = wrapper.ownerDocument.activeElement;
  const focusId = active && wrapper.contains(active) ? active.id : "";
  try {
    // defer로 늦어진 마운트도 실제 마운트 직전의 폼 상태를 읽어요(configure 값이 우선, F2).
    for (const member of outer.members) {
      member.defaults = readState(member.name, member.element, member.props);
    }
    // 첫 렌더가 SSR 자식을 바꿔 끼워요(hono/jsx/dom은 hydrate 대신 replaceChildren).
    render(jsx(IslandRoot as never, { outer }), wrapper as HTMLElement);
  } catch {
    return;
  }
  outer.mounted = true;
  wrapper.setAttribute("data-podo-mounted", "");
  if (focusId) {
    (wrapper.ownerDocument.getElementById(focusId) as HTMLElement | null)?.focus();
  }
}

/** 바깥 island 루트 — configure·제어 값·중첩 Chip 제거를 상태 보존 재렌더로 반영해요. */
function IslandRoot({ outer }: { outer: OuterIsland }) {
  const [, setTick] = useState(0);
  outer.refresh = () => setTick((tick) => tick + 1);
  return buildVNode(outer.node);
}

function buildVNode(node: IslandNode): VChild {
  const Component = islandComponents[node.name]!;
  const props: Record<string, unknown> = { ...node.props, ...node.defaults, ...node.configured };
  for (const [slot, element] of node.slots) {
    const children = domToVNode(element.childNodes, {
      island: (nested) => {
        const child = nodes.get(nested);
        return child && !child.removed ? buildVNode(child) : null;
      },
    });
    props[slot] = children.length === 1 ? children[0] : children;
  }
  attachCallbacks(node, props);
  if (node.name === "Chip") {
    adaptRemovableChip(node, props);
  }
  return jsx(Component as never, props);
}

function attachCallbacks(node: IslandNode, props: Record<string, unknown>): void {
  for (const [prop, spec] of Object.entries(islandCallbacks[node.name] ?? {})) {
    const theirs = node.configured[prop];
    props[prop] = (...args: never[]) => {
      // 제어 모드 기본 갱신을 먼저 해서, 콜백·이벤트 안에서 소비자가 다시 configure한
      // 값이 마지막에 이겨요(계획 D2, F1).
      const controlled = spec.controlled !== undefined && spec.controlled in node.configured;
      if (controlled) {
        node.configured[spec.controlled!] = args[0];
      }
      if (typeof theirs === "function") {
        (theirs as (...values: never[]) => void)(...args);
      }
      emit(node, spec.event, spec.detail(...args));
      if (controlled) {
        node.outer.refresh();
      }
    };
  }
}

/** Hono `removable` → React onRemove(removable일 때만, R4). 기본 동작은 Hono 추가 편의예요. */
function adaptRemovableChip(node: IslandNode, props: Record<string, unknown>): void {
  const removable = props.removable === true;
  const theirs = props.onRemove;
  delete props.removable;
  // React Chip은 onRemove 존재로 제거형이 되므로, 토글 Chip에는 configure로 받은
  // onRemove도 넘기지 않아요(R4, F3).
  delete props.onRemove;
  if (!removable) {
    return;
  }
  props.onRemove = (event: unknown) => {
    if (typeof theirs === "function") {
      (theirs as (value: unknown) => void)(event);
    }
    if (!emit(node, "podo:remove", {}, true)) {
      return;
    }
    if (node === node.outer.node) {
      node.element.remove();
      releaseIds(node.outer);
    } else {
      node.removed = true;
      node.outer.refresh();
    }
  };
}

/** 문서에서 지운 island의 id를 풀어 같은 id의 새 island가 configure를 받게 해요(F4). */
function releaseIds(outer: OuterIsland): void {
  for (const member of outer.members) {
    if (member.id !== undefined && byId.get(member.id) === member) {
      byId.delete(member.id);
    }
  }
}

/** 이벤트는 마운트된 바깥 래퍼에서 내요 — 안쪽 island면 detail.id로 알려요(계획 §3.3). */
function emit(
  node: IslandNode,
  name: string,
  detail: Record<string, unknown>,
  cancelable = false
): boolean {
  const nested = node !== node.outer.node && node.id !== undefined;
  return emitEvent(
    node.outer.node.element,
    name,
    nested ? { ...detail, id: node.id } : detail,
    cancelable
  );
}
