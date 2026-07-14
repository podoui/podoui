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
  | "solid-danger"
  | "outline-primary"
  | "outline-assistive"
  | "outline-white"
  | "outline-danger";

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
  /** Controlled 선택 값 (Figma state) — 비선택이 기본 모습이에요. */
  selected?: boolean;
  disabled?: boolean;
  /** Background contrast (Figma: solid, outline-strong, outline-weak). */
  theme?: "solid" | "outline-strong" | "outline-weak";
  /** Label/icon scale (Figma: md 14px — base, lg 16px). */
  size?: "md" | "lg";
  /** Category/status icon before the label (Figma prefix-icon). */
  prefix?: ReactNode;
  /** Removal/action icon after the label, e.g. close (Figma suffix-icon). */
  suffix?: ReactNode;
  onPress?: () => void;
  /** Fires with the next value when the chip is toggled. */
  onSelectedChange?: (selected: boolean) => void;
  /**
   * 제거형 칩 — 지정하면 선택된 모습으로 고정되고 X 버튼이 붙어요.
   * 토글 대신 X 프레스가 이 콜백을 불러요.
   */
  onRemove?: () => void;
  /** 제거 버튼의 접근성 이름 (기본 "제거"). */
  removeLabel?: string;
  testID?: string;
}

export interface NativeBadgeProps {
  /** Count or short status text. Ignored when dot is set. */
  children?: ReactNode;
  /**
   * 상태·의미 색상 (Figma theme) — natural이 base. natural~info는 진한 배경의
   * 시스템 상태, gray~orange는 연한 배경의 색상 표기예요.
   */
  theme?:
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
  /** 숫자·텍스트 없이 6px 점만 표시 (Figma dot). */
  dot?: boolean;
  /** dot처럼 텍스트가 없을 때 의미를 이름으로 제공해요. */
  accessibilityLabel?: string;
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
  /** 안쪽 TextInput에 그대로 연결되는 ref — focus() 같은 imperative 호출용. */
  inputRef?: React.Ref<unknown>;
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
  /** 안쪽 TextInput에 그대로 연결되는 ref — focus() 같은 imperative 호출용. */
  inputRef?: React.Ref<unknown>;
  accessibilityLabel?: string;
  accessibilityLabelledBy?: string;
  accessibilityDescribedBy?: string;
  accessibilityState?: Record<string, unknown>;
  testID?: string;
}

export interface NativeSelectOption {
  value: string;
  label: string;
}

