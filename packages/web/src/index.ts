import { createButtonBehavior, createFieldA11y, createInputBehavior } from "@podo/core";

export interface RegisterPodoElementsOptions {
  registry?: CustomElementRegistry;
  prefix?: string;
}

export const podoElementNames = {
  button: "podo-button",
  input: "podo-input",
  field: "podo-field",
  icon: "podo-icon",
  text: "podo-text",
} as const;

export function registerPodoElements(options: RegisterPodoElementsOptions = {}): void {
  const registry = options.registry ?? globalThis.customElements;
  if (!registry) {
    throw new Error("CustomElementRegistry is not available in this environment.");
  }

  const names = createElementNames(options.prefix);
  const definitions: Array<[string, CustomElementConstructor]> = [
    [names.button, createButtonElement()],
    [names.input, createInputElement()],
    [names.field, createFieldElement()],
    [names.icon, createIconElement()],
    [names.text, createTextElement()],
  ];

  for (const [name, constructor] of definitions) {
    if (!registry.get(name)) {
      registry.define(name, constructor);
    }
  }
}

export function createElementNames(prefix = "podo"): typeof podoElementNames {
  return {
    button: `${prefix}-button`,
    input: `${prefix}-input`,
    field: `${prefix}-field`,
    icon: `${prefix}-icon`,
    text: `${prefix}-text`,
  } as typeof podoElementNames;
}

