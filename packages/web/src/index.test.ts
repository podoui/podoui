// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  componentStyleBlock,
  podoWebComponentCss,
  registerComponentTokenCss,
  registerPodoElements,
} from "./index.js";

describe("@podo/web", () => {
  it("registers standard custom elements once", () => {
    registerPodoElements();
    registerPodoElements();

    expect(customElements.get("podo-button")).toBeDefined();
    expect(customElements.get("podo-checkbox")).toBeDefined();
    expect(customElements.get("podo-chip")).toBeDefined();
    expect(customElements.get("podo-input")).toBeDefined();
    expect(customElements.get("podo-switch")).toBeDefined();
    expect(customElements.get("podo-textarea")).toBeDefined();
    expect(podoWebComponentCss).toContain('.podo-button[data-theme="solid-primary"]');
    expect(podoWebComponentCss).toContain('.podo-chip[data-theme="outline-weak"]');
    // Table ships as classes only (no shadow element — table semantics).
    expect(podoWebComponentCss).toContain('.podo-table[data-type="grid"]');
    expect(customElements.get("podo-table")).toBeUndefined();
  });

  it("reads binding-key vars, exposes data-state, and consumes the registered token CSS", () => {
    registerPodoElements();
    // base reads the binding-key var (with token-var fallback)
    expect(podoWebComponentCss).toContain("var(--podo-button-root-background,");

    const layer =
      '.podo-button[data-theme="solid-assistive"] { --podo-button-root-background: red; }';
    registerComponentTokenCss(layer);
    expect(componentStyleBlock()).toContain(layer);

    const button = document.createElement("podo-button");
    button.setAttribute("theme", "solid-assistive");
    button.setAttribute("disabled", "");
    document.body.append(button);
    const html = button.shadowRoot?.innerHTML ?? "";
    // the generated layer is injected into the shadow, and state is exposed
    expect(html).toContain(layer);
    expect(html).toContain('data-theme="solid-assistive"');
    expect(html).toContain('data-state="disabled"');

    // reset so other tests/snapshots see the unregistered style block
    registerComponentTokenCss("");
  });

  it("renders button slots, states, and activation event", () => {
    registerPodoElements();
    const button = document.createElement("podo-button");
    button.setAttribute("theme", "solid-primary");
    button.textContent = "Save";
    let pressed = 0;
    button.addEventListener("podo-press", () => {
      pressed += 1;
    });
    document.body.append(button);

    button.shadowRoot?.querySelector("button")?.dispatchEvent(new MouseEvent("click"));

    expect(pressed).toBe(1);
    expect(button.shadowRoot?.innerHTML).toMatchSnapshot();
  });

  it("renders input, field, icon, and typography components", async () => {
    registerPodoElements();
    const input = document.createElement("podo-input") as HTMLElement & { value: string };
    input.setAttribute("invalid", "");
    input.setAttribute("size", "lg");
    // Composition slots (Figma prefix / suffix-text / suffix-icon).
    input.innerHTML = '<span slot="prefix">₩</span><span slot="suffix-text">원</span>';
    input.value = "hello";
    document.body.append(input);
    input.shadowRoot
      ?.querySelector("input")
      ?.dispatchEvent(new InputEvent("input", { bubbles: true }));

    const field = document.createElement("podo-field");
    field.setAttribute("field-id", "email");
    field.setAttribute("invalid", "");
    field.setAttribute("required", "");
    field.innerHTML = '<span slot="label">Email</span><podo-input></podo-input>';
    document.body.append(field);
    await Promise.resolve();

    const chip = document.createElement("podo-chip");
    chip.setAttribute("theme", "outline-weak");
    chip.setAttribute("size", "sm");
    chip.textContent = "필터";
    document.body.append(chip);

    const toggle = document.createElement("podo-switch") as HTMLElement & { checked: boolean };
    toggle.setAttribute("aria-label", "알림");
    document.body.append(toggle);
    // Clicking flips the checked attribute and emits podo-checked-change.
    let toggled: boolean | undefined;
    toggle.addEventListener("podo-checked-change", (event) => {
      toggled = (event as CustomEvent<{ checked: boolean }>).detail.checked;
    });
    toggle.shadowRoot?.querySelector("button")?.click();

    const check = document.createElement("podo-checkbox") as HTMLElement & {
      checked: boolean;
      indeterminate: boolean;
    };
    check.setAttribute("label", "이용약관");
    check.setAttribute("indeterminate", "");
    document.body.append(check);
    const checkInput = check.shadowRoot?.querySelector("input");
    // The mixed state only exists as a DOM property on the inner input.
    expect(checkInput?.indeterminate).toBe(true);
    expect(checkInput?.getAttribute("data-state")).toBe("indeterminate");
    let checkedNext: boolean | undefined;
    check.addEventListener("podo-checked-change", (event) => {
      checkedNext = (event as CustomEvent<{ checked: boolean }>).detail.checked;
    });
    // Clicking resolves the mixed state to checked and emits the change event.
    checkInput?.click();

    const area = document.createElement("podo-textarea") as HTMLElement & { value: string };
    area.setAttribute("invalid", "");
    area.setAttribute("resize", "false");
    area.setAttribute("placeholder", "메모");
    document.body.append(area);

    const icon = document.createElement("podo-icon");
    icon.setAttribute("name", "menu");
    document.body.append(icon);

    const text = document.createElement("podo-text");
    text.setAttribute("as", "h1");
    text.textContent = "Dashboard";
    document.body.append(text);

    expect(input.shadowRoot?.innerHTML).toMatchSnapshot("input");
    expect(field.shadowRoot?.innerHTML).toMatchSnapshot("field");
    expect(chip.shadowRoot?.innerHTML).toMatchSnapshot("chip");
    expect(chip.shadowRoot?.querySelector("button")?.getAttribute("data-theme")).toBe(
      "outline-weak"
    );
    expect(toggled).toBe(true);
    expect(toggle.checked).toBe(true);
    expect(toggle.shadowRoot?.querySelector("button")?.getAttribute("data-state")).toBe("on");
    expect(toggle.shadowRoot?.innerHTML).toMatchSnapshot("switch");
    expect(checkedNext).toBe(true);
    expect(check.checked).toBe(true);
    expect(check.indeterminate).toBe(false);
    expect(check.shadowRoot?.querySelector("input")?.getAttribute("data-state")).toBe("checked");
    expect(check.shadowRoot?.querySelector(".podo-checkbox-wrap")).toBeDefined();
    expect(check.shadowRoot?.innerHTML).toMatchSnapshot("checkbox");
    expect(area.shadowRoot?.querySelector("textarea")?.getAttribute("data-state")).toBe("invalid");
    expect(area.shadowRoot?.querySelector("textarea")?.getAttribute("data-resize")).toBe("false");
    expect(area.shadowRoot?.innerHTML).toMatchSnapshot("textarea");
    expect(field.querySelector("podo-input")?.getAttribute("id")).toBe("email-control");
    expect(field.querySelector("podo-input")?.getAttribute("aria-describedby")).toBe(
      "email-description email-error"
    );
    expect(
      field.querySelector("podo-input")?.shadowRoot?.querySelector("input")?.getAttribute("id")
    ).toBe("email-control");
    expect(
      field
        .querySelector("podo-input")
        ?.shadowRoot?.querySelector("input")
        ?.getAttribute("aria-labelledby")
    ).toBe("email-label");
    expect(
      field
        .querySelector("podo-input")
        ?.shadowRoot?.querySelector("input")
        ?.getAttribute("aria-describedby")
    ).toBe("email-description email-error");
    expect(
      field
        .querySelector("podo-input")
        ?.shadowRoot?.querySelector("input")
        ?.getAttribute("aria-invalid")
    ).toBe("true");
    expect(
      field
        .querySelector("podo-input")
        ?.shadowRoot?.querySelector("input")
        ?.getAttribute("aria-required")
    ).toBe("true");
    expect(icon.shadowRoot?.innerHTML).toMatchSnapshot("icon");
    expect(text.shadowRoot?.innerHTML).toMatchSnapshot("text");
  });
});
