// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  PodoNativeThemeProvider,
  adaptReactNativeTokens,
  createNativeComponents,
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
    expect(screen.getByLabelText("Email").getAttribute("data-labelledby")).toBe(
      "podo-field-control-label"
    );
    expect(screen.getByLabelText("Email").getAttribute("data-describedby")).toBe(
      "podo-field-control-error"
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
    fireEvent.click(screen.getByText("과일 선택").closest("button") as HTMLElement);
    expect(screen.getByTestId("select").getAttribute("data-open")).toBe("true");
    fireEvent.click(screen.getByText("바나나").closest("button") as HTMLElement);
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
    expect(screen.getByTestId("button").getAttribute("data-bg")).toBe("#9DB7FF");
  });
});

function TestPressable({
  children,
  onPress,
  style,
  testID,
  ...props
}: Record<string, unknown> & { children?: React.ReactNode }): React.ReactElement {
  const styleRecord = style as Record<string, unknown> | undefined;
  return (
    <button
      aria-label={props.accessibilityLabel as string | undefined}
      data-bg={styleRecord?.backgroundColor as string | undefined}
      data-testid={testID as string | undefined}
      data-size={props["data-size"] as string | undefined}
      data-state={props["data-state"] as string | undefined}
      data-theme={props["data-theme"] as string | undefined}
      disabled={Boolean(props.disabled)}
      onClick={() => {
        if (typeof onPress === "function") {
          onPress();
        }
      }}
    >
      {children}
    </button>
  );
}

function TestText({
  children,
  style,
  testID,
}: Record<string, unknown> & { children?: React.ReactNode }): React.ReactElement {
  const styleRecord = style as Record<string, unknown> | undefined;
  return (
    <span
      data-color={styleRecord?.color as string | undefined}
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
  return (
    <input
      ref={ref}
      aria-label={props.accessibilityLabel as string | undefined}
      data-bg={styleRecord?.backgroundColor as string | undefined}
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
      data-gap={String(styleRecord?.gap ?? "")}
      data-bg={styleRecord?.backgroundColor as string | undefined}
      data-testid={testID as string | undefined}
      data-state={props["data-state"] as string | undefined}
      data-theme={props["data-theme"] as string | undefined}
      data-position={props["data-position"] as string | undefined}
      data-ordinal={props["data-ordinal"] as string | undefined}
      data-open={props["data-open"] as string | undefined}
      aria-label={props.accessibilityLabel as string | undefined}
    >
      {children}
    </div>
  );
}
