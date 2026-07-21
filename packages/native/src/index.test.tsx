// @vitest-environment jsdom

import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  Field,
  Icon,
  Input,
  PodoNativeThemeProvider,
  Radio,
  Select,
  Switch,
  Textarea,
  Toast,
  Tooltip,
  adaptReactNativeTokens,
  createNativeComponents,
  defaultNativeHost,
  usePodoNativeTheme,
} from "./index.js";

const domNative = createNativeComponents({
  Pressable: TestPressable,
  Text: TestText,
  // forwardRef so the components' inputRef passthrough reaches the DOM input,
  // like the real RN TextInput ref would.
  TextInput: React.forwardRef(TestTextInput),
  View: TestView,
});

describe("@podoui/native", () => {
  it("adapts token units for React Native", () => {
    expect(
      adaptReactNativeTokens({
        size: "16px",
        gap: "1.5rem",
        color: "#FFFFFF",
        nested: ["8px"],
      })
    ).toEqual({ size: 16, gap: 24, color: "#FFFFFF", nested: [8] });
  });

  it("renders Pressable, TextInput, Field, and Icon through injected native hosts", () => {
    render(
      <domNative.Field label="Email" error="Required" invalid>
        <domNative.Input accessibilityLabel="Email" value="team@podo.dev" invalid />
        <domNative.Button>
          <domNative.Icon name="menu" glyph="≡" /> Save
        </domNative.Button>
      </domNative.Field>
    );

    expect(screen.getByLabelText("Email").getAttribute("value")).toBe("team@podo.dev");
    // The default Field id is generated per instance (useId, sanitized), so
    // assert the shape and that label/error share the same root.
    const emailLabelledBy = screen.getByLabelText("Email").getAttribute("data-labelledby");
    expect(emailLabelledBy).toMatch(/^podo-field-[A-Za-z0-9_-]+-label$/);
    expect(screen.getByLabelText("Email").getAttribute("data-describedby")).toBe(
      emailLabelledBy?.replace(/-label$/, "-error")
    );
    expect(screen.getByRole("button").getAttribute("data-theme")).toBe("solid-primary");
    expect(screen.getByText("≡")).toBeDefined();

    render(
      <domNative.Chip theme="outline-weak" size="lg" testID="chip">
        필터
      </domNative.Chip>
    );
    expect(screen.getByTestId("chip").getAttribute("data-theme")).toBe("outline-weak");
    expect(screen.getByText("필터")).toBeDefined();

    render(
      <>
        <domNative.Badge theme="red" testID="badge">
          99
        </domNative.Badge>
        <domNative.Badge theme="red" dot accessibilityLabel="새 알림" testID="badge-dot" />
      </>
    );
    const badge = screen.getByTestId("badge");
    expect(badge.getAttribute("data-theme")).toBe("red");
    expect(badge.getAttribute("data-bg")).toBe("#FEF1F1");
    expect(badge.textContent).toBe("99");
    // The dot mode swaps to the 6px dot fill (Figma accent.50 for red).
    expect(screen.getByTestId("badge-dot").getAttribute("data-bg")).toBe("#F15764");

    render(<domNative.Textarea accessibilityLabel="메모" defaultValue="여러 줄" testID="area" />);
    expect(screen.getByTestId("area").tagName).toBe("INPUT"); // TestTextInput host
    expect((screen.getByTestId("area") as HTMLInputElement).value).toBe("여러 줄");

    // inputRef reaches the inner TextInput for imperative focus (e.g. after
    // a failed validation).
    const inputRef = React.createRef<HTMLInputElement>();
    render(<domNative.Input inputRef={inputRef} accessibilityLabel="검색어" testID="focusable" />);
    inputRef.current?.focus();
    expect(document.activeElement).toBe(screen.getByTestId("focusable"));

    const textareaRef = React.createRef<HTMLInputElement>();
    render(<domNative.Textarea inputRef={textareaRef} accessibilityLabel="긴 글" />);
    expect(textareaRef.current).not.toBeNull();

    // Select: 트리거 프레스로 열고, 셀 프레스로 선택 (단일은 닫힘).
    const picked: string[] = [];
    render(
      <domNative.Select
        testID="select"
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        onValueChange={(next) => picked.push(next)}
      />
    );
    expect(screen.getByTestId("select").getAttribute("data-open")).toBeNull();
    // The trigger is a combobox (not a button) — matching the react/web
    // renderers' role="combobox" trigger pattern.
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByTestId("select").getAttribute("data-open")).toBe("true");
    // Menu cells are listbox options now (not buttons).
    fireEvent.click(screen.getByText("바나나").closest('[role="option"]') as HTMLElement);
    expect(picked).toEqual(["banana"]);
    expect(screen.getByTestId("select").getAttribute("data-open")).toBeNull();

    const changes: boolean[] = [];
    render(
      <domNative.Switch
        checked
        size="lg"
        testID="switch"
        onCheckedChange={(next) => changes.push(next)}
      />
    );
    const toggle = screen.getByTestId("switch");
    expect(toggle.getAttribute("data-state")).toBe("on");
    toggle.click();
    expect(changes).toEqual([false]);

    const checks: boolean[] = [];
    render(
      <>
        <domNative.Checkbox
          indeterminate
          label="전체 선택"
          testID="check-parent"
          onCheckedChange={(next) => checks.push(next)}
        />
        <domNative.Checkbox checked disabled testID="check-locked" />
      </>
    );
    const parent = screen.getByTestId("check-parent");
    expect(parent.getAttribute("data-state")).toBe("indeterminate");
    expect(screen.getByText("–")).toBeDefined();
    parent.click();
    expect(checks).toEqual([true]);
    const locked = screen.getByTestId("check-locked");
    expect(locked.getAttribute("data-state")).toBe("checked");
    locked.click();
    expect(checks).toEqual([true]);

    const radioPicks: boolean[] = [];
    render(
      <domNative.Radio
        label="베이직"
        testID="radio-basic"
        onCheckedChange={(next) => radioPicks.push(next)}
      />
    );
    const radio = screen.getByTestId("radio-basic");
    expect(radio.getAttribute("data-state")).toBe("unchecked");
    radio.click();
    // Radios select — they never untoggle themselves.
    expect(radioPicks).toEqual([true]);

    let toastClosed = 0;
    render(
      <domNative.Toast
        state="success"
        caption="캡션 영역"
        testID="toast"
        onClose={() => (toastClosed += 1)}
      >
        저장됐어요
      </domNative.Toast>
    );
    expect(screen.getByTestId("toast").getAttribute("data-state")).toBe("success");
    expect(screen.getByText("캡션 영역")).toBeDefined();
    screen.getByLabelText("닫기").click();
    expect(toastClosed).toBe(1);

    render(
      <domNative.Tooltip label="임시 저장돼요" position="top" ordinal="second" testID="tooltip" />
    );
    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip.getAttribute("data-position")).toBe("top");
    expect(tooltip.getAttribute("data-ordinal")).toBe("second");
    expect(screen.getByText("임시 저장돼요")).toBeDefined();

    expect(screen.getByText("Required")).toBeDefined();
  });

  it("provides native theme context", () => {
    function Probe(): React.ReactElement {
      const theme = usePodoNativeTheme();
      return <span data-testid="native-theme">{`${theme.theme}:${theme.colorScheme}`}</span>;
    }

    render(
      <PodoNativeThemeProvider theme="dashboard" colorScheme="dark">
        <Probe />
      </PodoNativeThemeProvider>
    );

    expect(screen.getByTestId("native-theme").textContent).toBe("dashboard:dark");
  });

  it("applies theme token styles to native host components", () => {
    render(
      <PodoNativeThemeProvider
        theme="dashboard"
        colorScheme="dark"
        tokens={{ color: { background: "#000000", text: "#eeeeee" }, spacing: { controlGap: 10 } }}
      >
        <domNative.Field label="Email" helperText="Work email" testID="field">
          <domNative.Input accessibilityLabel="Email" testID="input" />
        </domNative.Field>
        <domNative.Button testID="button">Save</domNative.Button>
      </PodoNativeThemeProvider>
    );

    expect(screen.getByTestId("field").getAttribute("data-gap")).toBe("10");
    // The input box style (background) lives on the wrapper View; the
    // TextInput itself carries the text color.
    expect(screen.getByTestId("input").parentElement?.getAttribute("data-bg")).toBe("#000000");
    expect(screen.getByTestId("input").getAttribute("data-color")).toBe("#eeeeee");
    // Button backgrounds now come from the styles.css theme map (Figma light
    // values, like BADGE_COLORS) instead of the old ad-hoc dark accent color.
    expect(screen.getByTestId("button").getAttribute("data-bg")).toBe("#426CED");
  });

  it("renders the multi-select trigger as a combobox with no button-nested chip controls", () => {
    const cleared: string[][] = [];
    render(
      <domNative.Select
        testID="multi-select"
        multiple
        clearable
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        values={["strawberry", "banana"]}
        onValuesChange={(next) => cleared.push(next)}
      />
    );

    // The trigger carries the combobox role (react/web parity) and still
    // wires the expanded accessibility state.
    const root = screen.getByTestId("multi-select");
    const trigger = within(root).getByRole("combobox");
    expect(trigger.tagName).not.toBe("BUTTON");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // The open multi menu is an aria-multiselectable listbox.
    expect(within(root).getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");

    // The removable chip X and the clear-all control are buttons themselves,
    // but no ancestor of theirs is a button (nested <button> is invalid HTML).
    const removeChip = screen.getByLabelText("딸기 제거");
    const clearAll = screen.getByLabelText("모두 해제");
    expect(removeChip.tagName).toBe("BUTTON");
    expect(clearAll.tagName).toBe("BUTTON");
    expect(removeChip.parentElement?.closest("button")).toBeNull();
    expect(clearAll.parentElement?.closest("button")).toBeNull();

    // Both stay functional inside the combobox trigger.
    fireEvent.click(removeChip);
    fireEvent.click(clearAll);
    expect(cleared).toEqual([["banana"], []]);
  });

  it("maps Button themes and sizes to distinct visual styles", () => {
    render(
      <>
        <domNative.Button testID="btn-primary">저장</domNative.Button>
        <domNative.Button theme="solid-danger" testID="btn-danger">
          삭제
        </domNative.Button>
        <domNative.Button theme="outline-white" testID="btn-outline">
          취소
        </domNative.Button>
        <domNative.Button size="xs" testID="btn-xs">
          XS
        </domNative.Button>
        <domNative.Button size="lg" testID="btn-lg">
          LG
        </domNative.Button>
      </>
    );

    // Themes (styles.css non-hover base values): distinct fills/borders/labels.
    const primary = screen.getByTestId("btn-primary");
    const danger = screen.getByTestId("btn-danger");
    const outline = screen.getByTestId("btn-outline");
    expect(primary.getAttribute("data-bg")).toBe("#426CED");
    expect(danger.getAttribute("data-bg")).toBe("#F23B3B");
    expect(outline.getAttribute("data-bg")).toBe("#FFFFFF");
    expect(primary.getAttribute("data-border")).toBe("transparent");
    expect(outline.getAttribute("data-border")).toBe("#D1D2D6");
    expect(screen.getByText("저장").getAttribute("data-color")).toBe("#FFFFFF");
    expect(screen.getByText("취소").getAttribute("data-color")).toBe("#18181B");

    // Sizes (Figma xs 32 / lg 52): the height actually changes.
    expect(screen.getByTestId("btn-xs").getAttribute("data-height")).toBe("32");
    expect(screen.getByTestId("btn-lg").getAttribute("data-height")).toBe("52");
    expect(screen.getByTestId("btn-primary").getAttribute("data-height")).toBe("42");

    // Pressed feedback (styles.css :active *-pressed fills): component hosts
    // receive the style-as-function form, resolved here at pressed: true.
    expect(primary.getAttribute("data-bg-pressed")).toBe("#123BBA");
    expect(danger.getAttribute("data-bg-pressed")).toBe("#CD0404");
    expect(outline.getAttribute("data-bg-pressed")).toBe("rgba(0, 0, 0, 0.1)");
  });

  it("renders the disabled Button with the design-system disabled treatment", () => {
    render(
      <>
        <domNative.Button disabled testID="btn-disabled-solid">
          저장
        </domNative.Button>
        <domNative.Button disabled theme="outline-primary" testID="btn-disabled-outline">
          취소
        </domNative.Button>
      </>
    );

    // .podo-button[disabled]: its own fill/label pair — not theme color plus
    // opacity (styles.css declares no disabled opacity).
    const solid = screen.getByTestId("btn-disabled-solid");
    expect(solid.getAttribute("data-bg")).toBe("#E4E4E7");
    expect(solid.getAttribute("data-border")).toBe("transparent");
    expect(within(solid).getByText("저장").getAttribute("data-color")).toBe("#9FA2AD");
    // Outline themes keep the visible disabled border
    // (.podo-button[data-theme^="outline"][disabled]).
    const outline = screen.getByTestId("btn-disabled-outline");
    expect(outline.getAttribute("data-bg")).toBe("#E4E4E7");
    expect(outline.getAttribute("data-border")).toBe("#D1D2D6");
    // No pressed feedback while disabled — the pressed fill stays the
    // disabled fill.
    expect(solid.getAttribute("data-bg-pressed")).toBe("#E4E4E7");
  });

  it("shows the danger border on invalid Input and Textarea", () => {
    render(
      <>
        <domNative.Input accessibilityLabel="이메일" invalid testID="invalid-input" />
        <domNative.Input accessibilityLabel="이름" testID="valid-input" />
        <domNative.Textarea accessibilityLabel="소개" invalid testID="invalid-area" />
        <domNative.Textarea accessibilityLabel="메모" testID="valid-area" />
      </>
    );

    // Input's box lives on the wrapper View; Textarea styles itself.
    expect(screen.getByTestId("invalid-input").parentElement?.getAttribute("data-border")).toBe(
      "#F23B3B"
    );
    expect(screen.getByTestId("invalid-area").getAttribute("data-border")).toBe("#F23B3B");
    expect(screen.getByTestId("valid-input").parentElement?.getAttribute("data-border")).toBe(
      "#E4E4E7"
    );
    expect(screen.getByTestId("valid-area").getAttribute("data-border")).toBe("#E4E4E7");
  });

  it("keeps a disabled removable Chip inert with the disabled treatment", () => {
    const removed: string[] = [];
    render(
      <domNative.Chip disabled onRemove={() => removed.push("removed")} testID="chip-locked">
        태그
      </domNative.Chip>
    );

    // Root mirrors the react renderer's vocabulary (data-disabled="true") and
    // the non-removable disabled chip's colors.
    const chip = screen.getByTestId("chip-locked");
    expect(chip.getAttribute("data-disabled")).toBe("true");
    expect(chip.getAttribute("data-bg")).toBe("#E4E4E7");

    // The X is a disabled control: accessibilityState.disabled and no onRemove.
    const remove = within(chip).getByLabelText("제거") as HTMLButtonElement;
    expect(remove.getAttribute("aria-disabled")).toBe("true");
    expect(remove.disabled).toBe(true);
    fireEvent.click(remove);
    expect(removed).toEqual([]);
  });

  it("locks a disabled multi-select's values against chip removal and clear-all", () => {
    const changes: string[][] = [];
    render(
      <domNative.Select
        testID="multi-locked"
        multiple
        clearable
        disabled
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        values={["strawberry", "banana"]}
        onValuesChange={(next) => changes.push(next)}
      />
    );

    const root = screen.getByTestId("multi-locked");
    expect(root.getAttribute("data-state")).toBe("disabled");
    // Value chips render as static (no per-chip remove control) and the
    // clear-all button is not rendered at all.
    expect(within(root).getByText("딸기")).toBeDefined();
    expect(within(root).queryByLabelText("딸기 제거")).toBeNull();
    expect(within(root).queryByLabelText("바나나 제거")).toBeNull();
    expect(within(root).queryByLabelText("모두 해제")).toBeNull();
    // The disabled trigger doesn't open the menu either.
    fireEvent.click(within(root).getByRole("combobox"));
    expect(root.getAttribute("data-open")).toBeNull();
    expect(changes).toEqual([]);
  });

  it("wires required into standalone Input and Textarea accessibilityState", () => {
    render(
      <>
        <domNative.Input accessibilityLabel="이메일" required testID="required-input" />
        <domNative.Textarea accessibilityLabel="소개" required testID="required-area" />
        <domNative.Input accessibilityLabel="닉네임" testID="optional-input" />
        <domNative.Textarea accessibilityLabel="메모" testID="optional-area" />
      </>
    );

    expect(screen.getByTestId("required-input").getAttribute("aria-required")).toBe("true");
    expect(screen.getByTestId("required-area").getAttribute("aria-required")).toBe("true");
    expect(screen.getByTestId("optional-input").getAttribute("aria-required")).toBeNull();
    expect(screen.getByTestId("optional-area").getAttribute("aria-required")).toBeNull();
  });

  it("puts the Select accessible name on the combobox trigger", () => {
    render(
      <domNative.Select
        testID="named-select"
        accessibilityLabel="과일"
        options={[{ value: "strawberry", label: "딸기" }]}
      />
    );

    // The name lives on the interactive trigger, not the outer layout View.
    const trigger = screen.getByLabelText("과일");
    expect(trigger.getAttribute("role")).toBe("combobox");
    expect(screen.getByTestId("named-select").getAttribute("aria-label")).toBeNull();
  });

  it("generates distinct default Field ids and keeps an explicit id winning", () => {
    render(
      <>
        <domNative.Field label="이름">
          <domNative.Input accessibilityLabel="이름" testID="first-control" />
        </domNative.Field>
        <domNative.Field label="주소">
          <domNative.Input accessibilityLabel="주소" testID="second-control" />
        </domNative.Field>
        <domNative.Field label="메모" id="memo-field">
          <domNative.Input accessibilityLabel="메모" testID="explicit-control" />
        </domNative.Field>
      </>
    );

    const first = screen.getByTestId("first-control").getAttribute("data-labelledby");
    const second = screen.getByTestId("second-control").getAttribute("data-labelledby");
    // Generated ids are sanitized (no useId ":"/"«»" delimiters) and unique
    // per Field instance.
    expect(first).toMatch(/^podo-field-[A-Za-z0-9_-]+-label$/);
    expect(second).toMatch(/^podo-field-[A-Za-z0-9_-]+-label$/);
    expect(first).not.toBe(second);
    expect(screen.getByTestId("explicit-control").getAttribute("data-labelledby")).toBe(
      "memo-field-label"
    );
  });

  it("disables the wrapped control from Field disabled — the child cannot opt out", () => {
    render(
      <>
        <domNative.Field label="이메일" disabled>
          <domNative.Input accessibilityLabel="이메일" testID="field-locked-input" />
        </domNative.Field>
        <domNative.Field label="소개" disabled>
          <domNative.Textarea accessibilityLabel="소개" testID="field-locked-area" />
        </domNative.Field>
        <domNative.Field label="별명" disabled>
          <domNative.Input accessibilityLabel="별명" disabled={false} testID="field-forced-input" />
        </domNative.Field>
      </>
    );

    // Field disabled reaches the child: non-editable + announced as disabled.
    const lockedInput = screen.getByTestId("field-locked-input");
    expect(lockedInput.getAttribute("data-editable")).toBe("false");
    expect(lockedInput.getAttribute("aria-disabled")).toBe("true");
    const lockedArea = screen.getByTestId("field-locked-area");
    expect(lockedArea.getAttribute("data-editable")).toBe("false");
    expect(lockedArea.getAttribute("aria-disabled")).toBe("true");
    // OR semantics (react/hono parity): Field disabled forces the child —
    // an explicit child disabled={false} cannot opt out.
    const forcedInput = screen.getByTestId("field-forced-input");
    expect(forcedInput.getAttribute("data-editable")).toBe("false");
    expect(forcedInput.getAttribute("aria-disabled")).toBe("true");
  });

  it("shows the danger border from Field invalid — the child cannot opt out", () => {
    render(
      <>
        <domNative.Field label="이메일" invalid>
          <domNative.Input accessibilityLabel="이메일" testID="field-invalid-input" />
        </domNative.Field>
        <domNative.Field label="소개" invalid>
          <domNative.Textarea accessibilityLabel="소개" testID="field-invalid-area" />
        </domNative.Field>
        <domNative.Field label="이름" invalid>
          <domNative.Input
            accessibilityLabel="이름"
            invalid={false}
            testID="field-forced-invalid"
          />
        </domNative.Field>
      </>
    );

    // Input's box lives on the wrapper View; Textarea styles itself.
    expect(
      screen.getByTestId("field-invalid-input").parentElement?.getAttribute("data-border")
    ).toBe("#F23B3B");
    expect(screen.getByTestId("field-invalid-input").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByTestId("field-invalid-area").getAttribute("data-border")).toBe("#F23B3B");
    // OR semantics (react/hono parity): Field invalid forces the child —
    // an explicit child invalid={false} cannot opt out.
    expect(
      screen.getByTestId("field-forced-invalid").parentElement?.getAttribute("data-border")
    ).toBe("#F23B3B");
    expect(screen.getByTestId("field-forced-invalid").getAttribute("aria-invalid")).toBe("true");
  });

  it("applies the disabled treatment to Input and Textarea and drops them from focus", () => {
    render(
      <>
        <domNative.Input accessibilityLabel="이메일" disabled testID="disabled-input" />
        <domNative.Textarea accessibilityLabel="소개" disabled testID="disabled-area" />
        <domNative.Input accessibilityLabel="이름" testID="enabled-input" />
      </>
    );

    // .podo-input[data-state="disabled"]: gray box + border, muted text; the
    // control is non-editable and out of the focus order (focusable: false).
    const input = screen.getByTestId("disabled-input");
    expect(input.parentElement?.getAttribute("data-bg")).toBe("#E4E4E7");
    expect(input.parentElement?.getAttribute("data-border")).toBe("#D1D2D6");
    expect(input.getAttribute("data-color")).toBe("#9FA2AD");
    expect(input.getAttribute("data-editable")).toBe("false");
    expect(input.getAttribute("data-focusable")).toBe("false");
    expect(input.getAttribute("aria-disabled")).toBe("true");

    // .podo-textarea[data-state="disabled"]: the same treatment on itself.
    const area = screen.getByTestId("disabled-area");
    expect(area.getAttribute("data-bg")).toBe("#E4E4E7");
    expect(area.getAttribute("data-border")).toBe("#D1D2D6");
    expect(area.getAttribute("data-color")).toBe("#9FA2AD");
    expect(area.getAttribute("data-editable")).toBe("false");
    expect(area.getAttribute("data-focusable")).toBe("false");
    expect(area.getAttribute("aria-disabled")).toBe("true");

    // Enabled boxes keep the normal colors and stay focusable.
    const enabled = screen.getByTestId("enabled-input");
    expect(enabled.parentElement?.getAttribute("data-bg")).toBe("#FFFFFF");
    expect(enabled.parentElement?.getAttribute("data-border")).toBe("#E4E4E7");
    expect(enabled.getAttribute("data-focusable")).toBeNull();
  });

  it("joins the Field describedBy ids after a child's existing descriptor", () => {
    render(
      <>
        <domNative.Field label="이메일" helperText="회사 메일" id="join-field">
          <domNative.Input
            accessibilityLabel="이메일"
            accessibilityDescribedBy="custom-hint"
            testID="join-input"
          />
        </domNative.Field>
        <domNative.Field label="이름" helperText="실명" id="plain-field">
          <domNative.Input accessibilityLabel="이름" testID="plain-input" />
        </domNative.Field>
      </>
    );

    // A pre-existing descriptor keeps its spot first; the Field description
    // id joins after (react/hono aria-describedby parity — never clobbered).
    expect(screen.getByTestId("join-input").getAttribute("data-describedby")).toBe(
      "custom-hint join-field-description"
    );
    expect(screen.getByTestId("plain-input").getAttribute("data-describedby")).toBe(
      "plain-field-description"
    );
  });

  it("hides Icon from the iOS, Android, and web accessibility trees", () => {
    render(<domNative.Icon name="menu" glyph="≡" testID="deco-icon" />);

    const icon = screen.getByTestId("deco-icon");
    // iOS: accessibilityElementsHidden.
    expect(icon.getAttribute("data-a11y-hidden")).toBe("true");
    // Android: importantForAccessibility.
    expect(icon.getAttribute("data-important")).toBe("no-hide-descendants");
    // RN Web: aria-hidden.
    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("resolves the Icon glyph through the provider's iconGlyphs map", () => {
    render(
      <PodoNativeThemeProvider
        theme="landing"
        colorScheme="light"
        iconGlyphs={{ search: "\uE900", menu: "\uE901" }}
      >
        <domNative.Icon name="search" testID="mapped-icon" />
        <domNative.Icon name="search" glyph="★" testID="explicit-icon" />
        <domNative.Icon name="unknown" testID="fallback-icon" />
      </PodoNativeThemeProvider>
    );

    // Resolution order: glyph ?? theme.iconGlyphs?.[name] ?? name.
    expect(screen.getByTestId("mapped-icon").textContent).toBe("\uE900");
    expect(screen.getByTestId("explicit-icon").textContent).toBe("★");
    expect(screen.getByTestId("fallback-icon").textContent).toBe("unknown");

    // Without a provider map the name stays the readable fallback.
    render(<domNative.Icon name="search" testID="bare-icon" />);
    expect(screen.getByTestId("bare-icon").textContent).toBe("search");
  });

  it("keeps the Field counter in sync with external controlled value updates", () => {
    const field = (value: string): React.ReactElement => (
      <domNative.Field label="자기소개" countMax={10}>
        <domNative.Input accessibilityLabel="자기소개" value={value} />
      </domNative.Field>
    );
    const view = render(field("ab"));
    expect(screen.getByText("2/10")).toBeDefined();

    // A controlled update arriving from outside (no onValueChange round trip)
    // re-derives the count from the child's current value prop.
    view.rerender(field("abcde"));
    expect(screen.getByText("5/10")).toBeDefined();

    // Uncontrolled children keep the stateful fallback: the initial count
    // comes from defaultValue and the wired onValueChange updates it.
    let wired: ((value: string) => void) | undefined;
    function FakeControl(props: Record<string, unknown>): React.ReactElement {
      wired = props.onValueChange as (value: string) => void;
      return <span data-testid="fake-control" />;
    }
    render(
      <domNative.Field label="메모" countMax={20}>
        <FakeControl defaultValue="hello" />
      </domNative.Field>
    );
    expect(screen.getByText("5/20")).toBeDefined();
    act(() => wired?.("hello world"));
    expect(screen.getByText("11/20")).toBeDefined();
  });

  it("drives the Select through its listbox/keyboard contract", () => {
    const picked: string[] = [];
    render(
      <domNative.Select
        testID="kbd-select"
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
          { value: "grape", label: "포도" },
        ]}
        onValueChange={(next) => picked.push(next)}
      />
    );

    const root = screen.getByTestId("kbd-select");
    const trigger = within(root).getByRole("combobox");
    expect(trigger.getAttribute("aria-activedescendant")).toBeNull();

    // ArrowDown opens with the first option active; focus stays on the
    // trigger, pointing at the active cell via aria-activedescendant.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(root.getAttribute("data-open")).toBe("true");
    const listbox = within(root).getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]?.id).toMatch(/^podo-select-[A-Za-z0-9_-]+-option-0$/);
    expect(options[0]?.getAttribute("aria-selected")).toBe("false");
    expect(trigger.getAttribute("aria-activedescendant")).toBe(options[0]?.id);
    // The active cell carries the hover/active fill
    // (.podo-select__cell[data-active]).
    expect(options[0]?.getAttribute("data-active")).toBe("true");
    expect(options[0]?.getAttribute("data-bg")).toBe("#F4F4F5");

    // ArrowDown/ArrowUp move the active option (and its fill) around.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(options[1]?.id);
    expect(options[1]?.getAttribute("data-bg")).toBe("#F4F4F5");
    expect(options[0]?.getAttribute("data-bg")).toBeNull();
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(options[0]?.id);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    // Enter picks the active option and closes (single select). RN Web's
    // PressResponder also synthesizes a press from the same Enter — the
    // component swallows exactly that one, so the menu stays closed.
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(trigger);
    expect(picked).toEqual(["banana"]);
    expect(root.getAttribute("data-open")).toBeNull();
    expect(trigger.getAttribute("aria-activedescendant")).toBeNull();

    // Enter and Space also open; Escape closes without picking. Enter's
    // synthesized press is swallowed; a later plain click still toggles.
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(trigger);
    expect(root.getAttribute("data-open")).toBe("true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(root.getAttribute("data-open")).toBeNull();
    fireEvent.click(trigger);
    expect(root.getAttribute("data-open")).toBe("true");
    fireEvent.click(trigger);
    expect(root.getAttribute("data-open")).toBeNull();
    fireEvent.keyDown(trigger, { key: " " });
    expect(root.getAttribute("data-open")).toBe("true");
    expect(picked).toEqual(["banana"]);

    // Cells keep press-to-select.
    fireEvent.click(within(root).getAllByRole("option")[2] as HTMLElement);
    expect(picked).toEqual(["banana", "grape"]);
  });

  it("opens the Select with the current selection active and aria-selected", () => {
    render(
      <domNative.Select
        testID="picked-select"
        value="banana"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
          { value: "grape", label: "포도" },
        ]}
      />
    );

    const root = screen.getByTestId("picked-select");
    const trigger = within(root).getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "Enter" });
    const options = within(root).getAllByRole("option");
    // The picked cell is announced selected and starts as the active cell.
    expect(options[1]?.getAttribute("aria-selected")).toBe("true");
    expect(options[0]?.getAttribute("aria-selected")).toBe("false");
    expect(trigger.getAttribute("aria-activedescendant")).toBe(options[1]?.id);
    expect(options[1]?.getAttribute("data-bg")).toBe("#F4F4F5");
  });

  it("wraps the open Select menu in the host ScrollView capped at ten rows", () => {
    const scrollNative = createNativeComponents({
      Pressable: TestPressable,
      ScrollView: TestScrollView,
      Text: TestText,
      TextInput: React.forwardRef(TestTextInput),
      View: TestView,
    });
    const options = Array.from({ length: 12 }, (_, index) => ({
      value: `option-${index}`,
      label: `옵션 ${index}`,
    }));

    render(<scrollNative.Select testID="scroll-select" options={options} />);
    const root = screen.getByTestId("scroll-select");
    fireEvent.click(within(root).getByRole("combobox"));
    const menu = within(root).getByRole("listbox");
    expect(menu.getAttribute("data-scroll")).toBe("true");
    // Ten-row cap: 10 × selectCell minHeight 42 + 9 × selectMenuContent gap 4
    // + 2 × selectMenuContent padding 8 + 2 × selectMenu borderWidth 1 = 474.
    expect(menu.getAttribute("data-maxheight")).toBe("474");
    // Real RN ScrollView needs child-layout styles on contentContainerStyle:
    // the box keeps maxHeight/border on style (no gap/padding there) while
    // padding/gap/flexDirection ride contentContainerStyle.
    expect(menu.getAttribute("data-gap")).toBeNull();
    expect(menu.getAttribute("data-padding")).toBeNull();
    expect(menu.getAttribute("data-content-direction")).toBe("column");
    expect(menu.getAttribute("data-content-gap")).toBe("4");
    expect(menu.getAttribute("data-content-padding")).toBe("8");
    expect(within(menu).getAllByRole("option")).toHaveLength(12);

    // Hosts without a ScrollView fall back to a plain View with the same cap;
    // the View has no content container, so both style sets merge onto style.
    render(<domNative.Select testID="fallback-select" options={options} />);
    const fallbackRoot = screen.getByTestId("fallback-select");
    fireEvent.click(within(fallbackRoot).getByRole("combobox"));
    const fallbackMenu = within(fallbackRoot).getByRole("listbox");
    expect(fallbackMenu.getAttribute("data-scroll")).toBeNull();
    expect(fallbackMenu.getAttribute("data-maxheight")).toBe("474");
    expect(fallbackMenu.getAttribute("data-gap")).toBe("4");
    expect(fallbackMenu.getAttribute("data-padding")).toBe("8");

    // The default string-tag host ships a ScrollView entry for the menu.
    expect(defaultNativeHost.ScrollView).toBe("ScrollView");
  });

  it("scrolls the ScrollView menu to keep the keyboard-active option visible", () => {
    scrollToSpy.mockClear();
    const scrollNative = createNativeComponents({
      Pressable: TestPressable,
      ScrollView: TestScrollView,
      Text: TestText,
      TextInput: React.forwardRef(TestTextInput),
      View: TestView,
    });
    const options = Array.from({ length: 12 }, (_, index) => ({
      value: `option-${index}`,
      label: `옵션 ${index}`,
    }));

    render(<scrollNative.Select testID="follow-select" options={options} />);
    const root = screen.getByTestId("follow-select");
    const trigger = within(root).getByRole("combobox");

    // Opening lands on the first option — the menu is scrolled to its offset.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(scrollToSpy).toHaveBeenLastCalledWith({ y: 0, animated: false });
    // Each arrow move follows the active cell: offset = index × (42 row + 4 gap).
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(scrollToSpy).toHaveBeenLastCalledWith({ y: 46, animated: false });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(scrollToSpy).toHaveBeenLastCalledWith({ y: 92, animated: false });
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(scrollToSpy).toHaveBeenLastCalledWith({ y: 46, animated: false });

    // Hosts whose menu container exposes no scrollTo (string tags, the plain
    // View fallback) simply ignore the follow behavior — the keyboard-contract
    // test above drives domNative (no ScrollView) through the same arrows.
  });

  it("closes the open Select menu when disabled or readOnly flips, and blocks stale picks", () => {
    // Capture each option cell's onPress from the live render so the handler
    // captured BEFORE the lock flip can be invoked afterwards — the moral
    // equivalent of a queued native press. (Clicking a detached DOM node
    // would never reach React's root-attached listeners, exercising nothing.)
    const cellPress = new Map<string, () => void>();
    function CapturingPressable(
      props: Record<string, unknown> & { children?: React.ReactNode }
    ): React.ReactElement {
      if (props.role === "option" && typeof props.onPress === "function") {
        cellPress.set(String(props.nativeID), props.onPress as () => void);
      }
      // The multi-select clear-all control rides the same stale-press risk.
      if (props.accessibilityLabel === "모두 해제" && typeof props.onPress === "function") {
        cellPress.set("clear-all", props.onPress as () => void);
      }
      return <TestPressable {...props} />;
    }
    const captureNative = createNativeComponents({
      Pressable: CapturingPressable,
      Text: TestText,
      TextInput: React.forwardRef(TestTextInput),
      View: TestView,
    });

    const picked: string[] = [];
    const select = (extra: { disabled?: boolean; readOnly?: boolean } = {}): React.ReactElement => (
      <captureNative.Select
        testID="flip-select"
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        onValueChange={(next) => picked.push(next)}
        {...extra}
      />
    );
    const view = render(select());
    const root = screen.getByTestId("flip-select");
    fireEvent.click(within(root).getByRole("combobox"));
    expect(root.getAttribute("data-open")).toBe("true");
    const bananaId = (within(root).getByText("바나나").closest('[role="option"]') as HTMLElement)
      .id;
    const stalePress = cellPress.get(bananaId);
    expect(stalePress).toBeDefined();

    // Disabling while open closes the menu right away…
    view.rerender(select({ disabled: true }));
    expect(root.getAttribute("data-open")).toBeNull();
    expect(within(root).queryByText("바나나")).toBeNull();
    expect(within(root).getByRole("combobox").getAttribute("aria-expanded")).toBe("false");
    // …and the pre-flip handler reads the lock through the ref — the queued
    // press can't select anything even though its closure saw disabled: false.
    act(() => stalePress?.());
    expect(picked).toEqual([]);

    // Re-enabling doesn't resurrect the old open state.
    view.rerender(select());
    expect(root.getAttribute("data-open")).toBeNull();

    // A fresh handler captured after re-enabling still picks — proving the
    // harness delivers real presses and only the lock blocked the stale one.
    fireEvent.click(within(root).getByRole("combobox"));
    expect(root.getAttribute("data-open")).toBe("true");
    act(() => cellPress.get(bananaId)?.());
    expect(picked).toEqual(["banana"]);
    expect(root.getAttribute("data-open")).toBeNull();

    // The readOnly flip locks an open menu the same way.
    fireEvent.click(within(root).getByRole("combobox"));
    expect(root.getAttribute("data-open")).toBe("true");
    const preReadOnlyPress = cellPress.get(bananaId);
    view.rerender(select({ readOnly: true }));
    expect(root.getAttribute("data-open")).toBeNull();
    // 메뉴 셀은 사라져요 — 트리거는 이제 비제어 값 "바나나"를 정당하게
    // 보여주므로 텍스트 대신 option role로 확인해요.
    expect(within(root).queryByRole("option")).toBeNull();
    act(() => preReadOnlyPress?.());
    expect(picked).toEqual(["banana"]);

    // Clear-all rides the same lock: a clear press captured before the
    // disabled/readOnly flip can't wipe the values afterwards, even though
    // the flip already unmounted the clear control itself.
    const cleared: string[][] = [];
    const multiSelect = (
      extra: { disabled?: boolean; readOnly?: boolean } = {}
    ): React.ReactElement => (
      <captureNative.Select
        testID="flip-multi"
        multiple
        clearable
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        values={["strawberry"]}
        onValuesChange={(next) => cleared.push(next)}
        {...extra}
      />
    );
    const multiView = render(multiSelect());
    const staleClear = cellPress.get("clear-all");
    expect(staleClear).toBeDefined();
    multiView.rerender(multiSelect({ disabled: true }));
    expect(within(screen.getByTestId("flip-multi")).queryByLabelText("모두 해제")).toBeNull();
    act(() => staleClear?.());
    expect(cleared).toEqual([]);
    // The readOnly flip locks the captured clear handler the same way.
    multiView.rerender(multiSelect({ readOnly: true }));
    act(() => staleClear?.());
    expect(cleared).toEqual([]);
    // A handler captured after re-enabling clears — proving the harness
    // delivers real presses and only the lock blocked the stale ones.
    multiView.rerender(multiSelect());
    act(() => cellPress.get("clear-all")?.());
    expect(cleared).toEqual([[]]);
  });

  it("maps the Icon size variant to the 16/24/32 glyph fontSize", () => {
    render(
      <>
        <domNative.Icon name="menu" glyph="≡" testID="icon-default" />
        <domNative.Icon name="menu" glyph="≡" size="sm" testID="icon-sm" />
        <domNative.Icon name="menu" glyph="≡" size="md" testID="icon-md" />
        <domNative.Icon name="menu" glyph="≡" size="lg" testID="icon-lg" />
      </>
    );

    // sm 16 / md 24 / lg 32 — md (the default) matches the 24×24 SVG grid.
    expect(screen.getByTestId("icon-default").getAttribute("data-fontsize")).toBe("24");
    expect(screen.getByTestId("icon-sm").getAttribute("data-fontsize")).toBe("16");
    expect(screen.getByTestId("icon-md").getAttribute("data-fontsize")).toBe("24");
    expect(screen.getByTestId("icon-lg").getAttribute("data-fontsize")).toBe("32");
  });

  it("exposes a meaningful Icon as a named image instead of hiding it", () => {
    const { container } = render(
      <>
        <domNative.Icon
          name="search"
          glyph="⌕"
          decorative={false}
          accessibilityLabel="검색"
          testID="named-icon"
        />
        <domNative.Icon name="menu" glyph="≡" decorative={false} testID="unnamed-icon" />
      </>
    );

    // decorative={false} + accessibilityLabel: the hidden trio is dropped and
    // the glyph announces as a named image (role img / accessibilityRole image).
    const named = screen.getByTestId("named-icon");
    expect(named.getAttribute("role")).toBe("img");
    expect(named.getAttribute("aria-label")).toBe("검색");
    expect(named.getAttribute("aria-hidden")).toBeNull();
    expect(named.getAttribute("data-a11y-hidden")).toBeNull();
    expect(named.getAttribute("data-important")).toBeNull();
    expect(within(container).getByRole("img", { name: "검색" })).toBe(named);

    // decorative={false} without a label stays hidden — an unnamed image
    // would only announce noise.
    const unnamed = screen.getByTestId("unnamed-icon");
    expect(unnamed.getAttribute("role")).toBeNull();
    expect(unnamed.getAttribute("aria-hidden")).toBe("true");
    expect(unnamed.getAttribute("data-a11y-hidden")).toBe("true");
    expect(unnamed.getAttribute("data-important")).toBe("no-hide-descendants");
  });

  it("exposes a labeled dot Badge as an accessible named image", () => {
    render(
      <>
        <domNative.Badge theme="green" dot accessibilityLabel="온라인" testID="labeled-dot" />
        <domNative.Badge theme="gray" dot testID="plain-dot" />
      </>
    );

    // Real RN keeps non-touchable Views out of the a11y tree by default, so a
    // labeled dot must emit accessible:true plus the named-image pair —
    // accessibilityRole "image" for real RN, the web-ish role prop for RN Web
    // (renders role="img") — mirroring Icon's decorative={false} pattern.
    const labeledDot = screen.getByTestId("labeled-dot");
    expect(labeledDot.getAttribute("data-accessible")).toBe("true");
    expect(labeledDot.getAttribute("role")).toBe("img");
    expect(labeledDot.getAttribute("aria-label")).toBe("온라인");

    // An unlabeled dot stays decorative: no accessible opt-in, no bare image
    // role announcing noise.
    const plainDot = screen.getByTestId("plain-dot");
    expect(plainDot.getAttribute("data-accessible")).toBeNull();
    expect(plainDot.getAttribute("role")).toBeNull();
    expect(plainDot.getAttribute("aria-label")).toBeNull();
  });

  it("announces Toast as status per state and as alert only for danger", () => {
    const states = ["normal", "success", "info", "warning"] as const;
    const { container } = render(
      <>
        {states.map((state) => (
          <domNative.Toast key={state} state={state} testID={`toast-${state}`}>
            {state}
          </domNative.Toast>
        ))}
        <domNative.Toast state="danger" testID="toast-danger">
          danger
        </domNative.Toast>
      </>
    );

    // toast.component.json aria: role=status (normal/success/info/warning)
    // with the polite live region…
    const statuses = within(container).getAllByRole("status");
    expect(statuses.map((el) => el.getAttribute("data-testid"))).toEqual(
      states.map((state) => `toast-${state}`)
    );
    for (const status of statuses) {
      expect(status.getAttribute("data-live")).toBe("polite");
    }
    // …and role=alert (danger) with the assertive live region.
    const alert = within(container).getByRole("alert");
    expect(alert.getAttribute("data-testid")).toBe("toast-danger");
    expect(alert.getAttribute("data-live")).toBe("assertive");
  });

  it("exposes the Chip toggle via aria-pressed with the styles.css pressed feedback", () => {
    render(
      <>
        <domNative.Chip testID="chip-off">필터</domNative.Chip>
        <domNative.Chip selected testID="chip-on">
          필터
        </domNative.Chip>
        <domNative.Chip theme="outline-weak" testID="chip-outline-off">
          필터
        </domNative.Chip>
        <domNative.Chip theme="outline-weak" selected testID="chip-outline-on">
          필터
        </domNative.Chip>
        <domNative.Chip disabled testID="chip-disabled">
          필터
        </domNative.Chip>
        <domNative.Chip onRemove={() => {}} testID="chip-removable">
          필터
        </domNative.Chip>
      </>
    );

    // chip.component.json aria: "aria-pressed (selection toggle)" — both
    // states are exposed, alongside accessibilityState.selected.
    expect(screen.getByTestId("chip-off").getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByTestId("chip-on").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("chip-disabled").getAttribute("aria-pressed")).toBe("false");
    // Removable chips are not toggles (the root is a plain View) — no
    // aria-pressed there.
    expect(screen.getByTestId("chip-removable").getAttribute("aria-pressed")).toBeNull();

    // Pressed feedback (.podo-chip :active in podo-ui/styles.css), resolved
    // through the style-as-function form on component hosts: unselected solid
    // darkens the fill, unselected outlines darken the border, selected
    // solid lightens to #767985, selected outline-weak fills #F4F4F5.
    expect(screen.getByTestId("chip-off").getAttribute("data-bg-pressed")).toBe("#E4E4E7");
    expect(screen.getByTestId("chip-on").getAttribute("data-bg-pressed")).toBe("#767985");
    expect(screen.getByTestId("chip-outline-off").getAttribute("data-border-pressed")).toBe(
      "#D1D2D6"
    );
    expect(screen.getByTestId("chip-outline-on").getAttribute("data-bg-pressed")).toBe("#F4F4F5");
    // No pressed feedback while disabled — the pressed fill stays the
    // disabled fill.
    expect(screen.getByTestId("chip-disabled").getAttribute("data-bg-pressed")).toBe("#E4E4E7");
  });

  it("toggles the Switch from the keyboard and swallows Enter's synthesized press", () => {
    const changes: boolean[] = [];
    // checked={false}로 controlled 고정 — 이 테스트는 키/스왈로우 계약만 봐요
    // (비제어 상태 추적은 전용 defaultChecked 테스트가 커버).
    render(
      <domNative.Switch
        checked={false}
        testID="kbd-switch"
        onCheckedChange={(next) => changes.push(next)}
      />
    );
    const toggle = screen.getByTestId("kbd-switch");

    // Enter toggles once: the keydown handles it and the press RNW's
    // PressResponder synthesizes from the same Enter is swallowed.
    fireEvent.keyDown(toggle, { key: "Enter" });
    expect(changes).toEqual([true]);
    fireEvent.click(toggle);
    expect(changes).toEqual([true]);

    // Space toggles too; the switch renders a <div> under RNW (not a real
    // <button>), so Space synthesizes no press — a later real press still
    // works (nothing is swallowed).
    fireEvent.keyDown(toggle, { key: " " });
    expect(changes).toEqual([true, true]);
    fireEvent.click(toggle);
    expect(changes).toEqual([true, true, true]);

    // Other keys are ignored.
    fireEvent.keyDown(toggle, { key: "ArrowDown" });
    expect(changes).toEqual([true, true, true]);

    // Disabled switches ignore the keyboard entirely.
    const locked: boolean[] = [];
    render(
      <domNative.Switch
        disabled
        testID="locked-switch"
        onCheckedChange={(next) => locked.push(next)}
      />
    );
    fireEvent.keyDown(screen.getByTestId("locked-switch"), { key: "Enter" });
    fireEvent.keyDown(screen.getByTestId("locked-switch"), { key: " " });
    expect(locked).toEqual([]);
  });

  it("toggles the Checkbox and selects the Radio with Space", () => {
    const checks: boolean[] = [];
    const picks: boolean[] = [];
    render(
      <>
        <domNative.Checkbox checked testID="kbd-check" onCheckedChange={(n) => checks.push(n)} />
        <domNative.Radio testID="kbd-radio" onCheckedChange={(n) => picks.push(n)} />
        <domNative.Checkbox
          disabled
          testID="locked-check"
          onCheckedChange={(n) => checks.push(n)}
        />
        <domNative.Radio disabled testID="locked-radio" onCheckedChange={(n) => picks.push(n)} />
      </>
    );

    // checkbox.component.json keyboard: "Space toggles the checkbox". The
    // checkbox renders a <div> under RNW, so Space synthesizes no press —
    // no double toggle to swallow.
    fireEvent.keyDown(screen.getByTestId("kbd-check"), { key: " " });
    expect(checks).toEqual([false]);
    // Enter is unhandled here — RNW's lone synthesized press (simulated by
    // the click) toggles exactly once.
    fireEvent.keyDown(screen.getByTestId("kbd-check"), { key: "Enter" });
    expect(checks).toEqual([false]);
    fireEvent.click(screen.getByTestId("kbd-check"));
    expect(checks).toEqual([false, false]);

    // radio.component.json keyboard: "Space selects" — radios never untoggle.
    // Arrow-key group navigation needs a future RadioGroup primitive (native
    // radios are standalone), so arrows are ignored.
    fireEvent.keyDown(screen.getByTestId("kbd-radio"), { key: " " });
    expect(picks).toEqual([true]);
    fireEvent.keyDown(screen.getByTestId("kbd-radio"), { key: "ArrowDown" });
    expect(picks).toEqual([true]);

    // Disabled controls ignore the keyboard entirely.
    fireEvent.keyDown(screen.getByTestId("locked-check"), { key: " " });
    fireEvent.keyDown(screen.getByTestId("locked-radio"), { key: " " });
    expect(checks).toEqual([false, false]);
    expect(picks).toEqual([true]);
  });

  it("wires the Select trigger to its listbox and keeps options out of the focus order", () => {
    render(
      <domNative.Select
        testID="wired-select"
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
      />
    );

    const root = screen.getByTestId("wired-select");
    const trigger = within(root).getByRole("combobox");
    // Closed: haspopup announces the listbox, no controls id yet, and the
    // explicit aria-expanded rides alongside accessibilityState.expanded.
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-controls")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // Open: aria-controls points at the listbox menu id.
    fireEvent.click(trigger);
    const listbox = within(root).getByRole("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
    expect(listbox.id).toMatch(/^podo-select-[A-Za-z0-9_-]+$/);

    // Focus stays on the trigger: every option leaves the tab order
    // (tabIndex -1) and opts out of RNW focusability (focusable: false).
    for (const option of within(listbox).getAllByRole("option")) {
      expect(option.getAttribute("tabindex")).toBe("-1");
      expect(option.getAttribute("data-focusable")).toBe("false");
    }
  });

  it("labels the Tooltip bubble with the tooltip role and a referenceable id", () => {
    const { container } = render(<domNative.Tooltip label="임시 저장돼요" testID="role-tooltip" />);

    // tooltip.component.json aria: role=tooltip on the bubble itself; the
    // generated nativeID lets a future trigger point at it (aria-describedby).
    const bubble = within(container).getByRole("tooltip");
    expect(bubble.id).toMatch(/^podo-tooltip-[A-Za-z0-9_-]+$/);
    expect(bubble.textContent).toBe("임시 저장돼요");
    expect(screen.getByTestId("role-tooltip").contains(bubble)).toBe(true);
  });

  it("renders all 13 top-level exports against the defaultNativeHost string tags", () => {
    // react-test-renderer is not a workspace dependency (and is deprecated for
    // React 19), so the defaultNativeHost path is exercised with react-dom
    // itself: the string tags ("Pressable"/"Text"/"TextInput"/"View") render as
    // unknown elements whose lowercased tags and string/number props we can
    // assert on. React logs unknown-tag/prop dev warnings for those elements —
    // expected and documented — so they're silenced for this test only.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const cases: Array<{
        name: string;
        element: React.ReactElement;
        assert: (container: HTMLElement) => void;
      }> = [
        {
          name: "Button",
          element: <Button onPress={() => {}}>저장</Button>,
          assert: (c) => {
            const rootEl = c.querySelector("pressable");
            expect(rootEl?.getAttribute("accessibilityrole")).toBe("button");
            expect(rootEl?.getAttribute("data-theme")).toBe("solid-primary");
            expect(rootEl?.getAttribute("data-size")).toBe("md");
            expect(rootEl?.querySelector("text")?.textContent).toBe("저장");
          },
        },
        {
          name: "Checkbox",
          element: <Checkbox checked label="동의" />,
          assert: (c) => {
            const rootEl = c.querySelector("pressable");
            expect(rootEl?.getAttribute("accessibilityrole")).toBe("checkbox");
            expect(rootEl?.getAttribute("data-state")).toBe("checked");
            expect(rootEl?.textContent).toContain("동의");
          },
        },
        {
          name: "Radio",
          element: <Radio checked label="옵션" />,
          assert: (c) => {
            const rootEl = c.querySelector("pressable");
            expect(rootEl?.getAttribute("accessibilityrole")).toBe("radio");
            expect(rootEl?.getAttribute("data-state")).toBe("checked");
            expect(rootEl?.textContent).toContain("옵션");
          },
        },
        {
          name: "Chip",
          element: <Chip selected>필터</Chip>,
          assert: (c) => {
            const rootEl = c.querySelector("pressable");
            expect(rootEl?.getAttribute("accessibilityrole")).toBe("button");
            expect(rootEl?.getAttribute("data-theme")).toBe("solid");
            expect(rootEl?.getAttribute("data-state")).toBe("selected");
            expect(rootEl?.getAttribute("aria-pressed")).toBe("true");
            expect(rootEl?.querySelector("text")?.textContent).toBe("필터");
          },
        },
        {
          name: "Badge",
          element: <Badge theme="red">99</Badge>,
          assert: (c) => {
            const rootEl = c.querySelector("view");
            expect(rootEl?.getAttribute("data-theme")).toBe("red");
            expect(rootEl?.querySelector("text")?.textContent).toBe("99");
          },
        },
        {
          name: "Select",
          element: (
            <Select placeholder="과일 선택" options={[{ value: "strawberry", label: "딸기" }]} />
          ),
          assert: (c) => {
            expect(c.querySelector("view")?.getAttribute("data-size")).toBe("md");
            const trigger = c.querySelector('pressable[accessibilityrole="combobox"]');
            expect(trigger).not.toBeNull();
            expect(trigger?.getAttribute("aria-haspopup")).toBe("listbox");
            expect(trigger?.getAttribute("aria-expanded")).toBe("false");
            expect(trigger?.textContent).toContain("과일 선택");
          },
        },
        {
          name: "Input",
          element: <Input placeholder="이메일" testID="host-input" />,
          assert: (c) => {
            const control = c.querySelector("view > textinput");
            expect(control?.getAttribute("placeholder")).toBe("이메일");
            expect(control?.getAttribute("testid")).toBe("host-input");
          },
        },
        {
          name: "Textarea",
          element: <Textarea placeholder="메모" />,
          assert: (c) => {
            const control = c.querySelector("textinput");
            expect(control?.getAttribute("placeholder")).toBe("메모");
            expect(control?.getAttribute("numberoflines")).toBe("3");
          },
        },
        {
          name: "Field",
          element: (
            <Field label="이름" helperText="실명을 입력해요">
              <Input placeholder="이름 입력" />
            </Field>
          ),
          assert: (c) => {
            const label = c.querySelector("text[nativeid]");
            expect(label?.textContent).toBe("이름");
            expect(label?.getAttribute("nativeid")).toMatch(/^podo-field-[A-Za-z0-9_-]+-label$/);
            // The wired control points back at the Field label id.
            expect(c.querySelector("textinput")?.getAttribute("accessibilitylabelledby")).toBe(
              label?.getAttribute("nativeid")
            );
            expect(c.textContent).toContain("실명을 입력해요");
          },
        },
        {
          name: "Icon",
          element: <Icon name="menu" glyph="≡" />,
          assert: (c) => {
            expect(c.querySelector("text")?.textContent).toBe("≡");
          },
        },
        {
          name: "Switch",
          element: <Switch checked accessibilityLabel="알림" />,
          assert: (c) => {
            const rootEl = c.querySelector("pressable");
            expect(rootEl?.getAttribute("accessibilityrole")).toBe("switch");
            expect(rootEl?.getAttribute("data-state")).toBe("on");
            expect(rootEl?.getAttribute("accessibilitylabel")).toBe("알림");
          },
        },
        {
          name: "Toast",
          element: <Toast state="success">저장됐어요</Toast>,
          assert: (c) => {
            const rootEl = c.querySelector("view");
            // Non-danger states announce as status (role prop), not alert.
            expect(rootEl?.getAttribute("role")).toBe("status");
            expect(rootEl?.getAttribute("accessibilityrole")).toBeNull();
            expect(rootEl?.getAttribute("accessibilityliveregion")).toBe("polite");
            expect(rootEl?.getAttribute("data-state")).toBe("success");
            expect(rootEl?.textContent).toContain("저장됐어요");
          },
        },
        {
          name: "Tooltip",
          element: <Tooltip label="도움말" />,
          assert: (c) => {
            const rootEl = c.querySelector("view");
            expect(rootEl?.getAttribute("data-position")).toBe("right");
            expect(rootEl?.getAttribute("data-theme")).toBe("default");
            const bubble = c.querySelector('view[role="tooltip"]');
            expect(bubble?.getAttribute("nativeid")).toMatch(/^podo-tooltip-[A-Za-z0-9_-]+$/);
            expect(bubble?.querySelector("text")?.textContent).toBe("도움말");
          },
        },
      ];

      for (const hostCase of cases) {
        const { container, unmount } = render(
          <PodoNativeThemeProvider theme="landing" colorScheme="light">
            {hostCase.element}
          </PodoNativeThemeProvider>
        );
        hostCase.assert(container);
        unmount();
      }
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("toggles an uncontrolled Chip from defaultSelected while a controlled selected wins", () => {
    const changes: boolean[] = [];
    render(
      <>
        <domNative.Chip
          defaultSelected
          testID="chip-uncontrolled"
          onSelectedChange={(next) => changes.push(next)}
        >
          필터
        </domNative.Chip>
        <domNative.Chip
          selected={false}
          defaultSelected
          testID="chip-controlled"
          onSelectedChange={(next) => changes.push(next)}
        >
          고정
        </domNative.Chip>
      </>
    );

    // defaultSelected seeds the internal state; each press flips it. Presses
    // are also the keyboard path: the chip is a real <button> under RNW, so
    // Enter/Space synthesize this same press.
    const chip = screen.getByTestId("chip-uncontrolled");
    expect(chip.getAttribute("data-state")).toBe("selected");
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chip);
    expect(chip.getAttribute("data-state")).toBeNull();
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(chip);
    expect(chip.getAttribute("data-state")).toBe("selected");
    expect(changes).toEqual([false, true]);

    // A controlled selected prop wins over defaultSelected and stays put; the
    // change callback still reports the requested next value.
    const controlled = screen.getByTestId("chip-controlled");
    expect(controlled.getAttribute("data-state")).toBeNull();
    fireEvent.click(controlled);
    expect(controlled.getAttribute("data-state")).toBeNull();
    expect(controlled.getAttribute("aria-pressed")).toBe("false");
    expect(changes).toEqual([false, true, true]);
  });

  it("tracks an uncontrolled Switch through press and keyboard while a controlled checked wins", () => {
    const changes: boolean[] = [];
    render(
      <>
        <domNative.Switch
          defaultChecked
          testID="switch-uncontrolled"
          onCheckedChange={(next) => changes.push(next)}
        />
        <domNative.Switch
          checked={false}
          defaultChecked
          testID="switch-controlled"
          onCheckedChange={(next) => changes.push(next)}
        />
      </>
    );

    // defaultChecked seeds the internal state; press and keyboard drive it
    // identically (Enter's synthesized press stays swallowed — one toggle).
    const toggle = screen.getByTestId("switch-uncontrolled");
    expect(toggle.getAttribute("data-state")).toBe("on");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("off");
    fireEvent.keyDown(toggle, { key: " " });
    expect(toggle.getAttribute("data-state")).toBe("on");
    fireEvent.keyDown(toggle, { key: "Enter" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("data-state")).toBe("off");
    expect(changes).toEqual([false, true, false]);

    // Controlled checked wins over defaultChecked and ignores internal
    // updates; the change callback still fires with the requested value.
    const controlled = screen.getByTestId("switch-controlled");
    expect(controlled.getAttribute("data-state")).toBe("off");
    fireEvent.click(controlled);
    expect(controlled.getAttribute("data-state")).toBe("off");
    fireEvent.keyDown(controlled, { key: " " });
    expect(controlled.getAttribute("data-state")).toBe("off");
    expect(changes).toEqual([false, true, false, true, true]);
  });

  it("tracks an uncontrolled Checkbox through press and Space while a controlled checked wins", () => {
    const changes: boolean[] = [];
    render(
      <>
        <domNative.Checkbox
          defaultChecked
          testID="check-uncontrolled"
          onCheckedChange={(next) => changes.push(next)}
        />
        <domNative.Checkbox
          checked
          defaultChecked={false}
          testID="check-controlled"
          onCheckedChange={(next) => changes.push(next)}
        />
        <domNative.Checkbox
          indeterminate
          defaultChecked
          testID="check-mixed"
          onCheckedChange={(next) => changes.push(next)}
        />
      </>
    );

    // defaultChecked seeds the internal state; press and Space drive it
    // identically (checkbox.component.json keyboard: "Space toggles").
    const box = screen.getByTestId("check-uncontrolled");
    expect(box.getAttribute("data-state")).toBe("checked");
    fireEvent.click(box);
    expect(box.getAttribute("data-state")).toBe("unchecked");
    fireEvent.keyDown(box, { key: " " });
    expect(box.getAttribute("data-state")).toBe("checked");
    expect(changes).toEqual([false, true]);

    // Controlled checked wins and ignores internal updates.
    const controlled = screen.getByTestId("check-controlled");
    expect(controlled.getAttribute("data-state")).toBe("checked");
    fireEvent.click(controlled);
    expect(controlled.getAttribute("data-state")).toBe("checked");
    expect(changes).toEqual([false, true, false]);

    // The indeterminate interaction is unchanged: the mixed look rides the
    // indeterminate prop (not the toggled value), and toggling still reports
    // the next checked value from the seeded true.
    const mixed = screen.getByTestId("check-mixed");
    expect(mixed.getAttribute("data-state")).toBe("indeterminate");
    fireEvent.click(mixed);
    expect(mixed.getAttribute("data-state")).toBe("indeterminate");
    expect(changes).toEqual([false, true, false, false]);
  });

  it("selects an uncontrolled Radio through press and Space while a controlled checked wins", () => {
    const picks: boolean[] = [];
    render(
      <>
        <domNative.Radio testID="radio-press" onCheckedChange={(next) => picks.push(next)} />
        <domNative.Radio testID="radio-space" onCheckedChange={(next) => picks.push(next)} />
        <domNative.Radio defaultChecked testID="radio-preset" />
        <domNative.Radio
          checked={false}
          defaultChecked
          testID="radio-controlled"
          onCheckedChange={(next) => picks.push(next)}
        />
      </>
    );

    // Press selects and keeps the internal state true — radios never untoggle
    // themselves; group exclusivity stays the consumer's concern (react
    // renderer parity: standalone semantics).
    const pressed = screen.getByTestId("radio-press");
    expect(pressed.getAttribute("data-state")).toBe("unchecked");
    fireEvent.click(pressed);
    expect(pressed.getAttribute("data-state")).toBe("checked");
    fireEvent.click(pressed);
    expect(pressed.getAttribute("data-state")).toBe("checked");
    expect(picks).toEqual([true, true]);

    // Space drives the same uncontrolled selection (radio.component.json
    // keyboard: "Space selects").
    const spaced = screen.getByTestId("radio-space");
    fireEvent.keyDown(spaced, { key: " " });
    expect(spaced.getAttribute("data-state")).toBe("checked");
    expect(picks).toEqual([true, true, true]);

    // defaultChecked seeds the initial selection.
    expect(screen.getByTestId("radio-preset").getAttribute("data-state")).toBe("checked");

    // Controlled checked wins over defaultChecked and ignores internal
    // updates; the callback still reports true.
    const controlled = screen.getByTestId("radio-controlled");
    expect(controlled.getAttribute("data-state")).toBe("unchecked");
    fireEvent.click(controlled);
    expect(controlled.getAttribute("data-state")).toBe("unchecked");
    expect(picks).toEqual([true, true, true, true]);
  });

  it("keeps the uncontrolled single Select value internally from defaultValue", () => {
    const picked: string[] = [];
    render(
      <domNative.Select
        testID="uncontrolled-select"
        placeholder="과일 선택"
        defaultValue="strawberry"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
          { value: "grape", label: "포도" },
        ]}
        onValueChange={(next) => picked.push(next)}
      />
    );

    const root = screen.getByTestId("uncontrolled-select");
    const trigger = within(root).getByRole("combobox");
    // defaultValue seeds the trigger text and the menu's selected cell.
    expect(trigger.textContent).toContain("딸기");
    fireEvent.click(trigger);
    expect(within(root).getAllByRole("option")[0]?.getAttribute("aria-selected")).toBe("true");

    // A cell press moves the internal value (and closes the single menu).
    fireEvent.click(within(root).getAllByRole("option")[1] as HTMLElement);
    expect(picked).toEqual(["banana"]);
    expect(root.getAttribute("data-open")).toBeNull();
    expect(trigger.textContent).toContain("바나나");

    // The keyboard path drives the same internal state: ArrowDown reopens on
    // the banana selection, ArrowDown moves to grape, Enter picks it (the
    // synthesized press is swallowed).
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(
      within(root).getAllByRole("option")[1]?.id
    );
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.click(trigger);
    expect(picked).toEqual(["banana", "grape"]);
    expect(trigger.textContent).toContain("포도");

    // Reopening announces the uncontrolled selection as selected and active.
    fireEvent.click(trigger);
    const options = within(root).getAllByRole("option");
    expect(options[2]?.getAttribute("aria-selected")).toBe("true");
    expect(options[1]?.getAttribute("aria-selected")).toBe("false");
    expect(trigger.getAttribute("aria-activedescendant")).toBe(options[2]?.id);
  });

  it("tracks uncontrolled multi Select values through pick, chip removal, and clear-all", () => {
    const changes: string[][] = [];
    render(
      <domNative.Select
        testID="uncontrolled-multi"
        multiple
        clearable
        placeholder="과일 선택"
        defaultValues={["strawberry"]}
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        onValuesChange={(next) => changes.push(next)}
      />
    );

    // defaultValues seeds the trigger chips.
    const root = screen.getByTestId("uncontrolled-multi");
    expect(within(root).getByLabelText("딸기 제거")).toBeDefined();
    fireEvent.click(within(root).getByRole("combobox"));

    // A cell press toggles into the internal values (multi menu stays open).
    fireEvent.click(within(root).getAllByRole("option")[1] as HTMLElement);
    expect(changes).toEqual([["strawberry", "banana"]]);
    expect(within(root).getByLabelText("바나나 제거")).toBeDefined();
    expect(within(root).getAllByRole("option")[1]?.getAttribute("aria-selected")).toBe("true");

    // Chip removal rides the same internal toggle…
    fireEvent.click(within(root).getByLabelText("딸기 제거"));
    expect(changes).toEqual([["strawberry", "banana"], ["banana"]]);
    expect(within(root).queryByLabelText("딸기 제거")).toBeNull();

    // …and clear-all wipes the internal values entirely.
    fireEvent.click(within(root).getByLabelText("모두 해제"));
    expect(changes).toEqual([["strawberry", "banana"], ["banana"], []]);
    expect(within(root).queryByLabelText("바나나 제거")).toBeNull();
    expect(within(root).queryByLabelText("모두 해제")).toBeNull();
    for (const option of within(root).getAllByRole("option")) {
      expect(option.getAttribute("aria-selected")).toBe("false");
    }
  });

  it("keeps controlled Select values authoritative over defaults and internal picks", () => {
    const picked: string[] = [];
    const changes: string[][] = [];
    render(
      <>
        <domNative.Select
          testID="controlled-single"
          value="strawberry"
          defaultValue="banana"
          options={[
            { value: "strawberry", label: "딸기" },
            { value: "banana", label: "바나나" },
          ]}
          onValueChange={(next) => picked.push(next)}
        />
        <domNative.Select
          testID="controlled-multi"
          multiple
          values={["strawberry"]}
          defaultValues={["banana"]}
          options={[
            { value: "strawberry", label: "딸기" },
            { value: "banana", label: "바나나" },
          ]}
          onValuesChange={(next) => changes.push(next)}
        />
      </>
    );

    // The controlled value wins over defaultValue; a pick still fires the
    // callback but the shown value never moves without the prop changing.
    const single = screen.getByTestId("controlled-single");
    const singleTrigger = within(single).getByRole("combobox");
    expect(singleTrigger.textContent).toContain("딸기");
    fireEvent.click(singleTrigger);
    fireEvent.click(within(single).getAllByRole("option")[1] as HTMLElement);
    expect(picked).toEqual(["banana"]);
    expect(singleTrigger.textContent).toContain("딸기");
    fireEvent.click(singleTrigger);
    expect(within(single).getAllByRole("option")[0]?.getAttribute("aria-selected")).toBe("true");
    expect(within(single).getAllByRole("option")[1]?.getAttribute("aria-selected")).toBe("false");

    // Controlled values win over defaultValues the same way: the callback
    // reports the requested next array, the chips stay on the prop.
    const multi = screen.getByTestId("controlled-multi");
    expect(within(multi).getByLabelText("딸기 제거")).toBeDefined();
    expect(within(multi).queryByLabelText("바나나 제거")).toBeNull();
    fireEvent.click(within(multi).getByRole("combobox"));
    fireEvent.click(within(multi).getAllByRole("option")[1] as HTMLElement);
    expect(changes).toEqual([["strawberry", "banana"]]);
    expect(within(multi).queryByLabelText("바나나 제거")).toBeNull();
    expect(within(multi).getAllByRole("option")[1]?.getAttribute("aria-selected")).toBe("false");
  });

  it("focuses the wired control from a Field label press", () => {
    const inputRef = React.createRef<HTMLInputElement>();
    render(
      <domNative.Field label="회신 이메일" id="focus-field">
        <domNative.Input
          accessibilityLabel="회신 이메일"
          inputRef={inputRef}
          testID="label-focus-input"
        />
      </domNative.Field>
    );

    const input = screen.getByTestId("label-focus-input");
    const label = screen.getByText("회신 이메일");
    // The label keeps its plain Text semantics — no button role for AT, and
    // the nativeID the control's accessibilityLabelledBy points at is intact.
    expect(label.getAttribute("role")).toBeNull();
    expect(label.id).toBe("focus-field-label");
    expect(input.getAttribute("data-labelledby")).toBe("focus-field-label");

    // Pressing the label forwards focus to the underlying TextInput host
    // (field.component.json focusManagement).
    const focusSpy = vi.spyOn(input, "focus");
    expect(document.activeElement).not.toBe(input);
    fireEvent.click(label);
    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(input);
    // The child's own inputRef stays wired alongside the Field's capture.
    expect(inputRef.current).toBe(input);
  });

  it("keeps the Field label press a no-op for non-focusable controls and disabled fields", () => {
    function InertControl(): React.ReactElement {
      return <span data-testid="inert-control" />;
    }
    render(
      <>
        <domNative.Field label="결제 상태">
          <InertControl />
        </domNative.Field>
        <domNative.Field label="잠긴 회신 이메일" disabled>
          <domNative.Input accessibilityLabel="잠긴 회신 이메일" testID="locked-focus-input" />
        </domNative.Field>
      </>
    );

    // A control that never wires inputRef leaves the Field's ref empty — the
    // label press is a guarded no-op (no throw, focus unchanged).
    const before = document.activeElement;
    fireEvent.click(screen.getByText("결제 상태"));
    expect(document.activeElement).toBe(before);

    // Disabled fields ignore the label press, like a web label pointing at a
    // disabled input.
    fireEvent.click(screen.getByText("잠긴 회신 이메일"));
    expect(document.activeElement).not.toBe(screen.getByTestId("locked-focus-input"));
  });
});

