/**
 * 마운트 직전 SSR 마크업의 현재 상태를 비제어 초기값(default* 키만, R1)으로 읽어요 —
 * 스크립트가 늦게 실려도 그 사이 브라우저가 바꾼 폼 값이 이어져요(계획 §3.5).
 */
export function readState(
  name: string,
  wrapper: Element,
  props: Record<string, unknown>
): Record<string, unknown> {
  const root = wrapper.firstElementChild;
  if (!root) {
    return {};
  }
  switch (name) {
    case "Select": {
      if (typeof props.name !== "string") {
        return {};
      }
      const values = Array.from(root.children)
        .filter(
          (child): child is HTMLInputElement =>
            child instanceof HTMLInputElement &&
            child.type === "hidden" &&
            child.name === props.name
        )
        .map((input) => input.value);
      return props.multiple ? { defaultValues: values } : { defaultValue: values[0] };
    }
    case "Chip":
      return root.matches("button.podo-chip")
        ? { defaultSelected: root.getAttribute("aria-pressed") === "true" }
        : {};
    case "Switch": {
      const control = root.matches('[role="switch"]')
        ? root
        : root.querySelector('[role="switch"]');
      return control ? { defaultChecked: control.getAttribute("aria-checked") === "true" } : {};
    }
    default:
      return {};
  }
}
