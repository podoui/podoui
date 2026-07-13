/** @jsxImportSource hono/jsx */

import { cloneElement, isValidElement } from "hono/jsx";
import type { Child } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import { raw } from "hono/html";
import {
  createButtonBehavior,
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
  const state = behavior.invalid ? "invalid" : behavior.disabled ? "disabled" : undefined;

  return (
    <textarea
      id={id}
      class={joinClass("podo-textarea", className)}
      name={name}
      placeholder={placeholder}
      maxlength={maxLength}
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

export interface HonoTableProps {
  children: Child;
  /** grid: bordered frame with per-cell rules; horizon: row rules only. */
  type?: "grid" | "horizon";
  class?: string;
}

export function Table({ children, type = "grid", class: className }: HonoTableProps): JSX.Element {
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
  /** Track size (Figma: sm 30x18, md 40x24 — base, lg 56x32). */
  size?: "sm" | "md" | "lg";
  /** Visible label next to the track (Figma label/text); also names the switch. */
  label?: Child;
  disabled?: boolean;
  "aria-label"?: string;
  class?: string;
}

export function Switch({
  checked,
  size = "md",
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

  // Figma 566:12693: track + 6px gap + 14px text.
  return (
    <label class="podo-switch-wrap" data-disabled={disabled ? "true" : undefined}>
      {control}
      <span class="podo-switch__text">{label}</span>
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
  const state = behavior.invalid ? "invalid" : behavior.disabled ? "disabled" : undefined;

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
