import React, {
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  createButtonBehavior,
  createCheckboxBehavior,
  createFieldA11y,
  createInputBehavior,
  createRadioBehavior,
  createSwitchBehavior,
} from "@podo/core";

export type NativeHostComponent = string | React.ComponentType<Record<string, unknown>>;

export interface NativeHost {
  Pressable: NativeHostComponent;
  Text: NativeHostComponent;
  TextInput: NativeHostComponent;
  View: NativeHostComponent;
}

export interface NativeTheme {
  theme: string;
  colorScheme: "light" | "dark";
  tokens?: Record<string, unknown>;
}

export interface NativeThemeProviderProps extends NativeTheme {
  children: ReactNode;
}

export type NativeButtonTheme =
  | "solid-primary"
  | "solid-assistive"
  | "solid-white"
  | "outline-primary"
  | "outline-assistive"
  | "outline-white";

export interface NativeButtonProps {
  children: ReactNode;
  disabled?: boolean;
  theme?: NativeButtonTheme;
  size?: "xs" | "sm" | "md" | "lg";
  /** Stretch to the parent's full width (alignSelf: stretch). */
  fill?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  onPress?: () => void;
  testID?: string;
}

export interface NativeChipProps {
  children: ReactNode;
  disabled?: boolean;
  /** Background contrast (Figma: solid, outline-strong, outline-weak). */
  theme?: "solid" | "outline-strong" | "outline-weak";
  /** Label/icon scale (Figma: sm 13px, md 16px — md is base). */
  size?: "sm" | "md";
  /** Category/status icon before the label (Figma prefix-icon). */
  prefix?: ReactNode;
  /** Removal/action icon after the label, e.g. close (Figma suffix-icon). */
  suffix?: ReactNode;
  onPress?: () => void;
  testID?: string;
}