export interface NativeSelectProps {
  /** 메뉴 항목 목록 — 셀 마크업은 컴포넌트가 그려요. */
  options: NativeSelectOption[];
  /** 값이 없을 때 트리거에 표시 (Figma 플레이스 홀더). */
  placeholder?: string;
  /** Trigger height and radius (Figma: md 42 — base, lg 52). */
  size?: "md" | "lg";
  /** 다중 선택 (Figma theme=slot) — 칩 나열 + 체크박스 셀. */
  multiple?: boolean;
  /** Controlled 단일 값. */
  value?: string | null;
  /** Controlled 다중 값. */
  values?: string[];
  /** 단일 값이 선택될 때. */
  onValueChange?: (value: string) => void;
  /** 다중 값이 토글될 때 다음 배열과 함께. */
  onValuesChange?: (values: string[]) => void;
  /** 트리거에 보여줄 최대 칩 수 — 넘치는 값은 "+N"으로 축약돼요. */
  maxChips?: number;
  invalid?: boolean;
  disabled?: boolean;
  /** 값 앞에 붙는 아이콘 (Figma prefix-icon). */
  prefix?: ReactNode;
  accessibilityLabel?: string;
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

export interface NativeTooltipProps {
  /** 말풍선 내용 (Figma label). */
  label: ReactNode;
  /** 대상 기준 표시 방향 — 화살표가 대상을 가리켜요 (Figma position). */
  position?: "right" | "left" | "bottom" | "top";
  /** 화살표가 말풍선의 시작/가운데/끝 어디에 붙는지 (Figma ordinal). */
  ordinal?: "first" | "second" | "third";
  /** 밝은 배경(default) 또는 어두운 배경(reverse) (Figma theme). */
  theme?: "default" | "reverse";
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
  Badge: (props: NativeBadgeProps) => React.ReactElement;
  Select: (props: NativeSelectProps) => React.ReactElement;
  Input: (props: NativeInputProps) => React.ReactElement;
  Textarea: (props: NativeTextareaProps) => React.ReactElement;
  Field: (props: NativeFieldProps) => React.ReactElement;
  Icon: (props: NativeIconProps) => React.ReactElement;
  Switch: (props: NativeSwitchProps) => React.ReactElement;
  Toast: (props: NativeToastProps) => React.ReactElement;
  Tooltip: (props: NativeTooltipProps) => React.ReactElement;
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

// Badge (Figma 474:3218) colors — natural~info strong fills, gray~orange soft
// labels. The red dot mirrors the Figma accent.50 pick (#F15764), which differs
// from the label's error.50 — pending a design check.
const BADGE_COLORS: Record<
  NonNullable<NativeBadgeProps["theme"]>,
  { fill: string; label: string; dot: string }
> = {
  natural: { fill: "#3E424B", label: "#F9F9F9", dot: "#3E424B" },
  danger: { fill: "#F23B3B", label: "#F9F9F9", dot: "#F23B3B" },
  success: { fill: "#3EA856", label: "#F9F9F9", dot: "#3EA856" },
  warning: { fill: "#FFAA00", label: "#F9F9F9", dot: "#FFAA00" },
  info: { fill: "#0095FF", label: "#F9F9F9", dot: "#0095FF" },
  gray: { fill: "#F4F4F5", label: "#18181B", dot: "#3E424B" },
  red: { fill: "#FEF1F1", label: "#F23B3B", dot: "#F15764" },
  green: { fill: "#ECF8EF", label: "#3EA856", dot: "#3EA856" },
  yellow: { fill: "#FFF7E6", label: "#FFAA00", dot: "#FFAA00" },
  blue: { fill: "#EBF5FF", label: "#0095FF", dot: "#0095FF" },
  purple: { fill: "#F8F5FF", label: "#8E51FF", dot: "#8E51FF" },
  orange: { fill: "#FFF4F0", label: "#FF6A33", dot: "#FF6A33" },
};

export function createNativeComponents(host: NativeHost = defaultNativeHost): NativeComponents {
  const components: NativeComponents = {
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
      const selected = props.selected === true;
      if (props.onRemove) {
        // Removable chip: born in the selected look, no toggle — the X is the
        // only control, so the root is a plain View.
        const box =
          themeName === "outline-weak"
            ? { fill: "#F9F9F9", border: "#767985", label: "#18181B" }
            : { fill: "#3E424B", border: "transparent", label: "#FFFFFF" };
        return createElement(
          host.View,
          {
            style: {
              ...styles.chip,
              backgroundColor: box.fill,
              borderColor: box.border,
            },
            testID: props.testID,
            "data-theme": themeName,
            "data-size": size,
            "data-state": "selected",
          },
          props.prefix,
          createElement(
            host.Text,
            {
              style: {
                ...styles.chipLabel,
                color: box.label,
                fontSize: size === "lg" ? 16 : 14,
              },
            },
            props.children
          ),
          createElement(
            host.Pressable,
            {
              accessibilityRole: "button",
              accessibilityLabel: props.removeLabel ?? "제거",
              onPress: props.onRemove,
            },
            createElement(host.Text, { style: { color: box.label, fontSize: 14 } }, "✕")
          )
        );
      }
      // Figma 538:6615 selection colors — unselected is the base look.
      // outline-strong selected renders identically to solid (pending fix).
      const box = props.disabled
        ? { fill: "#E4E4E7", border: "transparent", label: "#9FA2AD" }
        : selected
          ? themeName === "outline-weak"
            ? { fill: "#F9F9F9", border: "#767985", label: "#18181B" }
            : { fill: "#3E424B", border: "transparent", label: "#FFFFFF" }
          : themeName === "solid"
            ? { fill: "#F4F4F5", border: "transparent", label: "#18181B" }
            : { fill: "transparent", border: "#E4E4E7", label: "#18181B" };
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: !behavior.pressable, selected },
          disabled: !behavior.pressable,
          // Chips toggle: pressing reports the next selected value.
          onPress: behavior.pressable
            ? () => {
                props.onSelectedChange?.(!selected);
                props.onPress?.();
              }
            : undefined,
          style: {
            ...styles.chip,
            backgroundColor: box.fill,
            borderColor: box.border,
          },
          testID: props.testID,
          "data-theme": themeName,
          "data-size": size,
          "data-state": selected ? "selected" : undefined,
        },
        props.prefix,
        createElement(
          host.Text,
          { style: { ...styles.chipLabel, color: box.label, fontSize: size === "lg" ? 16 : 14 } },
          props.children
        ),
        props.suffix
      );
    },
    Badge: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const themeName = props.theme ?? "natural";
      const box = BADGE_COLORS[themeName];
      if (props.dot) {
        return createElement(host.View, {
          accessibilityLabel: props.accessibilityLabel,
          style: { backgroundColor: box.dot, borderRadius: 3, height: 6, width: 6 },
          testID: props.testID,
          "data-theme": themeName,
          "data-dot": "true",
        });
      }
      return createElement(
        host.View,
        {
          accessibilityLabel: props.accessibilityLabel,
          style: { ...styles.badge, backgroundColor: box.fill },
          testID: props.testID,
          "data-theme": themeName,
        },
        createElement(
          host.Text,
          { style: { ...styles.badgeLabel, color: box.label } },
          props.children
        )
      );
    },
    // Select (Figma 318:2237): trigger + inline menu below (no overlay portal
    // on native). Controlled values only; open state is internal.
    Select: function NativeSelect(props) {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const [open, setOpen] = useState(false);
      const multiple = props.multiple === true;
      const disabled = props.disabled === true;
      const selectedValues = props.values ?? [];
      const selected = props.options.find((o) => o.value === props.value);
      const hasValue = multiple ? selectedValues.length > 0 : Boolean(selected);
      const border = disabled
        ? { color: "#D1D2D6", width: 1 }
        : open
          ? { color: props.invalid ? "#F23B3B" : "#426CED", width: 2 }
          : props.invalid
            ? { color: "#F23B3B", width: 1 }
            : { color: "#E4E4E7", width: 1 };

      const pick = (optionValue: string) => {
        if (multiple) {
          const next = selectedValues.includes(optionValue)
            ? selectedValues.filter((v) => v !== optionValue)
            : [...selectedValues, optionValue];
          props.onValuesChange?.(next);
        } else {
          props.onValueChange?.(optionValue);
          setOpen(false);
        }
      };

      // 선택 값 칩은 Chip 컴포넌트의 제거형 모드를 그대로 재사용하고,
      // maxChips를 넘는 값은 "+N"으로 축약해요 (해제는 메뉴에서).
      const maxChips = props.maxChips ?? 3;
      const hiddenChipCount = Math.max(0, selectedValues.length - maxChips);
      const chips: ReactNode[] = selectedValues.slice(0, maxChips).map((v) => {
        const label = props.options.find((o) => o.value === v)?.label ?? v;
        return createElement(components.Chip, {
          key: v,
          children: label,
          removeLabel: `${label} 제거`,
          onRemove: () => pick(v),
        });
      });
      if (hiddenChipCount > 0) {
        chips.push(
          createElement(
            host.Text,
            {
              key: "podo-select-more",
              accessibilityLabel: `외 ${hiddenChipCount}개 선택됨`,
              style: { color: "#50555E", fontSize: 14, lineHeight: 22 },
            },
            `+${hiddenChipCount}`
          )
        );
      }

      const valueContent =
        multiple && hasValue
          ? chips
          : [
              createElement(
                host.Text,
                {
                  key: "value",
                  style: {
                    color: disabled ? "#9FA2AD" : hasValue ? "#18181B" : "#9FA2AD",
                    flex: 1,
                    fontSize: 16,
                    lineHeight: 26,
                  },
                },
                (multiple ? props.placeholder : (selected?.label ?? props.placeholder)) ?? ""
              ),
            ];

      const cells = props.options.map((option) => {
        const isSelected = multiple
          ? selectedValues.includes(option.value)
          : option.value === props.value;
        return createElement(
          host.Pressable,
          {
            key: option.value,
            accessibilityRole: "button",
            accessibilityState: { selected: isSelected },
            onPress: () => pick(option.value),
            style: styles.selectCell,
            "data-state": isSelected ? "selected" : undefined,
          },
          multiple
            ? createElement(
                host.View,
                {
                  style: {
                    alignItems: "center",
                    backgroundColor: isSelected ? "#426CED" : "#FFFFFF",
                    borderColor: isSelected ? "#426CED" : "#9FA2AD",
                    borderRadius: 4,
                    borderWidth: 1,
                    height: 18,
                    justifyContent: "center",
                    width: 18,
                  },
                },
                isSelected
                  ? createElement(host.Text, { style: { color: "#F9F9F9", fontSize: 12 } }, "✓")
                  : null
              )
            : null,
          createElement(
            host.Text,
            {
              style: {
                // 단일 선택의 선택 셀은 라벨도 primary (Figma Menu-cell selected).
                color: !multiple && isSelected ? "#426CED" : "#18181B",
                flex: 1,
                fontSize: 16,
                lineHeight: 26,
              },
            },
            option.label
          ),
          !multiple && isSelected
            ? createElement(host.Text, { style: { color: "#426CED", fontSize: 16 } }, "✓")
            : null
        );
      });

      return createElement(
        host.View,
        {
          accessibilityLabel: props.accessibilityLabel,
          style: { flexDirection: "column", gap: 6 },
          testID: props.testID,
          "data-size": props.size ?? "md",
          "data-state": props.invalid ? "invalid" : disabled ? "disabled" : undefined,
          "data-open": open ? "true" : undefined,
        },
        createElement(
          host.Pressable,
          {
            accessibilityRole: "button",
            accessibilityState: { disabled, expanded: open },
            disabled,
            onPress: disabled ? undefined : () => setOpen(!open),
            style: {
              ...styles.selectTrigger,
              ...(props.size === "lg" ? { borderRadius: 12, minHeight: 52, minWidth: 120 } : {}),
              backgroundColor: disabled ? "#E4E4E7" : "#FFFFFF",
              borderColor: border.color,
              borderWidth: border.width,
            },
          },
          props.prefix,
          ...valueContent,
          createElement(host.Text, { style: { color: "#27272A", fontSize: 16 } }, "▾")
        ),
        open ? createElement(host.View, { style: styles.selectMenu }, ...cells) : null
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
        ref: props.inputRef,
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
        ref: props.inputRef,
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
    Tooltip: (props) => {
      const theme = props.theme ?? "default";
      const position = props.position ?? "right";
      const ordinal = props.ordinal ?? "first";
      // default is the dark pair (base); reverse flips to white.
      const fill = theme === "reverse" ? "#FFFFFF" : "#3E424B";
      // Arrowhead via the RN border-triangle trick (a zero-size box whose one
      // colored border forms the 4x16 wedge pointing at the target).
      const wedge: Record<string, string | number> = { height: 0, width: 0 };
      if (position === "right" || position === "left") {
        wedge.borderBottomColor = "transparent";
        wedge.borderBottomWidth = 8;
        wedge.borderTopColor = "transparent";
        wedge.borderTopWidth = 8;
        wedge.marginBottom = 4;
        wedge.marginTop = 4;
        const side = position === "right" ? "Right" : "Left";
        wedge[`border${side}Color`] = fill;
        wedge[`border${side}Width`] = 4;
      } else {
        wedge.borderLeftColor = "transparent";
        wedge.borderLeftWidth = 8;
        wedge.borderRightColor = "transparent";
        wedge.borderRightWidth = 8;
        wedge.marginLeft = 4;
        wedge.marginRight = 4;
        const side = position === "bottom" ? "Bottom" : "Top";
        wedge[`border${side}Color`] = fill;
        wedge[`border${side}Width`] = 4;
      }
      return createElement(
        host.View,
        {
          style: {
            alignItems:
              ordinal === "second" ? "center" : ordinal === "third" ? "flex-end" : "flex-start",
            flexDirection:
              position === "right"
                ? "row"
                : position === "left"
                  ? "row-reverse"
                  : position === "bottom"
                    ? "column"
                    : "column-reverse",
          },
          testID: props.testID,
          "data-theme": theme,
          "data-position": position,
          "data-ordinal": ordinal,
        },
        createElement(host.View, { style: wedge }),
        createElement(
          host.View,
          {
            style: {
              backgroundColor: fill,
              borderRadius: 8,
              paddingBottom: 6,
              paddingLeft: 8,
              paddingRight: 8,
              paddingTop: 6,
            },
          },
          createElement(
            host.Text,
            { style: { color: theme === "reverse" ? "#18181B" : "#F9F9F9", fontSize: 14 } },
            props.label
          )
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
  return components;
}

export const {
  Button,
  Checkbox,
  Radio,
  Chip,
  Badge,
  Select,
  Input,
  Textarea,
  Field,
  Icon,
  Switch,
  Toast,
  Tooltip,
} = createNativeComponents();

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
  | "badge"
  | "badgeLabel"
  | "button"
  | "buttonLabel"
  | "chip"
  | "chipLabel"
  | "selectCell"
  | "selectMenu"
  | "selectTrigger"
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
    // Badge (Figma 474:3218): count pill, min-width 22, 0/6 padding.
    badge: {
      alignItems: "center",
      borderRadius: 9999,
      flexDirection: "row",
      justifyContent: "center",
      minWidth: 22,
      paddingHorizontal: 6,
    },
    badgeLabel: { fontSize: 14, lineHeight: 22 },
    // Select (Figma 318:2237): Input-shaped trigger, menu 6px below inline.
    selectTrigger: {
      alignItems: "center",
      borderRadius: 10,
      flexDirection: "row",
      gap: 6,
      minHeight: 42,
      minWidth: 100,
      paddingLeft: 16,
      paddingRight: 10,
    },
    selectMenu: {
      backgroundColor: "#FFFFFF",
      borderColor: "#E4E4E7",
      borderRadius: 10,
      borderWidth: 1,
      flexDirection: "column",
      gap: 4,
      padding: 8,
    },
    selectCell: {
      alignItems: "center",
      borderRadius: 8,
      flexDirection: "row",
      gap: 8,
      minHeight: 42,
      paddingHorizontal: 8,
    },
    // Chip (Figma 538:6615): pill, content-sized; md gap 2/pad 6 (base).
    chip: {
      alignItems: "center",
      borderRadius: 9999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 2,
      justifyContent: "center",
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
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
