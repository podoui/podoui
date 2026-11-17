/**
 * 이벤트 계약(계획 D4, docs/hono-parity.md §2·§4) — React 콜백을 bubbling CustomEvent로.
 */
export interface IslandCallback {
  event: string;
  /** detail 키 = React 콜백 인자 이름. */
  detail: (...args: never[]) => Record<string, unknown>;
  /** configure로 이 prop을 넘긴 제어 모드면 콜백 값으로 저장 값을 갱신해요. */
  controlled?: string;
}

export const islandCallbacks: Record<string, Record<string, IslandCallback>> = {
  Select: {
    onValueChange: {
      event: "podo:value-change",
      detail: (value: string) => ({ value }),
      controlled: "value",
    },
    onValuesChange: {
      event: "podo:values-change",
      detail: (values: string[]) => ({ values }),
      controlled: "values",
    },
    onOptionAdd: {
      event: "podo:option-add",
      detail: (option: { value: string; label: string }) => ({ option }),
    },
  },
  Chip: {
    onPress: {
      event: "podo:press",
      detail: (press: { source: string; originalEvent: Event }) => ({
        source: press.source,
        originalEvent: press.originalEvent,
      }),
    },
    onSelectedChange: {
      event: "podo:selected-change",
      detail: (selected: boolean) => ({ selected }),
      controlled: "selected",
    },
  },
  Switch: {
    onCheckedChange: {
      event: "podo:checked-change",
      detail: (checked: boolean) => ({ checked }),
      controlled: "checked",
    },
  },
};

export function emitEvent(
  target: EventTarget,
  name: string,
  detail: Record<string, unknown>,
  cancelable = false
): boolean {
  return target.dispatchEvent(new CustomEvent(name, { bubbles: true, cancelable, detail }));
}

/**
 * 비island 위임(계획 R5 표) — 네이티브 이벤트는 그대로 두고 의미 이벤트를 하나 더 내요.
 */
export function installDelegation(doc: Document): void {
  doc.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest?.("button[data-podo-button]");
    if (button instanceof HTMLButtonElement && !button.disabled && !event.defaultPrevented) {
      emitEvent(button, "podo:press", { source: "button", originalEvent: event });
    }
  });
  doc.addEventListener("input", (event) => {
    const target = event.target;
    if (
      (target instanceof HTMLInputElement &&
        target.matches("[data-podo-input] > input.podo-input__control")) ||
      (target instanceof HTMLTextAreaElement && target.matches("[data-podo-textarea]"))
    ) {
      emitEvent(target, "podo:value-change", { value: target.value, event });
    }
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      updateFieldCount(target);
    }
  });
  doc.addEventListener("change", (event) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement &&
      target.matches("[data-podo-checkbox], [data-podo-radio]") &&
      !event.defaultPrevented
    ) {
      emitEvent(target, "podo:checked-change", { checked: target.checked });
    }
  });
}

/** 위임 대상의 DOM 상태를 React와 맞춰요 — 혼합 체크박스·자동 글자 수(T1 D-3). */
export function syncStaticState(root: ParentNode): void {
  for (const box of Array.from(
    root.querySelectorAll<HTMLInputElement>('input[data-podo-checkbox][aria-checked="mixed"]')
  )) {
    box.indeterminate = true;
  }
  for (const field of Array.from(root.querySelectorAll("[data-podo-field]"))) {
    const control = field.querySelector(
      ":scope > .podo-field__control input, :scope > .podo-field__control textarea"
    );
    if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) {
      updateFieldCount(control);
    }
  }
}

function updateFieldCount(control: HTMLInputElement | HTMLTextAreaElement): void {
  const slot = control.closest(".podo-field__control");
  const field = slot?.parentElement;
  if (!field?.matches("[data-podo-field]")) {
    return;
  }
  const counter = field.querySelector(":scope > .podo-field__footer > .podo-field__count");
  const max = counter?.textContent?.split("/")[1];
  if (counter && max !== undefined) {
    counter.textContent = `${control.value.length}/${max}`;
  }
}
