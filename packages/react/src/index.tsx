"use client";

import React, {
  createContext,
  createElement,
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  createButtonBehavior,
  createCheckboxBehavior,
  createFieldA11y,
  createInputBehavior,
  createSwitchBehavior,
} from "@podoui/core";

export interface PodoThemeContextValue {
  theme: string;
  colorScheme: "light" | "dark";
}

export interface PodoThemeProviderProps extends PodoThemeContextValue {
  children: ReactNode;
}

export interface PodoPressEvent {
  source: "button" | "chip";
  originalEvent: React.MouseEvent<HTMLButtonElement>;
}

export type ButtonTheme =
  | "solid-primary"
  | "solid-assistive"
  | "solid-white"
  | "solid-danger"
  | "outline-primary"
  | "outline-assistive"
  | "outline-white"
  | "outline-danger";

export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled" | "onClick" | "prefix"
> {
  theme?: ButtonTheme;
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  /** Stretch to the parent's full width (Figma auto-layout fill container). */
  fill?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onPress?: (event: PodoPressEvent) => void;
}

export type ChipTheme = "solid" | "outline-strong" | "outline-weak";

export interface ChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled" | "onClick" | "prefix"
> {
  /** Background contrast (Figma: solid, outline-strong, outline-weak). */
  theme?: ChipTheme;
  /** Label/icon scale (Figma: md 14px — base, lg 16px). */
  size?: "md" | "lg";
  /** Controlled 선택 값 (Figma state) — 비선택이 기본 모습이에요. */
  selected?: boolean;
  /** Initial uncontrolled selection. */
  defaultSelected?: boolean;
  disabled?: boolean;
  /** Category/status icon before the label (Figma prefix-icon). */
  prefix?: ReactNode;
  /** Removal/action icon after the label, e.g. close (Figma suffix-icon). */
  suffix?: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onPress?: (event: PodoPressEvent) => void;
  /** Fires with the next value when the chip is toggled. */
  onSelectedChange?: (selected: boolean) => void;
  /**
   * 제거형 칩 — 지정하면 선택된 모습으로 고정되고 X 버튼이 붙어요.
   * 토글 대신 X 클릭이 이 콜백을 부르며, 루트는 button이 아닌 span이 돼요.
   */
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 제거 버튼의 접근성 이름 (기본 "제거"). */
  removeLabel?: string;
}

export type BadgeTheme =
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

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * 상태·의미 색상 (Figma theme) — natural이 base. natural~info는 진한 배경의
   * 시스템 상태, gray~orange는 연한 배경의 색상 표기예요.
   */
  theme?: BadgeTheme;
  /** 숫자·텍스트 없이 6px 점만 표시 (Figma dot). children은 무시돼요. */
  dot?: boolean;
}

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "disabled" | "onClick" | "value"
> {
  /** Controlled on/off value (Figma state=on/off). */
  checked?: boolean;
  /** Initial uncontrolled value. */
  defaultChecked?: boolean;
  /** Track size (Figma: sm 30x18 — base, md 40x24, lg 56x32). */
  size?: "sm" | "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the track (Figma label/text); also names the switch. */
  label?: ReactNode;
  disabled?: boolean;
  /** Fires with the next value when the switch is toggled. */
  onCheckedChange?: (checked: boolean) => void;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked" | "disabled" | "onChange" | "size" | "type"
> {
  /** Controlled value (Figma state=checked/unchecked). */
  checked?: boolean;
  /** Initial uncontrolled value. */
  defaultChecked?: boolean;
  /** Partial-selection look for parent checkboxes (Figma state=indeterminate); announced as mixed. */
  indeterminate?: boolean;
  /** Label size only — the 18px box is fixed (Figma: md 14 — base, lg 16). */
  size?: "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the box (Figma label/text); also names the checkbox. */
  label?: ReactNode;
  disabled?: boolean;
  /** Fires with the next value when the checkbox is toggled. */
  onCheckedChange?: (checked: boolean) => void;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
}

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "disabled" | "onChange" | "size" | "type"
> {
  /** Label size only — the 18px circle is fixed (Figma: md 14 — base, lg 16). */
  size?: "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the circle (Figma label/text); also names the radio. */
  label?: ReactNode;
  disabled?: boolean;
  /** Fires with the next value when the radio is selected. */
  onCheckedChange?: (checked: boolean) => void;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
}

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "disabled" | "onChange" | "prefix" | "size"
> {
  /** Control height, radius, and font (Figma: md 42, lg 52). */
  size?: "md" | "lg";
  /** Icon or symbol giving the value context, before the control (Figma prefix). */
  prefix?: ReactNode;
  /** Fixed unit/domain text after the control, e.g. 원, kg (Figma suffix-text). */
  suffixText?: ReactNode;
  /** In-input action icon: clear, search, visibility toggle (Figma suffix-icon). */
  suffixIcon?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onValueChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
}

export interface SelectOption {
  value: string;
  /** 트리거 텍스트·칩·검색 필터에 그대로 쓰이는 표시 문자열. */
  label: string;
}

export interface SelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange" | "prefix"
> {
  /** 메뉴 항목 목록 — 셀 마크업은 컴포넌트가 그려요. */
  options: SelectOption[];
  /** 값이 없을 때 트리거에 표시 (Figma 플레이스 홀더). */
  placeholder?: string;
  /** Control height and radius (Figma: md 42 — base, lg 52). */
  size?: "md" | "lg";
  /**
   * 다중 선택 (Figma theme=slot) — 선택 값이 삭제 가능한 칩으로 나열되고
   * 메뉴 셀에 체크박스가 붙어요. false면 Figma theme=text.
   */
  multiple?: boolean;
  /** Controlled 단일 값 (null = 선택 없음). 생략하면 비제어. */
  value?: string | null;
  /** 비제어 단일 초기값. */
  defaultValue?: string;
  /** 단일 값이 선택될 때. */
  onValueChange?: (value: string) => void;
  /** Controlled 다중 값. 생략하면 비제어. */
  values?: string[];
  /** 비제어 다중 초기값. */
  defaultValues?: string[];
  /** 다중 값이 토글될 때 다음 배열과 함께. */
  onValuesChange?: (values: string[]) => void;
  /**
   * 트리거에 보여줄 최대 칩 수 — 넘치는 값은 "+N"으로 축약돼요 (해제는
   * 메뉴에서). 트리거가 한도 끝도 없이 넓어지는 걸 막아요.
   */
  maxChips?: number;
  /** 초기 열림 상태 (문서·데모용). */
  defaultOpen?: boolean;
  /** 열리면 트리거가 검색 입력이 되고 입력어를 포함한 항목만 남아요. */
  searchable?: boolean;
  /** 메뉴 상단에 직접 추가 입력줄 표시 (Figma multi-select-input). */
  addable?: boolean;
  /** 추가 입력줄 플레이스홀더. */
  addPlaceholder?: string;
  /** 추가 버튼으로 새 옵션이 만들어져 목록에 붙고 선택됐을 때. */
  onOptionAdd?: (option: SelectOption) => void;
  /** 다중 선택에서 값이 있을 때 트리거에 "모두 해제" ✕ 버튼을 보여줘요. */
  clearable?: boolean;
  /**
   * 메뉴를 document.body로 포탈 렌더 (기본값) — overflow hidden 컨테이너나
   * 스태킹 컨텍스트 안에서도 잘리지 않아요. portal={false}면 트리거 아래
   * 인라인으로 렌더돼요 (Tooltip과 동일 규약).
   */
  portal?: boolean;
  /**
   * 값은 보이지만 변경할 수 없는 상태 — 박스·체브론 없이 값만 렌더돼요
   * (Figma read-only, Input과 동일 규약).
   */
  readOnly?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** 값 앞에 붙는 아이콘 (Figma prefix-icon). */
  prefix?: ReactNode;
}

export interface TextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "disabled" | "onChange"
> {
  /** Show the resize grip and allow vertical resizing (Figma resize). */
  resize?: boolean;
  /** Value is visible but not editable; renders without the box (Figma read-only). */
  readOnly?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  onChange?: React.TextareaHTMLAttributes<HTMLTextAreaElement>["onChange"];
  onValueChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void;
}

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** grid: bordered frame with per-cell rules; horizon: row rules only. */
  type?: "grid" | "horizon";
  /** Checkbox selection column (Figma): select-all header + per-row boxes. */
  checkbox?: boolean;
  /** Initially selected tbody row indexes (0-based) when checkbox is on. */
  defaultSelected?: number[];
  /** Fires with the selected row indexes whenever the selection changes. */
  onSelectionChange?: (selected: number[]) => void;
}

export type ToastState = "normal" | "success" | "danger" | "info" | "warning";

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, "prefix"> {
  /** 상황의 성격에 따른 색·톤 (Figma state). */
  state?: ToastState;
  /** State icon before the title (Figma prefix-icon). */
  prefix?: ReactNode;
  /** Follow-up action text, e.g. 실행 취소 (Figma suffix-text). */
  suffixText?: ReactNode;
  /** Custom action icon after the title (Figma suffix-icon — the close X by default). */
  suffixIcon?: ReactNode;
  /** Extra line under the title (Figma caption). */
  caption?: ReactNode;
  /** Renders the close X button and fires when it's pressed. */
  onClose?: () => void;
  children: ReactNode;
}