export interface NativeSwitchProps {
  /** Controlled on/off value (Figma state=on/off). */
  checked?: boolean;
  /** Track size (Figma: sm 30x18 — base, md 40x24, lg 56x32). */
  size?: "sm" | "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the track (Figma label/text). */
  label?: ReactNode;
  disabled?: boolean;
  /** Fires with the next value when the switch is toggled. */
  onCheckedChange?: (checked: boolean) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export interface NativeCheckboxProps {
  /** Controlled value (Figma state=checked/unchecked). */
  checked?: boolean;
  /** Partial-selection look for parent checkboxes (Figma state=indeterminate); announced as mixed. */
  indeterminate?: boolean;
  /** Label size only — the 18px box is fixed (Figma: md 14 — base, lg 16). */
  size?: "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the box (Figma label/text). */
  label?: ReactNode;
  disabled?: boolean;
  /** Fires with the next value when the checkbox is toggled. */
  onCheckedChange?: (checked: boolean) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export interface NativeRadioProps {
  /** Controlled value (Figma checked). Group exclusivity is the consumer's. */
  checked?: boolean;
  /** Label size only — the 18px circle is fixed (Figma: md 14 — base, lg 16). */
  size?: "md" | "lg";
  /** SemiBold label for emphasized items (Figma bold). */
  bold?: boolean;
  /** Visible label next to the circle (Figma label/text). */
  label?: ReactNode;
  disabled?: boolean;
  /** Fires with true when the radio is selected. */
  onCheckedChange?: (checked: boolean) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export interface NativeInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Native TextInput maxLength; Field injects its countMax here. */
  maxLength?: number;
  /** Value is visible but not editable; renders without the box (Figma read-only). */
  readOnly?: boolean;
  /** Control height and radius (Figma: md 42, lg 52). */
  size?: "md" | "lg";
  /** Icon or symbol giving the value context, before the control (Figma prefix). */
  prefix?: ReactNode;
  /** Fixed unit/domain text after the control, e.g. 원, kg (Figma suffix-text). */
  suffixText?: ReactNode;
  /** In-input action icon: clear, search, visibility toggle (Figma suffix-icon). */
  suffixIcon?: ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
  accessibilityLabel?: string;
  accessibilityLabelledBy?: string;
  accessibilityDescribedBy?: string;
  accessibilityState?: Record<string, unknown>;
  testID?: string;
}

export interface NativeTextareaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  /** Native TextInput maxLength; Field injects its countMax here. */
  maxLength?: number;
  /** Number of visible lines the box reserves (default 3). */
  numberOfLines?: number;
  /** Value is visible but not editable; renders without the box (Figma read-only). */
  readOnly?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  onValueChange?: (value: string) => void;
  accessibilityLabel?: string;
  accessibilityLabelledBy?: string;
  accessibilityDescribedBy?: string;
  accessibilityState?: Record<string, unknown>;
  testID?: string;
}

export interface NativeFieldProps {
  children: ReactNode;
  label: ReactNode;
  /** Supplementary text next to the label (Figma sub-label). */
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
  id?: string;
  testID?: string;
}

export interface NativeIconProps {
  name: string;
  glyph?: string;
  testID?: string;
}

export interface NativeToastProps {
  children: ReactNode;
  /** 상황의 성격에 따른 색·톤 (Figma state). */
  state?: "normal" | "success" | "danger" | "info" | "warning";
  /** State icon before the title (Figma prefix-icon). */
  prefix?: ReactNode;
  /** Follow-up action text, e.g. 실행 취소 (Figma suffix-text). */
  suffixText?: ReactNode;
  /** Extra line under the title (Figma caption). */
  caption?: ReactNode;
  /** Renders the close X and fires when it's pressed. */
  onClose?: () => void;
  testID?: string;
}

export interface NativeComponents {
  Button: (props: NativeButtonProps) => React.ReactElement;
  Checkbox: (props: NativeCheckboxProps) => React.ReactElement;
  Radio: (props: NativeRadioProps) => React.ReactElement;
  Chip: (props: NativeChipProps) => React.ReactElement;
  Input: (props: NativeInputProps) => React.ReactElement;
  Textarea: (props: NativeTextareaProps) => React.ReactElement;
  Field: (props: NativeFieldProps) => React.ReactElement;
  Icon: (props: NativeIconProps) => React.ReactElement;
  Switch: (props: NativeSwitchProps) => React.ReactElement;
  Toast: (props: NativeToastProps) => React.ReactElement;
}

export type NativeStyle = Record<string, string | number | undefined>;

export const defaultNativeHost: NativeHost = {
  Pressable: "Pressable",
  Text: "Text",
  TextInput: "TextInput",
  View: "View",
};

const NativeThemeContext = createContext<NativeTheme>({
  theme: "landing",
  colorScheme: "light",
});

export function PodoNativeThemeProvider({
  theme,
  colorScheme,
  tokens,
  children,
}: NativeThemeProviderProps): React.ReactElement {
  const value =
    typeof tokens === "undefined" ? { theme, colorScheme } : { theme, colorScheme, tokens };

  return <NativeThemeContext.Provider value={value}>{children}</NativeThemeContext.Provider>;
}

export function usePodoNativeTheme(): NativeTheme {
  return useContext(NativeThemeContext);
}

export function adaptReactNativeTokens(value: unknown): unknown {
  if (typeof value === "string") {
    const px = value.match(/^(-?(?:\d+|\d*\.\d+))px$/);
    if (px?.[1]) {
      return Number(px[1]);
    }

    const rem = value.match(/^(-?(?:\d+|\d*\.\d+))rem$/);
    if (rem?.[1]) {
      return Number(rem[1]) * 16;
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.map(adaptReactNativeTokens);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, adaptReactNativeTokens(child)])
    );
  }

  return value;
}

