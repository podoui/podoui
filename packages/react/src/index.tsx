import React, {
  createContext,
  createElement,
  cloneElement,
  forwardRef,
  isValidElement,
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
} from "@podo/core";

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

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
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
    ...props
  },
  ref
) {
  const behavior = createButtonBehavior({ disabled, type });
  // Uncontrolled fallback: without a selected prop the chip toggles itself.
  const [internalSelected, setInternalSelected] = useState(defaultSelected);
  const isSelected = selected ?? internalSelected;

  return (
    <button
      {...props}
      {...behavior.dataState}
      ref={ref}
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

  // Portal placement: measure the trigger and the bubble, then pin the bubble
  // so its arrowhead points at the trigger's center.
  useLayoutEffect(() => {
    if (!isOpen || !portal) {
      setCoords(null);
      return;
    }
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
  }, [isOpen, portal, position, ordinal]);

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
      {bubble && portal && typeof document !== "undefined"
        ? createPortal(bubble, document.body)
        : bubble}
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
  const [selected, setSelected] = useState<Set<number>>(() => new Set(defaultSelected ?? []));
  // Drag bookkeeping: anchor row, its toggle direction, and the pre-drag
  // selection the range is applied over (so shrinking the range reverts rows).
  const dragRef = useRef<{ anchor: number; mode: boolean; snapshot: Set<number> } | null>(null);
  // A finished drag ends with a browser click on the anchor row — swallow it.
  const dragMovedRef = useRef(false);

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
              }}
              onPointerEnter={(event) => {
                if (!dragRef.current) {
                  return;
                }
                // The primary button was released outside the table — bail out.
                if (!(event.buttons & 1)) {
                  dragRef.current = null;
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
      onPointerUp={(event) => {
        rest.onPointerUp?.(event);
        dragRef.current = null;
        // The click the drag ends with fires before this timeout runs.
        setTimeout(() => {
          dragMovedRef.current = false;
        }, 0);
      }}
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
  const shownCount = count ?? autoCount;
  const a11y = createFieldA11y({
    id: fieldId,
    invalid,
    required,
    hasDescription: showHelper,
    hasError: showError,
  });
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
      : undefined
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
        <label className="podo-field__label" id={a11y.ids.labelId} htmlFor={a11y.ids.controlId}>
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

export function Icon({ name, className, ...props }: IconProps): React.ReactElement {
  return (
    <i
      {...props}
      aria-hidden="true"
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
  onControlChange?: (event: ChangeEvent<HTMLInputElement>) => void
): ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) {
      return child;
    }

    const existing = child.props;
    return cloneElement(child, {
      ...controlProps,
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
