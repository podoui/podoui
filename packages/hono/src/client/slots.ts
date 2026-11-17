/**
 * island 래퍼의 슬롯 요소(data-podo-slot) — 안쪽 island에 속한 슬롯은 빼요.
 * 슬롯 요소의 자식 노드가 같은 이름의 React prop이 돼요(계획 §3.1).
 */
export type SlotSource = ParentNode | Node[];

export function slotElements(wrapper: Element): Map<string, SlotSource> {
  const slots = new Map<string, SlotSource>();
  // 래퍼 자신에 표식이 있으면 래퍼의 SSR 자식 노드가 그 prop이에요(예: Tooltip 트리거 =
  // children). 마운트하면 래퍼의 자식이 바뀌므로 지금 노드 목록을 붙잡아 둬요.
  const own = wrapper.getAttribute("data-podo-slot");
  if (own) {
    slots.set(own, Array.from(wrapper.childNodes));
  }
  for (const element of Array.from(wrapper.querySelectorAll("[data-podo-slot]"))) {
    const name = element.getAttribute("data-podo-slot");
    if (name && element.closest("[data-podo-island]") === wrapper) {
      // <template> 슬롯은 마크업이 content(DocumentFragment)에 있어요(닫힌 Tooltip의 리치 label).
      slots.set(name, element instanceof HTMLTemplateElement ? element.content : element);
    }
  }
  return slots;
}