export function createNativeComponents(host: NativeHost = defaultNativeHost): NativeComponents {
  return {
    Button: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const behavior = createButtonBehavior({ disabled: props.disabled });
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: !behavior.pressable },
          disabled: !behavior.pressable,
          onPress: behavior.pressable ? props.onPress : undefined,
          style: {
            ...styles.button,
            ...(props.fill ? { alignSelf: "stretch" } : {}),
            opacity: behavior.pressable ? 1 : 0.56,
          },
          testID: props.testID,
          "data-theme": props.theme ?? "solid-primary",
          "data-size": props.size ?? "md",
        },
        props.prefix,
        createElement(host.Text, { style: styles.buttonLabel }, props.children),
        props.suffix
      );
    },
    Chip: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const behavior = createButtonBehavior({ disabled: props.disabled });
      const themeName = props.theme ?? "solid";
      const size = props.size ?? "md";
      // Figma outline-strong currently renders identically to solid; mirrored
      // as-is pending a design fix.
      const themed =
        themeName === "outline-weak"
          ? { ...styles.chip, ...styles.chipOutlineWeak }
          : props.disabled
            ? { ...styles.chip, ...styles.chipDisabled }
            : styles.chip;
      const labelColor =
        themeName === "outline-weak" ? "#18181B" : props.disabled ? "#9FA2AD" : "#FFFFFF";
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: !behavior.pressable },
          disabled: !behavior.pressable,
          onPress: behavior.pressable ? props.onPress : undefined,
          style: themed,
          testID: props.testID,
          "data-theme": themeName,
          "data-size": size,
        },
        props.prefix,
        createElement(
          host.Text,
          { style: { ...styles.chipLabel, color: labelColor, fontSize: size === "sm" ? 13 : 16 } },
          props.children
        ),
        props.suffix
      );
    },
    Input: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const behavior = createInputBehavior({
        value: props.value,
        defaultValue: props.defaultValue,
        disabled: props.disabled,
        invalid: props.invalid,
        required: props.required,
      });
      // Root wrapper carries the box style so prefix/suffix content can live
      // inside the input (Figma 538:6693); the TextInput keeps the a11y wiring.
      const control = createElement(host.TextInput, {
        accessibilityLabel: props.accessibilityLabel,
        accessibilityLabelledBy: props.accessibilityLabelledBy,
        accessibilityDescribedBy: props.accessibilityDescribedBy,
        accessibilityState: {
          ...props.accessibilityState,
          disabled: behavior.disabled,
          invalid: behavior.invalid || Boolean(props.accessibilityState?.invalid),
        },
        editable: !behavior.disabled && !props.readOnly,
        defaultValue: props.defaultValue,
        value: props.value,
        placeholder: props.placeholder,
        maxLength: props.maxLength,
        onChangeText: props.onValueChange,
        style: styles.inputControl,
        testID: props.testID,
      });
      return createElement(
        host.View,
        {
          style: {
            ...styles.input,
            ...(props.size === "lg" ? styles.inputLg : {}),
            // Figma read-only: value only, no box.
            ...(props.readOnly
              ? {
                  backgroundColor: "transparent",
                  borderColor: "transparent",
                  paddingLeft: 0,
                  paddingRight: 0,
                }
              : {}),
          },
        },
        props.prefix ? createElement(host.View, { style: styles.inputAffix }, props.prefix) : null,
        control,
        props.suffixText
          ? createElement(host.Text, { style: styles.inputSuffixText }, props.suffixText)
          : null,
        props.suffixIcon
          ? createElement(host.View, { style: styles.inputAffix }, props.suffixIcon)
          : null
      );
    },
    Textarea: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const behavior = createInputBehavior({
        value: props.value,
        defaultValue: props.defaultValue,
        disabled: props.disabled,
        invalid: props.invalid,
        required: props.required,
      });
      return createElement(host.TextInput, {
        accessibilityLabel: props.accessibilityLabel,
        accessibilityLabelledBy: props.accessibilityLabelledBy,
        accessibilityDescribedBy: props.accessibilityDescribedBy,
        accessibilityState: {
          ...props.accessibilityState,
          disabled: behavior.disabled,
          invalid: behavior.invalid || Boolean(props.accessibilityState?.invalid),
        },
        editable: !behavior.disabled && !props.readOnly,
        defaultValue: props.defaultValue,
        value: props.value,
        placeholder: props.placeholder,
        maxLength: props.maxLength,
        multiline: true,
        numberOfLines: props.numberOfLines ?? 3,
        onChangeText: props.onValueChange,
        style: {
          ...styles.textarea,
          // Figma read-only: value only, no box (vertical padding kept).
          ...(props.readOnly
            ? {
                backgroundColor: "transparent",
                borderColor: "transparent",
                paddingLeft: 0,
                paddingRight: 0,
              }
            : {}),
        },
        testID: props.testID,
      });
    },
    Field: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      // The footer shows a single guidance line (Figma 538:6691): the error
      // wins over the helper text, matching the web/react/hono renderers.
      const showError = Boolean(props.error);
      const showHelper = Boolean(props.helperText) && !showError;
      // Without an explicit count prop the field tracks the wired control's
      // text length itself (mirrors the react/web renderers).
      const [autoCount, setAutoCount] = useState(() => initialNativeControlLength(props.children));
      const trackCount = props.countMax != null && props.count == null;
      const shownCount = props.count ?? autoCount;
      const a11y = createFieldA11y({
        id: props.id,
        invalid: props.invalid,
        required: props.required,
        hasDescription: showHelper,
        hasError: showError,
      });
      return createElement(
        host.View,
        {
          accessibilityState: { disabled: Boolean(props.disabled) },
          style: styles.field,
          testID: props.testID,
        },
        createElement(
          host.View,
          { style: styles.fieldHeading },
          createElement(
            host.Text,
            { nativeID: a11y.ids.labelId, style: styles.label },
            props.label
          ),
          props.required
            ? createElement(
                host.Text,
                { accessibilityElementsHidden: true, style: styles.fieldRequirement },
                "*"
              )
            : null,
          props.subLabel
            ? createElement(host.Text, { style: styles.fieldSubLabel }, props.subLabel)
            : null,
          props.suffixIcon
            ? createElement(host.View, { style: styles.fieldSuffixIcon }, props.suffixIcon)
            : null
        ),
        wireNativeControl(
          props.children,
          a11y,
          trackCount ? (value) => setAutoCount(value.length) : undefined,
          // countMax also caps the control via the platform-native maxLength.
          props.countMax
        ),
        showError || showHelper || props.countMax != null
          ? createElement(
              host.View,
              { style: styles.fieldFooter },
              showError
                ? createElement(
                    host.Text,
                    { nativeID: a11y.ids.errorId, style: styles.error },
                    props.error
                  )
                : null,
              showHelper
                ? createElement(
                    host.Text,
                    { nativeID: a11y.ids.descriptionId, style: styles.fieldHelperText },
                    props.helperText
                  )
                : null,
              props.countMax != null
                ? createElement(
                    host.Text,
                    { style: styles.fieldCount },
                    `${shownCount}/${props.countMax}`
                  )
                : null
            )
          : null
      );
    },
    Icon: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      return createElement(
        host.Text,
        { accessibilityElementsHidden: true, style: styles.icon, testID: props.testID },
        props.glyph ?? props.name
      );
    },
    Switch: (props) => {
      const behavior = createSwitchBehavior({ checked: props.checked, disabled: props.disabled });
      // Figma 566:12693 geometry per size: track w/h, handle diameter, edge pad.
      const metrics =
        props.size === "md"
          ? { w: 40, h: 24, handle: 20, pad: 2 }
          : props.size === "lg"
            ? { w: 56, h: 32, handle: 25, pad: 4 }
            : { w: 30, h: 18, handle: 14, pad: 2 };
      const track = behavior.disabled ? "#E4E4E7" : behavior.checked ? "#426CED" : "#D1D2D6";
      const handle = behavior.disabled ? "#D1D2D6" : "#FFFFFF";
      // The pressable row includes the optional label (track + 6px gap + 14px text).
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "switch",
          accessibilityState: { checked: behavior.checked, disabled: behavior.disabled },
          accessibilityLabel: props.accessibilityLabel,
          disabled: !behavior.pressable,
          onPress: behavior.pressable
            ? () => props.onCheckedChange?.(!behavior.checked)
            : undefined,
          style: { alignItems: "center", flexDirection: "row", gap: 6 },
          testID: props.testID,
          "data-state": behavior.checked ? "on" : "off",
          "data-size": props.size ?? "sm",
        },
        createElement(
          host.View,
          {
            style: {
              backgroundColor: track,
              borderRadius: 9999,
              height: metrics.h,
              justifyContent: "center",
              width: metrics.w,
            },
          },
          createElement(host.View, {
            style: {
              backgroundColor: handle,
              borderRadius: 9999,
              height: metrics.handle,
              marginLeft: behavior.checked ? metrics.w - metrics.handle - metrics.pad : metrics.pad,
              width: metrics.handle,
            },
          })
        ),
        props.label
          ? createElement(
              host.Text,
              {
                style: {
                  color: behavior.disabled ? "#9FA2AD" : "#50555E",
                  // Figma: label size follows the track size (sm 14/md 16/lg 18).
                  fontSize: props.size === "md" ? 16 : props.size === "lg" ? 18 : 14,
                  fontWeight: props.bold ? "600" : undefined,
                },
              },
              props.label
            )
          : null
      );
    },
    Checkbox: (props) => {
      const behavior = createCheckboxBehavior({
        checked: props.checked,
        indeterminate: props.indeterminate,
        disabled: props.disabled,
      });
      // Figma 328:18039 colors; the box stays 18x18 radius 4 for every size.
      const solid = behavior.checked && !behavior.indeterminate;
      const box = behavior.disabled
        ? { fill: "#E4E4E7", border: solid ? undefined : "#D1D2D6", mark: "#9FA2AD" }
        : solid
          ? { fill: "#426CED", border: undefined, mark: "#F9F9F9" }
          : { fill: "#FFFFFF", border: "#9FA2AD", mark: "#27272A" };
      const mark = behavior.indeterminate ? "–" : behavior.checked ? "✓" : null;
      // The pressable row includes the optional label (box + 6px gap + text).
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "checkbox",
          accessibilityState: {
            checked: behavior.indeterminate ? "mixed" : behavior.checked,
            disabled: behavior.disabled,
          },
          accessibilityLabel: props.accessibilityLabel,
          disabled: !behavior.pressable,
          onPress: behavior.pressable
            ? () => props.onCheckedChange?.(!behavior.checked)
            : undefined,
          style: { alignItems: "center", flexDirection: "row", gap: 6 },
          testID: props.testID,
          "data-state": behavior.dataState["data-state"],
          "data-size": props.size ?? "md",
        },
        createElement(
          host.View,
          {
            style: {
              alignItems: "center",
              backgroundColor: box.fill,
              borderColor: box.border,
              borderRadius: 4,
              borderWidth: box.border ? 1 : 0,
              height: 18,
              justifyContent: "center",
              width: 18,
            },
          },
          mark
            ? createElement(
                host.Text,
                { style: { color: box.mark, fontSize: 12, fontWeight: "700", lineHeight: 14 } },
                mark
              )
            : null
        ),
        props.label
          ? createElement(
              host.Text,
              {
                style: {
                  color: behavior.disabled ? "#9FA2AD" : "#50555E",
                  // Figma: label size follows the size variant (md 14/lg 16).
                  fontSize: props.size === "lg" ? 16 : 14,
                  fontWeight: props.bold ? "600" : undefined,
                },
              },
              props.label
            )
          : null
      );
    },
    Toast: (props) => {
      // Figma 459:1298 per-state tinted fill + border; the toaster stack is a
      // web affordance — apps place the card in their own overlay.
      const palette = {
        success: { fill: "#ECF8EF", border: "#3EA856" },
        danger: { fill: "#FEF1F1", border: "#F23B3B" },
        info: { fill: "#EBF5FF", border: "#0095FF" },
        warning: { fill: "#FFF7E6", border: "#FFAA00" },
        normal: { fill: "#F4F4F5", border: "#D1D2D6" },
      }[props.state ?? "normal"];
      return createElement(
        host.View,
        {
          accessibilityRole: "alert",
          style: {
            alignItems: "flex-start",
            backgroundColor: palette.fill,
            borderColor: palette.border,
            borderRadius: 10,
            borderWidth: 1,
            flexDirection: "row",
            gap: 8,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 12,
          },
          testID: props.testID,
          "data-state": props.state ?? "normal",
        },
        props.prefix ?? null,
        createElement(
          host.View,
          { style: { flex: 1, gap: 4 } },
          createElement(
            host.View,
            { style: { alignItems: "center", flexDirection: "row", gap: 4 } },
            createElement(
              host.Text,
              { style: { color: "#18181B", flex: 1, fontSize: 16, fontWeight: "600" } },
              props.children
            ),
            props.suffixText
              ? createElement(
                  host.Text,
                  { style: { color: "#18181B", fontSize: 16 } },
                  props.suffixText
                )
              : null,
            props.onClose
              ? createElement(
                  host.Pressable,
                  {
                    accessibilityRole: "button",
                    accessibilityLabel: "닫기",
                    onPress: props.onClose,
                    style: {
                      alignItems: "center",
                      height: 24,
                      justifyContent: "center",
                      width: 24,
                    },
                  },
                  createElement(host.Text, { style: { color: "#18181B", fontSize: 16 } }, "✕")
                )
              : null
          ),
          props.caption
            ? createElement(host.Text, { style: { color: "#18181B", fontSize: 14 } }, props.caption)
            : null
        )
      );
    },
    Radio: (props) => {
      const behavior = createRadioBehavior({ checked: props.checked, disabled: props.disabled });
      // Figma 379:3350 colors; the circle stays 18x18 for every size and the
      // white 8px dot survives disabled.
      const circle = behavior.disabled
        ? { fill: "#E4E4E7", border: behavior.checked ? undefined : "#D1D2D6" }
        : behavior.checked
          ? { fill: "#426CED", border: undefined }
          : { fill: "transparent", border: "#9FA2AD" };
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "radio",
          accessibilityState: { checked: behavior.checked, disabled: behavior.disabled },
          accessibilityLabel: props.accessibilityLabel,
          disabled: !behavior.pressable,
          // Radios select — they never untoggle themselves.
          onPress: behavior.pressable ? () => props.onCheckedChange?.(true) : undefined,
          style: { alignItems: "center", flexDirection: "row", gap: 6 },
          testID: props.testID,
          "data-state": behavior.dataState["data-state"],
          "data-size": props.size ?? "md",
        },
        createElement(
          host.View,
          {
            style: {
              alignItems: "center",
              backgroundColor: circle.fill,
              borderColor: circle.border,
              borderRadius: 9999,
              borderWidth: circle.border ? 1 : 0,
              height: 18,
              justifyContent: "center",
              width: 18,
            },
          },
          behavior.checked
            ? createElement(host.View, {
                style: {
                  backgroundColor: "#FFFFFF",
                  borderRadius: 9999,
                  height: 8,
                  width: 8,
                },
              })
            : null
        ),
        props.label
          ? createElement(
              host.Text,
              {
                style: {
                  color: behavior.disabled ? "#9FA2AD" : "#50555E",
                  // Figma: label size follows the size variant (md 14/lg 16).
                  fontSize: props.size === "lg" ? 16 : 14,
                  fontWeight: props.bold ? "600" : undefined,
                },
              },
              props.label
            )
          : null
      );
    },
  };
}

