import { forgetSource } from "./dom-to-vnode.js";

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
  DatePicker: {
    onChange: {
      event: "podo:change",
      detail: (value: Record<string, unknown>) => ({ value }),
      controlled: "value",
    },
    onReset: { event: "podo:reset", detail: () => ({}) },
  },
  Table: {
    onSelectionChange: {
      event: "podo:selection-change",
      detail: (selected: number[]) => ({ selected }),
    },
  },
  Editor: {
    onChange: {
      event: "podo:change",
      detail: (content: string) => ({ content }),
      controlled: "value",
    },
    onImageUploadError: {
      event: "podo:image-upload-error",
      detail: (error: unknown, file: File) => ({ error, file }),
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
    const close = (event.target as Element | null)?.closest?.(".podo-toast__close");
    const card = close?.closest("[data-podo-toast]");
    if (card && !event.defaultPrevented) {
      closeToast(card);
    }
  });
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

const timedToasts = new WeakSet<Element>();

/**
 * 서버 flash Toast 닫기(T1 D-4) — 취소 가능한 podo:close를 내고, 취소하지 않으면 카드를
 * 지워요(React Toast는 onClose 콜백만 부르므로 이 기본 동작은 Hono 편의예요).
 */
function closeToast(card: Element): void {
  if (card.isConnected && emitEvent(card, "podo:close", {}, true)) {
    forgetSource(card);
    card.remove();
  }
}

/** 위임 대상의 DOM 상태를 React와 맞춰요 — 혼합 체크박스·자동 글자 수(T1 D-3)·Toast 자동 닫힘. */
export function syncStaticState(root: ParentNode): void {
  for (const card of Array.from(root.querySelectorAll("[data-podo-toast][data-duration]"))) {
    const duration = Number(card.getAttribute("data-duration"));
    // 타이머 상태는 DOM 표식 대신 WeakSet — island 마운트가 카드를 새 노드로 바꾸면 새
    // 노드에 다시 걸려요(옛 노드 타이머는 isConnected 검사로 아무 일도 안 해요, T5 F5).
    if (Number.isFinite(duration) && duration >= 0 && !timedToasts.has(card)) {
      timedToasts.add(card);
      setTimeout(() => closeToast(card), duration);
    }
  }
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
