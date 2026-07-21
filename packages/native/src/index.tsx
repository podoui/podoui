import React, {
  cloneElement,
  createContext,
  createElement,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
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
  joinIds,
} from "@podoui/core";

export type NativeHostComponent = string | React.ComponentType<Record<string, unknown>>;

export interface NativeHost {
  Pressable: NativeHostComponent;
  /** Optional scroll container — the Select menu uses it for its ten-row cap. */
  ScrollView?: NativeHostComponent;
  Text: NativeHostComponent;
  TextInput: NativeHostComponent;
  View: NativeHostComponent;
}

export interface NativeTheme {
  theme: string;
  colorScheme: "light" | "dark";
  tokens?: Record<string, unknown>;
  /**
   * Icon name → glyph character map consumed by Icon. Build it from the
   * generated RN glyph map (`podo build` → `PodoIcons.native.ts`, whose
   * `podoIconGlyphMap` maps name → codepoint) with `String.fromCodePoint`.
   */
  iconGlyphs?: Record<string, string>;
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
  /** Initial uncontrolled selection. */
  defaultSelected?: boolean;
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
  /**
   * dot처럼 텍스트가 없을 때 의미를 이름으로 제공해요. 라벨이 있는 dot은
   * accessible한 named image(accessibilityRole "image" / RN Web role "img")로
   * 안내돼요.
   */
  accessibilityLabel?: string;
  testID?: string;
}