export const podoWebComponentCss = `:host {
  box-sizing: border-box;
  font: inherit;
}

button,
input {
  box-sizing: border-box;
  font: inherit;
}

.podo-button {
  align-items: center;
  justify-content: center;
  background: var(--podo-button-root-background, #426CED);
  border: 1px solid var(--podo-button-root-borderColor, transparent);
  border-radius: 10px;
  color: var(--podo-button-label-color, #FFFFFF);
  cursor: pointer;
  display: inline-flex;
  font-family: var(--podo-typography-body-medium-fontFamily, "Pretendard", sans-serif);
  font-weight: 400;
  gap: 6px;
  line-height: 1.6;
  min-height: 42px;
  min-width: 80px;
  padding: 2px 16px;
}

.podo-button__icon {
  align-items: center;
  color: var(--podo-button-icon-color, var(--podo-button-label-color, currentColor));
  display: inline-flex;
}

/* Sizes (Figma: xs 32 / sm 36 / md 42 / lg 52) */
.podo-button[data-size="xs"] {
  border-radius: 6px;
  font-size: 14px;
  min-height: 32px;
  padding: 2px 10px;
}
.podo-button[data-size="sm"] {
  border-radius: 8px;
  font-size: 14px;
  min-height: 36px;
  padding: 2px 16px;
}
.podo-button[data-size="md"] {
  border-radius: 10px;
  font-size: 16px;
  min-height: 42px;
  padding: 2px 16px;
}
.podo-button[data-size="lg"] {
  border-radius: 12px;
  font-size: 16px;
  min-height: 52px;
  padding: 2px 20px;
}

/* Themes (Figma solid/outline x primary/assistive/white) */
.podo-button[data-theme="solid-primary"] {
  --podo-button-root-background: #426CED;
  --podo-button-label-color: #FFFFFF;
}
.podo-button[data-theme="solid-primary"]:hover:not([disabled]) {
  --podo-button-root-background: #1245E2;
}
.podo-button[data-theme="solid-primary"]:active:not([disabled]) {
  --podo-button-root-background: #123BBA;
}
.podo-button[data-theme="solid-assistive"] {
  --podo-button-root-background: #F4F4F5;
  --podo-button-label-color: #18181B;
}
.podo-button[data-theme="solid-assistive"]:hover:not([disabled]) {
  --podo-button-root-background: #E4E4E7;
}
.podo-button[data-theme="solid-white"] {
  --podo-button-root-background: #FFFFFF;
  --podo-button-label-color: #18181B;
}
.podo-button[data-theme="solid-white"]:hover:not([disabled]) {
  --podo-button-root-background: #F4F4F5;
}
.podo-button[data-theme="outline-primary"] {
  --podo-button-root-background: #FFFFFF;
  --podo-button-root-borderColor: #426CED;
  --podo-button-label-color: #426CED;
}
.podo-button[data-theme="outline-primary"]:hover:not([disabled]) {
  --podo-button-root-background: #F4F7FE;
}
.podo-button[data-theme="outline-assistive"] {
  --podo-button-root-background: #F9F9F9;
  --podo-button-root-borderColor: #D1D2D6;
  --podo-button-label-color: #18181B;
}
.podo-button[data-theme="outline-assistive"]:hover:not([disabled]) {
  --podo-button-root-background: #F4F4F5;
}
.podo-button[data-theme="outline-white"] {
  --podo-button-root-background: #FFFFFF;
  --podo-button-root-borderColor: #D1D2D6;
  --podo-button-label-color: #18181B;
}
.podo-button[data-theme="outline-white"]:hover:not([disabled]) {
  --podo-button-root-background: #F9F9F9;
}

.podo-button:focus-visible {
  outline: 2px solid #426CED;
  outline-offset: 2px;
}

.podo-button[disabled] {
  --podo-button-root-background: #E4E4E7;
  --podo-button-root-borderColor: transparent;
  --podo-button-label-color: #9FA2AD;
  cursor: not-allowed;
}

.podo-input {
  background: var(--podo-input-root-background, var(--podo-component-input-background, #FFFFFF));
  border: 1px solid
    var(--podo-input-root-borderColor, var(--podo-component-input-border, #14151A));
  border-radius: var(--podo-radius-control-md, 8px);
  color: var(--podo-input-text-color, var(--podo-semantic-color-text-default, #14151A));
  min-height: 40px;
  padding: 0 var(--podo-spacing-scale-2, 8px);
}

.podo-input[aria-invalid="true"] {
  border-color: var(--podo-semantic-color-text-danger, #D92D20);
}

.podo-field {
  display: grid;
  gap: var(--podo-spacing-component-field-gap, 8px);
}

.podo-field__label {
  color: var(--podo-field-label-color, var(--podo-semantic-color-text-default, #14151A));
  font-weight: 600;
}

.podo-field__description,
.podo-field__error {
  color: var(--podo-semantic-color-text-default, #14151A);
  font-size: 0.875em;
}

.podo-field__description {
  color: var(--podo-field-description-color, var(--podo-semantic-color-text-default, #14151A));
}

.podo-field__error {
  color: var(--podo-field-error-color, var(--podo-semantic-color-text-danger, #D92D20));
}

.podo-icon {
  color: var(--podo-icon-glyph-color, var(--podo-semantic-color-text-default, currentColor));
  font-family: "PodoIcons";
  line-height: 1;
}

.podo-text {
  color: var(--podo-typography-root-color, var(--podo-semantic-color-text-default, #14151A));
  font-family: var(--podo-typography-body-medium-fontFamily, inherit);
  font-size: var(--podo-typography-body-medium-fontSize, 1rem);
  line-height: var(--podo-typography-body-medium-lineHeight, 1.5);
}

.podo-text[data-as="h1"] {
  font-family: var(--podo-typography-heading-xlarge-fontFamily, inherit);
  font-size: var(--podo-typography-heading-xlarge-fontSize, 2rem);
  font-weight: var(--podo-typography-heading-xlarge-fontWeight, 700);
  line-height: var(--podo-typography-heading-xlarge-lineHeight, 1.2);
}`;

// The spec-driven component token CSS layer (@podo/codegen emitComponentTokenCss,
// emitted to components.css at build). Consumers register it so per-variant and
// per-state token overrides apply inside each component's shadow root, which is
// where the binding-key vars (--podo-<id>-<part>-<prop>) the components read live.
let registeredComponentTokenCss = "";

export function registerComponentTokenCss(css: string): void {
  registeredComponentTokenCss = css;
}

export function getRegisteredComponentTokenCss(): string {
  return registeredComponentTokenCss;
}

export function componentStyleBlock(): string {
  return `<style>${podoWebComponentCss}${
    registeredComponentTokenCss ? `\n${registeredComponentTokenCss}` : ""
  }</style>`;
}