export const { Button, Checkbox, Radio, Chip, Input, Textarea, Field, Icon, Switch, Toast } =
  createNativeComponents();

function wireNativeControl(
  children: ReactNode,
  a11y: ReturnType<typeof createFieldA11y>,
  onControlText?: (value: string) => void,
  maxLength?: number
): ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) {
      return child;
    }

    return cloneElement(child, {
      accessibilityLabelledBy: a11y.ids.labelId,
      accessibilityDescribedBy: a11y.control["aria-describedby"] as string | undefined,
      accessibilityState: {
        ...(child.props.accessibilityState as Record<string, unknown> | undefined),
        invalid: a11y.control["aria-invalid"] === "true",
        required: a11y.control["aria-required"] === "true",
      },
      ...(maxLength != null ? { maxLength } : {}),
      ...(onControlText
        ? {
            onValueChange: (value: string) => {
              (child.props.onValueChange as ((v: string) => void) | undefined)?.(value);
              onControlText(value);
            },
          }
        : {}),
    });
  });
}

/** Initial character count read from the control's value/defaultValue. */
function initialNativeControlLength(children: ReactNode): number {
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

function createNativeThemeStyles(
  theme: NativeTheme
): Record<
  | "button"
  | "buttonLabel"
  | "chip"
  | "chipDisabled"
  | "chipLabel"
  | "chipOutlineWeak"
  | "error"
  | "field"
  | "fieldCount"
  | "fieldFooter"
  | "fieldHeading"
  | "fieldHelperText"
  | "fieldRequirement"
  | "fieldSubLabel"
  | "fieldSuffixIcon"
  | "icon"
  | "input"
  | "inputAffix"
  | "inputControl"
  | "inputLg"
  | "inputSuffixText"
  | "label"
  | "textarea",
  NativeStyle
> {
  const tokens = adaptReactNativeTokens(theme.tokens);
  const textColor = stringToken(tokens, ["color", "text"]) ?? defaultNativeTextColor(theme);
  const backgroundColor =
    stringToken(tokens, ["color", "background"]) ?? defaultNativeBackgroundColor(theme);
  const dangerColor = stringToken(tokens, ["color", "danger"]) ?? "#F23B3B";
  const mutedColor = "#9FA2AD";
  const gap = numberToken(tokens, ["spacing", "controlGap"]) ?? 6;
  // Figma border/gary #E4E4E7 (gray.20) for light; dark keeps a visible gray.
  const borderColor = theme.colorScheme === "dark" ? "#3E424B" : "#E4E4E7";
  const accentColor = theme.colorScheme === "dark" ? "#9DB7FF" : "#305CDE";

  return {
    field: { gap, padding: gap },
    fieldHeading: { alignItems: "center", flexDirection: "row", gap: 2 },
    label: { color: textColor, fontSize: 14, fontWeight: "600" },
    fieldRequirement: { color: dangerColor, fontSize: 13, fontWeight: "600" },
    fieldSubLabel: { color: mutedColor, fontSize: 13 },
    fieldSuffixIcon: { alignItems: "center", height: 20, justifyContent: "center", width: 20 },
    fieldFooter: { alignItems: "center", flexDirection: "row", gap: 2 },
    fieldHelperText: { color: mutedColor, flex: 1, fontSize: 14 },
    fieldCount: { color: mutedColor, fontSize: 14, marginLeft: "auto" },
    error: { color: dangerColor, flex: 1, fontSize: 14 },
    // Figma 538:6693: md 42/radius 10, lg 52/radius 12, pl 16 / pr 10, gap 6.
    input: {
      alignItems: "center",
      backgroundColor,
      borderColor,
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      minHeight: 42,
      paddingLeft: 16,
      paddingRight: 10,
    },
    inputLg: { borderRadius: 12, minHeight: 52 },
    inputControl: { color: textColor, flex: 1, fontSize: 16, padding: 0 },
    // Figma 380:3867: multi-line box, 16/12 padding, radius 10.
    textarea: {
      backgroundColor,
      borderColor,
      borderRadius: 10,
      borderWidth: 1,
      color: textColor,
      fontSize: 16,
      minHeight: 78,
      paddingHorizontal: 16,
      paddingVertical: 12,
      textAlignVertical: "top",
    },
    inputAffix: { alignItems: "center", height: 24, justifyContent: "center", width: 24 },
    inputSuffixText: { color: "#50555E", fontSize: 16 },
    button: {
      alignItems: "center",
      backgroundColor: accentColor,
      borderRadius: 8,
      flexDirection: "row",
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    buttonLabel: { color: theme.colorScheme === "dark" ? "#101828" : "#FFFFFF", fontWeight: "600" },
    // Chip (Figma 538:6615): pill, gap 4, padding 2/8, min-width 55.
    chip: {
      alignItems: "center",
      backgroundColor: "#3E424B",
      borderColor: "transparent",
      borderRadius: 9999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      justifyContent: "center",
      minWidth: 55,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    chipOutlineWeak: { backgroundColor: "#F9F9F9", borderColor: "#767985" },
    chipDisabled: { backgroundColor: "#E4E4E7" },
    chipLabel: { color: "#FFFFFF" },
    icon: { color: textColor },
  };
}

function defaultNativeTextColor(theme: NativeTheme): string {
  return theme.colorScheme === "dark" ? "#F8FAFC" : "#111827";
}

function defaultNativeBackgroundColor(theme: NativeTheme): string {
  return theme.colorScheme === "dark" ? "#101828" : "#FFFFFF";
}

function stringToken(root: unknown, path: string[]): string | undefined {
  const value = nestedToken(root, path);
  return typeof value === "string" ? value : undefined;
}

function numberToken(root: unknown, path: string[]): number | undefined {
  const value = nestedToken(root, path);
  return typeof value === "number" ? value : undefined;
}

function nestedToken(root: unknown, path: string[]): unknown {
  let current = root;
  for (const segment of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