export interface NativeSwitchProps {
  /** Controlled on/off value (Figma state=on/off). */
  checked?: boolean;
  /** Initial uncontrolled value. */
  defaultChecked?: boolean;
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
  /** Initial uncontrolled value. */
  defaultChecked?: boolean;
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

/**
 * Standalone radio — there is no group container on native, so the consumer
 * keeps exactly one checked (radio.component.json native limitation). The
 * spec's "Arrow keys move within the same-name group" keyboard contract
 * therefore cannot be implemented here: roving Arrow navigation needs a
 * future RadioGroup primitive that owns the sibling list. Space (RN Web)
 * selects the focused radio.
 */
export interface NativeRadioProps {
  /** Controlled value (Figma checked). Group exclusivity is the consumer's. */
  checked?: boolean;
  /**
   * Initial uncontrolled value. 비제어 라디오는 선택되면 true로만 바뀌어요
   * (스스로 untoggle하지 않음) — 형제 해제는 react 렌더러처럼 그룹/consumer 몫.
   */
  defaultChecked?: boolean;
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
  /** Controlled 단일 값 (null = 선택 없음). 생략하면 비제어. */
  value?: string | null;
  /** 비제어 단일 초기값. */
  defaultValue?: string;
  /** Controlled 다중 값. 생략하면 비제어. */
  values?: string[];
  /** 비제어 다중 초기값. */
  defaultValues?: string[];
  /** 단일 값이 선택될 때. */
  onValueChange?: (value: string) => void;
  /** 다중 값이 토글될 때 다음 배열과 함께. */
  onValuesChange?: (values: string[]) => void;
  /** 트리거에 보여줄 최대 칩 수 — 넘치는 값은 "+N"으로 축약돼요. */
  maxChips?: number;
  /** 다중 선택에서 값이 있을 때 "모두 해제" ✕ 버튼을 보여줘요. */
  clearable?: boolean;
  /** 값은 보이지만 변경 불가 — 박스·체브론 없이 값만 렌더 (Figma read-only). */
  readOnly?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  /** 값 앞에 붙는 아이콘 (Figma prefix-icon). */
  prefix?: ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

export interface NativeFieldProps {
  children: ReactNode;
  /**
   * Heading text. 라벨을 누르면 연결된 컨트롤로 포커스를 넘겨요
   * (field.component.json focusManagement) — 컨트롤이 focus()를 노출하는
   * TextInput 기반(Input/Textarea)일 때만이고, 그 외 컨트롤·disabled 필드는
   * no-op이에요. 라벨 자체는 버튼이 되지 않아요 (Text onPress만 사용).
   */
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
  /**
   * Manifest icon name. Without an explicit glyph, the name is looked up in
   * the provider's iconGlyphs map (`PodoNativeThemeProvider iconGlyphs` —
   * consumers pass the generated glyph map there); if neither resolves, the
   * raw name renders as readable fallback text.
   */
  name: string;
  /**
   * Explicit glyph character — wins over the provider map. Resolution order:
   * `glyph ?? theme.iconGlyphs?.[name] ?? name`.
   */
  glyph?: string;
  /**
   * Glyph scale (icon.component.json size variant). Maps to the glyph
   * fontSize: sm 16 / md 24 / lg 32 — md (the default) matches the 24×24
   * SVG grid the icon font is built from, sm/lg step ±8.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Decorative icons (the default) are hidden from every platform's a11y
   * tree. Pass `decorative={false}` together with `accessibilityLabel` to
   * expose the icon as a named image instead (role/accessibilityRole
   * img/image); without a label the icon stays hidden — an unnamed image
   * would only announce noise.
   */
  decorative?: boolean;
  /** Accessible name for meaningful (`decorative={false}`) icons. */
  accessibilityLabel?: string;
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
  ScrollView: "ScrollView",
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
  iconGlyphs,
  children,
}: NativeThemeProviderProps): React.ReactElement {
  const value = {
    theme,
    colorScheme,
    ...(typeof tokens === "undefined" ? {} : { tokens }),
    ...(typeof iconGlyphs === "undefined" ? {} : { iconGlyphs }),
  };

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

// Button themes — base and pressed values from podo-ui/styles.css
// ("/* Themes */", Figma light values like BADGE_COLORS). Native has no hover
// state; Pressable's pressed state maps to the CSS :active `*-pressed` fill.
// Solid themes keep a transparent border so every theme shares the same box.
const BUTTON_COLORS: Record<
  NativeButtonTheme,
  { fill: string; label: string; border: string; pressed: string }
> = {
  "solid-primary": { fill: "#426CED", label: "#FFFFFF", border: "transparent", pressed: "#123BBA" },
  "solid-assistive": {
    fill: "#F4F4F5",
    label: "#18181B",
    border: "transparent",
    pressed: "#D1D2D6",
  },
  "solid-white": { fill: "#FFFFFF", label: "#18181B", border: "transparent", pressed: "#E4E4E7" },
  "solid-danger": { fill: "#F23B3B", label: "#FFFFFF", border: "transparent", pressed: "#CD0404" },
  "outline-primary": { fill: "#FFFFFF", label: "#426CED", border: "#426CED", pressed: "#D0DBFB" },
  "outline-assistive": {
    fill: "#F9F9F9",
    label: "#18181B",
    border: "#D1D2D6",
    pressed: "#E4E4E7",
  },
  "outline-white": {
    fill: "#FFFFFF",
    label: "#18181B",
    border: "#D1D2D6",
    pressed: "rgba(0, 0, 0, 0.1)",
  },
  "outline-danger": { fill: "#FFFFFF", label: "#F23B3B", border: "#F23B3B", pressed: "#FFE0DF" },
};

// .podo-button[disabled] (podo-ui/styles.css): the disabled state has its own
// fill/label pair — no opacity in the spec. Outline themes keep a visible
// disabled border (styles.css [data-theme^="outline"][disabled]).
const BUTTON_DISABLED = { fill: "#E4E4E7", label: "#9FA2AD" };
const BUTTON_DISABLED_OUTLINE_BORDER = "#D1D2D6";

// Button sizes (Figma: xs 32 / sm 36 / md 42 / lg 52) — height, padding,
// radius, and font size mirror podo-ui/styles.css ("/* Sizes */").
const BUTTON_SIZES: Record<
  NonNullable<NativeButtonProps["size"]>,
  {
    borderRadius: number;
    fontSize: number;
    minHeight: number;
    paddingHorizontal: number;
    paddingVertical: number;
  }
> = {
  xs: { borderRadius: 6, fontSize: 14, minHeight: 32, paddingHorizontal: 10, paddingVertical: 2 },
  sm: { borderRadius: 8, fontSize: 14, minHeight: 36, paddingHorizontal: 16, paddingVertical: 2 },
  md: { borderRadius: 10, fontSize: 16, minHeight: 42, paddingHorizontal: 16, paddingVertical: 2 },
  lg: { borderRadius: 12, fontSize: 16, minHeight: 52, paddingHorizontal: 20, paddingVertical: 10 },
};

// Icon size → glyph fontSize (icon.component.json size variant: sm/md/lg,
// default md). md 24 matches the 24×24 SVG grid the icon font is built from
// (packages/icons optimizes sources to viewBox 0 0 24 24); sm/lg step ±8.
const ICON_SIZES: Record<NonNullable<NativeIconProps["size"]>, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

// Select menu ten-row cap (select.component.json: the menu "caps at ten 42px
// rows (474px) and scrolls beyond"). Computed from this file's own styles:
// 10 rows × selectCell minHeight 42 + 9 gaps × selectMenuContent gap 4
// + 2 × selectMenuContent padding 8 + 2 × selectMenu borderWidth 1 = 474.
// RN styles size border-box, so the box border counts toward maxHeight; the
// content padding scrolls with the cells inside the content container.
const SELECT_MENU_MAX_HEIGHT = 10 * 42 + 9 * 4 + 2 * 8 + 2 * 1;

export function createNativeComponents(host: NativeHost = defaultNativeHost): NativeComponents {
  const components: NativeComponents = {
    Button: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const behavior = createButtonBehavior({ disabled: props.disabled });
      const themeName = props.theme ?? "solid-primary";
      const size = props.size ?? "md";
      const box = BUTTON_COLORS[themeName];
      const metrics = BUTTON_SIZES[size];
      // Disabled swaps in the design system's own treatment
      // (.podo-button[disabled]: gray fill + muted label, no opacity) instead
      // of dimming the theme color.
      const colors = behavior.pressable
        ? box
        : {
            fill: BUTTON_DISABLED.fill,
            label: BUTTON_DISABLED.label,
            border: themeName.startsWith("outline-")
              ? BUTTON_DISABLED_OUTLINE_BORDER
              : "transparent",
          };
      const restingStyle = {
        ...styles.button,
        backgroundColor: colors.fill,
        borderColor: colors.border,
        borderRadius: metrics.borderRadius,
        minHeight: metrics.minHeight,
        paddingHorizontal: metrics.paddingHorizontal,
        paddingVertical: metrics.paddingVertical,
        ...(props.fill ? { alignSelf: "stretch" } : {}),
      };
      // Pressed feedback uses RN Pressable's style-as-function form with the
      // theme's `*-pressed` fill (styles.css :active). Only component hosts
      // (the real RN Pressable) get the function: string-tag hosts
      // (defaultNativeHost under test renderers/react-dom demos) render DOM
      // elements whose style prop must be a plain object — a function there
      // would throw — so they keep the static resting style.
      const style =
        typeof host.Pressable === "string"
          ? restingStyle
          : ({ pressed }: { pressed: boolean }) =>
              pressed && behavior.pressable
                ? { ...restingStyle, backgroundColor: box.pressed }
                : restingStyle;
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: !behavior.pressable },
          disabled: !behavior.pressable,
          onPress: behavior.pressable ? props.onPress : undefined,
          style,
          testID: props.testID,
          "data-theme": themeName,
          "data-size": size,
        },
        props.prefix,
        createElement(
          host.Text,
          { style: { ...styles.buttonLabel, color: colors.label, fontSize: metrics.fontSize } },
          props.children
        ),
        props.suffix
      );
    },
    Chip: function NativeChip(props) {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const behavior = createButtonBehavior({ disabled: props.disabled });
      const themeName = props.theme ?? "solid";
      const size = props.size ?? "md";
      // Uncontrolled fallback: without a selected prop the chip toggles itself
      // (react 렌더러 규칙 그대로 — controlled selected가 항상 이겨요). 제거형
      // 칩은 선택 모습이 고정이라 이 상태를 쓰지 않아요.
      const [internalSelected, setInternalSelected] = useState(props.defaultSelected ?? false);
      const selected = props.selected ?? internalSelected;
      if (props.onRemove) {
        // Removable chip: born in the selected look, no toggle — the X is the
        // only control, so the root is a plain View. Disabled keeps the same
        // treatment as the non-removable disabled chip and inerts the X
        // (react parity: data-disabled="true" + disabled remove button).
        const box = behavior.disabled
          ? { fill: "#E4E4E7", border: "transparent", label: "#9FA2AD" }
          : themeName === "outline-weak"
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
            "data-disabled": behavior.disabled ? "true" : undefined,
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
              accessibilityState: { disabled: behavior.disabled },
              disabled: behavior.disabled,
              onPress: behavior.pressable ? props.onRemove : undefined,
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
      // Pressed feedback (podo-ui/styles.css .podo-chip :active rules):
      // unselected solid darkens the fill to #E4E4E7, unselected outlines
      // darken the border to #D1D2D6, selected solid/outline-strong lighten
      // to #767985, selected outline-weak fills #F4F4F5.
      const pressedBox = selected
        ? themeName === "outline-weak"
          ? { ...box, fill: "#F4F4F5" }
          : { ...box, fill: "#767985" }
        : themeName === "solid"
          ? { ...box, fill: "#E4E4E7" }
          : { ...box, border: "#D1D2D6" };
      const restingStyle = {
        ...styles.chip,
        backgroundColor: box.fill,
        borderColor: box.border,
      };
      // Same host-type guard as Button: only component hosts (the real RN
      // Pressable) accept RN's style-as-function form — string-tag hosts
      // render DOM elements whose style prop must stay a plain object.
      const style =
        typeof host.Pressable === "string"
          ? restingStyle
          : ({ pressed }: { pressed: boolean }) =>
              pressed && behavior.pressable
                ? {
                    ...restingStyle,
                    backgroundColor: pressedBox.fill,
                    borderColor: pressedBox.border,
                  }
                : restingStyle;
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "button",
          accessibilityState: { disabled: !behavior.pressable, selected },
          // Toggle chips are pressed-state buttons (chip.component.json aria:
          // "aria-pressed (selection toggle)") — RNW passes aria-pressed
          // through; real RN keeps announcing via accessibilityState.selected.
          "aria-pressed": selected,
          disabled: !behavior.pressable,
          // Chips toggle: pressing reports the next selected value. RNW의
          // button role은 진짜 <button>이라 Enter/Space가 press를 합성해요 —
          // 키보드도 같은 경로로 비제어 상태를 움직여요 (별도 onKeyDown 불필요).
          onPress: behavior.pressable
            ? () => {
                if (props.selected == null) {
                  setInternalSelected(!selected);
                }
                props.onSelectedChange?.(!selected);
                props.onPress?.();
              }
            : undefined,
          style,
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
        // Non-touchable Views are not accessibility elements by default on
        // real RN, so a labeled dot must opt in with accessible plus a named
        // image role — accessibilityRole "image" for real RN and the web-ish
        // role prop for RN Web (renders role="img"), mirroring Icon's
        // decorative={false} pattern. An unlabeled dot stays decorative.
        const labeled = props.accessibilityLabel != null;
        return createElement(host.View, {
          ...(labeled
            ? {
                accessible: true,
                accessibilityRole: "image",
                role: "img",
                accessibilityLabel: props.accessibilityLabel,
              }
            : {}),
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
      const [openState, setOpen] = useState(false);
      const [activeIndex, setActiveIndex] = useState(0);
      const multiple = props.multiple === true;
      const disabled = props.disabled === true;
      const readOnly = props.readOnly === true;
      // 내부 open 상태는 disabled/readOnly와 항상 재조정돼요: 메뉴가 열린 채
      // 잠기면 즉시 닫히고, 다시 풀려도 저절로 되열리지 않아요 (render-phase
      // adjustment — react 렌더러의 가드와 같은 결과).
      if (openState && (disabled || readOnly)) {
        setOpen(false);
      }
      const open = openState && !disabled && !readOnly;
      // Uncontrolled fallbacks — value/values props switch each mode to
      // controlled (react 렌더러 규칙 그대로: controlled 값이 항상 이겨요).
      const [internalValue, setInternalValue] = useState<string | null>(props.defaultValue ?? null);
      const [internalValues, setInternalValues] = useState<string[]>(props.defaultValues ?? []);
      // value는 null(선택 없음)도 controlled — undefined만 비제어예요.
      const selectedValue = props.value !== undefined ? props.value : internalValue;
      const selectedValues = props.values ?? internalValues;
      const selected = props.options.find((o) => o.value === selectedValue);
      const hasValue = multiple ? selectedValues.length > 0 : Boolean(selected);
      const border = readOnly
        ? { color: "transparent", width: 1 }
        : disabled
          ? { color: "#D1D2D6", width: 1 }
          : open
            ? { color: props.invalid ? "#F23B3B" : "#426CED", width: 2 }
            : props.invalid
              ? { color: "#F23B3B", width: 1 }
              : { color: "#E4E4E7", width: 1 };

      // The lock is read through a ref kept current on every render: a queued
      // press handler captured before a disabled/readOnly flip would otherwise
      // see the stale (unlocked) closure values from its defining render.
      const lockRef = useRef(disabled || readOnly);
      lockRef.current = disabled || readOnly;

      const pick = (optionValue: string) => {
        // Guard stale presses (e.g. a queued native press landing after the
        // disabled/readOnly flip) — mirrors the react renderer's guards.
        if (lockRef.current) {
          return;
        }
        if (multiple) {
          const next = selectedValues.includes(optionValue)
            ? selectedValues.filter((v) => v !== optionValue)
            : [...selectedValues, optionValue];
          // 비제어일 때만 내부 상태를 갱신해요 — change 콜백은 항상 불려요.
          if (props.values === undefined) {
            setInternalValues(next);
          }
          props.onValuesChange?.(next);
        } else {
          if (props.value === undefined) {
            setInternalValue(optionValue);
          }
          props.onValueChange?.(optionValue);
          setOpen(false);
        }
      };

      const clearAll = () => {
        // Same stale-press guard as pick(): a clear-all press queued before a
        // disabled/readOnly flip must not mutate values after the lock.
        if (lockRef.current) {
          return;
        }
        if (props.values === undefined) {
          setInternalValues([]);
        }
        props.onValuesChange?.([]);
      };

      // Stable per-instance option ids for aria-activedescendant (useId
      // delimiters stripped, like Field's generated ids).
      const reactId = useId();
      const menuId = `podo-select-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const optionId = (index: number): string => `${menuId}-option-${index}`;
      // Options can change while open — keep the active cell in range.
      const lastIndex = props.options.length - 1;
      const active = Math.max(0, Math.min(activeIndex, lastIndex));

      // Keyboard navigation keeps the active option inside the 474px viewport:
      // whenever the active cell changes while open, scroll the menu container
      // to the cell's offset (index × (cell minHeight 42 + menu gap 4)). Only
      // host instances that expose an RN ScrollView-like scrollTo are driven —
      // string-tag hosts (and the plain View fallback) yield refs without one
      // and simply ignore the follow behavior.
      const menuRef = useRef<unknown>(null);
      useEffect(() => {
        if (!open) {
          return;
        }
        const node = menuRef.current as {
          scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
        } | null;
        if (!node || typeof node.scrollTo !== "function") {
          return;
        }
        try {
          node.scrollTo({ y: active * (42 + 4), animated: false });
        } catch {
          // Hosts whose scrollTo throws (e.g. jsdom stubs) are unscrollable.
        }
      }, [open, active]);

      const openMenu = () => {
        if (disabled || readOnly) {
          return;
        }
        // The active cell starts on the current single selection, or on the
        // first option (multiple always starts at the top).
        const selectedIndex = multiple
          ? -1
          : props.options.findIndex((o) => o.value === selectedValue);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setOpen(true);
      };

      // Published keyboard contract (select.component.json accessibility):
      // Enter/Space/ArrowDown opens, ArrowUp/ArrowDown moves the active
      // option, Enter picks it, Escape closes. Focus never leaves the
      // trigger — the active cell is pointed at via aria-activedescendant.
      // RN Web delivers onKeyDown on Pressable; native RN ignores the prop.
      // RN Web의 PressResponder는 포커스된 트리거의 Enter에서 onPress도
      // 합성하므로, Enter를 여기서 처리했을 땐 바로 다음 합성 press 한 번을
      // 삼켜 이중 토글을 막아요 (실제 RN은 onKeyDown이 없어 플래그가 항상
      // false — 터치 onPress는 그대로 동작해요).
      const suppressSynthPress = useRef(false);
      const onTriggerKeyDown = (event?: { key?: string; preventDefault?: () => void }) => {
        const key = event?.key;
        if (!key || disabled || readOnly) {
          return;
        }
        suppressSynthPress.current = false;
        if (!open) {
          if (key === "Enter" || key === " " || key === "ArrowDown") {
            event?.preventDefault?.();
            suppressSynthPress.current = key === "Enter";
            openMenu();
          }
          return;
        }
        if (key === "ArrowDown") {
          event?.preventDefault?.();
          setActiveIndex(Math.min(active + 1, lastIndex));
        } else if (key === "ArrowUp") {
          event?.preventDefault?.();
          setActiveIndex(Math.max(active - 1, 0));
        } else if (key === "Enter") {
          event?.preventDefault?.();
          suppressSynthPress.current = true;
          const option = props.options[active];
          if (option) {
            pick(option.value);
          }
        } else if (key === "Escape") {
          event?.preventDefault?.();
          setOpen(false);
        }
      };

      // 선택 값 칩은 Chip 컴포넌트의 제거형 모드를 그대로 재사용하고,
      // maxChips를 넘는 값은 "+N"으로 축약해요 (해제는 메뉴에서).
      const maxChips = props.maxChips ?? 3;
      const hiddenChipCount = Math.max(0, selectedValues.length - maxChips);
      const chips: ReactNode[] = selectedValues.slice(0, maxChips).map((v) => {
        const label = props.options.find((o) => o.value === v)?.label ?? v;
        // read-only·disabled는 지울 수 없으니 X 없는 정적 칩으로 렌더해요
        // (disabled는 비활성 칩과 같은 색으로).
        if (readOnly || disabled) {
          return createElement(
            host.View,
            {
              key: v,
              style: { ...styles.chip, backgroundColor: disabled ? "#E4E4E7" : "#3E424B" },
              "data-state": "selected",
              "data-disabled": disabled ? "true" : undefined,
            },
            createElement(
              host.Text,
              {
                style: {
                  ...styles.chipLabel,
                  color: disabled ? "#9FA2AD" : "#FFFFFF",
                  fontSize: 14,
                },
              },
              label
            )
          );
        }
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

      const cells = props.options.map((option, index) => {
        const isSelected = multiple
          ? selectedValues.includes(option.value)
          : option.value === selectedValue;
        const isActive = index === active;
        return createElement(
          host.Pressable,
          {
            key: option.value,
            // Listbox option semantics (select.component.json aria) — the
            // web-ish role prop (RN ≥0.71) instead of a button role; string
            // hosts just carry the attribute through.
            role: "option",
            nativeID: optionId(index),
            accessibilityState: { selected: isSelected },
            "aria-selected": isSelected,
            // Focus never enters the list (select.component.json
            // focusManagement: "Focus stays on the trigger") — the trigger
            // points at the active cell via aria-activedescendant instead.
            // RNW honors both focusable:false and tabIndex:-1 (Pressables are
            // focusable by default there); real RN ignores them.
            focusable: false,
            tabIndex: -1,
            onPress: () => pick(option.value),
            // The active (keyboard) cell shows the hover/active fill
            // (.podo-select__cell[data-active] in podo-ui/styles.css).
            style: { ...styles.selectCell, ...(isActive ? styles.selectCellActive : {}) },
            "data-state": isSelected ? "selected" : undefined,
            "data-active": isActive ? "true" : undefined,
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
          style: { flexDirection: "column", gap: 6 },
          testID: props.testID,
          "data-size": props.size ?? "md",
          "data-state": props.invalid
            ? "invalid"
            : disabled
              ? "disabled"
              : readOnly
                ? "read-only"
                : undefined,
          "data-open": open ? "true" : undefined,
        },
        createElement(
          host.Pressable,
          {
            // combobox — matches the react/web trigger role and keeps the
            // interactive chip-remove/clear pressables (role=button) from
            // nesting inside another button (invalid HTML under RN Web).
            accessibilityRole: "combobox",
            // The accessible name belongs on the interactive trigger, not the
            // outer layout View.
            accessibilityLabel: props.accessibilityLabel,
            accessibilityState: { disabled, expanded: open },
            disabled,
            onPress:
              disabled || readOnly
                ? undefined
                : () => {
                    // 처리된 Enter 키가 합성한 press는 한 번만 삼켜요.
                    if (suppressSynthPress.current) {
                      suppressSynthPress.current = false;
                      return;
                    }
                    if (open) {
                      setOpen(false);
                    } else {
                      openMenu();
                    }
                  },
            onKeyDown: disabled || readOnly ? undefined : onTriggerKeyDown,
            // Combobox wiring (select.component.json aria: "combobox trigger
            // with aria-expanded/aria-haspopup/aria-controls") — RNW passes
            // the aria-* props through; real RN ignores them and keeps
            // announcing via accessibilityState.expanded above.
            "aria-haspopup": "listbox",
            "aria-controls": open ? menuId : undefined,
            "aria-expanded": String(open),
            // Focus stays here — the active option is only pointed at.
            "aria-activedescendant": open && lastIndex >= 0 ? optionId(active) : undefined,
            style: {
              ...styles.selectTrigger,
              ...(props.size === "lg" ? { borderRadius: 12, minHeight: 52, minWidth: 120 } : {}),
              ...(readOnly ? { paddingLeft: 0 } : {}),
              backgroundColor: disabled ? "#E4E4E7" : readOnly ? "transparent" : "#FFFFFF",
              borderColor: border.color,
              borderWidth: border.width,
            },
          },
          props.prefix,
          ...valueContent,
          props.clearable && multiple && hasValue && !disabled && !readOnly
            ? createElement(
                host.Pressable,
                {
                  accessibilityRole: "button",
                  accessibilityLabel: "모두 해제",
                  onPress: clearAll,
                },
                createElement(host.Text, { style: { color: "#767985", fontSize: 14 } }, "✕")
              )
            : null,
          readOnly
            ? null
            : createElement(host.Text, { style: { color: "#27272A", fontSize: 16 } }, "▾")
        ),
        open
          ? createElement(
              // The menu scrolls past ten rows when the host ships a
              // ScrollView; hosts without one fall back to a capped View.
              host.ScrollView ?? host.View,
              {
                ref: menuRef,
                role: "listbox",
                nativeID: menuId,
                "aria-multiselectable": multiple ? true : undefined,
                // Real RN ScrollView lays its children out in an inner content
                // container: box styles (maxHeight/background/border/radius)
                // stay on style while the child-layout styles
                // (padding/gap/flexDirection) must ride contentContainerStyle.
                // The View fallback has no content container, so both merge
                // onto style.
                ...(host.ScrollView
                  ? {
                      style: { ...styles.selectMenu, maxHeight: SELECT_MENU_MAX_HEIGHT },
                      contentContainerStyle: styles.selectMenuContent,
                    }
                  : {
                      style: {
                        ...styles.selectMenu,
                        ...styles.selectMenuContent,
                        maxHeight: SELECT_MENU_MAX_HEIGHT,
                      },
                    }),
              },
              ...cells
            )
          : null
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
          required: behavior.required || Boolean(props.accessibilityState?.required),
        },
        editable: !behavior.disabled && !props.readOnly,
        // Disabled controls also leave the focus order — RN Web honors
        // focusable:false, real RN accepts it on TextInput next to editable.
        ...(behavior.disabled ? { focusable: false } : {}),
        defaultValue: props.defaultValue,
        value: props.value,
        placeholder: props.placeholder,
        maxLength: props.maxLength,
        onChangeText: props.onValueChange,
        style: {
          ...styles.inputControl,
          // Disabled text drops to the muted gray
          // (.podo-input[data-state="disabled"] .podo-input__control).
          ...(behavior.disabled ? styles.inputControlDisabled : {}),
        },
        testID: props.testID,
      });
      return createElement(
        host.View,
        {
          style: {
            ...styles.input,
            ...(props.size === "lg" ? styles.inputLg : {}),
            // Invalid keeps the danger border (styles.css .podo-input invalid);
            // read-only still removes the box, like the Select trigger.
            ...(behavior.invalid ? styles.inputInvalid : {}),
            // Disabled gray box (.podo-input[data-state="disabled"]) wins over
            // invalid, matching the Select trigger's border ladder.
            ...(behavior.disabled ? styles.inputDisabled : {}),
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
          required: behavior.required || Boolean(props.accessibilityState?.required),
        },
        editable: !behavior.disabled && !props.readOnly,
        // Disabled controls also leave the focus order — RN Web honors
        // focusable:false, real RN accepts it on TextInput next to editable.
        ...(behavior.disabled ? { focusable: false } : {}),
        defaultValue: props.defaultValue,
        value: props.value,
        placeholder: props.placeholder,
        maxLength: props.maxLength,
        multiline: true,
        numberOfLines: props.numberOfLines ?? 3,
        onChangeText: props.onValueChange,
        style: {
          ...styles.textarea,
          // Invalid keeps the danger border (styles.css .podo-textarea invalid);
          // read-only still removes the box, like the Select trigger.
          ...(behavior.invalid ? styles.inputInvalid : {}),
          // Disabled gray box + muted text
          // (.podo-textarea[data-state="disabled"]), winning over invalid.
          ...(behavior.disabled ? { ...styles.inputDisabled, ...styles.inputControlDisabled } : {}),
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
    Field: function NativeField(props) {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      // 라벨 프레스 → 컨트롤 포커스 (field.component.json focusManagement:
      // "Forward label press to the control when target supports it").
      // wireNativeControl이 자식의 inputRef에 끼워 넣은 콜백이 밑단 TextInput
      // 노드를 붙잡고, 라벨은 focus()를 노출하는 노드일 때만 넘겨요 —
      // Select처럼 focus 없는 컨트롤·컨트롤이 없는 필드는 no-op이에요.
      const controlRef = useRef<unknown>(null);
      const focusControl = () => {
        // disabled 필드는 웹 label[for]→disabled input처럼 무시해요.
        if (props.disabled) {
          return;
        }
        const node = controlRef.current as { focus?: unknown } | null;
        if (node && typeof node.focus === "function") {
          (node as { focus: () => void }).focus();
        }
      };
      // The footer shows a single guidance line (Figma 538:6691): the error
      // wins over the helper text, matching the web/react/hono renderers.
      const showError = Boolean(props.error);
      const showHelper = Boolean(props.helperText) && !showError;
      // Without an explicit count prop the field tracks the wired control's
      // text length itself (mirrors the react/web renderers). Controlled
      // children can be updated externally without firing onValueChange, so
      // the count derives from the child's current value prop when present;
      // uncontrolled children fall back to the onValueChange-tracked state.
      const [autoCount, setAutoCount] = useState(() => initialNativeControlLength(props.children));
      const trackCount = props.countMax != null && props.count == null;
      const controlledCount = controlledNativeControlLength(props.children);
      const shownCount = props.count ?? controlledCount ?? autoCount;
      // Per-instance default id — core's fixed "podo-field-control" seed would
      // make every unlabeled Field share label/description/error ids. useId's
      // delimiters (":" / "«»") are stripped so the joined a11y id strings stay
      // plain; an explicit id prop always wins.
      const reactId = useId();
      const a11y = createFieldA11y({
        id: props.id ?? `podo-field-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
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
            {
              nativeID: a11y.ids.labelId,
              // Text 자체의 onPress만 써요 (RN Text 지원) — Pressable로 감싸지
              // 않으니 라벨이 AT에 버튼으로 둔갑하지 않고 nativeID/라벨 의미가
              // 그대로예요. 프레스는 연결된 컨트롤로 포커스만 넘겨요.
              onPress: focusControl,
              style: styles.label,
            },
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
          { disabled: props.disabled, invalid: props.invalid },
          trackCount ? (value) => setAutoCount(value.length) : undefined,
          // countMax also caps the control via the platform-native maxLength.
          props.countMax,
          // 라벨 프레스 포커스용 — 자식 inputRef에 합류해 TextInput 노드를 잡아요.
          controlRef
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
      // Meaningful icon: decorative={false} plus an accessibilityLabel drops
      // the hidden trio and announces a named image. Without a label the icon
      // stays decorative — an unnamed image role would only announce noise.
      const labeled = props.decorative === false && props.accessibilityLabel != null;
      return createElement(
        host.Text,
        {
          ...(labeled
            ? {
                // Named image: accessibilityRole for real RN, the web-ish
                // role prop for RN Web (which renders role="img").
                accessibilityRole: "image",
                role: "img",
                accessibilityLabel: props.accessibilityLabel,
              }
            : {
                // Decorative glyph — hidden from every platform's a11y tree:
                // iOS (accessibilityElementsHidden), Android
                // (importantForAccessibility), and RN Web (aria-hidden).
                accessibilityElementsHidden: true,
                importantForAccessibility: "no-hide-descendants",
                "aria-hidden": true,
              }),
          // Glyph scale (ICON_SIZES): sm 16 / md 24 / lg 32, default md.
          style: { ...styles.icon, fontSize: ICON_SIZES[props.size ?? "md"] },
          testID: props.testID,
        },
        // Resolution order (see NativeIconProps): explicit glyph → the
        // provider's iconGlyphs entry for the name → the raw name as
        // readable fallback text when no glyph map is wired.
        props.glyph ?? theme.iconGlyphs?.[props.name] ?? props.name
      );
    },
    Switch: function NativeSwitch(props) {
      // Uncontrolled fallback: without a checked prop the switch tracks itself.
      const [internalChecked, setInternalChecked] = useState(props.defaultChecked ?? false);
      const behavior = createSwitchBehavior({
        checked: props.checked ?? internalChecked,
        disabled: props.disabled,
      });
      // Figma 566:12693 geometry per size: track w/h, handle diameter, edge pad.
      const metrics =
        props.size === "md"
          ? { w: 40, h: 24, handle: 20, pad: 2 }
          : props.size === "lg"
            ? { w: 56, h: 32, handle: 25, pad: 4 }
            : { w: 30, h: 18, handle: 14, pad: 2 };
      const track = behavior.disabled ? "#E4E4E7" : behavior.checked ? "#426CED" : "#D1D2D6";
      const handle = behavior.disabled ? "#D1D2D6" : "#FFFFFF";
      // Press와 키보드가 같은 toggle을 타요 — 비제어 상태도 두 경로에서
      // 동일하게 움직이고, controlled checked면 내부 상태는 건드리지 않아요.
      const toggle = () => {
        if (props.checked == null) {
          setInternalChecked(!behavior.checked);
        }
        props.onCheckedChange?.(!behavior.checked);
      };
      // Keyboard contract (switch.component.json: "Enter/Space toggles the
      // switch"). RN Web delivers onKeyDown on Pressable; real RN ignores the
      // prop. The switch role renders a <div> under RNW (not a real <button>),
      // so Space never synthesizes a press there — but RNW's PressResponder
      // does synthesize onPress from Enter on any focused pressable, so the
      // handled Enter swallows exactly that one synthesized press (mirroring
      // Select's suppressSynthPress; real RN never sets the flag).
      const suppressSynthPress = useRef(false);
      const onKeyDown = (event?: { key?: string; preventDefault?: () => void }) => {
        const key = event?.key;
        if (!key || !behavior.pressable) {
          return;
        }
        suppressSynthPress.current = false;
        if (key === "Enter" || key === " ") {
          event?.preventDefault?.();
          suppressSynthPress.current = key === "Enter";
          toggle();
        }
      };
      // The pressable row includes the optional label (track + 6px gap + 14px text).
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "switch",
          accessibilityState: { checked: behavior.checked, disabled: behavior.disabled },
          accessibilityLabel: props.accessibilityLabel,
          disabled: !behavior.pressable,
          onPress: behavior.pressable
            ? () => {
                // 처리된 Enter 키가 합성한 press는 한 번만 삼켜요.
                if (suppressSynthPress.current) {
                  suppressSynthPress.current = false;
                  return;
                }
                toggle();
              }
            : undefined,
          onKeyDown: behavior.pressable ? onKeyDown : undefined,
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
    Checkbox: function NativeCheckbox(props) {
      // Uncontrolled fallback: without a checked prop the checkbox tracks
      // itself. indeterminate 상호작용은 그대로예요 — 토글은 checked만 뒤집고,
      // mixed 표시는 계속 indeterminate prop이 결정해요.
      const [internalChecked, setInternalChecked] = useState(props.defaultChecked ?? false);
      const behavior = createCheckboxBehavior({
        checked: props.checked ?? internalChecked,
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
      // Press와 키보드가 같은 toggle을 타요 — 비제어 상태도 두 경로에서
      // 동일하게 움직이고, controlled checked면 내부 상태는 건드리지 않아요.
      const toggle = () => {
        if (props.checked == null) {
          setInternalChecked(!behavior.checked);
        }
        props.onCheckedChange?.(!behavior.checked);
      };
      // Keyboard contract (checkbox.component.json: "Space toggles the
      // checkbox"). RN Web delivers onKeyDown; real RN ignores the prop. The
      // checkbox role renders a <div> under RNW (not a real <button>), so
      // Space never synthesizes a press — no suppressSynthPress needed for
      // the handled key. (RNW still synthesizes onPress from Enter, but Enter
      // is unhandled here, so that lone press toggles once — no double.)
      const onKeyDown = (event?: { key?: string; preventDefault?: () => void }) => {
        if (event?.key !== " " || !behavior.pressable) {
          return;
        }
        event.preventDefault?.();
        toggle();
      };
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
          onPress: behavior.pressable ? toggle : undefined,
          onKeyDown: behavior.pressable ? onKeyDown : undefined,
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
      const state = props.state ?? "normal";
      const palette = {
        success: { fill: "#ECF8EF", border: "#3EA856" },
        danger: { fill: "#FEF1F1", border: "#F23B3B" },
        info: { fill: "#EBF5FF", border: "#0095FF" },
        warning: { fill: "#FFF7E6", border: "#FFAA00" },
        normal: { fill: "#F4F4F5", border: "#D1D2D6" },
      }[state];
      // Announcement contract (toast.component.json aria): role=status for
      // normal/success/info/warning, role=alert only for danger.
      // - danger: accessibilityRole "alert" (RN + RNW both know it) with the
      //   assertive Android live region so it interrupts.
      // - others: the web-ish role prop "status" (RNW renders role="status";
      //   real RN maps role→accessibilityRole where possible and ignores
      //   values like "status" it has no counterpart for) with the polite
      //   Android live region, so the card announces without interrupting.
      const announcement =
        state === "danger"
          ? { accessibilityRole: "alert", accessibilityLiveRegion: "assertive" }
          : { role: "status", accessibilityLiveRegion: "polite" };
      return createElement(
        host.View,
        {
          ...announcement,
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
          "data-state": state,
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
    Tooltip: function NativeTooltip(props) {
      const theme = props.theme ?? "default";
      const position = props.position ?? "right";
      const ordinal = props.ordinal ?? "first";
      // Stable per-instance bubble id (useId delimiters stripped, like
      // Field/Select ids) — a future trigger primitive can point at it via
      // accessibilityDescribedBy/aria-describedby.
      const reactId = useId();
      const bubbleId = `podo-tooltip-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
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
            // tooltip role (tooltip.component.json aria: "role=tooltip") on
            // the bubble itself — RNW renders role="tooltip"; real RN ignores
            // the value (no counterpart) and the nativeID gives a future
            // trigger primitive an id to reference (see bubbleId above).
            role: "tooltip",
            nativeID: bubbleId,
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
    Radio: function NativeRadio(props) {
      // Uncontrolled fallback: without a checked prop the radio tracks itself.
      // 선택은 true로만 바뀌고(라디오는 스스로 untoggle하지 않아요), 형제 해제
      // 같은 그룹 배타는 react 렌더러처럼 consumer/name-group 몫이에요.
      const [internalChecked, setInternalChecked] = useState(props.defaultChecked ?? false);
      const behavior = createRadioBehavior({
        checked: props.checked ?? internalChecked,
        disabled: props.disabled,
      });
      // Figma 379:3350 colors; the circle stays 18x18 for every size and the
      // white 8px dot survives disabled.
      const circle = behavior.disabled
        ? { fill: "#E4E4E7", border: behavior.checked ? undefined : "#D1D2D6" }
        : behavior.checked
          ? { fill: "#426CED", border: undefined }
          : { fill: "transparent", border: "#9FA2AD" };
      // Keyboard contract (radio.component.json: "Space selects"). RN Web
      // delivers onKeyDown; real RN ignores the prop. The radio role renders
      // a <div> under RNW (not a real <button>), so Space never synthesizes a
      // press — no suppressSynthPress needed. The spec's Arrow-key group
      // navigation is NOT implemented: native radios are standalone (no group
      // container), so roving focus needs a future RadioGroup primitive that
      // owns the sibling list (see NativeRadioProps).
      // Press와 키보드가 같은 select를 타요 — 비제어 상태도 두 경로에서
      // 동일하게 true로 고정되고, controlled checked면 내부 상태는 그대로예요.
      const select = () => {
        if (props.checked == null) {
          setInternalChecked(true);
        }
        props.onCheckedChange?.(true);
      };
      const onKeyDown = (event?: { key?: string; preventDefault?: () => void }) => {
        if (event?.key !== " " || !behavior.pressable) {
          return;
        }
        event.preventDefault?.();
        select();
      };
      return createElement(
        host.Pressable,
        {
          accessibilityRole: "radio",
          accessibilityState: { checked: behavior.checked, disabled: behavior.disabled },
          accessibilityLabel: props.accessibilityLabel,
          disabled: !behavior.pressable,
          // Radios select — they never untoggle themselves.
          onPress: behavior.pressable ? select : undefined,
          onKeyDown: behavior.pressable ? onKeyDown : undefined,
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
  field: { disabled?: boolean | undefined; invalid?: boolean | undefined },
  onControlText?: (value: string) => void,
  maxLength?: number,
  controlRef?: React.MutableRefObject<unknown>
): ReactNode {
  return React.Children.map(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) {
      return child;
    }

    return cloneElement(child, {
      // Field disabled/invalid는 감싼 컨트롤에도 실제로 반영돼요 — OR 의미론:
      // 필드가 잠그거나 invalid로 만들면 자식은 opt out 할 수 없어요
      // (react/hono 렌더러와 같은 크로스 렌더러 결정).
      ...(field.disabled ? { disabled: true } : {}),
      ...(field.invalid ? { invalid: true } : {}),
      accessibilityLabelledBy: a11y.ids.labelId,
      // A child's own descriptor ids stay first; the Field ids join after
      // (react/hono aria-describedby join parity — never clobbered).
      accessibilityDescribedBy: joinIds(
        typeof child.props.accessibilityDescribedBy === "string"
          ? child.props.accessibilityDescribedBy
          : undefined,
        a11y.control["aria-describedby"] as string | undefined
      ),
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
      // 라벨 프레스 포커스용 ref 합류 — Input/Textarea는 inputRef를 밑단
      // TextInput에 그대로 넘기므로 여기서 노드를 붙잡아요. 자식이 단 자신의
      // inputRef도 그대로 살려요 (describedBy join과 같은 비클로버 원칙).
      // inputRef를 모르는 컨트롤(Select 등)은 prop을 무시해 no-op이에요.
      ...(controlRef
        ? {
            inputRef: (node: unknown) => {
              const childRef = child.props.inputRef as React.Ref<unknown> | undefined;
              if (typeof childRef === "function") {
                childRef(node);
              } else if (childRef && typeof childRef === "object") {
                (childRef as React.MutableRefObject<unknown>).current = node;
              }
              controlRef.current = node;
            },
          }
        : {}),
    });
  });
}

/**
 * Character count from a controlled child's current `value` prop, if any —
 * re-read every render so external controlled updates stay in sync.
 */
function controlledNativeControlLength(children: ReactNode): number | undefined {
  let length: number | undefined;
  React.Children.forEach(children, (child) => {
    if (isValidElement<Record<string, unknown>>(child)) {
      const value = child.props.value;
      if (typeof value === "string") {
        length = value.length;
      }
    }
  });
  return length;
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
  | "selectCellActive"
  | "selectMenu"
  | "selectMenuContent"
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
  | "inputControlDisabled"
  | "inputDisabled"
  | "inputInvalid"
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
    // styles.css keeps the danger border under focus too — the invalid box
    // always reads danger, matching the Select trigger's invalid branch.
    inputInvalid: { borderColor: dangerColor },
    // .podo-input/.podo-textarea [data-state="disabled"]: foreground-disabled
    // fill + border-disabled hairline; the text drops to text-disabled
    // (styles.css fallback values — the Chip disabled grays).
    inputDisabled: { backgroundColor: "#E4E4E7", borderColor: "#D1D2D6" },
    inputControlDisabled: { color: "#9FA2AD" },
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
    // Layout base only — colors and metrics come from BUTTON_COLORS and
    // BUTTON_SIZES per theme/size (mirroring podo-ui/styles.css .podo-button).
    button: {
      alignItems: "center",
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
    },
    buttonLabel: { fontWeight: "600" },
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
    // Menu box shell (scroll container) — child layout lives in
    // selectMenuContent so ScrollView hosts can put it on contentContainerStyle.
    selectMenu: {
      backgroundColor: "#FFFFFF",
      borderColor: "#E4E4E7",
      borderRadius: 10,
      borderWidth: 1,
    },
    selectMenuContent: {
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
    // .podo-select__cell:hover / [data-active]: foreground-gray-light fill —
    // the keyboard-active cell reuses the pointer hover treatment.
    selectCellActive: { backgroundColor: "#F4F4F5" },
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