function TestPressable({
  children,
  onPress,
  style,
  testID,
  ...props
}: Record<string, unknown> & { children?: React.ReactNode }): React.ReactElement {
  // Component hosts can receive RN Pressable's style-as-function form —
  // resolve both states so tests can assert resting and pressed styles.
  const styleFn =
    typeof style === "function"
      ? (style as (state: { pressed: boolean }) => Record<string, unknown>)
      : undefined;
  const styleRecord = (styleFn ? styleFn({ pressed: false }) : style) as
    | Record<string, unknown>
    | undefined;
  const pressedRecord = styleFn ? styleFn({ pressed: true }) : undefined;
  // The web-ish role prop (RN ≥0.71) wins over accessibilityRole, like RNW.
  const role =
    (props.role as string | undefined) ??
    (props.accessibilityRole as string | undefined) ??
    "button";
  const state = props.accessibilityState as Record<string, unknown> | undefined;
  const shared = {
    id: props.nativeID as string | undefined,
    "aria-label": props.accessibilityLabel as string | undefined,
    // RNW passthrough: an explicit aria-expanded prop wins over the
    // accessibilityState.expanded mapping.
    "aria-expanded":
      props["aria-expanded"] != null
        ? String(props["aria-expanded"])
        : state && "expanded" in state
          ? Boolean(state.expanded)
          : undefined,
    "aria-haspopup": props["aria-haspopup"] as string | undefined,
    "aria-controls": props["aria-controls"] as string | undefined,
    "aria-pressed": props["aria-pressed"] as boolean | undefined,
    "aria-selected": props["aria-selected"] as boolean | undefined,
    "aria-activedescendant": props["aria-activedescendant"] as string | undefined,
    // RNW honors focusable:false / tabIndex:-1 on Pressables.
    tabIndex: props.tabIndex as number | undefined,
    "data-focusable": props.focusable === false ? "false" : undefined,
    // Mirror the RN accessibilityState.disabled announcement; fall back to the
    // host disabled prop like react-native-web does.
    "aria-disabled":
      state && "disabled" in state
        ? Boolean(state.disabled) || undefined
        : props.disabled
          ? true
          : undefined,
    "data-bg": styleRecord?.backgroundColor as string | undefined,
    "data-bg-pressed": pressedRecord?.backgroundColor as string | undefined,
    "data-border": styleRecord?.borderColor as string | undefined,
    "data-border-pressed": pressedRecord?.borderColor as string | undefined,
    "data-height": styleRecord?.minHeight == null ? undefined : String(styleRecord.minHeight),
    "data-testid": testID as string | undefined,
    "data-active": props["data-active"] as string | undefined,
    "data-size": props["data-size"] as string | undefined,
    "data-state": props["data-state"] as string | undefined,
    "data-theme": props["data-theme"] as string | undefined,
    onClick: () => {
      if (!props.disabled && typeof onPress === "function") {
        onPress();
      }
    },
    onKeyDown: props.onKeyDown as React.KeyboardEventHandler<HTMLElement> | undefined,
  };
  // Mirror react-native-web: accessibilityRole="button" becomes a real
  // <button>; any other role renders a <div> carrying the ARIA role.
  if (role !== "button") {
    return (
      <div role={role} {...shared}>
        {children}
      </div>
    );
  }
  return (
    <button disabled={Boolean(props.disabled)} {...shared}>
      {children}
    </button>
  );
}