export type ToasterPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToasterProps {
  /** Screen edge the stack anchors to. */
  position?: ToasterPosition;
  /** Auto-dismiss delay (ms) for toasts without their own duration. */
  duration?: number;
  /** Most toasts shown at once; the oldest is dismissed when it overflows. */
  max?: number;
}

export interface ToastOptions {
  state?: ToastState;
  caption?: ReactNode;
  /** Auto-dismiss delay (ms); overrides the Toaster default. */
  duration?: number;
  /** Stays until the close X is pressed — no auto-dismiss. */
  manual?: boolean;
}

export type TooltipTheme = "default" | "reverse";
export type TooltipPosition = "right" | "left" | "bottom" | "top";
export type TooltipOrdinal = "first" | "second" | "third";

export interface TooltipProps {
  /** 말풍선 내용 (Figma label). */
  label: ReactNode;
  /** 대상 기준 표시 방향 — 화살표가 대상을 가리켜요 (Figma position). */
  position?: TooltipPosition;
  /** 화살표가 말풍선의 시작/가운데/끝 어디에 붙는지 (Figma ordinal). */
  ordinal?: TooltipOrdinal;
  /** 밝은 배경(default) 또는 어두운 배경(reverse) (Figma theme). */
  theme?: TooltipTheme;
  /** false면 흐름 안에 그대로 렌더 — 기본은 document.body 포탈 + 좌표 배치. */
  portal?: boolean;
  /** Controlled visibility; 생략하면 hover/focus로 스스로 열고 닫아요. */
  open?: boolean;
  /** 트리거 요소 하나. hover/focus 핸들러와 aria-describedby가 주입돼요. */
  children: ReactElement;
}

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  /** Supplementary text next to the label (Figma sub-label, e.g. "선택"). */
  subLabel?: ReactNode;
  /** Helper/status icon at the right edge of the heading row (Figma suffix-icon). */
  suffixIcon?: ReactNode;
  /** Footer guidance for how to fill the control (Figma helper-text). */
  helperText?: ReactNode;
  /** Footer error message; replaces helperText and renders in the danger color. */
  error?: ReactNode;
  /** Current character count, shown as count/countMax when countMax is set. */
  count?: number;
  /** Maximum character count; enables the footer counter (Figma character-count). */
  countMax?: number;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export interface IconProps extends HTMLAttributes<HTMLElement> {
  name: string;
  /** Glyph scale (icon.component.json size variant: sm, md — base, lg). */
  size?: "sm" | "md" | "lg";
  /**
   * Decorative icons are hidden from assistive technology (spec default).
   * decorative={false}는 role="img"로 렌더되고 소비자의 aria-label이
   * 접근성 이름이 돼요.
   */
  decorative?: boolean;
}

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "h1";
  variant?: "body" | "h1";
}

export const PodoThemeContext = createContext<PodoThemeContextValue>({
  theme: "landing",
  colorScheme: "light",
});

export function PodoThemeProvider({
  theme,
  colorScheme,
  children,
}: PodoThemeProviderProps): React.ReactElement {
  return (
    <PodoThemeContext.Provider value={{ theme, colorScheme }}>
      <div data-podo-theme={theme} data-color-scheme={colorScheme}>
        {children}
      </div>
    </PodoThemeContext.Provider>
  );
}

export function usePodoTheme(): PodoThemeContextValue {
  return useContext(PodoThemeContext);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    theme = "solid-primary",
    size = "md",
    disabled,
    fill,
    prefix,
    suffix,
    children,
    className,
    type = "button",
    onClick,
    onPress,
    ...props
  },
  ref
) {
  const behavior = createButtonBehavior({ disabled, type });
  const classes = joinClass("podo-button", className);

  return (
    <button
      {...props}
      {...behavior.dataState}
      ref={ref}
      type={behavior.root.type}
      disabled={behavior.root.disabled}
      aria-disabled={behavior.root.ariaDisabled}
      tabIndex={behavior.root.tabIndex}
      className={classes}
      data-size={size}
      data-theme={theme}
      data-fill={fill ? "true" : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!behavior.pressable || event.defaultPrevented) {
          return;
        }
        onPress?.({ source: "button", originalEvent: event });
      }}
    >
      {prefix ? <span className="podo-button__icon">{prefix}</span> : null}
      <span className="podo-button__label">{children}</span>
      {suffix ? <span className="podo-button__icon">{suffix}</span> : null}
    </button>
  );
});

// Close glyph for removable chips (Figma suffix-icon=close, 16px, follows the
// label color).
const CHIP_CLOSE = (
  <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * The forwarded ref receives the chip's root element, which depends on the
 * mode: removable chips (`onRemove`) expose the static `<span>` root (the X
 * is the only button there), toggle chips the `<button>` root — hence the
 * `HTMLButtonElement | HTMLSpanElement` ref type.
 */
export const Chip = forwardRef<HTMLButtonElement | HTMLSpanElement, ChipProps>(function Chip(
  {
    theme = "solid",
    size = "md",
    selected,
    defaultSelected = false,
    disabled,
    prefix,
    suffix,
    children,
    className,
    type = "button",
    onClick,
    onPress,
    onSelectedChange,
    onRemove,
    removeLabel = "제거",
    ...props
  },
  ref
) {
  const behavior = createButtonBehavior({ disabled, type });
  // Uncontrolled fallback: without a selected prop the chip toggles itself.
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const isSelected = selected ?? internalSelected;
  // 하나의 forwarded ref가 두 루트(제거형 span/토글형 button)를 받아요 —
  // JSX ref 타입에 맞게 캐스트 대신 콜백으로 직접 연결해요.
  const setRootRef = useCallback(
    (node: HTMLButtonElement | HTMLSpanElement | null) => {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  if (onRemove) {
    // Removable chip: born in the selected look, no toggle — the X is the only
    // control, so the root is a static span (buttons can't nest). disabled는
    // 루트가 span이라 [disabled] 속성 대신 data-disabled로 표시하고, X 버튼을
    // 비활성화해 onRemove가 절대 불리지 않게 해요.
    return (
      <span
        {...(props as HTMLAttributes<HTMLElement>)}
        {...behavior.dataState}
        ref={setRootRef}
        className={joinClass("podo-chip", className)}
        data-size={size}
        data-theme={theme}
        data-state="selected"
        data-removable="true"
      >
        {prefix ? <span className="podo-chip__prefix">{prefix}</span> : null}
        <span className="podo-chip__label">{children}</span>
        <button
          type="button"
          className="podo-chip__remove"
          aria-label={removeLabel}
          disabled={behavior.root.disabled}
          aria-disabled={behavior.root.ariaDisabled}
          tabIndex={behavior.root.tabIndex}
          onClick={(event) => {
            if (!behavior.pressable || event.defaultPrevented) {
              return;
            }
            onRemove(event);
          }}
        >
          {CHIP_CLOSE}
        </button>
      </span>
    );
  }

  return (
    <button
      {...props}
      {...behavior.dataState}
      ref={setRootRef}
      type={behavior.root.type}
      disabled={behavior.root.disabled}
      aria-disabled={behavior.root.ariaDisabled}
      tabIndex={behavior.root.tabIndex}
      aria-pressed={isSelected}
      data-state={isSelected ? "selected" : undefined}
      className={joinClass("podo-chip", className)}
      data-size={size}
      data-theme={theme}
      onClick={(event) => {
        onClick?.(event);
        if (!behavior.pressable || event.defaultPrevented) {
          return;
        }
        if (selected == null) {
          setInternalSelected(!isSelected);
        }
        onSelectedChange?.(!isSelected);
        onPress?.({ source: "chip", originalEvent: event });
      }}
    >
      {prefix ? <span className="podo-chip__prefix">{prefix}</span> : null}
      <span className="podo-chip__label">{children}</span>
      {suffix ? <span className="podo-chip__suffix">{suffix}</span> : null}
    </button>
  );
});

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { theme = "natural", dot, children, className, ...props },
  ref
) {
  return (
    <span
      {...props}
      ref={ref}
      className={joinClass("podo-badge", className)}
      data-theme={theme}
      data-dot={dot ? "true" : undefined}
    >
      {dot ? null : children}
    </span>
  );
});

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    defaultChecked = false,
    size = "sm",
    bold,
    label,
    disabled,
    className,
    type = "button",
    onClick,
    onCheckedChange,
    ...props
  },
  ref
) {
  // Uncontrolled fallback: without a checked prop the switch tracks itself.
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isOn = checked ?? internalChecked;
  const behavior = createSwitchBehavior({ checked: isOn, disabled });

  const control = (
    <button
      {...props}
      {...behavior.root}
      {...behavior.dataState}
      ref={ref}
      type={type}
      className={joinClass("podo-switch", className)}
      data-size={size}
      onClick={(event) => {
        onClick?.(event);
        if (!behavior.pressable || event.defaultPrevented) {
          return;
        }
        if (checked == null) {
          setInternalChecked(!isOn);
        }
        onCheckedChange?.(!isOn);
      }}
    >
      <span className="podo-switch__handle" />
    </button>
  );

  if (label == null) {
    return control;
  }

  // A <label> wrapper implicitly names and activates the switch button
  // (Figma 566:12693: track + 6px gap + size-matched text: sm 14/md 16/lg 18).
  return (
    <label
      className="podo-switch-wrap"
      data-size={size}
      data-bold={bold ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {control}
      <span className="podo-switch__text">{label}</span>
    </label>
  );
});

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked,
    defaultChecked = false,
    indeterminate = false,
    size = "md",
    bold,
    label,
    disabled,
    className,
    onChange,
    onCheckedChange,
    ...props
  },
  ref
) {
  // Uncontrolled fallback: without a checked prop the checkbox tracks itself.
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isOn = checked ?? internalChecked;
  const behavior = createCheckboxBehavior({ checked: isOn, indeterminate, disabled });

  const control = (
    <input
      {...props}
      {...behavior.dataState}
      ref={(element) => {
        // The mixed state only exists as a DOM property.
        if (element) {
          element.indeterminate = indeterminate;
        }
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
      }}
      type="checkbox"
      className={joinClass("podo-checkbox", className)}
      checked={isOn}
      disabled={disabled}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) {
          return;
        }
        if (checked == null) {
          setInternalChecked(event.target.checked);
        }
        onCheckedChange?.(event.target.checked);
      }}
    />
  );

  if (label == null) {
    return control;
  }

  // A <label> wrapper implicitly names and activates the checkbox
  // (Figma 328:18039: 18px box + 6px gap + size-matched text: md 14/lg 16).
  return (
    <label
      className="podo-checkbox-wrap"
      data-size={size}
      data-bold={bold ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {control}
      <span className="podo-checkbox__text">{label}</span>
    </label>
  );
});

