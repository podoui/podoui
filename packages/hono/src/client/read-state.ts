import {
  formatDatePickerFormValue,
  parseDatePickerFormValue,
  type PodoDatePickerTime,
  type PodoDatePickerType,
} from "@podoui/core";

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
    case "DatePicker":
      return readDatePicker(root, props);
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

/**
 * DatePicker hidden(name 또는 fromName/toName) → defaultValue.
 * - SSR이 쓴 값 그대로면 JSON 초기값을 유지해요 — 날짜만·시간만 있는 부분 초기값은
 *   hidden이 ""라 그 값을 다시 읽으면 지워지기 때문이에요(T4 R1).
 * - 시작·종료는 SSR 출력 순서(시작 → 종료)로 구분해요 — fromName과 toName이 같아도
 *   두 hidden이 섞이지 않아요(T4 R2).
 * - 해석할 수 없는 값은 무시하고 초기값을 둬요(""는 비우기, T4 R4).
 */
function readDatePicker(root: Element, props: Record<string, unknown>): Record<string, unknown> {
  const type = (props.type ?? "date") as PodoDatePickerType;
  const period = props.mode === "period";
  const initial = (props.defaultValue as Record<string, unknown> | undefined) ?? {};
  const hiddenInputs = Array.from(root.children).filter(
    (child): child is HTMLInputElement =>
      child instanceof HTMLInputElement && child.type === "hidden"
  );
  const startName = period ? props.fromName : props.name;
  const endName = period ? props.toName : undefined;
  const startIndex = hiddenInputs.findIndex((input) => input.name === startName);
  const endIndex = hiddenInputs.findIndex(
    (input, index) => input.name === endName && index !== startIndex
  );
  const value = { ...initial };
  let changed = false;
  const take = (index: number, dateKey: string, timeKey: string) => {
    const input = hiddenInputs[index];
    if (!input) {
      return;
    }
    const rendered = formatDatePickerFormValue(
      type,
      initial[dateKey] as Date | undefined,
      initial[timeKey] as PodoDatePickerTime | undefined
    );
    if (input.value === rendered) {
      return;
    }
    const parsed = parseDatePickerFormValue(type, input.value);
    if (!parsed) {
      return;
    }
    value[dateKey] = parsed.date;
    value[timeKey] = parsed.time;
    changed = true;
  };
  take(startIndex, "date", "time");
  take(endIndex, "endDate", "endTime");
  return changed ? { defaultValue: value } : {};
}