function TestText({
  children,
  style,
  testID,
  ...props
}: Record<string, unknown> & { children?: React.ReactNode }): React.ReactElement {
  const styleRecord = style as Record<string, unknown> | undefined;
  return (
    <span
      // RNW maps nativeID → id; RN Text supports onPress (the Field label
      // uses it), which the DOM host mirrors as a plain click handler.
      id={props.nativeID as string | undefined}
      onClick={props.onPress as React.MouseEventHandler<HTMLElement> | undefined}
      // The web-ish role prop (RN ≥0.71) wins over accessibilityRole, like RNW.
      role={(props.role ?? props.accessibilityRole) as string | undefined}
      aria-label={props.accessibilityLabel as string | undefined}
      aria-hidden={props["aria-hidden"] as boolean | undefined}
      data-a11y-hidden={props.accessibilityElementsHidden === true ? "true" : undefined}
      data-important={props.importantForAccessibility as string | undefined}
      data-color={styleRecord?.color as string | undefined}
      data-fontsize={styleRecord?.fontSize == null ? undefined : String(styleRecord.fontSize)}
      data-testid={testID as string | undefined}
    >
      {children}
    </span>
  );
}

function TestTextInput(
  props: Record<string, unknown>,
  ref: React.ForwardedRef<HTMLInputElement>
): React.ReactElement {
  const styleRecord = props.style as Record<string, unknown> | undefined;
  const state = props.accessibilityState as Record<string, unknown> | undefined;
  return (
    <input
      ref={ref}
      aria-label={props.accessibilityLabel as string | undefined}
      aria-required={state?.required ? true : undefined}
      aria-disabled={state?.disabled ? true : undefined}
      aria-invalid={state?.invalid ? true : undefined}
      data-editable={props.editable === false ? "false" : "true"}
      data-focusable={props.focusable === false ? "false" : undefined}
      data-bg={styleRecord?.backgroundColor as string | undefined}
      data-border={styleRecord?.borderColor as string | undefined}
      data-color={styleRecord?.color as string | undefined}
      data-labelledby={props.accessibilityLabelledBy as string | undefined}
      data-describedby={props.accessibilityDescribedBy as string | undefined}
      data-testid={props.testID as string | undefined}
      readOnly
      value={(props.value ?? props.defaultValue ?? "") as string}
    />
  );
}