// Radio stays a plain native input: same-name group exclusivity lives in the
// platform, and the browser doesn't fire events on the sibling it unchecks —
// so the visual rides :checked (no data-state tracking, unlike Checkbox).
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { size = "md", bold, label, disabled, className, onChange, onCheckedChange, ...props },
  ref
) {
  const control = (
    <input
      {...props}
      ref={ref}
      type="radio"
      className={joinClass("podo-radio", className)}
      disabled={disabled}
      onChange={(event) => {
        onChange?.(event);
        if (event.defaultPrevented) {
          return;
        }
        onCheckedChange?.(event.target.checked);
      }}
    />
  );

  if (label == null) {
    return control;
  }

  // A <label> wrapper implicitly names and activates the radio
  // (Figma 379:3350: 18px circle + 6px gap + size-matched text: md 14/lg 16).
  return (
    <label
      className="podo-radio-wrap"
      data-size={size}
      data-bold={bold ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      {control}
      <span className="podo-radio__text">{label}</span>
    </label>
  );
});

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    prefix,
    suffixText,
    suffixIcon,
    invalid,
    readOnly,
    disabled,
    required,
    className,
    onChange,
    onValueChange,
    ...props
  },
  ref
) {
  const behavior = createInputBehavior({
    disabled,
    invalid,
    required,
    value: typeof props.value === "string" ? props.value : undefined,
    defaultValue: typeof props.defaultValue === "string" ? props.defaultValue : undefined,
  });

  // Root wrapper carries the visual state (border, size, hover/focus) so
  // prefix/suffix content can live inside the box (Figma 538:6693); the inner
  // <input> receives every native/aria prop, including what Field wires in.
  // data-state matches the [data-state] selectors the token codegen emits.
  const state = behavior.invalid
    ? "invalid"
    : behavior.disabled
      ? "disabled"
      : readOnly
        ? "read-only"
        : undefined;

  return (
    <div className={joinClass("podo-input", className)} data-size={size} data-state={state}>
      {prefix ? <span className="podo-input__prefix">{prefix}</span> : null}
      <input
        {...props}
        {...behavior.root}
        ref={ref}
        readOnly={readOnly}
        className="podo-input__control"
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.currentTarget.value, event);
        }}
      />
      {suffixText ? <span className="podo-input__suffix-text">{suffixText}</span> : null}
      {suffixIcon ? <span className="podo-input__suffix-icon">{suffixIcon}</span> : null}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    resize = true,
    readOnly,
    invalid,
    disabled,
    required,
    className,
    onChange,
    onValueChange,
    ...props
  },
  ref
) {
  const behavior = createInputBehavior({
    disabled,
    invalid,
    required,
    value: typeof props.value === "string" ? props.value : undefined,
    defaultValue: typeof props.defaultValue === "string" ? props.defaultValue : undefined,
  });
  const state = behavior.invalid
    ? "invalid"
    : behavior.disabled
      ? "disabled"
      : readOnly
        ? "read-only"
        : undefined;

  return (
    <textarea
      {...props}
      {...behavior.root}
      ref={ref}
      readOnly={readOnly}
      className={joinClass("podo-textarea", className)}
      data-state={state}
      data-resize={resize ? undefined : "false"}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.currentTarget.value, event);
      }}
    />
  );
});