function createButtonElement(): CustomElementConstructor {
  return class PodoButtonElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["disabled", "size", "theme"];
    }

    readonly shadow = this.attachShadow({ mode: "open" });

    connectedCallback(): void {
      this.render();
    }

    attributeChangedCallback(): void {
      this.render();
    }

    private render(): void {
      const behavior = createButtonBehavior({
        disabled: this.hasAttribute("disabled"),
      });
      const disabled = behavior.root.disabled ? "disabled" : "";
      // Expose the disabled state so the generated [data-state] token overrides apply.
      const stateAttr = this.hasAttribute("disabled") ? 'data-state="disabled"' : "";

      this.shadow.innerHTML = `${componentStyleBlock()}
<button class="podo-button" part="root" data-theme="${escapeHtml(
        attr(this, "theme", "solid-primary")
      )}" data-size="${escapeHtml(attr(this, "size", "md"))}" ${stateAttr} ${disabled}>
  <span class="podo-button__icon" part="prefix"><slot name="prefix"></slot></span>
  <span part="label"><slot></slot></span>
  <span class="podo-button__icon" part="suffix"><slot name="suffix"></slot></span>
</button>`;
      this.shadow.querySelector("button")?.addEventListener("click", (event) => {
        if (!behavior.pressable) {
          event.preventDefault();
          return;
        }
        this.dispatchEvent(new CustomEvent("podo-press", { bubbles: true, composed: true }));
      });
    }
  };
}

function createInputElement(): CustomElementConstructor {
  return class PodoInputElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return [
        "aria-describedby",
        "aria-invalid",
        "aria-labelledby",
        "aria-required",
        "disabled",
        "id",
        "invalid",
        "name",
        "placeholder",
        "required",
        "value",
      ];
    }

    readonly shadow = this.attachShadow({ mode: "open", delegatesFocus: true });

    get value(): string {
      return attr(this, "value", "");
    }

    set value(value: string) {
      this.setAttribute("value", value);
    }

    connectedCallback(): void {
      this.render();
    }

    attributeChangedCallback(): void {
      this.render();
    }

    override focus(options?: FocusOptions): void {
      this.shadow.querySelector("input")?.focus(options);
    }

    private render(): void {
      const invalid = this.hasAttribute("invalid") || attr(this, "aria-invalid", "") === "true";
      const behavior = createInputBehavior({
        disabled: this.hasAttribute("disabled"),
        invalid,
        required: this.hasAttribute("required"),
        value: this.value,
      });
      const disabled = behavior.disabled ? "disabled" : "";
      const required = behavior.required ? "required" : "";
      const ariaInvalid = behavior.invalid ? 'aria-invalid="true"' : "";
      // Expose state so generated [data-state] token overrides apply at runtime.
      const stateAttr = behavior.invalid
        ? 'data-state="invalid"'
        : behavior.disabled
          ? 'data-state="disabled"'
          : "";

      this.shadow.innerHTML = `${componentStyleBlock()}
<input class="podo-input" part="control" ${stateAttr} ${attrString("id", attr(this, "id", ""))} ${attrString(
        "name",
        attr(this, "name", "")
      )} value="${escapeHtml(this.value)}" placeholder="${escapeHtml(
        attr(this, "placeholder", "")
      )}" ${attrString("aria-labelledby", attr(this, "aria-labelledby", ""))} ${attrString(
        "aria-describedby",
        attr(this, "aria-describedby", "")
      )} ${attrString("aria-required", attr(this, "aria-required", ""))} ${disabled} ${required} ${ariaInvalid} />`;
      this.shadow.querySelector("input")?.addEventListener("input", (event) => {
        const value = (event.currentTarget as HTMLInputElement).value;
        this.setAttribute("value", value);
        this.dispatchEvent(
          new CustomEvent("podo-value-change", {
            bubbles: true,
            composed: true,
            detail: { value },
          })
        );
      });
    }
  };
}

