/**
 * island 래퍼의 슬롯 요소(data-podo-slot) — 안쪽 island에 속한 슬롯은 빼요.
 * 슬롯 요소의 자식 노드가 같은 이름의 React prop이 돼요(계획 §3.1).
 */
export function slotElements(wrapper: Element): Map<string, Element> {
  const slots = new Map<string, Element>();
  for (const element of Array.from(wrapper.querySelectorAll("[data-podo-slot]"))) {
    const name = element.getAttribute("data-podo-slot");
    if (name && element.closest("[data-podo-island]") === wrapper) {
      slots.set(name, element);
    }
  }
  return slots;
}