// Select icons (Figma: chevron gray.80, single-selected check primary.50,
// checkbox check + chip close inherit their surface colors).
const SELECT_CHEVRON = (
  <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 9l6 6 6-6"
      stroke="#27272A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SELECT_CHECK = (
  <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M3.5 8.5l3 3 6-6.5"
      stroke="#426CED"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SELECT_BOX_CHECK = (
  <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2.5 6.5l2.5 2.5 4.5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Portal menu placement constants — 6px matches the menu-list's padding-top
// gap in CSS, 474px mirrors the menu's CSS max-height (ten 42px cells + nine
// 4px gaps + 16px padding + 2px border), 8px keeps it off the viewport edge.
const SELECT_MENU_GAP = 6;
const SELECT_MENU_MAX_HEIGHT = 474;
const SELECT_MENU_MARGIN = 8;
// 남은 공간이 아무리 좁아도 최소 한 줄(42px 셀 + 16px 패딩)은 보여요.
const SELECT_MENU_MIN_HEIGHT = 58;

export const Select = forwardRef<HTMLDivElement, SelectProps>(function Select(
  {
    options,
    placeholder,
    size = "md",
    multiple,
    value,
    defaultValue,
    onValueChange,
    values,
    defaultValues,
    onValuesChange,
    maxChips = 3,
    defaultOpen = false,
    searchable,
    addable,
    addPlaceholder,
    onOptionAdd,
    clearable,
    portal = true,
    readOnly,
    invalid,
    disabled,
    prefix,
    className,
    onClick,
    onKeyDown,
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    "aria-required": ariaRequired,
    ...props
  },
  ref
) {
  const [open, setOpen] = useState(defaultOpen);
  // Portal은 document.body가 필요한데 서버 렌더 중엔 DOM이 없어요. 마운트
  // 후에만 포탈을 붙여 SSR(renderToString)과 클라이언트 첫 렌더 마크업을
  // 동일하게 유지해요 — defaultOpen 메뉴는 마운트 직후 렌더에서 나타나요.
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [addText, setAddText] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  // Uncontrolled fallbacks — value/values props switch each mode to controlled.
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const [internalValues, setInternalValues] = useState<string[]>(defaultValues ?? []);
  // addable로 만들어진 옵션은 내부에 쌓아 options와 합쳐요 (value 기준 중복 제거).
  const [added, setAdded] = useState<SelectOption[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const menuListRef = useRef<HTMLDivElement | null>(null);
  // Portal 모드에서 트리거 아래(공간이 없으면 위) 고정 배치할 좌표
  // (getBoundingClientRect 기준). bottom이 있으면 위로 뒤집힌 상태고,
  // maxHeight는 남은 공간이 메뉴보다 작을 때만 내부 스크롤용으로 줄여요.
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight?: number;
  } | null>(null);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 열린 채 disabled/readOnly로 바뀌면 열림 상태도 함께 접어요 — 나중에 다시
  // 활성화될 때 메뉴가 저절로 되살아나지 않게요.
  useEffect(() => {
    if ((disabled || readOnly) && open) {
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    }
  }, [disabled, readOnly, open]);

  const selectedValue = value !== undefined ? value : internalValue;
  const selectedValues = values ?? internalValues;
  const allOptions = [
    ...options,
    ...added.filter((a) => !options.some((o) => o.value === a.value)),
  ];
  const visible =
    searchable && query ? allOptions.filter((o) => o.label.includes(query)) : allOptions;
  const hasValue = multiple
    ? selectedValues.length > 0
    : selectedValue != null && selectedValue !== "";
  const selectedOption = allOptions.find((o) => o.value === selectedValue);
  // disabled/read-only는 열림을 항상 거부해요 — defaultOpen으로 시작했든 열린
  // 채 상태가 바뀌었든, 메뉴(와 옵션 콜백)는 렌더되지 않아야 해요.
  const isOpen = open && !disabled && !readOnly;
  // ARIA 열림 상태는 메뉴의 실제 존재를 따라가요 — portal 메뉴는 마운트 전
  // (SSR·클라이언트 첫 렌더)엔 렌더되지 않으므로, 그동안 aria-expanded=false,
  // aria-controls 생략으로 존재하지 않는 listbox를 가리키지 않아요. 마운트 후
  // 메뉴와 함께 같이 뒤집혀요 (hydration 안전: 첫 클라이언트 렌더가 SSR과
  // 일치하고, 마운트 effect가 이후에 갱신). portal={false}는 메뉴가 SSR에도
  // 인라인으로 함께 렌더되므로 기존 동작 그대로예요.
  const menuRendered = isOpen && (!portal || mounted);

  const closeMenu = () => {
    // 검색 중엔 포커스가 곧 언마운트될 검색 입력에 있다 — 그대로 닫으면
    // 포커스가 body로 떨어지므로 트리거로 되돌린다 (spec focusManagement:
    // 포커스는 트리거 또는 검색 입력에 머문다). 바깥 클릭/스크롤 닫힘은 이
    // 함수를 타지 않아 사용자가 옮긴 포커스를 뺏지 않는다.
    const refocusTrigger = Boolean(isOpen && searchable);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    if (refocusTrigger) {
      triggerRef.current?.focus();
    }
  };

  const pick = (optionValue: string) => {
    // disabled/read-only 상태에선 어떤 경로(옵션 클릭, 칩 제거 등)로도 값이
    // 바뀌면 안 돼요.
    if (disabled || readOnly) {
      return;
    }
    if (multiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      if (values === undefined) {
        setInternalValues(next);
      }
      onValuesChange?.(next);
      // 검색 중 선택하면 입력값을 비워 전체 목록으로 되돌려요.
      setQuery("");
      setActiveIndex(-1);
    } else {
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onValueChange?.(optionValue);
      closeMenu();
    }
  };

  const addOption = () => {
    const text = addText.trim();
    if (!text) {
      return;
    }
    const option = { value: text, label: text };
    const existingIndex = allOptions.findIndex((o) => o.value === option.value);
    if (existingIndex < 0) {
      setAdded((prev) => [...prev, option]);
    }
    if (multiple) {
      if (!selectedValues.includes(option.value)) {
        const next = [...selectedValues, option.value];
        if (values === undefined) {
          setInternalValues(next);
        }
        onValuesChange?.(next);
      }
      // 추가된 옵션이 바로 보이게: 검색어를 비워 전체 목록으로 돌리고 해당
      // 셀을 활성으로 만들어 메뉴 스크롤이 따라가게 해요 (10줄 스크롤 대응).
      setQuery("");
      setActiveIndex(existingIndex >= 0 ? existingIndex : allOptions.length);
    } else {
      if (value === undefined) {
        setInternalValue(option.value);
      }
      onValueChange?.(option.value);
      closeMenu();
    }
    onOptionAdd?.(option);
    setAddText("");
  };

  // Outside click closes — the menu is anchored inside the root, so a simple
  // containment check covers the trigger, chips, add row, and cells.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (
        root &&
        event.target instanceof Node &&
        !root.contains(event.target) &&
        // Portal 메뉴는 루트 밖에 있으니 따로 포함 검사해요.
        !menuListRef.current?.contains(event.target)
      ) {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  // Portal 모드: 트리거 위치를 재서 메뉴를 그 아래 고정 배치해요. 값·검색어가
  // 바뀌어 트리거가 변해도 다시 잽니다. 아래 공간이 모자라고 위가 더 넓으면
  // 위로 뒤집고, 뒤집어도 다 안 들어가면 남은 공간만큼 max-height를 줄여
  // 내부 스크롤로 모든 옵션에 닿게 해요 (화면 밖 옵션은 클릭할 수 없고,
  // 바깥 스크롤은 메뉴를 닫으니까요). 리사이즈에도 같은 규칙으로 다시 잽니다.
  useLayoutEffect(() => {
    if (!isOpen || !portal) {
      return undefined;
    }
    const place = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }
      const menu = menuListRef.current?.firstElementChild as HTMLElement | null;
      // scrollHeight는 max-height 캡과 무관한 콘텐츠 높이 — CSS 캡이 상한.
      const menuHeight = Math.min(menu?.scrollHeight ?? 0, SELECT_MENU_MAX_HEIGHT);
      const spaceBelow = window.innerHeight - rect.bottom - SELECT_MENU_GAP - SELECT_MENU_MARGIN;
      const spaceAbove = rect.top - SELECT_MENU_GAP - SELECT_MENU_MARGIN;
      const flip = menuHeight > spaceBelow && spaceAbove > spaceBelow;
      const space = flip ? spaceAbove : spaceBelow;
      // 메뉴는 min-width: min-content로 트리거보다 넓어질 수 있어요.
      const menuWidth = Math.max(rect.width, menu?.offsetWidth ?? 0);
      setMenuPosition({
        // 뒤집힌 메뉴는 아래쪽을 트리거 위 6px에 고정해요 (아래 배치의
        // menu-list padding-top 간격과 동일).
        bottom: flip ? window.innerHeight - rect.top + SELECT_MENU_GAP : undefined,
        // 트리거 왼쪽 정렬 유지 — 오른쪽 화면 밖으로 넘치는 만큼만 당겨요.
        left: Math.min(
          rect.left,
          Math.max(SELECT_MENU_MARGIN, window.innerWidth - menuWidth - SELECT_MENU_MARGIN)
        ),
        maxHeight: menuHeight > space ? Math.max(space, SELECT_MENU_MIN_HEIGHT) : undefined,
        top: flip ? undefined : rect.bottom,
        width: rect.width,
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [isOpen, portal, selectedValues.length, query, size]);

  // Portal 메뉴는 바깥 스크롤을 따라가지 않고 닫아요 (Tooltip과 동일).
  // 메뉴 내부 옵션 리스트 스크롤은 예외. 리사이즈는 위에서 다시 배치해요.
  useEffect(() => {
    if (!isOpen || !portal) {
      return undefined;
    }
    const close = (event: Event) => {
      if (
        event.target instanceof Node &&
        menuListRef.current &&
        menuListRef.current.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
      setQuery("");
      setActiveIndex(-1);
    };
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [isOpen, portal]);

  // 메뉴가 10줄에서 스크롤되므로, 키보드 활성 셀이 밖으로 나가면 따라가요.
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      document.getElementById(`${menuId}-${activeIndex}`)?.scrollIntoView?.({ block: "nearest" });
    }
  }, [isOpen, activeIndex, menuId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (disabled || readOnly || event.defaultPrevented) {
      return;
    }
    // 칩 제거·모두 해제 같은 내부 버튼에서 버블링된 Enter/Space는 그 버튼의
    // 네이티브 키보드 활성화(클릭 합성)가 처리해요 — 트리거가 preventDefault로
    // 삼켜 메뉴를 토글하면 안 돼요. 합성된 click은 버튼의 click 핸들러가
    // 포인터 경로와 동일하게 stopPropagation으로 토글 번짐을 막아요.
    const nestedButton = (event.target as HTMLElement).closest("button");
    if (nestedButton && event.currentTarget.contains(nestedButton)) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      setActiveIndex((current) => {
        const max = visible.length - 1;
        if (max < 0) {
          return -1;
        }
        return event.key === "ArrowDown" ? Math.min(current + 1, max) : Math.max(current - 1, 0);
      });
    } else if (event.key === "Enter") {
      // 추가 입력줄의 Enter는 자체 처리(stopPropagation) — 여기 오지 않아요.
      event.preventDefault();
      const active = visible[activeIndex];
      if (open && active) {
        pick(active.value);
      } else {
        setOpen(!open);
        if (open) {
          setQuery("");
          setActiveIndex(-1);
        }
      }
    } else if (event.key === " " && !(searchable && open)) {
      event.preventDefault();
      if (open) {
        closeMenu();
      } else {
        setOpen(true);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu();
    }
  };

  // 선택 값 칩은 Chip 컴포넌트의 제거형 모드를 그대로 재사용하고, maxChips를
  // 넘는 값은 "+N"으로 축약해요 (해제는 메뉴에서). read-only에선 지울 수
  // 없으니 X 없는 정적 칩으로 렌더해요.
  const hiddenChipCount = Math.max(0, selectedValues.length - maxChips);
  const chips = selectedValues.slice(0, maxChips).map((v) => {
    const label = allOptions.find((o) => o.value === v)?.label ?? v;
    // read-only/disabled Select의 값은 지울 수 없으니 X 없는 정적 칩으로 렌더해요.
    if (readOnly || disabled) {
      return (
        <span
          key={v}
          className="podo-chip"
          data-theme="solid"
          data-size="md"
          data-state="selected"
          data-removable="true"
          data-disabled={disabled ? "true" : undefined}
        >
          <span className="podo-chip__label">{label}</span>
        </span>
      );
    }
    return (
      <Chip
        key={v}
        removeLabel={`${label} 제거`}
        onRemove={(event) => {
          // 트리거 클릭(메뉴 토글)으로 번지지 않게 여기서 끊어요.
          event.stopPropagation();
          pick(v);
        }}
      >
        {label}
      </Chip>
    );
  });
  if (hiddenChipCount > 0) {
    chips.push(
      <span
        key="podo-select-more"
        className="podo-select__chip-more"
        aria-label={`외 ${hiddenChipCount}개 선택됨`}
      >
        +{hiddenChipCount}
      </span>
    );
  }

  // 검색 중엔 포커스가 내부 입력으로 옮겨가므로 ARIA combobox 패턴대로
  // 콤보박스 배선(role/aria-expanded/-controls/-activedescendant)도 입력이
  // 넘겨받아요 — 트리거가 역할을 이중으로 갖지 않게 그동안 내려놓아요.
  const searching = Boolean(isOpen && searchable);
  const searchComboProps = {
    role: "combobox",
    "aria-expanded": menuRendered,
    "aria-haspopup": "listbox",
    "aria-autocomplete": "list",
    "aria-controls": menuRendered ? menuId : undefined,
    "aria-activedescendant":
      menuRendered && activeIndex >= 0 ? `${menuId}-${activeIndex}` : undefined,
  } as const;
  // id와 이름·설명·상태 ARIA는 레이아웃 래퍼가 아니라 combobox 요소가 실어야
  // 해요 — Field가 주입한 label[for]/aria-* 배선이 여기로 들어와요. 검색 중엔
  // combobox 역할이 입력으로 넘어가니 이 묶음도 역할과 함께 따라가요.
  const comboAria = {
    id,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid ?? (invalid || undefined),
    "aria-required": ariaRequired,
  };

  return (
    <div
      {...props}
      ref={(node) => {
        rootRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={joinClass("podo-select", className)}
      data-size={size}
      data-state={invalid ? "invalid" : disabled ? "disabled" : readOnly ? "read-only" : undefined}
      data-open={isOpen ? "true" : undefined}
    >
      <div
        {...(searching ? undefined : comboAria)}
        ref={triggerRef}
        role={searching ? undefined : "combobox"}
        aria-expanded={searching ? undefined : menuRendered}
        aria-haspopup={searching ? undefined : "listbox"}
        aria-controls={menuRendered && !searching ? menuId : undefined}
        aria-activedescendant={
          menuRendered && !searching && activeIndex >= 0 ? `${menuId}-${activeIndex}` : undefined
        }
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        tabIndex={disabled || searching ? -1 : 0}
        className="podo-select__trigger"
        onKeyDown={handleKeyDown}
        onClick={(event) => {
          onClick?.(event);
          if (disabled || readOnly || event.defaultPrevented) {
            return;
          }
          // 검색 입력 클릭은 편집이지 토글이 아니에요.
          if ((event.target as HTMLElement).closest(".podo-select__search")) {
            return;
          }
          if (open) {
            closeMenu();
          } else {
            setOpen(true);
          }
        }}
      >
        {prefix ? <span className="podo-select__prefix">{prefix}</span> : null}
        {/* 검색 모드 두 갈래: 칩이 있으면 칩 뒤에 인라인 커서(react-select식,
            입력 폭은 타이핑한 만큼만), 없으면 값 콘텐츠를 레이아웃에 남겨
            너비를 고정한 채 입력을 그 위에 겹쳐요 (열림/닫힘 너비 점프 방지). */}
        <span className="podo-select__value" data-placeholder={hasValue ? undefined : "true"}>
          {searching && multiple && hasValue ? (
            <span className="podo-select__value-content">
              {chips}
              <input
                {...searchComboProps}
                {...comboAria}
                autoFocus
                className="podo-select__search podo-select__search--inline"
                style={{ width: `calc(${query.length * 2}ch + 2px)` }}
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                  setActiveIndex(-1);
                }}
              />
            </span>
          ) : (
            <>
              <span
                className="podo-select__value-content"
                data-hidden={searching ? "true" : undefined}
              >
                {multiple
                  ? hasValue
                    ? chips
                    : placeholder
                  : (selectedOption?.label ?? placeholder)}
              </span>
              {searching ? (
                <input
                  {...searchComboProps}
                  {...comboAria}
                  autoFocus
                  className="podo-select__search"
                  value={query}
                  placeholder={multiple ? placeholder : (selectedOption?.label ?? placeholder)}
                  onChange={(event) => {
                    setQuery(event.currentTarget.value);
                    setActiveIndex(-1);
                  }}
                />
              ) : null}
            </>
          )}
        </span>
        {clearable && multiple && hasValue && !disabled && !readOnly ? (
          <button
            type="button"
            className="podo-select__clear"
            aria-label="모두 해제"
            onClick={(event) => {
              // 메뉴 토글로 번지지 않게 끊고 전체 해제해요.
              event.stopPropagation();
              if (values === undefined) {
                setInternalValues([]);
              }
              onValuesChange?.([]);
            }}
          >
            {CHIP_CLOSE}
          </button>
        ) : null}
        {/* read-only는 열 수 없으니 체브론도 없어요 (Figma read-only). */}
        {readOnly ? null : <span className="podo-select__chevron">{SELECT_CHEVRON}</span>}
      </div>
      {menuRendered
        ? renderSelectMenu(
            portal,
            <div
              ref={menuListRef}
              className="podo-select__menu-list"
              data-portal={portal ? "true" : undefined}
              style={
                portal
                  ? {
                      bottom: menuPosition?.bottom,
                      left: menuPosition?.left ?? 0,
                      position: "fixed",
                      right: "auto",
                      top: menuPosition?.bottom != null ? "auto" : (menuPosition?.top ?? 0),
                      width: menuPosition?.width,
                    }
                  : undefined
              }
            >
              {/* 박스(.podo-select__menu)와 리스트박스를 분리해요 —
                  role="listbox"의 자식은 option/group만 허용되므로 추가
                  입력줄은 리스트박스 밖, 같은 박스 안 위쪽에 렌더해요
                  (hono와 동일 구조). aria-controls/-activedescendant는
                  리스트박스 id를 가리켜요. */}
              <div
                className="podo-select__menu"
                style={
                  portal && menuPosition?.maxHeight != null
                    ? { maxHeight: menuPosition.maxHeight }
                    : undefined
                }
              >
                {addable ? (
                  <div className="podo-select__add">
                    <input
                      className="podo-select__add-input"
                      value={addText}
                      placeholder={addPlaceholder}
                      onChange={(event) => setAddText(event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.stopPropagation();
                          addOption();
                        }
                      }}
                    />
                    <button type="button" className="podo-select__add-button" onClick={addOption}>
                      추가
                    </button>
                  </div>
                ) : null}
                <div
                  className="podo-select__listbox"
                  role="listbox"
                  id={menuId}
                  aria-multiselectable={multiple || undefined}
                >
                  {visible.map((option, index) => {
                    const selected = multiple
                      ? selectedValues.includes(option.value)
                      : option.value === selectedValue;
                    return (
                      <div
                        key={option.value}
                        id={`${menuId}-${index}`}
                        role="option"
                        aria-selected={selected}
                        className="podo-select__cell"
                        data-state={selected ? "selected" : undefined}
                        data-active={index === activeIndex ? "true" : undefined}
                        onClick={() => pick(option.value)}
                      >
                        {multiple ? (
                          <span
                            className="podo-select__checkbox"
                            data-checked={selected ? "true" : undefined}
                          >
                            {selected ? SELECT_BOX_CHECK : null}
                          </span>
                        ) : null}
                        <span className="podo-select__cell-label">{option.label}</span>
                        {!multiple && selected ? (
                          <span className="podo-select__cell-check">{SELECT_CHECK}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        : null}
    </div>
  );
});

// Portal이면 메뉴를 document.body로 띄우고, 아니면 트리거 아래 인라인.
function renderSelectMenu(portal: boolean, menu: React.ReactElement): React.ReactNode {
  return portal ? createPortal(menu, document.body) : menu;
}

// Arrowheads per position, pointing at the target (Figma 4x16 rounded vector,
// drawn straight — the 2px rounding is invisible at this size).
const TOOLTIP_ARROWS: Record<TooltipPosition, React.ReactElement> = {
  right: (
    <svg aria-hidden width="4" height="16" viewBox="0 0 4 16">
      <path d="M4 0v4L0 8l4 4v4z" fill="currentColor" />
    </svg>
  ),
  left: (
    <svg aria-hidden width="4" height="16" viewBox="0 0 4 16">
      <path d="M0 0v4l4 4-4 4v4z" fill="currentColor" />
    </svg>
  ),
  bottom: (
    <svg aria-hidden width="16" height="4" viewBox="0 0 16 4">
      <path d="M0 4h4l4-4 4 4h4z" fill="currentColor" />
    </svg>
  ),
  top: (
    <svg aria-hidden width="16" height="4" viewBox="0 0 16 4">
      <path d="M0 0h4l4 4 4-4h4z" fill="currentColor" />
    </svg>
  ),
};

// Distance from the bubble's start edge to the arrowhead center while
// ordinal=first/third (Figma: 4px inset + half the 16px arrow).
const TOOLTIP_ARROW_CENTER = 12;

export function Tooltip({
  label,
  position = "right",
  ordinal = "first",
  theme = "default",
  portal = true,
  open,
  children,
}: TooltipProps): React.ReactElement {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  // Portal은 document.body가 필요한데 서버 렌더 중엔 DOM이 없어요. 서버와
  // 클라이언트 첫 렌더는 말풍선을 인라인으로 두고(hydration 마크업 일치),
  // 마운트 후에만 포탈로 옮겨요 — <Tooltip open>이 SSR에서도 죽지 않고
  // 말풍선이 내내 렌더된 채 유지돼요 (Select의 mounted 패턴과 동일).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Portal placement: measure the trigger and the bubble, then pin the bubble
  // so its arrowhead points at the trigger's center.
  useLayoutEffect(() => {
    if (!isOpen || !portal) {
      setCoords(null);
      return;
    }
    const place = () => {
      const trigger = triggerRef.current;
      const bubble = bubbleRef.current;
      if (!trigger || !bubble) {
        return;
      }
      const t = trigger.getBoundingClientRect();
      const b = bubble.getBoundingClientRect();
      const align = (size: number, start: number, length: number) =>
        ordinal === "second"
          ? start + length / 2 - size / 2
          : ordinal === "third"
            ? start + length / 2 - (size - TOOLTIP_ARROW_CENTER)
            : start + length / 2 - TOOLTIP_ARROW_CENTER;
      setCoords(
        position === "top"
          ? { top: t.top - b.height, left: align(b.width, t.left, t.width) }
          : position === "bottom"
            ? { top: t.bottom, left: align(b.width, t.left, t.width) }
            : position === "left"
              ? { top: align(b.height, t.top, t.height), left: t.left - b.width }
              : { top: align(b.height, t.top, t.height), left: t.right }
      );
    };
    place();
    if (open == null) {
      // uncontrolled hover 툴팁은 스크롤/리사이즈에 닫혀요 (아래 effect) —
      // 좌표를 따라갈 필요가 없어요.
      return;
    }
    // Controlled(강제 열림) 툴팁은 부모가 open을 소유해 닫을 수 없어요 —
    // 트리거가 움직이면 고정 좌표가 낡으므로 스크롤/리사이즈마다 다시 재요.
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
    // mounted가 바뀌면 말풍선이 인라인에서 포탈로 옮겨가므로 다시 재요.
  }, [isOpen, portal, position, ordinal, mounted, open]);

  // Anything that moves the trigger invalidates the pinned coords — close.
  useEffect(() => {
    if (!isOpen || open != null) {
      return;
    }
    const close = () => setInternalOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen, open]);

  const child = React.Children.only(children) as ReactElement<Record<string, unknown>> & {
    ref?: React.Ref<HTMLElement>;
  };
  const childRef = child.ref;
  const compose =
    <E,>(theirs: unknown, ours: (event: E) => void) =>
    (event: E) => {
      if (typeof theirs === "function") {
        theirs(event);
      }
      ours(event);
    };
  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    "aria-describedby": isOpen
      ? joinClass(child.props["aria-describedby"] as string | undefined, id)
      : (child.props["aria-describedby"] as string | undefined),
    onPointerEnter: compose(child.props.onPointerEnter, () => setInternalOpen(true)),
    onPointerLeave: compose(child.props.onPointerLeave, () => setInternalOpen(false)),
    onFocus: compose(child.props.onFocus, () => setInternalOpen(true)),
    onBlur: compose(child.props.onBlur, () => setInternalOpen(false)),
    onKeyDown: compose(child.props.onKeyDown, (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        setInternalOpen(false);
      }
    }),
  } as Record<string, unknown>);

  const bubble = isOpen ? (
    <div
      ref={bubbleRef}
      id={id}
      role="tooltip"
      className="podo-tooltip"
      data-theme={theme}
      data-position={position}
      data-ordinal={ordinal}
      style={
        portal
          ? { position: "fixed", top: coords?.top ?? -9999, left: coords?.left ?? -9999 }
          : undefined
      }
    >
      <span className="podo-tooltip__arrow">{TOOLTIP_ARROWS[position]}</span>
      <span className="podo-tooltip__bubble">{label}</span>
    </div>
  ) : null;

  return (
    <>
      {trigger}
      {bubble && portal && mounted ? createPortal(bubble, document.body) : bubble}
    </>
  );
}

const TOAST_CLOSE_GLYPH = (
  <svg aria-hidden viewBox="0 0 24 24" width="24" height="24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  {
    state = "normal",
    prefix,
    suffixText,
    suffixIcon,
    caption,
    onClose,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <div
      {...props}
      ref={ref}
      // danger interrupts the screen reader; everything else politely waits.
      role={state === "danger" ? "alert" : "status"}
      className={joinClass("podo-toast", className)}
      data-state={state}
    >
      {prefix != null ? <span className="podo-toast__prefix">{prefix}</span> : null}
      <div className="podo-toast__contents">
        <div className="podo-toast__title-row">
          <span className="podo-toast__title">{children}</span>
          {suffixText != null || suffixIcon != null || onClose ? (
            <span className="podo-toast__suffix">
              {suffixText != null ? (
                <span className="podo-toast__suffix-text">{suffixText}</span>
              ) : null}
              {onClose ? (
                <button
                  type="button"
                  className="podo-toast__close"
                  aria-label="닫기"
                  onClick={onClose}
                >
                  {suffixIcon ?? TOAST_CLOSE_GLYPH}
                </button>
              ) : suffixIcon != null ? (
                <span className="podo-toast__suffix-icon">{suffixIcon}</span>
              ) : null}
            </span>
          ) : null}
        </div>
        {caption != null ? <span className="podo-toast__caption">{caption}</span> : null}
      </div>
    </div>
  );
});

// The toaster layer is design-less plumbing (the Figma set covers the card
// only): a module store the imperative toast() API pushes into, and a Toaster
// that renders the stack. Defaults: top-center, 3s, 3 toasts.
interface ToastItem {
  id: number;
  title: ReactNode;
  options: ToastOptions;
  /** Mid-exit: still rendered for the leave animation, no longer counted. */
  leaving?: boolean;
}

// Must match the podo-toast-out animation duration in the CSS.
const TOAST_EXIT_MS = 180;

let toastSequence = 0;
let toastItems: readonly ToastItem[] = [];
const toastListeners = new Set<() => void>();

function notifyToastListeners(): void {
  for (const listener of toastListeners) {
    listener();
  }
}

function subscribeToToasts(listener: () => void): () => void {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

function readToasts(): readonly ToastItem[] {
  return toastItems;
}

function pushToast(title: ReactNode, options: ToastOptions = {}): number {
  const id = ++toastSequence;
  toastItems = [...toastItems, { id, title, options }];
  notifyToastListeners();
  return id;
}

type ToastShortcut = (title: ReactNode, options?: Omit<ToastOptions, "state">) => number;

function toastShortcut(state: ToastState): ToastShortcut {
  return (title, options = {}) => pushToast(title, { ...options, state });
}

/** Imperative API — render one <Toaster /> near the app root, then toast("..."). */
export const toast = Object.assign(pushToast, {
  normal: toastShortcut("normal"),
  success: toastShortcut("success"),
  danger: toastShortcut("danger"),
  info: toastShortcut("info"),
  warning: toastShortcut("warning"),
  /** Dismisses one toast by id, or every toast without one — the card plays
   *  its leave animation before it's actually removed. */
  dismiss(id?: number): void {
    const leavingIds: number[] = [];
    toastItems = toastItems.map((item) => {
      if (item.leaving || (id != null && item.id !== id)) {
        return item;
      }
      leavingIds.push(item.id);
      return { ...item, leaving: true };
    });
    if (leavingIds.length === 0) {
      return;
    }
    notifyToastListeners();
    setTimeout(() => {
      toastItems = toastItems.filter((item) => !leavingIds.includes(item.id));
      notifyToastListeners();
    }, TOAST_EXIT_MS);
  },
});

export function Toaster({
  position = "top-center",
  duration = 3000,
  max = 3,
}: ToasterProps): React.ReactElement {
  const items = useSyncExternalStore(subscribeToToasts, readToasts, readToasts);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  // Collapsed by default; hover or keyboard focus fans the stack out.
  const [expanded, setExpanded] = useState(false);
  // Leaving toasts stay rendered for their exit animation but stop counting
  // toward max, so a new arrival fades in while the evicted one fades out.
  const active = items.filter((item) => !item.leaving);
  const shownActive = new Set(active.slice(-max).map((item) => item.id));
  const visible = items.filter((item) => item.leaving || shownActive.has(item.id));

  useEffect(() => {
    // Overflow evicts the oldest toast for good (cascades until <= max).
    if (active.length > max && active[0]) {
      toast.dismiss(active[0].id);
      return;
    }
    const alive = new Set(items.map((item) => item.id));
    // Drop timers for gone toasts, and — while the pointer/focus is on the
    // stack — for every toast, pausing auto-dismiss. Leaving the stack re-runs
    // this effect (expanded flips) and starts fresh timers.
    for (const [id, timer] of timers.current) {
      if (expanded || !alive.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    }
    if (expanded) {
      return;
    }
    for (const item of items) {
      if (item.leaving || item.options.manual || timers.current.has(item.id)) {
        continue;
      }
      timers.current.set(
        item.id,
        setTimeout(() => toast.dismiss(item.id), item.options.duration ?? duration)
      );
    }
  });

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (visible.length === 0 && expanded) {
      setExpanded(false);
    }
  }, [visible.length, expanded]);

  // The front card is the newest; render newest-first so it paints on top and
  // stacks index 0/1/2 from front to back (collapsed: back cards shrink and
  // peek below; expanded: real gap layout). Rendering order is only visual —
  // aria-live still announces in insertion order because each Toast keeps its
  // own live region.
  const ordered = [...visible].reverse();

  // position: fixed does the anchoring — mount once near the app root
  // (a transformed ancestor would re-anchor the stack).
  return (
    <div
      className="podo-toaster"
      data-position={position}
      data-expanded={expanded ? "true" : undefined}
      style={{ "--podo-toast-count": ordered.length } as React.CSSProperties}
      onPointerEnter={() => setExpanded(true)}
      onPointerLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setExpanded(false);
        }
      }}
    >
      {ordered.map((item, index) => (
        <Toast
          key={item.id}
          state={item.options.state ?? "normal"}
          caption={item.options.caption}
          data-leaving={item.leaving ? "true" : undefined}
          // 0 = front (newest); back cards read it to shrink and offset.
          data-stack={index}
          style={{ "--podo-toast-index": index } as React.CSSProperties}
          onClose={() => toast.dismiss(item.id)}
        >
          {item.title}
        </Toast>
      ))}
    </div>
  );
}

// Table keeps native table semantics: children are standard thead/tbody/tr
// markup, so accessibility and column layout come from the platform. Mark
// unavailable rows with data-disabled; hover/pressed row states are CSS.
// checkbox injects the design's selection column: a select-all box in the
// first header row and one box per tbody row; selected rows get data-selected.
// Pointer sugar on top (the checkboxes stay the accessible controls): clicking
// anywhere in a row toggles it, and dragging along the checkbox column
// range-selects — the range follows the anchor row's toggle direction.
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { type = "horizon", checkbox = false, defaultSelected, onSelectionChange, className, ...props },
  ref
) {
  // data-disabled 행은 어떤 경로로도 선택될 수 없다 — defaultSelected의 초기값도
  // 예외가 아니라서 비활성 행 인덱스는 걸러낸다.
  const [selected, setSelected] = useState<Set<number>>(() =>
    initialTableSelection(defaultSelected, props.children)
  );
  // Drag bookkeeping: anchor row, its toggle direction, and the pre-drag
  // selection the range is applied over (so shrinking the range reverts rows).
  const dragRef = useRef<{ anchor: number; mode: boolean; snapshot: Set<number> } | null>(null);
  // A finished drag ends with a browser click on the anchor row — swallow it.
  const dragMovedRef = useRef(false);
  // 포인터는 테이블 밖에서도 놓일 수 있으니, 드래그 중에만 document 레벨
  // pointerup/pointercancel로 정리해요 (Select의 outside-pointerdown 패턴과
  // 동일 — 이펙트라 SSR 안전, 언마운트 시 해제). 남은 dragMovedRef가 다음
  // 행 클릭을 삼키지 않게 두 ref를 모두 초기화해요.
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!dragging) {
      return undefined;
    }
    const endDrag = () => {
      setDragging(false);
      dragRef.current = null;
      // The click the drag ends with fires before this timeout runs, so a
      // moved drag still swallows it; later ordinary clicks pass through.
      setTimeout(() => {
        dragMovedRef.current = false;
      }, 0);
    };
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
    return () => {
      document.removeEventListener("pointerup", endDrag);
      document.removeEventListener("pointercancel", endDrag);
    };
  }, [dragging]);

  if (!checkbox) {
    return (
      <table {...props} ref={ref} className={joinClass("podo-table", className)} data-type={type} />
    );
  }

  const { children, ...rest } = props;
  const commit = (next: Set<number>) => {
    setSelected(next);
    onSelectionChange?.([...next].sort((a, b) => a - b));
  };

  // First pass: rows with data-disabled are excluded from selection.
  const selectableRows: number[] = [];
  let scanIndex = 0;
  React.Children.forEach(children, (section) => {
    if (!isValidElement<Record<string, unknown>>(section) || section.type !== "tbody") {
      return;
    }
    React.Children.forEach(section.props.children as ReactNode, (row) => {
      if (!isValidElement<Record<string, unknown>>(row)) {
        return;
      }
      const index = scanIndex++;
      if (!row.props["data-disabled"]) {
        selectableRows.push(index);
      }
    });
  });
  const allSelected = selectableRows.length > 0 && selectableRows.every((i) => selected.has(i));
  const someSelected = selectableRows.some((i) => selected.has(i));

  const applyDragRange = (current: number) => {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }
    const next = new Set(drag.snapshot);
    const lo = Math.min(drag.anchor, current);
    const hi = Math.max(drag.anchor, current);
    for (const i of selectableRows) {
      if (i >= lo && i <= hi) {
        if (drag.mode) {
          next.add(i);
        } else {
          next.delete(i);
        }
      }
    }
    commit(next);
  };

  let headerWired = false;
  let bodyIndex = 0;
  const wired = React.Children.map(children, (section) => {
    if (!isValidElement<Record<string, unknown>>(section)) {
      return section;
    }
    if (section.type === "thead" && !headerWired) {
      headerWired = true;
      let firstRow = true;
      const rows = React.Children.map(section.props.children as ReactNode, (row) => {
        if (!isValidElement<Record<string, unknown>>(row) || !firstRow) {
          return row;
        }
        firstRow = false;
        return cloneElement(row, undefined, [
          <th key="podo-check" className="podo-table__check">
            <Checkbox
              aria-label="전체 선택"
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={() => commit(allSelected ? new Set() : new Set(selectableRows))}
            />
          </th>,
          ...React.Children.toArray(row.props.children as ReactNode),
        ]);
      });
      return cloneElement(section, undefined, rows);
    }
    if (section.type === "tbody") {
      const rows = React.Children.map(section.props.children as ReactNode, (row) => {
        if (!isValidElement<Record<string, unknown>>(row)) {
          return row;
        }
        const index = bodyIndex++;
        const rowDisabled = Boolean(row.props["data-disabled"]);
        const rowSelected = selected.has(index);
        const toggleRow = () => {
          const draft = new Set(selected);
          if (draft.has(index)) {
            draft.delete(index);
          } else {
            draft.add(index);
          }
          commit(draft);
        };
        const rowOnClick = row.props.onClick as
          | ((event: React.MouseEvent<HTMLTableRowElement>) => void)
          | undefined;
        return cloneElement(
          row,
          {
            ...(rowSelected ? { "data-selected": "true" } : {}),
            onClick: (event: React.MouseEvent<HTMLTableRowElement>) => {
              rowOnClick?.(event);
              if (rowDisabled || event.defaultPrevented) {
                return;
              }
              if (dragMovedRef.current) {
                dragMovedRef.current = false;
                return;
              }
              // Interactive content (the checkbox, buttons, inputs...) handles
              // itself, and a text-selection drag isn't a row click.
              const target = event.target as Element;
              if (target.closest("input, button, a, select, textarea, label")) {
                return;
              }
              if (window.getSelection()?.toString()) {
                return;
              }
              toggleRow();
            },
          },
          [
            <td
              key="podo-check"
              className="podo-table__check"
              onPointerDown={(event) => {
                if (rowDisabled || event.button !== 0 || event.pointerType === "touch") {
                  return;
                }
                dragMovedRef.current = false;
                dragRef.current = {
                  anchor: index,
                  mode: !selected.has(index),
                  snapshot: new Set(selected),
                };
                setDragging(true);
              }}
              onPointerEnter={(event) => {
                if (!dragRef.current) {
                  return;
                }
                // The primary button is no longer down (a release the document
                // listener somehow missed) — end the drag fully so the stale
                // dragMovedRef can't swallow the next row click.
                if (!(event.buttons & 1)) {
                  dragRef.current = null;
                  dragMovedRef.current = false;
                  setDragging(false);
                  return;
                }
                dragMovedRef.current = true;
                applyDragRange(index);
              }}
            >
              <Checkbox
                aria-label={`행 ${index + 1} 선택`}
                checked={rowSelected}
                disabled={rowDisabled}
                onCheckedChange={(next) => {
                  const draft = new Set(selected);
                  if (next) {
                    draft.add(index);
                  } else {
                    draft.delete(index);
                  }
                  commit(draft);
                }}
              />
            </td>,
            ...React.Children.toArray(row.props.children as ReactNode),
          ]
        );
      });
      return cloneElement(section, undefined, rows);
    }
    return section;
  });

  return (
    <table
      {...rest}
      ref={ref}
      className={joinClass("podo-table", className)}
      data-type={type}
      data-checkbox="true"
    >
      {wired}
    </table>
  );
});