function TestView({
  children,
  style,
  testID,
  ...props
}: Record<string, unknown> & { children?: React.ReactNode }): React.ReactElement {
  const styleRecord = style as Record<string, unknown> | undefined;
  return (
    <div
      id={props.nativeID as string | undefined}
      // The web-ish role prop (RN ≥0.71) wins over accessibilityRole, like RNW.
      role={(props.role ?? props.accessibilityRole) as string | undefined}
      // Surface the RN accessible opt-in (real RN needs it on plain Views).
      data-accessible={props.accessible === true ? "true" : undefined}
      data-live={props.accessibilityLiveRegion as string | undefined}
      data-gap={String(styleRecord?.gap ?? "")}
      data-padding={styleRecord?.padding == null ? undefined : String(styleRecord.padding)}
      data-bg={styleRecord?.backgroundColor as string | undefined}
      data-border={styleRecord?.borderColor as string | undefined}
      data-maxheight={styleRecord?.maxHeight == null ? undefined : String(styleRecord.maxHeight)}
      data-testid={testID as string | undefined}
      data-state={props["data-state"] as string | undefined}
      data-disabled={props["data-disabled"] as string | undefined}
      data-theme={props["data-theme"] as string | undefined}
      data-position={props["data-position"] as string | undefined}
      data-ordinal={props["data-ordinal"] as string | undefined}
      data-open={props["data-open"] as string | undefined}
      aria-label={props.accessibilityLabel as string | undefined}
      aria-multiselectable={props["aria-multiselectable"] as boolean | undefined}
    >
      {children}
    </div>
  );
}

