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
  | "outline-primary"
  | "outline-assistive"
  | "outline-white";

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
  /** Label/icon scale (Figma: sm 13px, md 16px — md is base). */
  size?: "sm" | "md";
  disabled?: boolean;
  /** Category/status icon before the label (Figma prefix-icon). */
  prefix?: Child;
  /** Removal/action icon after the label, e.g. close (Figma suffix-icon). */
  suffix?: Child;
  type?: "button" | "submit" | "reset";
  class?: string;
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
  disabled,
  prefix,
  suffix,
  type,
  class: className,
}: HonoChipProps): JSX.Element {
  const behavior = createButtonBehavior({ disabled, type });

  return (
    <button
      class={joinClass("podo-chip", className)}
      type={behavior.root.type}
      disabled={behavior.root.disabled}
      aria-disabled={behavior.root.ariaDisabled}
      tabIndex={behavior.root.tabIndex}
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
