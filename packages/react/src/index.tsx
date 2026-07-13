import React, {
  createContext,
  createElement,
  cloneElement,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
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
  | "outline-primary"
  | "outline-assistive"
  | "outline-white";

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
  /** Label/icon scale (Figma: sm 13px, md 16px — md is base). */
  size?: "sm" | "md";
  disabled?: boolean;
  /** Category/status icon before the label (Figma prefix-icon). */
  prefix?: ReactNode;
  /** Removal/action icon after the label, e.g. close (Figma suffix-icon). */
  suffix?: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  onPress?: (event: PodoPressEvent) => void;
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
    disabled,
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

  return (
    <button
      {...props}
      {...behavior.dataState}
      ref={ref}
      type={behavior.root.type}
      disabled={behavior.root.disabled}
      aria-disabled={behavior.root.ariaDisabled}
      tabIndex={behavior.root.tabIndex}
      className={joinClass("podo-chip", className)}
      data-size={size}
      data-theme={theme}
      onClick={(event) => {
        onClick?.(event);
        if (!behavior.pressable || event.defaultPrevented) {
          return;
        }
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
  { resize = true, invalid, disabled, required, className, onChange, onValueChange, ...props },
  ref
) {
  const behavior = createInputBehavior({
    disabled,
    invalid,
    required,
    value: typeof props.value === "string" ? props.value : undefined,
    defaultValue: typeof props.defaultValue === "string" ? props.defaultValue : undefined,
  });
  const state = behavior.invalid ? "invalid" : behavior.disabled ? "disabled" : undefined;

  return (
    <textarea
      {...props}
      {...behavior.root}
      ref={ref}
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