function createFieldElement(): CustomElementConstructor {
  return class PodoFieldElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["disabled", "invalid", "required", "field-id"];
    }

    readonly shadow = this.attachShadow({ mode: "open" });

    connectedCallback(): void {
      this.render();
    }

    attributeChangedCallback(): void {
      this.render();
    }

    private render(): void {
      const fieldId = attr(this, "field-id", "podo-field");
      const a11y = createFieldA11y({
        id: fieldId,
        invalid: this.hasAttribute("invalid"),
        required: this.hasAttribute("required"),
        hasDescription: true,
        hasError: this.hasAttribute("invalid"),
      });

      const stateAttr = this.hasAttribute("invalid") ? 'data-state="invalid"' : "";

      this.shadow.innerHTML = `${componentStyleBlock()}
<div class="podo-field" part="root" id="${escapeHtml(a11y.ids.rootId)}" ${stateAttr}>
  <label class="podo-field__label" part="label" id="${escapeHtml(
    a11y.ids.labelId
  )}" for="${escapeHtml(a11y.ids.controlId)}">
    <slot name="label">Label</slot>
  </label>
  <div part="control"><slot></slot></div>
  <div class="podo-field__description" part="description" id="${escapeHtml(a11y.ids.descriptionId)}">
    <slot name="description"></slot>
  </div>
  <div class="podo-field__error" part="error" id="${escapeHtml(a11y.ids.errorId)}">
    <slot name="error"></slot>
  </div>
</div>`;
      wireDefaultSlotControl(this.shadow, a11y.control);
    }
  };
}

function createIconElement(): CustomElementConstructor {
  return class PodoIconElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["codepoint", "name"];
    }

    readonly shadow = this.attachShadow({ mode: "open" });

    connectedCallback(): void {
      this.render();
    }

    attributeChangedCallback(): void {
      this.render();
    }

    private render(): void {
      const name = attr(this, "name", "");
      const codepoint = attr(this, "codepoint", defaultWebIconCodepoints[name] ?? "");
      const glyph = codepoint ? `&#x${escapeHtml(codepoint)};` : "";
      this.shadow.innerHTML = `${componentStyleBlock()}<span class="podo-icon podo-icon-${escapeHtml(
        name
      )}" part="icon" aria-hidden="true">${glyph}</span>`;
    }
  };
}

function createTextElement(): CustomElementConstructor {
  return class PodoTextElement extends HTMLElement {
    static get observedAttributes(): string[] {
      return ["as"];
    }

    readonly shadow = this.attachShadow({ mode: "open" });

    connectedCallback(): void {
      this.render();
    }

    attributeChangedCallback(): void {
      this.render();
    }

    private render(): void {
      const as = attr(this, "as", "body");
      // Carry the spec-id class (podo-typography) too so generated component CSS
      // (.podo-typography ...) matches this element's runtime class (.podo-text).
      this.shadow.innerHTML = `${componentStyleBlock()}<span class="podo-text podo-typography" data-as="${escapeHtml(
        as
      )}" part="text"><slot></slot></span>`;
    }
  };
}

function attr(element: Element, name: string, fallback: string): string {
  return element.getAttribute(name) ?? fallback;
}

function attrString(name: string, value: string): string {
  return value ? `${name}="${escapeHtml(value)}"` : "";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

const defaultWebIconCodepoints: Record<string, string> = {
  "chevron-left": "E001",
  "chevron-right": "E002",
  menu: "E003",
};

function wireDefaultSlotControl(
  shadow: ShadowRoot,
  controlAttributes: Record<string, string | boolean>
): void {
  const slot = shadow.querySelector("slot:not([name])");
  if (!(slot instanceof HTMLSlotElement)) {
    return;
  }

  const apply = (): void => {
    const control = slot.assignedElements({ flatten: true })[0];
    if (!(control instanceof HTMLElement)) {
      return;
    }

    for (const [name, value] of Object.entries(controlAttributes)) {
      if (typeof value === "boolean") {
        if (value) {
          control.setAttribute(name, "");
        }
      } else {
        control.setAttribute(name, value);
      }
    }
  };

  slot.addEventListener("slotchange", apply);
  queueMicrotask(apply);
}
