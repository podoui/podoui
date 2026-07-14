/** @jsxImportSource hono/jsx */

import { cloneElement, isValidElement } from "hono/jsx";
import type { Child } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import { raw } from "hono/html";
import {
  createButtonBehavior,
  createCheckboxBehavior,
  createFieldA11y,
  createInputBehavior,
  createSwitchBehavior,
} from "@podo/core";

export type HonoButtonTheme =
  | "solid-primary"
  | "solid-assistive"
  | "solid-white"
  | "solid-danger"
  | "outline-primary"
  | "outline-assistive"
  | "outline-white"
  | "outline-danger";

export interface HonoButtonProps {
  children: Child;
  theme?: HonoButtonTheme;
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  /** Stretch to the parent's full width (Figma auto-layout fill container). */
  fill?: boolean;
  prefix?: Child;
  suffix?: Child;
  type?: "button" | "submit" | "reset";
  class?: string;
}

export interface HonoChipProps {
  children: Child;
  /** Background contrast (Figma: solid, outline-strong, outline-weak). */
  theme?: "solid" | "outline-strong" | "outline-weak";
  /** Label/icon scale (Figma: md 14px — base, lg 16px). */
  size?: "md" | "lg";
  /** 선택 여부 (Figma state) — 비선택이 기본 모습. 토글은 클라이언트 코드 몫이에요. */
  selected?: boolean;
  disabled?: boolean;
  /** Category/status icon before the label (Figma prefix-icon). */
  prefix?: Child;
  /** Removal/action icon after the label, e.g. close (Figma suffix-icon). */
  suffix?: Child;
  /**
   * 제거형 칩 — 선택된 모습으로 고정되고 X 버튼 마크업이 붙어요 (동작은
   * 클라이언트 코드). 루트는 button 대신 span으로 렌더돼요.
   */
  removable?: boolean;
  /** 제거 버튼의 접근성 이름 (기본 "제거"). */
  removeLabel?: string;
  type?: "button" | "submit" | "reset";
  class?: string;
}

export interface HonoBadgeProps {
  /** Count or short status text. Ignored when dot is set. */
  children?: Child;
  /**
   * 상태·의미 색상 (Figma theme) — natural이 base. natural~info는 진한 배경의
   * 시스템 상태, gray~orange는 연한 배경의 색상 표기예요.
   */
  theme?:
    | "natural"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | "gray"
    | "red"
    | "green"
    | "yellow"
    | "blue"
    | "purple"
    | "orange";
  /** 숫자·텍스트 없이 6px 점만 표시 (Figma dot). */
  dot?: boolean;
  class?: string;
  "aria-label"?: string;
}

export interface HonoInputProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Native input maxlength; Field injects its countMax here. */
  maxLength?: number;
  /** Value is visible but not editable; renders without the box (Figma read-only). */
  readOnly?: boolean;
  /** Control height, radius, and font (Figma: md 42, lg 52). */
  size?: "md" | "lg";
  /** Icon or symbol giving the value context, before the control (Figma prefix). */
  prefix?: Child;
  /** Fixed unit/domain text after the control, e.g. 원, kg (Figma suffix-text). */
  suffixText?: Child;
  /** In-input action icon: clear, search, visibility toggle (Figma suffix-icon). */
  suffixIcon?: Child;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: string;
  "aria-required"?: string;
}

export interface HonoTextareaProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Native textarea maxlength; Field injects its countMax here. */
  maxLength?: number;
  /** Show the resize grip and allow vertical resizing (Figma resize). */
  resize?: boolean;
  /** Value is visible but not editable; renders without the box (Figma read-only). */
  readOnly?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  class?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: string;
  "aria-required"?: string;
}

export function Textarea({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  maxLength,
  resize = true,
  readOnly,
  invalid,
  disabled,
  required,
  class: className,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: HonoTextareaProps): JSX.Element {
  const behavior = createInputBehavior({ value, defaultValue, invalid, disabled, required });
  const state = behavior.invalid
    ? "invalid"
    : behavior.disabled
      ? "disabled"
      : readOnly
        ? "read-only"
        : undefined;

  return (
    <textarea
      id={id}
      class={joinClass("podo-textarea", className)}
      name={name}
      placeholder={placeholder}
      maxlength={maxLength}
      readonly={readOnly}
      disabled={disabled}
      required={required}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid ?? (behavior.invalid ? "true" : undefined)}
      aria-required={ariaRequired ?? (behavior.required ? "true" : undefined)}
      data-state={state}
      data-resize={resize ? undefined : "false"}
    >
      {value ?? defaultValue ?? ""}
    </textarea>
  );
}