export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
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
    className,
    ...props
  },
  ref
) {
  const generatedId = useId().replaceAll(":", "podo");
  const fieldId = id === "podo-field" ? generatedId : id;
  // The footer shows a single guidance line (Figma 538:6691): the error wins
  // over the helper text so only the ids of what is rendered are referenced.
  const showError = Boolean(error);
  const showHelper = Boolean(helperText) && !showError;
  // Character count: an explicit `count` prop is controlled; otherwise the
  // field tracks the wired control's value length itself, so
  // <Field countMax={500}><Input /></Field> counts with no extra wiring.
  const [autoCount, setAutoCount] = useState(() => initialControlLength(children));
  const trackCount = countMax != null && count == null;
  // controlled 자식(value prop)은 렌더마다 현재 value에서 길이를 다시 계산한다 —
  // 외부에서 값이 갱신돼 리렌더돼도 카운터가 낡지 않는다. uncontrolled 자식은
  // change 이벤트로 추적한 상태 값을 그대로 쓴다.
  const shownCount = count ?? controlledControlLength(children) ?? autoCount;
  const a11y = createFieldA11y({
    id: fieldId,
    invalid,
    required,
    hasDescription: showHelper,
    hasError: showError,
  });
  // 자식 컨트롤이 명시적 id를 가지면 clone에서 그 id가 이기므로
  // (wireReactControl의 existing.id 우선), label[for]도 생성 id 대신 그 id를
  // 가리켜야 연결이 끊기지 않아요.
  const controlId = firstExplicitControlId(children) ?? a11y.ids.controlId;
  // countMax also caps the control via the platform-native maxLength, so
  // typing/pasting past the limit is blocked without any custom handling.
  const wiredChildren = wireReactControl(
    children,
    countMax != null ? { ...a11y.control, maxLength: countMax } : a11y.control,
    trackCount
      ? (event) => {
          const value = event.currentTarget?.value;
          if (typeof value === "string") {
            setAutoCount(value.length);
          }
        }
      : undefined,
    { disabled, invalid }
  );

  return (
    <div
      {...props}
      ref={ref}
      className={joinClass("podo-field", className)}
      data-disabled={disabled ? "true" : undefined}
      data-invalid={invalid ? "true" : undefined}
      data-required={required ? "true" : undefined}
    >
      <div className="podo-field__heading">
        <label className="podo-field__label" id={a11y.ids.labelId} htmlFor={controlId}>
          {label}
          {required ? (
            <span className="podo-field__requirement" aria-hidden="true">
              *
            </span>
          ) : null}
          {subLabel ? <span className="podo-field__sub-label">{subLabel}</span> : null}
        </label>
        {suffixIcon ? <span className="podo-field__suffix-icon">{suffixIcon}</span> : null}
      </div>
      <div className="podo-field__control">{wiredChildren}</div>
      {showError || showHelper || countMax != null ? (
        <div className="podo-field__footer">
          {showError ? (
            <span className="podo-field__error" id={a11y.ids.errorId}>
              {error}
            </span>
          ) : null}
          {showHelper ? (
            <span className="podo-field__helper-text" id={a11y.ids.descriptionId}>
              {helperText}
            </span>
          ) : null}
          {countMax != null ? (
            <span className="podo-field__count">
              {shownCount}/{countMax}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

export function Icon({
  name,
  size = "md",
  decorative = true,
  className,
  ...props
}: IconProps): React.ReactElement {
  return (
    <i
      {...props}
      // hono 렌더러와 동일한 어휘: 장식 아이콘은 aria-hidden으로 AT에서
      // 숨기고, 비장식 아이콘은 role="img" + 소비자의 aria-label로 노출돼요.
      {...(decorative ? { "aria-hidden": "true" as const } : { role: "img" })}
      data-size={size}
      className={joinClass("podo-icon", `podo-icon-${name}`, className)}
    />
  );
}

export function Typography({
  as = "p",
  variant = as === "h1" ? "h1" : "body",
  className,
  ...props
}: TypographyProps): React.ReactElement {
  return createElement(as, {
    ...props,
    className: joinClass("podo-text", `podo-text--${variant}`, className),
  });
}

function joinClass(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function wireReactControl(
  children: ReactNode,
  controlProps: Record<string, string | boolean | number>,
  onControlChange?: (event: ChangeEvent<HTMLInputElement>) => void,
  fieldState?: { disabled?: boolean | undefined; invalid?: boolean | undefined }
): ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) {
      return child;
    }

    const existing = child.props;
    return cloneElement(child, {
      ...controlProps,
      // Field의 disabled/invalid는 감싼 컨트롤에 OR로 강제돼요 (childState ||
      // fieldState) — native fieldset처럼 자식이 disabled={false}로 비활성
      // 그룹에서 빠져나갈 수 없어요. Field가 그 상태가 아니면 자식의 자체
      // 값이 그대로 유지돼요. invalid는 aria-invalid만이 아니라 컨트롤의
      // 시각적 invalid 상태(data-state)까지 함께 켜요.
      ...(fieldState?.disabled ? { disabled: true } : {}),
      ...(fieldState?.invalid ? { invalid: true } : {}),
      id: existing.id ?? controlProps.id,
      "aria-describedby": joinClass(
        existing["aria-describedby"] as string | undefined,
        controlProps["aria-describedby"] as string | undefined
      ),
      ...(onControlChange
        ? {
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              (existing.onChange as ((e: ChangeEvent<HTMLInputElement>) => void) | undefined)?.(
                event
              );
              onControlChange(event);
            },
          }
        : {}),
    });
  });
}

/**
 * The first control child's explicit id, if any — the clone keeps it
 * (existing.id wins in wireReactControl), so the field label must target it.
 */
function firstExplicitControlId(children: ReactNode): string | undefined {
  let id: string | undefined;
  let seenControl = false;
  React.Children.forEach(children, (child) => {
    if (!seenControl && isValidElement<Record<string, unknown>>(child)) {
      seenControl = true;
      const childId = child.props.id;
      if (typeof childId === "string" && childId) {
        id = childId;
      }
    }
  });
  return id;
}

/** Initial character count read from the control's value/defaultValue. */
function initialControlLength(children: ReactNode): number {
  let length = 0;
  React.Children.forEach(children, (child) => {
    if (isValidElement<Record<string, unknown>>(child)) {
      const value = child.props.value ?? child.props.defaultValue;
      if (typeof value === "string") {
        length = value.length;
      }
    }
  });
  return length;
}

/**
 * Controlled 자식의 현재 value prop에서 읽은 글자 수. value prop이 없으면
 * (uncontrolled) null — 그때만 change 이벤트로 추적한 상태 카운트를 쓴다.
 */
function controlledControlLength(children: ReactNode): number | null {
  let length: number | null = null;
  React.Children.forEach(children, (child) => {
    if (isValidElement<Record<string, unknown>>(child)) {
      const value = child.props.value;
      if (typeof value === "string") {
        length = value.length;
      }
    }
  });
  return length;
}

/**
 * defaultSelected에서 data-disabled 행 인덱스를 걸러낸 초기 선택 집합.
 * 선택 토글·드래그·전체 선택이 모두 비활성 행을 제외하므로 초기값도 같은
 * 규칙을 따라야 비활성 행이 선택된 채 렌더되지 않는다.
 */
function initialTableSelection(
  defaultSelected: number[] | undefined,
  children: ReactNode
): Set<number> {
  if (!defaultSelected || defaultSelected.length === 0) {
    return new Set();
  }
  const disabled = new Set<number>();
  let scanIndex = 0;
  React.Children.forEach(children, (section) => {
    if (!isValidElement<Record<string, unknown>>(section) || section.type !== "tbody") {
      return;
    }
    React.Children.forEach(section.props.children as ReactNode, (row) => {
      if (!isValidElement<Record<string, unknown>>(row)) {
        return;
      }
      const index = scanIndex++;
      if (row.props["data-disabled"]) {
        disabled.add(index);
      }
    });
  });
  return new Set(defaultSelected.filter((index) => !disabled.has(index)));
}

// ---- v1 포팅 컴포넌트 (SRP 구조 유지: datepicker.tsx, editor/) ----
export { default as DatePicker } from "./datepicker.js";
export type {
  DatePickerProps,
  DatePickerValue,
  DatePickerMode,
  DatePickerType,
  TimeValue,
  DateRange,
  DateCondition,
  DateTimeLimit,
  MinuteStep,
} from "./datepicker.js";
export { default as Editor } from "./editor/index.js";
export type { EditorProps, ToolbarItem } from "./editor/types.js";
export { default as EditorView } from "./editor/view.js";
export type { EditorViewProps } from "./editor/view.js";