// Host ScrollView stand-in — marks itself so tests can tell the scrollable
// menu from the plain View fallback. Exposes contentContainerStyle values and
// an RN-like scrollTo spy (React 19 delivers ref as a plain prop) so the
// Select's keyboard-follow behavior is observable.
const scrollToSpy = vi.fn();

function TestScrollView({
  children,
  style,
  contentContainerStyle,
  ref,
  ...props
}: Record<string, unknown> & {
  children?: React.ReactNode;
  ref?: React.Ref<unknown>;
}): React.ReactElement {
  React.useImperativeHandle(ref, () => ({ scrollTo: scrollToSpy }), []);
  const styleRecord = style as Record<string, unknown> | undefined;
  const contentRecord = contentContainerStyle as Record<string, unknown> | undefined;
  return (
    <div
      id={props.nativeID as string | undefined}
      role={props.role as string | undefined}
      data-scroll="true"
      data-maxheight={styleRecord?.maxHeight == null ? undefined : String(styleRecord.maxHeight)}
      data-gap={styleRecord?.gap == null ? undefined : String(styleRecord.gap)}
      data-padding={styleRecord?.padding == null ? undefined : String(styleRecord.padding)}
      data-content-direction={contentRecord?.flexDirection as string | undefined}
      data-content-gap={contentRecord?.gap == null ? undefined : String(contentRecord.gap)}
      data-content-padding={
        contentRecord?.padding == null ? undefined : String(contentRecord.padding)
      }
      aria-multiselectable={props["aria-multiselectable"] as boolean | undefined}
    >
      {children}
    </div>
  );
}