export interface HonoSelectOption {
  value: string;
  label: string;
}

export interface HonoSelectProps {
  /** 메뉴 항목 목록 — 셀 마크업은 컴포넌트가 그려요. */
  options: HonoSelectOption[];
  /** 값이 없을 때 트리거에 표시 (Figma 플레이스 홀더). */
  placeholder?: string;
  /** Control height and radius (Figma: md 42 — base, lg 52). */
  size?: "md" | "lg";
  /** 다중 선택 (Figma theme=slot) — 칩 나열 + 체크박스 셀. */
  multiple?: boolean;
  /** 단일 선택 값. */
  value?: string;
  /** 다중 선택 값. */
  values?: string[];
  /** 트리거에 보여줄 최대 칩 수 — 넘치는 값은 "+N"으로 축약돼요. */
  maxChips?: number;
  /** 정적 렌더에서 메뉴를 펼쳐 보여줄지 (Figma focused). 동작은 클라이언트 코드. */
  open?: boolean;
  /** 메뉴 상단 추가 입력줄 마크업 (Figma multi-select-input). */
  addable?: boolean;
  addPlaceholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** 값 앞에 붙는 아이콘 (Figma prefix-icon). */
  prefix?: Child;
  class?: string;
}

const HONO_SELECT_CHEVRON = (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 9l6 6 6-6"
      stroke="#27272A"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const HONO_SELECT_CHECK = (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3.5 8.5l3 3 6-6.5"
      stroke="#426CED"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const HONO_SELECT_BOX_CHECK = (
  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2.5 6.5l2.5 2.5 4.5-5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const HONO_CHIP_CLOSE = (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
  </svg>
);

export function Select({
  options,
  placeholder,
  size = "md",
  multiple,
  value,
  values,
  maxChips = 3,
  open,
  addable,
  addPlaceholder,
  invalid,
  disabled,
  prefix,
  class: className,
}: HonoSelectProps): JSX.Element {
  const selectedValues = values ?? [];
  const selected = options.find((o) => o.value === value);
  const hasValue = multiple ? selectedValues.length > 0 : Boolean(selected);
  const state = invalid ? "invalid" : disabled ? "disabled" : undefined;

  return (
    <div
      class={joinClass("podo-select", className)}
      data-size={size}
      data-state={state}
      data-open={open ? "true" : undefined}
    >
      <div
        class="podo-select__trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-disabled={disabled ? "true" : undefined}
        tabindex={disabled ? -1 : 0}
      >
        {prefix ? <span class="podo-select__prefix">{prefix}</span> : null}
        <span class="podo-select__value" data-placeholder={hasValue ? undefined : "true"}>
          {multiple && hasValue ? (
            <>
              {selectedValues.slice(0, maxChips).map((v) => {
                const label = options.find((o) => o.value === v)?.label ?? v;
                // 선택 값 칩은 Chip의 제거형 모드를 그대로 재사용해요.
                return (
                  <Chip removable removeLabel={`${label} 제거`}>
                    {label}
                  </Chip>
                );
              })}
              {selectedValues.length > maxChips ? (
                <span
                  class="podo-chip podo-select__chip-more"
                  data-theme="solid"
                  data-size="md"
                  data-state="selected"
                  data-removable="true"
                  aria-label={`외 ${selectedValues.length - maxChips}개 선택됨`}
                >
                  +{selectedValues.length - maxChips}
                </span>
              ) : null}
            </>
          ) : (
            ((multiple ? placeholder : (selected?.label ?? placeholder)) ?? "")
          )}
        </span>
        <span class="podo-select__chevron">{HONO_SELECT_CHEVRON}</span>
      </div>
      {open ? (
        <div class="podo-select__menu-list">
          <div
            class="podo-select__menu"
            role="listbox"
            aria-multiselectable={multiple ? "true" : undefined}
          >
            {addable ? (
              <div class="podo-select__add">
                <input class="podo-select__add-input" placeholder={addPlaceholder} />
                <button type="button" class="podo-select__add-button">
                  추가
                </button>
              </div>
            ) : null}
            {options.map((option) => {
              const isSelected = multiple
                ? selectedValues.includes(option.value)
                : option.value === value;
              return (
                <div
                  class="podo-select__cell"
                  role="option"
                  aria-selected={isSelected ? "true" : "false"}
                  data-state={isSelected ? "selected" : undefined}
                >
                  {multiple ? (
                    <span
                      class="podo-select__checkbox"
                      data-checked={isSelected ? "true" : undefined}
                    >
                      {isSelected ? HONO_SELECT_BOX_CHECK : null}
                    </span>
                  ) : null}
                  <span class="podo-select__cell-label">{option.label}</span>
                  {!multiple && isSelected ? (
                    <span class="podo-select__cell-check">{HONO_SELECT_CHECK}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const HONO_TOOLTIP_ARROWS: Record<string, string> = {
  right:
    '<svg aria-hidden="true" width="4" height="16" viewBox="0 0 4 16"><path d="M4 0v4L0 8l4 4v4z" fill="currentColor"/></svg>',
  left: '<svg aria-hidden="true" width="4" height="16" viewBox="0 0 4 16"><path d="M0 0v4l4 4-4 4v4z" fill="currentColor"/></svg>',
  bottom:
    '<svg aria-hidden="true" width="16" height="4" viewBox="0 0 16 4"><path d="M0 4h4l4-4 4 4h4z" fill="currentColor"/></svg>',
  top: '<svg aria-hidden="true" width="16" height="4" viewBox="0 0 16 4"><path d="M0 0h4l4 4 4-4h4z" fill="currentColor"/></svg>',
};

export interface HonoTooltipProps {
  /** 말풍선 내용 (Figma label). */
  label: Child;
  /** 대상 기준 표시 방향 — 화살표가 대상을 가리켜요 (Figma position). */
  position?: "right" | "left" | "bottom" | "top";
  /** 화살표가 말풍선의 시작/가운데/끝 어디에 붙는지 (Figma ordinal). */
  ordinal?: "first" | "second" | "third";
  /** 밝은 배경(default) 또는 어두운 배경(reverse) (Figma theme). */
  theme?: "default" | "reverse";
  class?: string;
}

// Static bubble: hover triggering and portal positioning need client code.
export function Tooltip({
  label,
  position = "right",
  ordinal = "first",
  theme = "default",
  class: className,
}: HonoTooltipProps): JSX.Element {
  return (
    <div
      class={joinClass("podo-tooltip", className)}
      role="tooltip"
      data-theme={theme}
      data-position={position}
      data-ordinal={ordinal}
    >
      <span class="podo-tooltip__arrow">
        {raw(HONO_TOOLTIP_ARROWS[position] ?? HONO_TOOLTIP_ARROWS.right)}
      </span>
      <span class="podo-tooltip__bubble">{label}</span>
    </div>
  );
}

export type HonoToastState = "normal" | "success" | "danger" | "info" | "warning";

export interface HonoToastProps {
  children: Child;
  /** 상황의 성격에 따른 색·톤 (Figma state). */
  state?: HonoToastState;
  /** State icon before the title (Figma prefix-icon). */
  prefix?: Child;
  /** Follow-up action text, e.g. 실행 취소 (Figma suffix-text). */
  suffixText?: Child;
  /** Custom action icon after the title (Figma suffix-icon). */
  suffixIcon?: Child;
  /** Extra line under the title (Figma caption). */
  caption?: Child;
  /** Renders the close X; dismissing needs client code. */
  closable?: boolean;
  class?: string;
}

export function Toast({
  children,
  state = "normal",
  prefix,
  suffixText,
  suffixIcon,
  caption,
  closable,
  class: className,
}: HonoToastProps): JSX.Element {
  const suffix =
    suffixText != null || suffixIcon != null || closable ? (
      <span class="podo-toast__suffix">
        {suffixText != null ? <span class="podo-toast__suffix-text">{suffixText}</span> : null}
        {closable ? (
          <button class="podo-toast__close" type="button" aria-label="닫기">
            {raw(
              '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
            )}
          </button>
        ) : suffixIcon != null ? (
          <span class="podo-toast__suffix-icon">{suffixIcon}</span>
        ) : null}
      </span>
    ) : null;

  return (
    <div
      class={joinClass("podo-toast", className)}
      role={state === "danger" ? "alert" : "status"}
      data-state={state}
    >
      {prefix != null ? <span class="podo-toast__prefix">{prefix}</span> : null}
      <div class="podo-toast__contents">
        <div class="podo-toast__title-row">
          <span class="podo-toast__title">{children}</span>
          {suffix}
        </div>
        {caption != null ? <span class="podo-toast__caption">{caption}</span> : null}
      </div>
    </div>
  );
}

export interface HonoTableProps {
  children: Child;
  /** grid: bordered frame with per-cell rules; horizon: row rules only. */
  type?: "grid" | "horizon";
  class?: string;
}

export function Table({
  children,
  type = "horizon",
  class: className,
}: HonoTableProps): JSX.Element {
  return (
    <table class={joinClass("podo-table", className)} data-type={type}>
      {children}
    </table>
  );
}

export interface HonoFieldProps {
  children: Child;
  id?: string;
  label: Child;
  /** Supplementary text next to the label (Figma sub-label). */
  subLabel?: Child;
  /** Helper/status icon at the right edge of the heading row (Figma suffix-icon). */
  suffixIcon?: Child;
  /** Footer guidance for how to fill the control (Figma helper-text). */
  helperText?: Child;
  /** Footer error message; replaces helperText and renders in the danger color. */
  error?: Child;
  /** Current character count, shown as count/countMax when countMax is set. */
  count?: number;
  /** Maximum character count; enables the footer counter (Figma character-count). */
  countMax?: number;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
}

export interface HonoCriticalCssOptions {
  theme?: string;
  colorScheme?: "light" | "dark";
  css?: string;
}

export function Button({
  children,
  theme = "solid-primary",
  size = "md",
  disabled,
  fill,
  prefix,
  suffix,
  type,
  class: className,
}: HonoButtonProps): JSX.Element {
  const behavior = createButtonBehavior({ disabled, type });

  return (
    <button
      class={joinClass("podo-button", className)}
      type={behavior.root.type}
      disabled={behavior.root.disabled}
      aria-disabled={behavior.root.ariaDisabled}
      tabIndex={behavior.root.tabIndex}
      data-theme={theme}
      data-size={size}
      data-fill={fill ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {prefix ? <span class="podo-button__icon">{prefix}</span> : null}
      <span class="podo-button__label">{children}</span>
      {suffix ? <span class="podo-button__icon">{suffix}</span> : null}
    </button>
  );
}

export function Chip({
  children,
  theme = "solid",
  size = "md",
  selected,
  disabled,
  prefix,
  suffix,
  removable,
  removeLabel = "제거",
  type,
  class: className,
}: HonoChipProps): JSX.Element {
  const behavior = createButtonBehavior({ disabled, type });

  if (removable) {
    // Removable chip: selected look, no toggle — the X is the only control.
    return (
      <span
        class={joinClass("podo-chip", className)}
        data-theme={theme}
        data-size={size}
        data-state="selected"
        data-removable="true"
      >
        {prefix ? <span class="podo-chip__prefix">{prefix}</span> : null}
        <span class="podo-chip__label">{children}</span>
        <button type="button" class="podo-chip__remove" aria-label={removeLabel}>
          {HONO_CHIP_CLOSE}
        </button>
      </span>
    );
  }

  return (
    <button
      class={joinClass("podo-chip", className)}
      type={behavior.root.type}
      disabled={behavior.root.disabled}
      aria-disabled={behavior.root.ariaDisabled}
      tabIndex={behavior.root.tabIndex}
      aria-pressed={selected ? "true" : "false"}
      data-state={selected ? "selected" : undefined}
      data-theme={theme}
      data-size={size}
      data-disabled={disabled ? "true" : undefined}
    >
      {prefix ? <span class="podo-chip__prefix">{prefix}</span> : null}
      <span class="podo-chip__label">{children}</span>
      {suffix ? <span class="podo-chip__suffix">{suffix}</span> : null}
    </button>
  );
}

export function Badge({
  children,
  theme = "natural",
  dot,
  class: className,
  "aria-label": ariaLabel,
}: HonoBadgeProps): JSX.Element {
  return (
    <span
      class={joinClass("podo-badge", className)}
      data-theme={theme}
      data-dot={dot ? "true" : undefined}
      aria-label={ariaLabel}
    >
      {dot ? null : children}
    </span>
  );
}

export interface HonoSwitchProps {
  /** On/off value rendered statically (Figma state=on/off). */
  checked?: boolean;
  /** Track size (Figma: sm 30x18 — base, md 40x24, lg 56x32). */
  size?: "sm" | "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the track (Figma label/text); also names the switch. */
  label?: Child;
  disabled?: boolean;
  "aria-label"?: string;
  class?: string;
}

export function Switch({
  checked,
  size = "sm",
  bold,
  label,
  disabled,
  "aria-label": ariaLabel,
  class: className,
}: HonoSwitchProps): JSX.Element {
  const behavior = createSwitchBehavior({ checked, disabled });

  const control = (
    <button
      class={joinClass("podo-switch", className)}
      type="button"
      role="switch"
      aria-checked={behavior.checked ? "true" : "false"}
      aria-label={ariaLabel}
      disabled={behavior.disabled}
      data-size={size}
      data-state={behavior.checked ? "on" : "off"}
    >
      <span class="podo-switch__handle" />
    </button>
  );

  if (label == null) {
    return control;
  }

  // Figma 566:12693: track + 6px gap + size-matched text (sm 14/md 16/lg 18).
  return (
    <label
      class="podo-switch-wrap"
      data-size={size}
      data-bold={bold ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {control}
      <span class="podo-switch__text">{label}</span>
    </label>
  );
}

export interface HonoCheckboxProps {
  /** Value rendered statically (Figma state=checked/unchecked). */
  checked?: boolean;
  /** Partial-selection look (Figma state=indeterminate); the DOM mixed property needs client code. */
  indeterminate?: boolean;
  /** Label size only — the 18px box is fixed (Figma: md 14 — base, lg 16). */
  size?: "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the box (Figma label/text); also names the checkbox. */
  label?: Child;
  disabled?: boolean;
  name?: string;
  value?: string;
  "aria-label"?: string;
  class?: string;
}

export function Checkbox({
  checked,
  indeterminate,
  size = "md",
  bold,
  label,
  disabled,
  name,
  value,
  "aria-label": ariaLabel,
  class: className,
}: HonoCheckboxProps): JSX.Element {
  const behavior = createCheckboxBehavior({ checked, indeterminate, disabled });

  const control = (
    <input
      class={joinClass("podo-checkbox", className)}
      type="checkbox"
      name={name}
      value={value}
      checked={behavior.checked}
      disabled={behavior.disabled}
      aria-label={ariaLabel}
      data-state={behavior.dataState["data-state"]}
    />
  );

  if (label == null) {
    return control;
  }

  // Figma 328:18039: 18px box + 6px gap + size-matched text (md 14/lg 16).
  return (
    <label
      class="podo-checkbox-wrap"
      data-size={size}
      data-bold={bold ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {control}
      <span class="podo-checkbox__text">{label}</span>
    </label>
  );
}

export interface HonoRadioProps {
  /** Value rendered statically; the visual rides the native checked state. */
  checked?: boolean;
  /** Label size only — the 18px circle is fixed (Figma: md 14 — base, lg 16). */
  size?: "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the circle (Figma label/text); also names the radio. */
  label?: Child;
  disabled?: boolean;
  /** Same-name radios form a native exclusive group. */
  name?: string;
  value?: string;
  "aria-label"?: string;
  class?: string;
}

export function Radio({
  checked,
  size = "md",
  bold,
  label,
  disabled,
  name,
  value,
  "aria-label": ariaLabel,
  class: className,
}: HonoRadioProps): JSX.Element {
  const control = (
    <input
      class={joinClass("podo-radio", className)}
      type="radio"
      name={name}
      value={value}
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  );

  if (label == null) {
    return control;
  }

  // Figma 379:3350: 18px circle + 6px gap + size-matched text (md 14/lg 16).
  return (
    <label
      class="podo-radio-wrap"
      data-size={size}
      data-bold={bold ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {control}
      <span class="podo-radio__text">{label}</span>
    </label>
  );
}

export function Input({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  maxLength,
  readOnly,
  size = "md",
  prefix,
  suffixText,
  suffixIcon,
  invalid,
  disabled,
  required,
  class: className,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: HonoInputProps): JSX.Element {
  const behavior = createInputBehavior({ value, defaultValue, invalid, disabled, required });
  const state = behavior.invalid
    ? "invalid"
    : behavior.disabled
      ? "disabled"
      : readOnly
        ? "read-only"
        : undefined;

  // Root wrapper carries the visual state so prefix/suffix content can live
  // inside the box (Figma 538:6693); the inner input keeps the aria wiring.
  return (
    <div class={joinClass("podo-input", className)} data-size={size} data-state={state}>
      {prefix ? <span class="podo-input__prefix">{prefix}</span> : null}
      <input
        id={id}
        class="podo-input__control"
        name={name}
        value={value ?? defaultValue}
        placeholder={placeholder}
        maxlength={maxLength}
        readonly={readOnly}
        disabled={disabled}
        required={required}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid ?? (behavior.invalid ? "true" : undefined)}
        aria-required={ariaRequired ?? (behavior.required ? "true" : undefined)}
        data-invalid={invalid ? "true" : undefined}
      />
      {suffixText ? <span class="podo-input__suffix-text">{suffixText}</span> : null}
      {suffixIcon ? <span class="podo-input__suffix-icon">{suffixIcon}</span> : null}
    </div>
  );
}

export function Field({
  id = "podo-field",
  label,
  subLabel,
  suffixIcon,
  helperText,
  error,
  count,
  countMax,
  invalid,
  required,
  disabled,
  children,
}: HonoFieldProps): JSX.Element {
  // The footer shows a single guidance line (Figma 538:6691): the error wins
  // over the helper text so only the ids of what is rendered are referenced.
  const showError = Boolean(error);
  const showHelper = Boolean(helperText) && !showError;
  const a11y = createFieldA11y({
    id,
    invalid,
    required,
    hasDescription: showHelper,
    hasError: showError,
  });

  return (
    <div
      class="podo-field"
      data-invalid={invalid ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-required={required ? "true" : undefined}
    >
      <div class="podo-field__heading">
        <label class="podo-field__label" id={a11y.ids.labelId} for={a11y.ids.controlId}>
          {label}
          {required ? (
            <span class="podo-field__requirement" aria-hidden="true">
              *
            </span>
          ) : null}
          {subLabel ? <span class="podo-field__sub-label">{subLabel}</span> : null}
        </label>
        {suffixIcon ? <span class="podo-field__suffix-icon">{suffixIcon}</span> : null}
      </div>
      <div class="podo-field__control">
        {wireHonoControl(
          children,
          countMax != null ? { ...a11y.control, maxLength: countMax } : a11y.control
        )}
      </div>
      {showError || showHelper || countMax != null ? (
        <div class="podo-field__footer">
          {showError ? (
            <span class="podo-field__error" id={a11y.ids.errorId}>
              {error}
            </span>
          ) : null}
          {showHelper ? (
            <span class="podo-field__helper-text" id={a11y.ids.descriptionId}>
              {helperText}
            </span>
          ) : null}
          {countMax != null ? (
            <span class="podo-field__count">
              {count ?? 0}/{countMax}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Icon({ name }: { name: string }): JSX.Element {
  return <i class={`podo-icon podo-icon-${name}`} aria-hidden="true" />;
}

export function Typography({
  as = "p",
  variant = as === "h1" ? "h1" : "body",
  children,
}: {
  as?: "span" | "p" | "h1";
  variant?: "body" | "h1";
  children: Child;
}): JSX.Element {
  const Tag = as;
  return <Tag class={`podo-text podo-text--${variant}`}>{children}</Tag>;
}

export function renderCriticalCss({
  theme = "landing",
  colorScheme = "light",
  css = "",
}: HonoCriticalCssOptions = {}): JSX.Element {
  return (
    <>
      <style data-podo-critical>{raw(css)}</style>
      <script data-podo-theme>
        {raw(
          `document.documentElement.dataset.podoTheme=${JSON.stringify(
            theme
          )};document.documentElement.dataset.colorScheme=${JSON.stringify(colorScheme)};`
        )}
      </script>
    </>
  );
}

export const honoRendererScope =
  "Hono components render static SSR HTML. Interactive behavior is emitted as attributes and delegated to a future client entry.";

function joinClass(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function wireHonoControl(
  child: Child,
  controlAttributes: Record<string, string | boolean | number>
): Child {
  if (Array.isArray(child)) {
    return child.map((item) => wireHonoControl(item, controlAttributes));
  }

  if (!isValidElement(child)) {
    return child;
  }

  return cloneElement(child, Object.fromEntries(Object.entries(controlAttributes)));
}
