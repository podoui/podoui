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
  Keyboard as ReactNativeKeyboard,
  KeyboardAvoidingView as ReactNativeKeyboardAvoidingView,
  Linking as ReactNativeLinking,
  Modal as ReactNativeModal,
  Pressable as ReactNativePressable,
  ScrollView as ReactNativeScrollView,
  Text as ReactNativeText,
  TextInput as ReactNativeTextInput,
  View as ReactNativeView,
} from "react-native";
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
  /** Optional keyboard-aware sheet host. Defaults to React Native KeyboardAvoidingView. */
  KeyboardAvoidingView?: NativeHostComponent;
  /** Optional overlay host. Defaults to React Native Modal in the published entry. */
  Modal?: NativeHostComponent;
  Pressable: NativeHostComponent;
  /** Optional scroll container — the Select menu uses it for its ten-row cap. */
  ScrollView?: NativeHostComponent;
  Text: NativeHostComponent;
  TextInput: NativeHostComponent;
  View: NativeHostComponent;
  /** Optional rich-editor surface, normally react-native-webview's WebView. */
  WebView?: NativeHostComponent;
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
  /** Font family loaded from the generated PodoIcons.ttf asset. */
  iconFontFamily?: string;
  /** react-native-webview WebView component used for the WYSIWYG Editor. */
  webViewComponent?: NativeHostComponent;
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

export type NativeDatePickerMode = "instant" | "period";
export type NativeDatePickerType = "date" | "time" | "datetime" | "hour";
export type NativeHourFormat = "24" | "12";
export type NativeMinuteStep = 1 | 5 | 10 | 15 | 20 | 30;
export type NativeHourStep = 1 | 2 | 3 | 4 | 6 | 12;

export interface NativeTimeValue {
  hour: number;
  minute: number;
}

export interface NativeDatePickerValue {
  date?: Date;
  time?: NativeTimeValue;
  endDate?: Date;
  endTime?: NativeTimeValue;
}

export interface NativeDateRange {
  from: Date;
  to: Date;
}

export type NativeDateCondition = Date | NativeDateRange | ((date: Date) => boolean);

export interface NativeDateTimeLimit {
  date: Date;
  time?: NativeTimeValue;
}

export interface NativeYearRange {
  min?: number;
  max?: number;
}

export type NativeCalendarInitial = "now" | "prevMonth" | "nextMonth" | Date;

export interface NativeInitialCalendar {
  start?: NativeCalendarInitial;
  end?: NativeCalendarInitial;
}

export interface NativeDatePickerProps {
  mode?: NativeDatePickerMode;
  type?: NativeDatePickerType;
  value?: NativeDatePickerValue;
  defaultValue?: NativeDatePickerValue;
  onChange?: (value: NativeDatePickerValue) => void;
  placeholder?: string;
  disabled?: boolean;
  showActions?: boolean;
  disable?: NativeDateCondition[];
  enable?: NativeDateCondition[];
  minDate?: Date | NativeDateTimeLimit;
  maxDate?: Date | NativeDateTimeLimit;
  minuteStep?: NativeMinuteStep;
  hourFormat?: NativeHourFormat;
  disabledHours?: number[];
  hourStep?: NativeHourStep;
  format?: string;
  initialCalendar?: NativeInitialCalendar;
  yearRange?: NativeYearRange;
  quickSelect?: boolean;
  hideNavArrow?: boolean;
  onReset?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export type NativeEditorToolbarItem =
  | "undo-redo"
  | "paragraph"
  | "text-style"
  | "color"
  | "align"
  | "list"
  | "table"
  | "link"
  | "image"
  | "youtube"
  | "hr"
  | "format"
  | "code";

export interface NativeEditorValidator {
  safeParse: (value: string) => {
    success: boolean;
    error?: { issues?: Array<{ message?: string }> };
  };
}

export interface NativeEditorImageAsset {
  uri: string;
  alt?: string;
}

export type NativeEditorImageUploadHandler = (
  asset: NativeEditorImageAsset
) => Promise<string | NativeEditorImageAsset>;

export interface NativeEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  toolbar?: NativeEditorToolbarItem[];
  validator?: NativeEditorValidator;
  /** Optional native image picker bridge. Return a URI or an object with URI/alt text. */
  onImagePick?: () => Promise<string | NativeEditorImageAsset | undefined>;
  /** 선택한 이미지를 외부 저장소에서 처리하고 본문에 넣을 공개 URI를 반환합니다. */
  onImageUpload?: NativeEditorImageUploadHandler;
  /** 외부 이미지 처리 실패 알림. 실패한 이미지는 본문에 삽입하지 않습니다. */
  onImageUploadError?: (error: unknown, asset: NativeEditorImageAsset) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export interface NativeEditorViewProps {
  value: string;
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
  DatePicker: (props: NativeDatePickerProps) => React.ReactElement;
  Editor: (props: NativeEditorProps) => React.ReactElement;
  EditorView: (props: NativeEditorViewProps) => React.ReactElement;
}

export type NativeStyle = Record<string, string | number | undefined>;

export const defaultNativeHost: NativeHost = {
  KeyboardAvoidingView: ReactNativeKeyboardAvoidingView as unknown as NativeHostComponent,
  Modal: ReactNativeModal as unknown as NativeHostComponent,
  Pressable: ReactNativePressable as unknown as NativeHostComponent,
  ScrollView: ReactNativeScrollView as unknown as NativeHostComponent,
  Text: ReactNativeText as unknown as NativeHostComponent,
  TextInput: ReactNativeTextInput as unknown as NativeHostComponent,
  View: ReactNativeView as unknown as NativeHostComponent,
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
  iconFontFamily,
  webViewComponent,
  children,
}: NativeThemeProviderProps): React.ReactElement {
  const value = {
    theme,
    colorScheme,
    ...(typeof tokens === "undefined" ? {} : { tokens }),
    ...(typeof iconGlyphs === "undefined" ? {} : { iconGlyphs }),
    ...(typeof iconFontFamily === "undefined" ? {} : { iconFontFamily }),
    ...(typeof webViewComponent === "undefined" ? {} : { webViewComponent }),
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
function nativeButtonColors(
  theme: NativeTheme,
  themeName: NativeButtonTheme
): { fill: string; label: string; border: string; pressed: string } {
  const tokens = adaptReactNativeTokens(theme.tokens);
  const fallback = BUTTON_COLORS[themeName];
  const semantic = nativeSemanticColors(theme);
  const label =
    themeName === "solid-primary" || themeName === "solid-danger"
      ? semantic.textStaticInvert
      : themeName === "outline-primary"
        ? semantic.foregroundPrimary
        : themeName === "outline-danger"
          ? semantic.foregroundDanger
          : semantic.text;
  const border = themeName.startsWith("outline-")
    ? (stringToken(tokens, ["button", `border-${themeName.slice("outline-".length)}`]) ??
      fallback.border)
    : "transparent";
  return {
    fill:
      stringToken(tokens, ["button", `background-${themeName}`]) ??
      (theme.colorScheme === "dark" && themeName.startsWith("outline-")
        ? semantic.background
        : fallback.fill),
    label,
    border,
    pressed: stringToken(tokens, ["button", `background-${themeName}-pressed`]) ?? fallback.pressed,
  };
}

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

// Fantasticon normalizes the icon font to a 512-unit height while preserving
// each source SVG's horizontal advance. Most glyphs fit a square em, but the
// wider editor glyphs below do not. Giving them a square Text box clips their
// right edge on iOS/Android (most noticeably the final `code` toolbar item).
// Keep this in sync with packages/icons/samples/svg/editor viewBox widths.
const NATIVE_GLYPH_ADVANCE_RATIOS: Readonly<Record<string, number>> = {
  highlight: 576 / 512,
  link: 640 / 512,
  youtube: 576 / 512,
  hr: 640 / 512,
  eraser: 576 / 512,
  code: 640 / 512,
};
const NATIVE_GLYPH_HORIZONTAL_SAFETY = 2;

// Select menu ten-row cap (select.component.json: the menu "caps at ten 42px
// rows (474px) and scrolls beyond"). Computed from this file's own styles:
// 10 rows × selectCell minHeight 42 + 9 gaps × selectMenuContent gap 4
// + 2 × selectMenuContent padding 8 + 2 × selectMenu borderWidth 1 = 474.
// RN styles size border-box, so the box border counts toward maxHeight; the
// content padding scrolls with the cells inside the content container.
const SELECT_MENU_MAX_HEIGHT = 10 * 42 + 9 * 4 + 2 * 8 + 2 * 1;

const NATIVE_EDITOR_TOOLBAR: NativeEditorToolbarItem[] = [
  "undo-redo",
  "paragraph",
  "text-style",
  "color",
  "align",
  "list",
  "table",
  "link",
  "image",
  "youtube",
  "hr",
  "format",
  "code",
];

// Keep the native editor choices in lockstep with the v1 React editor.  The
// presentation changes on phones (bottom sheets and long-press), but the
// available authoring operations must not shrink just because the surface is
// native.
const NATIVE_EDITOR_COLORS = [
  [
    "#ff0000",
    "#ff8000",
    "#ffff00",
    "#80ff00",
    "#00ffff",
    "#0080ff",
    "#0000ff",
    "#8000ff",
    "#ff00ff",
    "#ffffff",
    "#000000",
  ],
  [
    "#ffcccc",
    "#ffe0cc",
    "#ffffcc",
    "#e0ffcc",
    "#ccffff",
    "#cce0ff",
    "#ccccff",
    "#e0ccff",
    "#ffccff",
    "#f5f5f5",
    "#cccccc",
  ],
  [
    "#ff9999",
    "#ffcc99",
    "#ffff99",
    "#ccff99",
    "#99ffff",
    "#99ccff",
    "#9999ff",
    "#cc99ff",
    "#ff99ff",
    "#e6e6e6",
    "#999999",
  ],
  [
    "#ff6666",
    "#ffb366",
    "#ffff66",
    "#b3ff66",
    "#66ffff",
    "#66b3ff",
    "#6666ff",
    "#b366ff",
    "#ff66ff",
    "#d9d9d9",
    "#666666",
  ],
  [
    "#cc0000",
    "#cc6600",
    "#cccc00",
    "#66cc00",
    "#00cccc",
    "#0066cc",
    "#0000cc",
    "#6600cc",
    "#cc00cc",
    "#b3b3b3",
    "#333333",
  ],
  [
    "#800000",
    "#804000",
    "#808000",
    "#408000",
    "#008080",
    "#004080",
    "#000080",
    "#400080",
    "#800080",
    "#808080",
    "#1a1a1a",
  ],
] as const;

const NATIVE_EDITOR_PARAGRAPHS = [
  { value: "h1", label: "제목 1", size: 28, weight: "700" },
  { value: "h2", label: "제목 2", size: 24, weight: "700" },
  { value: "h3", label: "제목 3", size: 20, weight: "700" },
  { value: "p", label: "본문", size: 16, weight: "400" },
  { value: "p1", label: "P1", size: 24, weight: "400" },
  { value: "p2", label: "P2", size: 20, weight: "400" },
  { value: "p3", label: "P3", size: 16, weight: "400" },
  { value: "p3_semibold", label: "P3 Semibold", size: 16, weight: "600" },
  { value: "p4", label: "P4", size: 14, weight: "400" },
  { value: "p4_semibold", label: "P4 Semibold", size: 14, weight: "600" },
  { value: "p5", label: "P5", size: 12, weight: "400" },
  { value: "p5_semibold", label: "P5 Semibold", size: 12, weight: "600" },
] as const;

const NATIVE_EDITOR_PANEL_TITLES: Record<string, string> = {
  paragraph: "문단 형식",
  color: "글꼴 색상",
  background: "배경 색상",
  align: "문단 정렬",
  table: "표 삽입",
  "table-context": "표 편집",
  link: "링크 삽입",
  image: "이미지 삽입",
  "image-edit": "이미지 편집",
  youtube: "YouTube 삽입",
  "youtube-edit": "YouTube 편집",
};

function nativeStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nativeSameDay(left: Date | undefined, right: Date | undefined): boolean {
  return Boolean(
    left &&
    right &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function nativeDateInRange(date: Date, range: NativeDateRange): boolean {
  const value = nativeStartOfDay(date).getTime();
  return (
    value >= nativeStartOfDay(range.from).getTime() && value <= nativeStartOfDay(range.to).getTime()
  );
}

function nativeMatchesDateCondition(date: Date, condition: NativeDateCondition): boolean {
  if (condition instanceof Date) {
    return nativeSameDay(date, condition);
  }
  if (typeof condition === "function") {
    return condition(date);
  }
  return nativeDateInRange(date, condition);
}

function nativeLimitDate(limit: Date | NativeDateTimeLimit | undefined): Date | undefined {
  if (!limit) return undefined;
  return limit instanceof Date ? limit : limit.date;
}

function nativeLimitTime(
  limit: Date | NativeDateTimeLimit | undefined,
  date: Date | undefined
): NativeTimeValue | undefined {
  if (!limit || limit instanceof Date || !date || !nativeSameDay(limit.date, date)) {
    return undefined;
  }
  return limit.time;
}

function nativeClampTime(
  date: Date | undefined,
  time: NativeTimeValue,
  props: NativeDatePickerProps,
  step: number
): NativeTimeValue {
  const min = nativeLimitTime(props.minDate, date);
  const max = nativeLimitTime(props.maxDate, date);
  if (!min && !max) return time;

  const toMinutes = (value: NativeTimeValue) => value.hour * 60 + value.minute;
  const fromMinutes = (value: number): NativeTimeValue => ({
    hour: Math.floor(value / 60),
    minute: value % 60,
  });
  const minMinutes = min ? toMinutes(min) : 0;
  const maxMinutes = max ? toMinutes(max) : 24 * 60 - 1;
  const candidate = toMinutes(time);
  if (candidate < minMinutes) {
    const aligned = Math.ceil(minMinutes / step) * step;
    return aligned <= maxMinutes && aligned < 24 * 60 ? fromMinutes(aligned) : { ...min! };
  }
  if (candidate > maxMinutes) {
    const aligned = Math.floor(maxMinutes / step) * step;
    return aligned >= minMinutes ? fromMinutes(aligned) : { ...max! };
  }
  return time;
}

function nativeDateDisabled(date: Date, props: NativeDatePickerProps): boolean {
  const day = nativeStartOfDay(date).getTime();
  const min = nativeLimitDate(props.minDate);
  const max = nativeLimitDate(props.maxDate);
  if (min && day < nativeStartOfDay(min).getTime()) return true;
  if (max && day > nativeStartOfDay(max).getTime()) return true;
  if (props.yearRange?.min != null && date.getFullYear() < props.yearRange.min) return true;
  if (props.yearRange?.max != null && date.getFullYear() > props.yearRange.max) return true;
  if (
    props.enable?.length &&
    !props.enable.some((condition) => nativeMatchesDateCondition(date, condition))
  ) {
    return true;
  }
  return Boolean(props.disable?.some((condition) => nativeMatchesDateCondition(date, condition)));
}

function nativeResolveCalendar(initial: NativeCalendarInitial | undefined, fallback: Date): Date {
  if (initial instanceof Date) return new Date(initial.getFullYear(), initial.getMonth(), 1);
  const base = new Date();
  if (initial === "prevMonth") return new Date(base.getFullYear(), base.getMonth() - 1, 1);
  if (initial === "nextMonth") return new Date(base.getFullYear(), base.getMonth() + 1, 1);
  if (initial === "now") return new Date(base.getFullYear(), base.getMonth(), 1);
  return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
}

function nativeFormatDatePart(date: Date | undefined): string {
  if (!date) return "";
  return `${date.getFullYear()} - ${String(date.getMonth() + 1).padStart(2, "0")} - ${String(date.getDate()).padStart(2, "0")}`;
}

function nativeFormatTimePart(
  time: NativeTimeValue | undefined,
  hourFormat: NativeHourFormat = "24"
): string {
  if (!time) return "";
  if (hourFormat === "12") {
    const period = time.hour < 12 ? "오전" : "오후";
    const hour = time.hour % 12 || 12;
    return `${period} ${String(hour).padStart(2, "0")} : ${String(time.minute).padStart(2, "0")}`;
  }
  return `${String(time.hour).padStart(2, "0")} : ${String(time.minute).padStart(2, "0")}`;
}

function nativeFormatDatePickerValue(
  value: NativeDatePickerValue,
  type: NativeDatePickerType,
  pattern: string | undefined,
  hourFormat: NativeHourFormat
): string {
  const date = value.date;
  const time = value.time;
  if (pattern) {
    let output = pattern;
    if (date) {
      output = output
        .replace(/y/g, String(date.getFullYear()))
        .replace(/m/g, String(date.getMonth() + 1).padStart(2, "0"))
        .replace(/d/g, String(date.getDate()).padStart(2, "0"));
    }
    if (time) {
      output = output
        .replace(/h/g, String(time.hour).padStart(2, "0"))
        .replace(/i/g, String(time.minute).padStart(2, "0"));
    }
    return output;
  }
  if (type === "time" || type === "hour") return nativeFormatTimePart(time, hourFormat);
  if (type === "datetime") {
    return [nativeFormatDatePart(date), nativeFormatTimePart(time, hourFormat)]
      .filter(Boolean)
      .join(" ");
  }
  return nativeFormatDatePart(date);
}

function nativeCalendarDays(viewDate: Date): Date[] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from(
    { length: 42 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
  );
}

function nativeQuickRange(key: string, now = new Date()): { date: Date; endDate: Date } {
  const today = nativeStartOfDay(now);
  const addDays = (count: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + count);
  if (key === "today") return { date: today, endDate: today };
  if (key === "yesterday") {
    const yesterday = addDays(-1);
    return { date: yesterday, endDate: yesterday };
  }
  if (key === "last7Days") return { date: addDays(-6), endDate: today };
  if (key === "last30Days") return { date: addDays(-29), endDate: today };
  if (key === "thisWeek") {
    const date = addDays(-today.getDay());
    return {
      date,
      endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6),
    };
  }
  if (key === "lastWeek") {
    const date = addDays(-today.getDay() - 7);
    return {
      date,
      endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 6),
    };
  }
  if (key === "thisMonth") {
    return {
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
    };
  }
  return {
    date: new Date(today.getFullYear(), today.getMonth() - 1, 1),
    endDate: new Date(today.getFullYear(), today.getMonth(), 0),
  };
}

function nativeClampQuickRange(
  range: { date: Date; endDate: Date },
  props: NativeDatePickerProps
): { date: Date; endDate: Date } {
  const min = nativeLimitDate(props.minDate);
  const max = nativeLimitDate(props.maxDate);
  return {
    date:
      min && nativeStartOfDay(range.date).getTime() < nativeStartOfDay(min).getTime()
        ? nativeStartOfDay(min)
        : range.date,
    endDate:
      max && nativeStartOfDay(range.endDate).getTime() > nativeStartOfDay(max).getTime()
        ? nativeStartOfDay(max)
        : range.endDate,
  };
}

function nativeQuickRangeDisabled(
  range: { date: Date; endDate: Date },
  props: NativeDatePickerProps
): boolean {
  const min = nativeLimitDate(props.minDate);
  const max = nativeLimitDate(props.maxDate);
  return Boolean(
    (min && nativeStartOfDay(range.endDate).getTime() < nativeStartOfDay(min).getTime()) ||
    (max && nativeStartOfDay(range.date).getTime() > nativeStartOfDay(max).getTime())
  );
}

function nativeEncodeEditorUrlAttribute(value: string): string {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    if (!`"'<>\``.includes(character) && codePoint > 0x20 && codePoint !== 0x7f) {
      return character;
    }
    return encodeURIComponent(character).replace(
      /[!'()*]/g,
      (reserved) => `%${reserved.charCodeAt(0).toString(16).toUpperCase()}`
    );
  })
    .join("")
    .replace(/\u2028/g, "%E2%80%A8")
    .replace(/\u2029/g, "%E2%80%A9");
}

function nativeEscapeEditorUrlAttribute(value: string): string {
  return nativeEncodeEditorUrlAttribute(value).replace(/&/g, "&amp;");
}

function nativeSafeEditorUrl(
  value: string,
  kind: "link" | "image" | "youtube"
): string | undefined {
  const source = value.trim();
  if (kind === "youtube") {
    const match = source.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i
    );
    return match?.[1]
      ? `https://www.youtube-nocookie.com/embed/${nativeEncodeEditorUrlAttribute(match[1])}`
      : undefined;
  }
  const allowed =
    kind === "image"
      ? /^(?:https?:\/\/|data:image\/(?:png|gif|jpeg|webp);base64,)/i
      : /^(?:https?:\/\/|mailto:|tel:|\/|#)/i;
  const hasControlCharacter = Array.from(source).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f;
  });
  return allowed.test(source) && !hasControlCharacter ? source : undefined;
}

function nativePlainTextFromHtml(value: unknown): string {
  return (typeof value === "string" ? value : "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|blockquote|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<hr\s*\/?>/gi, "────────")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function nativeTableHtml(rows: number, columns: number): string {
  const cells = Array.from({ length: columns }, () => "<td><br></td>").join("");
  return `<table><tbody>${Array.from({ length: rows }, () => `<tr>${cells}</tr>`).join("")}</tbody></table>`;
}

function nativeSanitizeEditorHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  const blockedElements =
    "script|object|embed|form|input|meta|link|base|style|svg|math|template|details|summary|dialog|video|audio|canvas|noscript|frame|frameset";
  return value
    .replace(new RegExp(`<(${blockedElements})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, "gi"), "")
    .replace(new RegExp(`<(?:${blockedElements})\\b[^>]*\\/?\\s*>`, "gi"), "")
    .replace(/[\s/]+on[a-z][a-z0-9:_-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/[\s/]+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /[\s/]+(?:href|src|xlink:href|action|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
      (attribute) =>
        /(?:javascript|vbscript)\s*:|data\s*:\s*text\/html/i.test(attribute) ? "" : attribute
    )
    .replace(/[\s/]+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (attribute) =>
      /(?:url\s*\(|expression\s*\(|@import|behavior\s*:|-moz-binding)/i.test(attribute)
        ? ""
        : attribute
    )
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, (iframe) => {
      const source = iframe.match(
        /\bsrc\s*=\s*(["'])https:\/\/www\.youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,})\1/i
      );
      return source?.[2] ? `<podo-youtube data-video="${source[2]}"></podo-youtube>` : "";
    })
    .replace(/<\/?iframe\b[^>]*>/gi, "")
    .replace(
      /<podo-youtube data-video="([A-Za-z0-9_-]{6,})"><\/podo-youtube>/gi,
      '<iframe src="https://www.youtube-nocookie.com/embed/$1" title="YouTube video" allowfullscreen></iframe>'
    );
}

function nativeEditorWebDocument(
  value: unknown,
  options: { editable: boolean; color: string; background: string; placeholder?: string }
): string {
  const html = nativeSanitizeEditorHtml(value);
  const placeholder = JSON.stringify(options.placeholder ?? "내용을 입력하세요...")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:${options.background};color:${options.color};font-family:-apple-system,BlinkMacSystemFont,"Pretendard",sans-serif;font-size:16px;line-height:1.6}
#editor{min-height:${options.editable ? "210px" : "1px"};padding:${options.editable ? "14px" : "0"};outline:none;word-break:break-word}
#editor:empty:before{content:${placeholder};color:#9FA2AD;pointer-events:none}
p{margin:0 0 10px}h1{font-size:28px;line-height:1.3;margin:0 0 12px}h2{font-size:24px;line-height:1.35;margin:0 0 12px}h3{font-size:20px;line-height:1.4;margin:0 0 10px}
.podo-p1{font-size:24px}.podo-p2{font-size:20px}.podo-p3{font-size:16px}.podo-p4{font-size:14px}.podo-p5{font-size:12px}.podo-semibold{font-weight:600}
ul,ol{padding-left:24px}blockquote{border-left:3px solid #D1D2D6;margin:10px 0;padding-left:12px;color:#6B6B73}
a{color:#426CED}img{display:block;max-width:100%;height:auto;margin:10px auto;border-radius:8px}.podo-youtube{margin:10px auto;max-width:100%;position:relative}.podo-youtube iframe{display:block;width:100%;min-height:190px;border:0;border-radius:8px;pointer-events:none}
table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #D1D2D6;min-width:44px;padding:8px;vertical-align:top}td.podo-selected,th.podo-selected,img.podo-selected,.podo-youtube.podo-selected{outline:2px solid #426CED;outline-offset:1px}hr{border:0;border-top:1px solid #D1D2D6;margin:16px 0}
</style></head><body><div id="editor" contenteditable="${options.editable ? "true" : "false"}" role="textbox" aria-multiline="true">${html}</div>
<script>
(function(){
var editor=document.getElementById('editor');var savedRange=null;var activeTarget=null;var holdTimer=null;var holdStart=null;
function post(payload){if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(payload));}}
function saveRange(){var selection=window.getSelection();if(selection&&selection.rangeCount&&editor.contains(selection.anchorNode)){savedRange=selection.getRangeAt(0).cloneRange();}}
function restoreRange(){if(!savedRange)return;var selection=window.getSelection();selection.removeAllRanges();selection.addRange(savedRange);}
function blurEditor(){saveRange();editor.setAttribute('contenteditable','false');editor.blur();document.body.setAttribute('tabindex','-1');document.body.focus({preventScroll:true});var selection=window.getSelection();if(selection)selection.removeAllRanges();}
function focusEditor(){editor.setAttribute('contenteditable','true');editor.focus();var selection=window.getSelection();if(!selection)return;try{if(savedRange){selection.removeAllRanges();selection.addRange(savedRange);return;}}catch(error){}var range=document.createRange();range.selectNodeContents(editor);range.collapse(false);selection.removeAllRanges();selection.addRange(range);savedRange=range;}
function postState(){if(!${options.editable ? "true" : "false"})return;var selection=window.getSelection();if(!selection||!selection.anchorNode||!editor.contains(selection.anchorNode))return;var node=selection.anchorNode.nodeType===3?selection.anchorNode.parentElement:selection.anchorNode;var block=node&&node.closest?node.closest('p,h1,h2,h3'):null;var paragraph=block?(block.tagName.toLowerCase()==='p'?(block.classList.contains('podo-p1')?'p1':block.classList.contains('podo-p2')?'p2':block.classList.contains('podo-p3')?(block.classList.contains('podo-semibold')?'p3_semibold':'p3'):block.classList.contains('podo-p4')?(block.classList.contains('podo-semibold')?'p4_semibold':'p4'):block.classList.contains('podo-p5')?(block.classList.contains('podo-semibold')?'p5_semibold':'p5'):'p'):block.tagName.toLowerCase()):'p';post({type:'state',bold:document.queryCommandState('bold'),italic:document.queryCommandState('italic'),underline:document.queryCommandState('underline'),strike:document.queryCommandState('strikeThrough'),align:document.queryCommandState('justifyCenter')?'center':document.queryCommandState('justifyRight')?'right':'left',paragraph:paragraph});}
function emit(){saveRange();postState();post({type:'input',html:editor.innerHTML,height:document.documentElement.scrollHeight});}
function postHeight(){post({type:'height',height:document.documentElement.scrollHeight});}
function clearSelected(){Array.prototype.forEach.call(editor.querySelectorAll('.podo-selected'),function(item){item.classList.remove('podo-selected');});}
function targetInfo(target){var cell=target&&target.closest?target.closest('td,th'):null;if(cell)return{kind:'table',target:cell};var image=target&&target.closest?target.closest('img'):null;if(image)return{kind:'image',target:image};var youtube=target&&target.closest?target.closest('.podo-youtube'):null;if(youtube)return{kind:'youtube',target:youtube};return null;}
function activate(info){if(!info)return;clearSelected();activeTarget=info.target;activeTarget.classList.add('podo-selected');if(info.kind==='table'){var range=document.createRange();range.selectNodeContents(activeTarget);range.collapse(true);blurEditor();savedRange=range;post({type:'context',kind:'table'});return;}var width=activeTarget.style.width||'100%';var align=activeTarget.style.marginLeft==='auto'&&activeTarget.style.marginRight==='auto'?'center':activeTarget.style.marginLeft==='auto'?'right':'left';blurEditor();post({type:'context',kind:info.kind,width:width,align:align,alt:info.kind==='image'?(activeTarget.getAttribute('alt')||''):''});}
function tableCell(){if(activeTarget&&activeTarget.closest&&activeTarget.closest('td,th'))return activeTarget.closest('td,th');var selection=window.getSelection();if(!selection||!selection.anchorNode)return null;var node=selection.anchorNode.nodeType===3?selection.anchorNode.parentElement:selection.anchorNode;return node&&node.closest?node.closest('td,th'):null;}
function tableCommand(name){var cell=tableCell();if(!cell)return;var row=cell.parentElement;var table=cell.closest('table');var index=Array.prototype.indexOf.call(row.children,cell);
if(name==='row-above'||name==='row-below'){var clone=row.cloneNode(true);Array.prototype.forEach.call(clone.children,function(item){item.innerHTML='<br>';});row.parentElement.insertBefore(clone,name==='row-above'?row:row.nextSibling);}
if(name==='row-delete'){row.remove();if(table&&!table.querySelector('tr'))table.remove();}
if(name==='column-left'||name==='column-right'){Array.prototype.forEach.call(table.querySelectorAll('tr'),function(item){var ref=item.children[index];var next=document.createElement('td');next.innerHTML='<br>';item.insertBefore(next,name==='column-left'?ref:ref?ref.nextSibling:null);});}
if(name==='column-delete'){Array.prototype.forEach.call(table.querySelectorAll('tr'),function(item){if(item.children[index])item.children[index].remove();});if(table&&!table.querySelector('td,th'))table.remove();}
if(name==='cell-color')cell.style.backgroundColor=arguments[1]||'';
if(name==='cell-align')cell.style.textAlign=arguments[1]||'left';
if(name==='table-delete'&&table)table.remove();}
function mediaCommand(message){if(!activeTarget||!activeTarget.isConnected)return;if(message.action==='delete'){activeTarget.remove();activeTarget=null;return;}var width=message.width;if(width){activeTarget.style.width=width==='original'?'auto':width;}if(message.align){activeTarget.style.marginLeft=message.align==='center'||message.align==='right'?'auto':'0';activeTarget.style.marginRight=message.align==='center'||message.align==='left'?'auto':'0';}if(activeTarget.tagName==='IMG'&&typeof message.alt==='string')activeTarget.setAttribute('alt',message.alt);clearSelected();}
function command(message){if(!${options.editable ? "true" : "false"})return;var name=message.command;var value=message.value||null;if(name.indexOf('table-')!==0&&name!=='media-edit'){focusEditor();}
if(name==='insertHTML'){document.execCommand('insertHTML',false,value||'');}
else if(name==='formatBlock'){var style=value||'p';var block=/^h[1-3]$/.test(style)?style:'p';document.execCommand('formatBlock',false,block);var selection=window.getSelection();var node=selection&&selection.anchorNode?(selection.anchorNode.nodeType===3?selection.anchorNode.parentElement:selection.anchorNode):null;var paragraph=node&&node.closest?node.closest('p,h1,h2,h3'):null;if(paragraph){paragraph.className='';if(/^p[1-5]/.test(style))paragraph.classList.add('podo-'+style.slice(0,2));if(style.indexOf('semibold')>0)paragraph.classList.add('podo-semibold');}}
else if(name==='link'){var selection=window.getSelection();if(selection&&selection.isCollapsed){var link=document.createElement('a');link.href=message.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=message.label||message.url;document.execCommand('insertHTML',false,link.outerHTML);}else{document.execCommand('createLink',false,message.url);}}
else if(name==='image'){var image=document.createElement('img');image.src=message.url;image.alt=message.alt||'';image.style.width=message.width==='original'?'auto':(message.width||'100%');image.style.marginLeft=message.align==='right'||message.align==='center'?'auto':'0';image.style.marginRight=message.align==='left'||message.align==='center'?'auto':'0';document.execCommand('insertHTML',false,image.outerHTML);}
else if(name==='youtube'){var wrapper=document.createElement('div');wrapper.className='podo-youtube';wrapper.style.width=message.width==='original'?'560px':(message.width||'100%');wrapper.style.marginLeft=message.align==='right'||message.align==='center'?'auto':'0';wrapper.style.marginRight=message.align==='left'||message.align==='center'?'auto':'0';var frame=document.createElement('iframe');frame.src=message.url;frame.title='YouTube video';frame.setAttribute('allowfullscreen','');wrapper.appendChild(frame);document.execCommand('insertHTML',false,wrapper.outerHTML);}
else if(name.indexOf('table-')===0){tableCommand(name.slice(6),value);if(!message.keepActive){clearSelected();activeTarget=null;focusEditor();}}
else if(name==='media-edit'){mediaCommand(message);clearSelected();activeTarget=null;focusEditor();}
else{document.execCommand(name,false,value);}emit();}
function receive(event){try{var message=JSON.parse(event.data);if(message.type==='command')command(message);if(message.type==='blur')blurEditor();if(message.type==='dismiss'){clearSelected();activeTarget=null;setTimeout(focusEditor,120);}if(message.type==='set'&&editor.innerHTML!==message.html){editor.innerHTML=message.html||'';}}catch(error){}}
editor.addEventListener('input',emit);editor.addEventListener('keyup',function(){saveRange();postState();});editor.addEventListener('mouseup',function(){saveRange();postState();});
editor.addEventListener('click',function(event){var info=targetInfo(event.target);if(info&&(info.kind==='image'||info.kind==='youtube')){event.preventDefault();activate(info);}});
editor.addEventListener('contextmenu',function(event){var info=targetInfo(event.target);if(info){event.preventDefault();activate(info);}});
editor.addEventListener('touchstart',function(event){var touch=event.touches&&event.touches[0];var info=targetInfo(event.target);if(!touch||!info)return;holdStart={x:touch.clientX,y:touch.clientY};clearTimeout(holdTimer);holdTimer=setTimeout(function(){activate(info);holdTimer=null;},550);},{passive:true});
editor.addEventListener('touchmove',function(event){var touch=event.touches&&event.touches[0];if(holdTimer&&touch&&holdStart&&(Math.abs(touch.clientX-holdStart.x)>10||Math.abs(touch.clientY-holdStart.y)>10)){clearTimeout(holdTimer);holdTimer=null;}},{passive:true});
editor.addEventListener('touchend',function(){if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}saveRange();},{passive:true});
document.addEventListener('message',receive);window.addEventListener('message',receive);
document.addEventListener('selectionchange',postState);
window.__podoReceive=receive;window.__podoCommand=command;window.__podoSetHtml=function(html){if(editor.innerHTML!==html){editor.innerHTML=html||'';}};
window.addEventListener('load',postHeight);if(typeof ResizeObserver!=='undefined'){new ResizeObserver(postHeight).observe(document.body);}Array.prototype.forEach.call(editor.querySelectorAll('img,iframe'),function(asset){asset.addEventListener('load',postHeight);});
post({type:'ready',height:document.documentElement.scrollHeight});
})();
</script></body></html>`;
}

export function createNativeComponents(host: NativeHost = defaultNativeHost): NativeComponents {
  const glyphFallbacks: Record<string, string> = {
    undo: "↶",
    redo: "↷",
    bold: "B",
    italic: "I",
    underline: "U",
    strikethrough: "S",
    "font-color": "A",
    highlight: "▰",
    "align-left": "≡",
    "align-center": "≡",
    "align-right": "≡",
    "list-ul": "•",
    "list-ol": "1.",
    table: "▦",
    link: "↗",
    image: "▧",
    youtube: "▶",
    hr: "―",
    eraser: "Tx",
    code: "</>",
    check: "✓",
    close: "×",
    "chevron-left": "‹",
    "chevron-right": "›",
    calendar: "▣",
    time: "◷",
  };
  const nativeGlyph = (
    theme: NativeTheme,
    name: string,
    color: string,
    size = 20,
    rotate?: string
  ) => {
    const advanceRatio = NATIVE_GLYPH_ADVANCE_RATIOS[name] ?? 1;
    const glyphWidth = Math.ceil(size * advanceRatio) + NATIVE_GLYPH_HORIZONTAL_SAFETY;
    return createElement(
      host.Text,
      {
        allowFontScaling: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
        "aria-hidden": true,
        style: {
          color,
          fontFamily: theme.iconFontFamily,
          fontSize: size,
          height: size,
          lineHeight: size,
          textAlign: "center",
          transform: rotate ? [{ rotate }] : undefined,
          width: glyphWidth,
        },
      },
      theme.iconGlyphs?.[name] ?? glyphFallbacks[name] ?? name
    );
  };

  function NativeWebEditor({
    editorProps,
    WebViewComponent,
  }: {
    editorProps: NativeEditorProps;
    WebViewComponent: NativeHostComponent;
  }): React.ReactElement {
    const theme = usePodoNativeTheme();
    const semantic = nativeSemanticColors(theme);
    const editorValue = typeof editorProps.value === "string" ? editorProps.value : "";
    const enabled = new Set(editorProps.toolbar ?? NATIVE_EDITOR_TOOLBAR);
    const [panel, setPanel] = useState<string | null>(null);
    const [auxValue, setAuxValue] = useState("");
    const [mediaWidth, setMediaWidth] = useState("100%");
    const [mediaAlign, setMediaAlign] = useState("center");
    const [mediaAlt, setMediaAlt] = useState("");
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [tableColorOpen, setTableColorOpen] = useState(false);
    const [formatState, setFormatState] = useState({
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      align: "left",
      paragraph: "p",
    });
    const [codeMode, setCodeMode] = useState(false);
    const [ready, setReady] = useState(false);
    const webRef = useRef<{
      injectJavaScript?: (script: string) => void;
      postMessage?: (message: string) => void;
    } | null>(null);
    const lastWebValue = useRef(nativeSanitizeEditorHtml(editorValue));

    const post = (payload: Record<string, unknown>) => {
      const message = JSON.stringify(payload);
      if (webRef.current?.injectJavaScript) {
        const encodedPayload = JSON.stringify(payload)
          .replace(/</g, "\\u003c")
          .replace(/\u2028/g, "\\u2028")
          .replace(/\u2029/g, "\\u2029");
        const encodedHtml = (JSON.stringify(String(payload.html ?? "")) ?? '""')
          .replace(/</g, "\\u003c")
          .replace(/\u2028/g, "\\u2028")
          .replace(/\u2029/g, "\\u2029");
        const script =
          payload.type === "command"
            ? `window.__podoCommand&&window.__podoCommand(${encodedPayload});true;`
            : payload.type === "set"
              ? `window.__podoSetHtml&&window.__podoSetHtml(${encodedHtml});true;`
              : `window.__podoReceive&&window.__podoReceive({data:${JSON.stringify(message)}});true;`;
        webRef.current.injectJavaScript(script);
        return;
      }
      webRef.current?.postMessage?.(message);
    };
    const command = (
      name: string,
      value?: string,
      extra?: Record<string, string>,
      closePanel = true
    ) => {
      post({ type: "command", command: name, ...(value ? { value } : {}), ...extra });
      if (closePanel) setPanel(null);
    };
    const dismissPanel = () => {
      post({ type: "dismiss" });
      setPanel(null);
    };

    useEffect(() => {
      const safeValue = nativeSanitizeEditorHtml(editorValue);
      if (ready && safeValue !== lastWebValue.current) {
        lastWebValue.current = safeValue;
        post({ type: "set", html: safeValue });
      }
    }, [editorValue, ready]);

    const toolButton = (
      key: string,
      label: string,
      iconName: string,
      action: () => void,
      active = false
    ) =>
      createElement(
        host.Pressable,
        {
          key,
          accessibilityRole: "button",
          accessibilityLabel: label,
          onPress: action,
          style: {
            alignItems: "center",
            backgroundColor: active ? semantic.foregroundInfoLight : "transparent",
            borderColor: active ? semantic.borderPrimary : "transparent",
            borderRadius: 7,
            borderWidth: 1,
            height: 36,
            justifyContent: "center",
            width: 36,
          },
        },
        nativeGlyph(theme, iconName, active ? semantic.foregroundPrimary : semantic.text, 18)
      );
    const panelButton = (key: string, label: string, action: () => void, disabled = false) =>
      createElement(
        host.Pressable,
        {
          key,
          accessibilityRole: "button",
          accessibilityLabel: label,
          disabled,
          onPress: disabled ? undefined : action,
          style: {
            alignItems: "center",
            backgroundColor: semantic.background,
            borderColor: semantic.borderGray,
            borderRadius: 8,
            borderWidth: 1,
            justifyContent: "center",
            minHeight: 38,
            opacity: disabled ? 0.55 : 1,
            paddingHorizontal: 12,
          },
        },
        createElement(host.Text, { style: { color: semantic.text, fontSize: 13 } }, label)
      );
    const togglePanel = (name: string) => {
      ReactNativeKeyboard?.dismiss?.();
      post({ type: "blur" });
      setAuxValue("");
      setMediaWidth("100%");
      setMediaAlign("center");
      setMediaAlt("");
      setTableColorOpen(false);
      if (panel === name) dismissPanel();
      else setPanel(name);
    };

    const tools: ReactNode[] = [];
    if (enabled.has("undo-redo")) {
      tools.push(
        toolButton("undo", "실행 취소", "undo", () => command("undo")),
        toolButton("redo", "다시 실행", "redo", () => command("redo"))
      );
    }
    if (enabled.has("paragraph"))
      tools.push(
        createElement(
          host.Pressable,
          {
            key: "paragraph",
            accessibilityRole: "button",
            accessibilityLabel: "문단 스타일",
            onPress: () => togglePanel("paragraph"),
            style: {
              alignItems: "center",
              borderColor: semantic.borderGray,
              borderRadius: 7,
              borderWidth: 1,
              flexDirection: "row",
              height: 36,
              justifyContent: "center",
              paddingHorizontal: 10,
            },
          },
          createElement(
            host.Text,
            { style: { color: semantic.text, fontSize: 13 } },
            NATIVE_EDITOR_PARAGRAPHS.find((option) => option.value === formatState.paragraph)
              ?.label ?? "문단"
          ),
          nativeGlyph(theme, "chevron-right", semantic.textSubtil, 13, "90deg")
        )
      );
    if (enabled.has("text-style")) {
      tools.push(
        toolButton("bold", "굵게", "bold", () => command("bold"), formatState.bold),
        toolButton("italic", "기울임", "italic", () => command("italic"), formatState.italic),
        toolButton(
          "underline",
          "밑줄",
          "underline",
          () => command("underline"),
          formatState.underline
        ),
        toolButton(
          "strike",
          "취소선",
          "strikethrough",
          () => command("strikeThrough"),
          formatState.strike
        )
      );
    }
    if (enabled.has("color")) {
      tools.push(
        toolButton("color", "글자색", "font-color", () => togglePanel("color")),
        toolButton("background", "배경색", "highlight", () => togglePanel("background"))
      );
    }
    if (enabled.has("align"))
      tools.push(
        toolButton("align", "문단 정렬", "align-" + formatState.align, () => togglePanel("align"))
      );
    if (enabled.has("list")) {
      tools.push(
        toolButton("ul", "글머리 기호 목록", "list-ul", () => command("insertUnorderedList")),
        toolButton("ol", "번호 목록", "list-ol", () => command("insertOrderedList"))
      );
    }
    if (enabled.has("table"))
      tools.push(toolButton("table", "표", "table", () => togglePanel("table")));
    if (enabled.has("link"))
      tools.push(toolButton("link", "링크", "link", () => togglePanel("link")));
    if (enabled.has("image"))
      tools.push(toolButton("image", "이미지", "image", () => togglePanel("image")));
    if (enabled.has("youtube"))
      tools.push(toolButton("youtube", "YouTube", "youtube", () => togglePanel("youtube")));
    if (enabled.has("hr"))
      tools.push(toolButton("hr", "구분선", "hr", () => command("insertHorizontalRule")));
    if (enabled.has("format"))
      tools.push(toolButton("format", "서식 지우기", "eraser", () => command("removeFormat")));
    if (enabled.has("code"))
      tools.push(
        toolButton("code", "HTML 편집", "code", () => setCodeMode((current) => !current), codeMode)
      );

    const mediaOptionControls = createElement(
      host.View,
      { style: { gap: 8 } },
      createElement(host.Text, { style: { color: semantic.textSubtil, fontSize: 12 } }, "크기"),
      createElement(
        host.View,
        { style: { flexDirection: "row", gap: 6 } },
        ...["100%", "75%", "50%", "original"].map((width) =>
          createElement(
            host.Pressable,
            {
              key: width,
              accessibilityRole: "button",
              accessibilityLabel: width === "original" ? "원본 크기" : width + " 크기",
              onPress: () => setMediaWidth(width),
              style: {
                alignItems: "center",
                backgroundColor:
                  mediaWidth === width ? semantic.foregroundInfoLight : semantic.background,
                borderColor: mediaWidth === width ? semantic.borderPrimary : semantic.borderGray,
                borderRadius: 8,
                borderWidth: 1,
                flex: 1,
                minHeight: 38,
                justifyContent: "center",
              },
            },
            createElement(
              host.Text,
              {
                style: {
                  color: mediaWidth === width ? semantic.foregroundPrimary : semantic.text,
                  fontSize: 13,
                },
              },
              width === "original" ? "원본" : width
            )
          )
        )
      ),
      createElement(host.Text, { style: { color: semantic.textSubtil, fontSize: 12 } }, "정렬"),
      createElement(
        host.View,
        { style: { flexDirection: "row", gap: 6 } },
        ...(["left", "center", "right"] as const).map((align) =>
          createElement(
            host.Pressable,
            {
              key: align,
              accessibilityRole: "button",
              accessibilityLabel:
                align === "left" ? "왼쪽 정렬" : align === "center" ? "가운데 정렬" : "오른쪽 정렬",
              onPress: () => setMediaAlign(align),
              style: {
                alignItems: "center",
                backgroundColor:
                  mediaAlign === align ? semantic.foregroundInfoLight : semantic.background,
                borderColor: mediaAlign === align ? semantic.borderPrimary : semantic.borderGray,
                borderRadius: 8,
                borderWidth: 1,
                flex: 1,
                height: 40,
                justifyContent: "center",
              },
            },
            nativeGlyph(theme, "align-" + align, semantic.text, 18)
          )
        )
      )
    );

    let panelContent: ReactNode = null;
    if (panel === "paragraph") {
      panelContent = createElement(
        host.View,
        { style: { gap: 4 } },
        ...NATIVE_EDITOR_PARAGRAPHS.map((option) =>
          createElement(
            host.Pressable,
            {
              key: option.value,
              accessibilityRole: "button",
              accessibilityLabel: option.label,
              onPress: () => command("formatBlock", option.value),
              style: {
                alignItems: "center",
                borderRadius: 8,
                flexDirection: "row",
                minHeight: 42,
                paddingHorizontal: 10,
              },
            },
            createElement(
              host.Text,
              {
                style: {
                  color: semantic.text,
                  fontSize: option.size,
                  fontWeight: option.weight,
                },
              },
              option.label
            )
          )
        )
      );
    } else if (panel === "color" || panel === "background") {
      panelContent = createElement(
        host.View,
        { style: { gap: 5 } },
        ...NATIVE_EDITOR_COLORS.map((row, rowIndex) =>
          createElement(
            host.View,
            { key: "color-row-" + rowIndex, style: { flexDirection: "row", gap: 5 } },
            ...row.map((color) =>
              createElement(host.Pressable, {
                key: color,
                accessibilityRole: "button",
                accessibilityLabel: (panel === "color" ? "글자색 " : "배경색 ") + color,
                onPress: () => command(panel === "color" ? "foreColor" : "hiliteColor", color),
                style: {
                  backgroundColor: color,
                  borderColor: semantic.borderGrayDeep,
                  borderRadius: 5,
                  borderWidth: 1,
                  flex: 1,
                  height: 29,
                  maxWidth: 29,
                },
              })
            )
          )
        )
      );
    } else if (panel === "align") {
      panelContent = createElement(
        host.View,
        { style: { flexDirection: "row", gap: 8 } },
        ...(
          [
            ["left", "왼쪽 정렬", "align-left", "justifyLeft"],
            ["center", "가운데 정렬", "align-center", "justifyCenter"],
            ["right", "오른쪽 정렬", "align-right", "justifyRight"],
          ] as const
        ).map(([key, label, icon, operation]) =>
          createElement(
            host.Pressable,
            {
              key,
              accessibilityRole: "button",
              accessibilityLabel: label,
              onPress: () => command(operation),
              style: {
                alignItems: "center",
                borderColor: semantic.borderGray,
                borderRadius: 8,
                borderWidth: 1,
                flex: 1,
                height: 48,
                justifyContent: "center",
              },
            },
            nativeGlyph(theme, icon, semantic.text, 20)
          )
        )
      );
    } else if (panel === "table") {
      panelContent = createElement(
        host.View,
        { style: { alignItems: "center", gap: 5 } },
        ...Array.from({ length: 6 }, (_, rowIndex) =>
          createElement(
            host.View,
            { key: "table-row-" + rowIndex, style: { flexDirection: "row", gap: 5 } },
            ...Array.from({ length: 6 }, (_, columnIndex) =>
              createElement(host.Pressable, {
                key: "table-" + (rowIndex + 1) + "-" + (columnIndex + 1),
                accessibilityRole: "button",
                accessibilityLabel: rowIndex + 1 + "행 " + (columnIndex + 1) + "열 표 삽입",
                onPress: () =>
                  command("insertHTML", nativeTableHtml(rowIndex + 1, columnIndex + 1)),
                style: {
                  backgroundColor: semantic.foregroundGrayLight,
                  borderColor: semantic.borderGrayDeep,
                  borderRadius: 3,
                  borderWidth: 1,
                  height: 34,
                  width: 34,
                },
              })
            )
          )
        ),
        createElement(
          host.Text,
          { style: { color: semantic.textSubtil, fontSize: 12, marginTop: 4 } },
          "삽입할 행과 열 크기를 선택하세요 · 표 셀은 길게 눌러 편집"
        )
      );
    } else if (panel === "table-context") {
      const tableAction = (
        key: string,
        label: string,
        operation: string,
        danger = false,
        value?: string
      ) =>
        createElement(
          host.Pressable,
          {
            key,
            accessibilityRole: "button",
            accessibilityLabel: label,
            onPress: () => command(operation, value),
            style: {
              alignItems: "center",
              borderRadius: 8,
              flexDirection: "row",
              minHeight: 42,
              paddingHorizontal: 10,
            },
          },
          createElement(host.Text, {
            children: label,
            style: { color: danger ? semantic.foregroundDanger : semantic.text, fontSize: 14 },
          })
        );
      panelContent = createElement(
        host.View,
        { style: { gap: 2 } },
        panelButton("cell-color", "셀 배경색", () => setTableColorOpen((current) => !current)),
        tableColorOpen
          ? createElement(
              host.View,
              { style: { gap: 5, paddingVertical: 6 } },
              ...NATIVE_EDITOR_COLORS.map((row, rowIndex) =>
                createElement(
                  host.View,
                  { key: "cell-row-" + rowIndex, style: { flexDirection: "row", gap: 5 } },
                  ...row.map((color) =>
                    createElement(host.Pressable, {
                      key: color,
                      accessibilityRole: "button",
                      accessibilityLabel: "셀 배경색 " + color,
                      onPress: () =>
                        command("table-cell-color", color, { keepActive: "true" }, false),
                      style: {
                        backgroundColor: color,
                        borderColor: semantic.borderGrayDeep,
                        borderRadius: 4,
                        borderWidth: 1,
                        flex: 1,
                        height: 27,
                        maxWidth: 27,
                      },
                    })
                  )
                )
              )
            )
          : null,
        tableAction("color-reset", "배경색 초기화", "table-cell-color"),
        tableAction("align-left", "왼쪽 정렬", "table-cell-align", false, "left"),
        tableAction("align-center", "가운데 정렬", "table-cell-align", false, "center"),
        tableAction("align-right", "오른쪽 정렬", "table-cell-align", false, "right"),
        tableAction("row-above", "위에 행 추가", "table-row-above"),
        tableAction("row-below", "아래에 행 추가", "table-row-below"),
        tableAction("row-delete", "행 삭제", "table-row-delete"),
        tableAction("column-left", "왼쪽에 열 추가", "table-column-left"),
        tableAction("column-right", "오른쪽에 열 추가", "table-column-right"),
        tableAction("column-delete", "열 삭제", "table-column-delete"),
        tableAction("table-delete", "표 삭제", "table-table-delete", true)
      );
    } else if (panel === "link" || panel === "image" || panel === "youtube") {
      const kind = panel as "link" | "image" | "youtube";
      const placeholder =
        kind === "link" ? "https://..." : kind === "image" ? "이미지 URL" : "YouTube URL";
      panelContent = createElement(
        host.View,
        { style: { gap: 8 } },
        createElement(host.TextInput, {
          accessibilityLabel: placeholder,
          autoCapitalize: "none",
          autoCorrect: false,
          onChangeText: setAuxValue,
          placeholder,
          placeholderTextColor: semantic.placeholder,
          style: {
            backgroundColor: semantic.background,
            borderColor: semantic.borderGray,
            borderRadius: 8,
            borderWidth: 1,
            color: semantic.text,
            minHeight: 40,
            paddingHorizontal: 10,
          },
          value: auxValue,
        }),
        kind === "image"
          ? createElement(host.TextInput, {
              accessibilityLabel: "대체 텍스트",
              onChangeText: setMediaAlt,
              placeholder: "이미지 설명...",
              placeholderTextColor: semantic.placeholder,
              style: {
                backgroundColor: semantic.background,
                borderColor: semantic.borderGray,
                borderRadius: 8,
                borderWidth: 1,
                color: semantic.text,
                minHeight: 40,
                paddingHorizontal: 10,
              },
              value: mediaAlt,
            })
          : null,
        kind !== "link" ? mediaOptionControls : null,
        createElement(
          host.View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" } },
          kind === "image" && editorProps.onImagePick
            ? panelButton(
                "picker",
                isImageUploading ? "업로드 중…" : "사진 선택",
                async () => {
                  setIsImageUploading(true);
                  try {
                    const picked = await editorProps.onImagePick?.();
                    if (!picked) return;
                    const asset = typeof picked === "string" ? { uri: picked } : picked;
                    let uploaded: string | NativeEditorImageAsset = asset;
                    if (editorProps.onImageUpload) {
                      try {
                        uploaded = await editorProps.onImageUpload(asset);
                      } catch (error) {
                        try {
                          editorProps.onImageUploadError?.(error, asset);
                        } catch {
                          // 오류 콜백이 실패해도 안전하지 않은/불완전한 URI는 삽입하지 않는다.
                        }
                        return;
                      }
                    }
                    const uri = typeof uploaded === "string" ? uploaded : uploaded.uri;
                    const safeUrl = nativeSafeEditorUrl(uri, "image");
                    if (safeUrl)
                      command("image", undefined, {
                        url: safeUrl,
                        alt:
                          mediaAlt ||
                          (typeof uploaded === "object" ? uploaded.alt : undefined) ||
                          asset.alt ||
                          "",
                        width: mediaWidth,
                        align: mediaAlign,
                      });
                  } finally {
                    setIsImageUploading(false);
                  }
                },
                isImageUploading
              )
            : null,
          panelButton("cancel", "취소", dismissPanel),
          panelButton("insert", "삽입", () => {
            const safeUrl = nativeSafeEditorUrl(auxValue, kind);
            if (!safeUrl) return;
            command(kind, undefined, {
              url: safeUrl,
              ...(kind === "image" ? { alt: mediaAlt } : {}),
              ...(kind !== "link" ? { width: mediaWidth, align: mediaAlign } : {}),
            });
          })
        )
      );
    } else if (panel === "image-edit" || panel === "youtube-edit") {
      const kind = panel === "image-edit" ? "image" : "youtube";
      panelContent = createElement(
        host.View,
        { style: { gap: 10 } },
        kind === "image"
          ? createElement(host.TextInput, {
              accessibilityLabel: "대체 텍스트",
              onChangeText: setMediaAlt,
              placeholder: "이미지 설명...",
              placeholderTextColor: semantic.placeholder,
              style: {
                backgroundColor: semantic.background,
                borderColor: semantic.borderGray,
                borderRadius: 8,
                borderWidth: 1,
                color: semantic.text,
                minHeight: 40,
                paddingHorizontal: 10,
              },
              value: mediaAlt,
            })
          : null,
        mediaOptionControls,
        createElement(
          host.View,
          { style: { flexDirection: "row", gap: 6, justifyContent: "space-between" } },
          panelButton("delete", "삭제", () =>
            command("media-edit", undefined, { action: "delete" })
          ),
          panelButton("cancel", "취소", dismissPanel),
          panelButton("apply", "적용", () =>
            command("media-edit", undefined, {
              width: mediaWidth,
              align: mediaAlign,
              ...(kind === "image" ? { alt: mediaAlt } : {}),
            })
          )
        )
      );
    }

    const validation = editorProps.validator?.safeParse(editorValue);
    const validationMessage =
      validation && !validation.success
        ? (validation.error?.issues?.[0]?.message ?? "입력값을 확인하세요")
        : undefined;
    const editorHeight = editorProps.height ?? editorProps.minHeight ?? 260;
    const panelBody = panelContent
      ? createElement(
          host.View,
          {
            accessibilityRole: "dialog",
            accessibilityLabel: NATIVE_EDITOR_PANEL_TITLES[panel ?? ""] ?? "에디터 도구",
            style: {
              backgroundColor: semantic.background,
              borderColor: semantic.borderGray,
              borderTopLeftRadius: host.Modal ? 18 : 0,
              borderTopRightRadius: host.Modal ? 18 : 0,
              borderWidth: host.Modal ? 1 : 0,
              gap: 12,
              maxHeight: host.Modal ? "82%" : undefined,
              paddingBottom: host.Modal ? 24 : 10,
              paddingHorizontal: 14,
              paddingTop: 12,
            },
          },
          createElement(
            host.View,
            {
              style: {
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "space-between",
                minHeight: 32,
              },
            },
            createElement(
              host.Text,
              { style: { color: semantic.text, fontSize: 16, fontWeight: "600" } },
              NATIVE_EDITOR_PANEL_TITLES[panel ?? ""] ?? "에디터 도구"
            ),
            createElement(
              host.Pressable,
              {
                accessibilityRole: "button",
                accessibilityLabel: "에디터 도구 닫기",
                onPress: dismissPanel,
                style: {
                  alignItems: "center",
                  height: 36,
                  justifyContent: "center",
                  width: 36,
                },
              },
              nativeGlyph(theme, "close", semantic.textSubtil, 18)
            )
          ),
          createElement(
            host.ScrollView ?? host.View,
            {
              keyboardShouldPersistTaps: "handled",
              showsVerticalScrollIndicator: false,
              style: { maxHeight: host.Modal ? 560 : undefined },
            },
            panelContent
          )
        )
      : null;
    const panelLayer =
      panelBody && host.Modal
        ? createElement(
            host.Modal,
            {
              animationType: "slide",
              onRequestClose: dismissPanel,
              presentationStyle: "overFullScreen",
              transparent: true,
              visible: true,
            },
            createElement(
              host.KeyboardAvoidingView ?? host.View,
              {
                ...(host.KeyboardAvoidingView ? { behavior: "padding" } : {}),
                style: { flex: 1, justifyContent: "flex-end" },
              },
              createElement(host.Pressable, {
                accessibilityLabel: "에디터 도구 닫기",
                onPress: dismissPanel,
                style: {
                  backgroundColor: "rgba(17, 17, 19, 0.48)",
                  bottom: 0,
                  left: 0,
                  position: "absolute",
                  right: 0,
                  top: 0,
                },
              }),
              panelBody
            )
          )
        : panelBody;

    return createElement(
      host.View,
      {
        style: {
          backgroundColor: semantic.background,
          borderColor: validationMessage ? semantic.borderDanger : semantic.borderGray,
          borderRadius: 12,
          borderWidth: 1,
          overflow: "hidden",
        },
        testID: editorProps.testID,
        "data-mode": codeMode ? "code" : "rich",
      },
      createElement(
        host.ScrollView ?? host.View,
        {
          accessibilityRole: "toolbar",
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          style: { borderBottomColor: semantic.borderGray, borderBottomWidth: 1 },
          contentContainerStyle: { alignItems: "center", gap: 2, padding: 6 },
        },
        ...tools
      ),
      panelLayer,
      codeMode
        ? createElement(host.TextInput, {
            accessibilityLabel: editorProps.accessibilityLabel ?? "HTML 편집기",
            multiline: true,
            onChangeText: (next: string) => editorProps.onChange(nativeSanitizeEditorHtml(next)),
            placeholder: editorProps.placeholder ?? "내용을 입력하세요...",
            placeholderTextColor: semantic.placeholder,
            style: {
              color: semantic.text,
              fontFamily: "monospace",
              fontSize: 13,
              height: editorHeight,
              padding: 14,
              textAlignVertical: "top",
            },
            testID: `${editorProps.testID ?? "podo-editor"}-code-input`,
            value: editorValue,
          })
        : createElement(WebViewComponent, {
            accessibilityLabel: editorProps.accessibilityLabel ?? "리치 텍스트 편집기",
            automaticallyAdjustContentInsets: false,
            javaScriptEnabled: true,
            keyboardDisplayRequiresUserAction: false,
            onMessage: (event: { nativeEvent?: { data?: string } }) => {
              try {
                const message = JSON.parse(event.nativeEvent?.data ?? "{}") as {
                  type?: string;
                  html?: string;
                  kind?: "table" | "image" | "youtube";
                  width?: string;
                  align?: string;
                  alt?: string;
                  bold?: boolean;
                  italic?: boolean;
                  underline?: boolean;
                  strike?: boolean;
                  paragraph?: string;
                };
                if (message.type === "ready") setReady(true);
                if (message.type === "state") {
                  setFormatState((current) => ({
                    bold: Boolean(message.bold),
                    italic: Boolean(message.italic),
                    underline: Boolean(message.underline),
                    strike: Boolean(message.strike),
                    align: message.align || current.align,
                    paragraph: message.paragraph || current.paragraph,
                  }));
                }
                if (message.type === "context" && message.kind) {
                  ReactNativeKeyboard?.dismiss?.();
                  setMediaWidth(message.width || "100%");
                  setMediaAlign(message.align || "center");
                  setMediaAlt(message.alt || "");
                  setTableColorOpen(false);
                  setPanel(message.kind === "table" ? "table-context" : `${message.kind}-edit`);
                }
                if (message.type === "input" && typeof message.html === "string") {
                  const safeValue = nativeSanitizeEditorHtml(message.html);
                  lastWebValue.current = safeValue;
                  editorProps.onChange(safeValue);
                  if (safeValue !== message.html) post({ type: "set", html: safeValue });
                }
              } catch {
                // Ignore malformed bridge messages from the embedded document.
              }
            },
            onShouldStartLoadWithRequest: (request: { url?: string }) => {
              const url = request.url ?? "";
              if (url === "about:blank" || url.startsWith("https://podo.local")) return true;
              if (/^https?:\/\//i.test(url)) void ReactNativeLinking?.openURL?.(url);
              return false;
            },
            originWhitelist: ["about:blank", "https://podo.local"],
            ref: webRef,
            scrollEnabled: true,
            source: {
              html: nativeEditorWebDocument(editorValue, {
                editable: true,
                color: semantic.text,
                background: semantic.background,
                ...(editorProps.placeholder ? { placeholder: editorProps.placeholder } : {}),
              }),
              baseUrl: "https://podo.local",
            },
            style: {
              backgroundColor: semantic.background,
              height: editorHeight,
              maxHeight: editorProps.maxHeight,
              minHeight: editorProps.minHeight,
            },
            testID: `${editorProps.testID ?? "podo-editor"}-webview`,
          }),
      validationMessage
        ? createElement(
            host.Text,
            {
              accessibilityRole: "alert",
              style: { color: semantic.foregroundDanger, fontSize: 13, padding: 10 },
            },
            validationMessage
          )
        : null
    );
  }

  function NativeWebEditorView({
    viewerProps,
    WebViewComponent,
  }: {
    viewerProps: NativeEditorViewProps;
    WebViewComponent: NativeHostComponent;
  }): React.ReactElement {
    const theme = usePodoNativeTheme();
    const semantic = nativeSemanticColors(theme);
    const [height, setHeight] = useState(24);
    return createElement(WebViewComponent, {
      accessibilityLabel: "에디터 콘텐츠",
      javaScriptEnabled: true,
      onMessage: (event: { nativeEvent?: { data?: string } }) => {
        try {
          const message = JSON.parse(event.nativeEvent?.data ?? "{}") as { height?: number };
          if (typeof message.height === "number") setHeight(Math.max(24, message.height));
        } catch {
          // Ignore malformed bridge messages from the embedded document.
        }
      },
      onShouldStartLoadWithRequest: (request: { url?: string }) =>
        request.url === "about:blank" || request.url?.startsWith("https://podo.local") === true,
      originWhitelist: ["about:blank", "https://podo.local"],
      scrollEnabled: false,
      source: {
        html: nativeEditorWebDocument(viewerProps.value, {
          editable: false,
          color: semantic.text,
          background: semantic.background,
        }),
        baseUrl: "https://podo.local",
      },
      style: { backgroundColor: semantic.background, height },
      testID: viewerProps.testID,
    });
  }
  const components: NativeComponents = {
    Button: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const semantic = nativeSemanticColors(theme);
      const behavior = createButtonBehavior({ disabled: props.disabled });
      const themeName = props.theme ?? "solid-primary";
      const size = props.size ?? "md";
      const box = nativeButtonColors(theme, themeName);
      const metrics = BUTTON_SIZES[size];
      // Disabled swaps in the design system's own treatment
      // (.podo-button[disabled]: gray fill + muted label, no opacity) instead
      // of dimming the theme color.
      const colors = behavior.pressable
        ? box
        : {
            fill:
              stringToken(adaptReactNativeTokens(theme.tokens), [
                "button",
                "background-disabled",
              ]) ?? semantic.disabled,
            label: semantic.textDisabled,
            border: themeName.startsWith("outline-")
              ? (stringToken(adaptReactNativeTokens(theme.tokens), ["button", "border-disabled"]) ??
                semantic.borderDisabled)
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
      const semantic = nativeSemanticColors(theme);
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
          ? { fill: semantic.disabled, border: "transparent", label: semantic.textDisabled }
          : themeName === "outline-weak"
            ? {
                fill: semantic.foregroundGray,
                border: semantic.borderNatural,
                label: semantic.text,
              }
            : {
                fill: semantic.foregroundNatural,
                border: "transparent",
                label: semantic.textStaticInvert,
              };
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
            nativeGlyph(theme, "close", box.label, 14)
          )
        );
      }
      // Figma 538:6615 selection colors — unselected is the base look.
      // outline-strong selected renders identically to solid (pending fix).
      const box = props.disabled
        ? { fill: semantic.disabled, border: "transparent", label: semantic.textDisabled }
        : selected
          ? themeName === "outline-weak"
            ? {
                fill: semantic.foregroundGray,
                border: semantic.borderNatural,
                label: semantic.text,
              }
            : {
                fill: semantic.foregroundNatural,
                border: "transparent",
                label: semantic.textStaticInvert,
              }
          : themeName === "solid"
            ? { fill: semantic.foregroundGrayLight, border: "transparent", label: semantic.text }
            : { fill: "transparent", border: semantic.borderGray, label: semantic.text };
      // Pressed feedback (podo-ui/styles.css .podo-chip :active rules):
      // unselected solid darkens the fill to #E4E4E7, unselected outlines
      // darken the border to #D1D2D6, selected solid/outline-strong lighten
      // to #767985, selected outline-weak fills #F4F4F5.
      const pressedBox = selected
        ? themeName === "outline-weak"
          ? { ...box, fill: semantic.foregroundGrayLight }
          : { ...box, fill: semantic.foregroundNaturalLightDeep }
        : themeName === "solid"
          ? { ...box, fill: semantic.foregroundGrayLightDeep }
          : { ...box, border: semantic.borderGrayDeep };
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
      const semantic = nativeSemanticColors(theme);
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
          ? { color: semantic.borderDisabled, width: 1 }
          : open
            ? { color: props.invalid ? semantic.borderDanger : semantic.borderPrimary, width: 2 }
            : props.invalid
              ? { color: semantic.borderDanger, width: 1 }
              : { color: semantic.borderGray, width: 1 };

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
              style: {
                ...styles.chip,
                backgroundColor: disabled ? semantic.disabled : semantic.foregroundNatural,
              },
              "data-state": "selected",
              "data-disabled": disabled ? "true" : undefined,
            },
            createElement(
              host.Text,
              {
                style: {
                  ...styles.chipLabel,
                  color: disabled ? semantic.textDisabled : semantic.textStaticInvert,
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
              style: { color: semantic.textSubtil, fontSize: 14, lineHeight: 22 },
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
                    color: disabled
                      ? semantic.textDisabled
                      : hasValue
                        ? semantic.text
                        : semantic.placeholder,
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
                    backgroundColor: isSelected ? semantic.foregroundPrimary : semantic.background,
                    borderColor: isSelected ? semantic.borderPrimary : semantic.borderNatural,
                    borderRadius: 4,
                    borderWidth: 1,
                    height: 18,
                    justifyContent: "center",
                    width: 18,
                  },
                },
                isSelected ? nativeGlyph(theme, "check", semantic.textStaticInvert, 12) : null
              )
            : null,
          createElement(
            host.Text,
            {
              style: {
                // 단일 선택의 선택 셀은 라벨도 primary (Figma Menu-cell selected).
                color: !multiple && isSelected ? semantic.textPrimary : semantic.text,
                flex: 1,
                fontSize: 16,
                lineHeight: 26,
              },
            },
            option.label
          ),
          !multiple && isSelected ? nativeGlyph(theme, "check", semantic.textPrimary, 16) : null
        );
      });

      const menu = createElement(
        host.ScrollView ?? host.View,
        {
          ref: menuRef,
          role: "listbox",
          nativeID: menuId,
          "aria-multiselectable": multiple ? true : undefined,
          testID: `${props.testID ?? "podo-select"}-menu`,
          ...(host.ScrollView
            ? {
                style: {
                  ...styles.selectMenu,
                  maxHeight: host.Modal ? 360 : SELECT_MENU_MAX_HEIGHT,
                },
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
      );

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
              backgroundColor: disabled
                ? semantic.disabled
                : readOnly
                  ? "transparent"
                  : semantic.background,
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
                nativeGlyph(theme, "close", semantic.iconSubtil, 16)
              )
            : null,
          readOnly
            ? null
            : nativeGlyph(
                theme,
                "chevron-right",
                semantic.iconSubtil,
                20,
                open ? "-90deg" : "90deg"
              )
        ),
        open
          ? host.Modal
            ? createElement(
                host.Modal,
                {
                  animationType: "fade",
                  onRequestClose: () => setOpen(false),
                  presentationStyle: "overFullScreen",
                  transparent: true,
                  visible: true,
                },
                createElement(
                  host.View,
                  {
                    style: {
                      flex: 1,
                      justifyContent: "flex-end",
                      padding: 16,
                    },
                  },
                  createElement(host.Pressable, {
                    accessibilityLabel: "선택 메뉴 닫기",
                    onPress: () => setOpen(false),
                    style: {
                      backgroundColor: "rgba(17, 17, 19, 0.48)",
                      bottom: 0,
                      left: 0,
                      position: "absolute",
                      right: 0,
                      top: 0,
                    },
                  }),
                  createElement(
                    host.View,
                    {
                      accessibilityRole: "dialog",
                      accessibilityLabel: "선택 메뉴",
                      style: {
                        backgroundColor: semantic.background,
                        borderRadius: 18,
                        gap: 10,
                        padding: 12,
                      },
                    },
                    createElement(
                      host.View,
                      {
                        style: {
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingHorizontal: 4,
                        },
                      },
                      createElement(
                        host.Text,
                        { style: { color: semantic.text, fontSize: 18, fontWeight: "700" } },
                        props.accessibilityLabel ?? props.placeholder ?? "선택"
                      ),
                      createElement(
                        host.Pressable,
                        {
                          accessibilityRole: "button",
                          accessibilityLabel: "닫기",
                          onPress: () => setOpen(false),
                          style: { padding: 8 },
                        },
                        nativeGlyph(theme, "close", semantic.iconSubtil, 20)
                      )
                    ),
                    menu
                  )
                )
              )
            : menu
          : null
      );
    },
    Input: (props) => {
      const theme = usePodoNativeTheme();
      const styles = createNativeThemeStyles(theme);
      const semantic = nativeSemanticColors(theme);
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
        placeholderTextColor: semantic.placeholder,
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
      const semantic = nativeSemanticColors(theme);
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
        placeholderTextColor: semantic.placeholder,
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
          style: {
            ...styles.icon,
            fontSize: ICON_SIZES[props.size ?? "md"],
            ...(theme.iconFontFamily ? { fontFamily: theme.iconFontFamily } : {}),
          },
          testID: props.testID,
        },
        // Resolution order (see NativeIconProps): explicit glyph → the
        // provider's iconGlyphs entry for the name → the raw name as
        // readable fallback text when no glyph map is wired.
        props.glyph ?? theme.iconGlyphs?.[props.name] ?? props.name
      );
    },
    Switch: function NativeSwitch(props) {
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
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
      const track = behavior.disabled
        ? semantic.disabled
        : behavior.checked
          ? semantic.foregroundPrimary
          : semantic.foregroundGrayLightDeep;
      const handle = behavior.disabled ? semantic.disabledDark : semantic.foregroundStaticInvert;
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
                  color: behavior.disabled ? semantic.textDisabled : semantic.textSubtil,
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
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
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
        ? {
            fill: semantic.disabled,
            border: solid ? undefined : semantic.borderDisabled,
            mark: semantic.textDisabled,
          }
        : solid
          ? { fill: semantic.foregroundPrimary, border: undefined, mark: semantic.textStaticInvert }
          : { fill: semantic.background, border: semantic.borderNatural, mark: semantic.text };
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
                  color: behavior.disabled ? semantic.textDisabled : semantic.textSubtil,
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
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
      // Figma 459:1298 per-state tinted fill + border; the toaster stack is a
      // web affordance — apps place the card in their own overlay.
      const state = props.state ?? "normal";
      const toastText =
        theme.colorScheme === "dark" && state !== "normal"
          ? semantic.textBasicReverse
          : semantic.text;
      const palette = {
        success: {
          fill: semantic.foregroundSuccessLight,
          border:
            stringToken(adaptReactNativeTokens(theme.tokens), ["border", "success"]) ?? "#3EA856",
        },
        danger: { fill: semantic.foregroundDangerLight, border: semantic.borderDanger },
        info: {
          fill: semantic.foregroundInfoLight,
          border:
            stringToken(adaptReactNativeTokens(theme.tokens), ["border", "info"]) ?? "#0095FF",
        },
        warning: {
          fill: semantic.foregroundWarningLight,
          border:
            stringToken(adaptReactNativeTokens(theme.tokens), ["border", "warning"]) ?? "#FFAA00",
        },
        normal: { fill: semantic.foregroundGrayLight, border: semantic.borderGrayDeep },
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
              { style: { color: toastText, flex: 1, fontSize: 16, fontWeight: "600" } },
              props.children
            ),
            props.suffixText
              ? createElement(
                  host.Text,
                  { style: { color: toastText, fontSize: 16 } },
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
                  nativeGlyph(theme, "close", toastText, 16)
                )
              : null
          ),
          props.caption
            ? createElement(host.Text, { style: { color: toastText, fontSize: 14 } }, props.caption)
            : null
        )
      );
    },
    Tooltip: function NativeTooltip(props) {
      const providerTheme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(providerTheme);
      const theme = props.theme ?? "default";
      const position = props.position ?? "right";
      const ordinal = props.ordinal ?? "first";
      // Stable per-instance bubble id (useId delimiters stripped, like
      // Field/Select ids) — a future trigger primitive can point at it via
      // accessibilityDescribedBy/aria-describedby.
      const reactId = useId();
      const bubbleId = `podo-tooltip-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
      // default is the dark pair (base); reverse flips to white.
      const fill = theme === "reverse" ? semantic.background : semantic.foregroundBasicReverse;
      const labelColor = theme === "reverse" ? semantic.text : semantic.textBasicReverse;
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
          createElement(host.Text, { style: { color: labelColor, fontSize: 14 } }, props.label)
        )
      );
    },
    Radio: function NativeRadio(props) {
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
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
        ? {
            fill: semantic.disabled,
            border: behavior.checked ? undefined : semantic.borderDisabled,
          }
        : behavior.checked
          ? { fill: semantic.foregroundPrimary, border: undefined }
          : { fill: "transparent", border: semantic.borderNatural };
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
                  backgroundColor: semantic.foregroundStaticInvert,
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
                  color: behavior.disabled ? semantic.textDisabled : semantic.textSubtil,
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
    DatePicker: function NativeDatePicker(props) {
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
      const mode = props.mode ?? "instant";
      const type = props.type ?? "date";
      const hourFormat = props.hourFormat ?? "24";
      const minuteStep = props.minuteStep ?? 1;
      const hourStep = props.hourStep ?? 1;
      const hasCalendar = type === "date" || type === "datetime";
      const hasTime = type === "time" || type === "datetime" || type === "hour";
      // 시간 선택은 Figma의 명시적 `선택`/`적용` 단계를 따른다. 날짜 전용 instant만
      // 기존처럼 날짜를 누르는 즉시 커밋한다.
      const showActions = props.showActions ?? (mode === "period" || hasTime);
      const initial = props.value ?? props.defaultValue ?? {};
      const [internalValue, setInternalValue] = useState<NativeDatePickerValue>(initial);
      const currentValue = props.value ?? internalValue;
      const [draft, setDraft] = useState<NativeDatePickerValue>(currentValue);
      const [open, setOpen] = useState(false);
      const fallbackDate = currentValue.date ?? new Date();
      const [viewDate, setViewDate] = useState(() =>
        nativeResolveCalendar(props.initialCalendar?.start, fallbackDate)
      );

      useEffect(() => {
        if (props.value) {
          setDraft(props.value);
          if (props.value.date) {
            setViewDate(new Date(props.value.date.getFullYear(), props.value.date.getMonth(), 1));
          }
        }
      }, [props.value]);

      const emit = (next: NativeDatePickerValue, close = false) => {
        setDraft(next);
        if (props.value == null) setInternalValue(next);
        props.onChange?.(next);
        if (close) setOpen(false);
      };
      const updateDraft = (next: NativeDatePickerValue, complete = false) => {
        setDraft(next);
        if (!showActions && complete) emit(next, true);
      };
      const chooseDate = (date: Date) => {
        if (nativeDateDisabled(date, props)) return;
        const withClampedTime = (value: NativeDatePickerValue, end: boolean) => {
          const timeKey = end ? "endTime" : "time";
          const dateKey = end ? "endDate" : "date";
          const time = value[timeKey];
          const selectedDate = value[dateKey];
          return time && selectedDate
            ? { ...value, [timeKey]: nativeClampTime(selectedDate, time, props, minuteStep) }
            : value;
        };
        if (mode === "period") {
          if (!draft.date || draft.endDate) {
            const withoutEnd = { ...draft };
            delete withoutEnd.endDate;
            delete withoutEnd.endTime;
            updateDraft({ ...withoutEnd, date }, false);
            return;
          }
          const first = nativeStartOfDay(draft.date);
          const second = nativeStartOfDay(date);
          let next: NativeDatePickerValue;
          if (second.getTime() < first.getTime()) {
            next = { ...draft, date: second, endDate: first };
            delete next.time;
            delete next.endTime;
            if (draft.endTime) next.time = draft.endTime;
            if (draft.time) next.endTime = draft.time;
          } else {
            next = { ...draft, date: first, endDate: second };
          }
          updateDraft(withClampedTime(withClampedTime(next, false), true), true);
          return;
        }
        updateDraft(withClampedTime({ ...draft, date }, false), !hasTime);
      };
      const selectTime = (end: boolean, unit: "hour" | "minute", selected: number) => {
        const key = end ? "endTime" : "time";
        const date = end ? draft.endDate : draft.date;
        const previous = draft[key] ?? { hour: 0, minute: 0 };
        const candidate =
          unit === "hour"
            ? {
                ...previous,
                hour: selected,
              }
            : { ...previous, minute: selected };
        const next = nativeClampTime(date, candidate, props, type === "hour" ? 60 : minuteStep);
        setDraft({ ...draft, [key]: next });
      };
      const triggerText = (end: boolean): string => {
        const value = end
          ? {
              ...(currentValue.endDate ? { date: currentValue.endDate } : {}),
              ...(currentValue.endTime ? { time: currentValue.endTime } : {}),
            }
          : currentValue;
        if (type === "hour" && value.time) {
          const hour = value.time.hour;
          return hourFormat === "12"
            ? `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}시`
            : `${hour}시`;
        }
        return (
          nativeFormatDatePickerValue(value, type, props.format, hourFormat) ||
          props.placeholder ||
          (hasCalendar ? "YYYY - MM - DD" : "HH : MM")
        );
      };
      const monthBlocked = (delta: number): boolean => {
        const candidate = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
        return Boolean(
          (props.yearRange?.min != null && candidate.getFullYear() < props.yearRange.min) ||
          (props.yearRange?.max != null && candidate.getFullYear() > props.yearRange.max)
        );
      };
      const renderTrigger = (end: boolean) =>
        createElement(
          host.Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: props.accessibilityLabel ?? (end ? "종료 날짜 선택" : "날짜 선택"),
            accessibilityState: { disabled: props.disabled, expanded: open },
            disabled: props.disabled,
            onPress: props.disabled
              ? undefined
              : () => {
                  setDraft(currentValue);
                  setOpen(!open);
                },
            style: {
              alignItems: "center",
              backgroundColor: props.disabled ? semantic.disabled : semantic.background,
              borderColor: open ? semantic.borderPrimary : semantic.borderGray,
              borderRadius: 10,
              borderWidth: 1,
              flex: 1,
              flexDirection: "row",
              gap: 8,
              minHeight: 42,
              paddingHorizontal: 12,
            },
            testID: end ? `${props.testID ?? "podo-datepicker"}-end` : props.testID,
            "data-open": open ? "true" : undefined,
          },
          nativeGlyph(theme, hasCalendar ? "calendar" : "time", semantic.iconSubtil, 18),
          createElement(
            host.Text,
            {
              style: {
                color: (
                  end
                    ? currentValue.endDate || currentValue.endTime
                    : currentValue.date || currentValue.time
                )
                  ? semantic.text
                  : semantic.placeholder,
                flex: 1,
                fontSize: 14,
              },
            },
            triggerText(end)
          ),
          nativeGlyph(theme, "chevron-right", semantic.iconSubtil, 18, open ? "-90deg" : "90deg")
        );
      const renderTime = (end: boolean) => {
        const time = (end ? draft.endTime : draft.time) ?? { hour: 0, minute: 0 };
        const hours = Array.from(
          { length: type === "hour" ? Math.ceil(24 / hourStep) : 24 },
          (_, index) => (type === "hour" ? index * hourStep : index)
        ).filter((hour) => hour < 24);
        const minutes = Array.from(
          { length: Math.ceil(60 / minuteStep) },
          (_, index) => index * minuteStep
        );
        const selectedDate = end ? draft.endDate : draft.date;
        const minTime = nativeLimitTime(props.minDate, selectedDate);
        const maxTime = nativeLimitTime(props.maxDate, selectedDate);
        const optionDisabled = (unit: "hour" | "minute", value: number) => {
          if (unit === "hour") {
            if (type === "hour" && props.disabledHours?.includes(value)) return true;
            return Boolean((minTime && value < minTime.hour) || (maxTime && value > maxTime.hour));
          }
          return Boolean(
            (minTime && time.hour === minTime.hour && value < minTime.minute) ||
            (maxTime && time.hour === maxTime.hour && value > maxTime.minute)
          );
        };
        const TimeColumnHost = host.ScrollView ?? host.View;
        const renderColumn = (
          label: string,
          values: number[],
          selected: number,
          unit: "hour" | "minute"
        ) =>
          createElement(
            host.View,
            {
              style: { flex: 1, height: 262, minWidth: 0 },
            },
            createElement(
              host.Text,
              {
                style: {
                  color: semantic.textSubtil,
                  fontSize: 16,
                  lineHeight: 26,
                  textAlign: "center",
                },
              },
              label
            ),
            createElement(
              TimeColumnHost,
              {
                accessibilityRole: "list",
                accessibilityLabel: `${end ? "종료 " : ""}${label} 선택`,
                showsVerticalScrollIndicator: false,
                style: host.ScrollView ? { flex: 1 } : { flex: 1, gap: 4 },
                ...(host.ScrollView
                  ? {
                      contentContainerStyle: { flexDirection: "column", gap: 4 },
                      contentOffset: {
                        x: 0,
                        y: Math.max(0, values.indexOf(selected) * 46 - 84),
                      },
                    }
                  : {}),
              },
              ...values.map((value) => {
                const isSelected = selected === value;
                const isDisabled = optionDisabled(unit, value);
                const display =
                  unit === "hour" && type === "hour"
                    ? hourFormat === "12"
                      ? `${value < 12 ? "오전" : "오후"} ${value % 12 || 12}시`
                      : `${value}시`
                    : String(value).padStart(2, "0");
                return createElement(
                  host.Pressable,
                  {
                    key: value,
                    accessibilityRole: "button",
                    accessibilityLabel: `${display}${unit === "minute" ? "분" : unit === "hour" && type !== "hour" ? "시" : ""}`,
                    accessibilityState: { disabled: isDisabled, selected: isSelected },
                    disabled: isDisabled,
                    onPress: isDisabled ? undefined : () => selectTime(end, unit, value),
                    style: {
                      alignItems: "center",
                      backgroundColor: "transparent",
                      borderRadius: 8,
                      justifyContent: "center",
                      minHeight: 42,
                      opacity: isDisabled ? 0.35 : 1,
                      paddingHorizontal: 8,
                    },
                  },
                  createElement(
                    host.Text,
                    {
                      style: {
                        color: isSelected ? semantic.foregroundPrimary : semantic.text,
                        fontSize: 16,
                        lineHeight: 26,
                      },
                    },
                    display
                  )
                );
              })
            )
          );
        const selectNow = () => {
          const now = new Date();
          let hour =
            type === "hour"
              ? hours.reduce(
                  (closest, option) =>
                    Math.abs(option - now.getHours()) < Math.abs(closest - now.getHours())
                      ? option
                      : closest,
                  hours[0] ?? 0
                )
              : now.getHours();
          if (type === "hour" && props.disabledHours?.includes(hour)) {
            hour = hours.find((option) => !props.disabledHours?.includes(option)) ?? hour;
          }
          const minute =
            type === "hour" ? 0 : Math.floor(now.getMinutes() / minuteStep) * minuteStep;
          const key = end ? "endTime" : "time";
          const date = end ? draft.endDate : draft.date;
          setDraft({
            ...draft,
            [key]: nativeClampTime(
              date,
              { hour, minute },
              props,
              type === "hour" ? 60 : minuteStep
            ),
          });
        };
        const standaloneTime = hasTime && !hasCalendar && mode === "instant";
        const controllerButton = (label: string, onPress: () => void, primary = false) =>
          createElement(
            host.Pressable,
            {
              accessibilityRole: "button",
              accessibilityLabel: label,
              onPress,
              style: {
                alignItems: "center",
                backgroundColor: primary
                  ? semantic.foregroundPrimary
                  : semantic.foregroundGrayLight,
                borderRadius: 8,
                flex: 1,
                justifyContent: "center",
                minHeight: 36,
                paddingHorizontal: 16,
                paddingVertical: 2,
              },
            },
            createElement(
              host.Text,
              {
                style: {
                  color: primary ? semantic.textStaticInvert : semantic.text,
                  fontSize: 14,
                  lineHeight: 22,
                },
              },
              label
            )
          );
        return createElement(
          host.View,
          {
            style: {
              height: standaloneTime ? 333 : 274,
              overflow: "hidden",
            },
            testID: `${props.testID ?? "podo-datepicker"}-${end ? "end-" : ""}time`,
          },
          createElement(
            host.View,
            { style: { flexDirection: "row", height: 274, paddingTop: 12 } },
            renderColumn("시간", hours, time.hour, "hour"),
            type === "hour" ? null : renderColumn("분", minutes, time.minute, "minute")
          ),
          standaloneTime
            ? createElement(
                host.View,
                {
                  style: {
                    borderColor: semantic.borderGray,
                    borderTopWidth: 1,
                    flexDirection: "row",
                    gap: 12,
                    height: 59,
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                  },
                },
                controllerButton("지금", selectNow),
                controllerButton("선택", () => emit(draft, true), true)
              )
            : null
        );
      };
      const actionButton = (
        label: string,
        onPress: () => void,
        primary = false,
        disabled = false,
        iconName?: string
      ) =>
        createElement(
          host.Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: label,
            accessibilityState: { disabled },
            disabled,
            onPress: disabled ? undefined : onPress,
            style: {
              backgroundColor: primary ? semantic.foregroundPrimary : semantic.foregroundGrayLight,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
            },
          },
          createElement(
            host.View,
            { style: { alignItems: "center", flexDirection: "row", gap: 4 } },
            iconName
              ? nativeGlyph(
                  theme,
                  iconName,
                  primary ? semantic.textStaticInvert : semantic.text,
                  18
                )
              : null,
            iconName
              ? null
              : createElement(
                  host.Text,
                  {
                    style: {
                      color: primary ? semantic.textStaticInvert : semantic.text,
                      fontSize: 14,
                    },
                  },
                  label
                )
          )
        );

      const calendar = hasCalendar
        ? createElement(
            host.View,
            { style: { gap: 8 } },
            createElement(
              host.View,
              {
                style: {
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                },
              },
              props.hideNavArrow
                ? null
                : actionButton(
                    "이전 달",
                    () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)),
                    false,
                    monthBlocked(-1),
                    "chevron-left"
                  ),
              createElement(
                host.Text,
                {
                  accessibilityRole: "header",
                  style: { color: semantic.text, fontSize: 16, fontWeight: "700" },
                },
                `${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월`
              ),
              props.hideNavArrow
                ? null
                : actionButton(
                    "다음 달",
                    () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)),
                    false,
                    monthBlocked(1),
                    "chevron-right"
                  )
            ),
            createElement(
              host.View,
              { style: { flexDirection: "row" } },
              ...["일", "월", "화", "수", "목", "금", "토"].map((weekday) =>
                createElement(
                  host.Text,
                  {
                    key: weekday,
                    style: {
                      color: semantic.textSubtil,
                      flex: 1,
                      fontSize: 12,
                      textAlign: "center",
                    },
                  },
                  weekday
                )
              )
            ),
            createElement(
              host.View,
              { accessibilityRole: "grid", style: { flexDirection: "row", flexWrap: "wrap" } },
              ...nativeCalendarDays(viewDate).map((date) => {
                const disabled = nativeDateDisabled(date, props);
                const selected =
                  nativeSameDay(date, draft.date) || nativeSameDay(date, draft.endDate);
                const inRange = Boolean(
                  draft.date &&
                  draft.endDate &&
                  nativeDateInRange(date, { from: draft.date, to: draft.endDate })
                );
                const outside = date.getMonth() !== viewDate.getMonth();
                return createElement(
                  host.Pressable,
                  {
                    key: date.toISOString(),
                    accessibilityRole: "button",
                    accessibilityLabel: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
                    accessibilityState: { disabled, selected },
                    disabled,
                    onPress: disabled ? undefined : () => chooseDate(date),
                    style: {
                      alignItems: "center",
                      backgroundColor: selected
                        ? semantic.foregroundPrimary
                        : inRange
                          ? semantic.foregroundInfoLight
                          : "transparent",
                      borderRadius: 8,
                      justifyContent: "center",
                      minHeight: 38,
                      opacity: disabled ? 0.35 : outside ? 0.5 : 1,
                      width: "14.2857%",
                    },
                    "data-state": selected ? "selected" : inRange ? "range" : undefined,
                  },
                  createElement(
                    host.Text,
                    {
                      style: {
                        color: selected ? semantic.textStaticInvert : semantic.text,
                        fontSize: 14,
                      },
                    },
                    String(date.getDate())
                  )
                );
              })
            )
          )
        : null;

      const quick =
        props.quickSelect && mode === "period"
          ? createElement(
              host.View,
              { style: { flexDirection: "row", flexWrap: "wrap", gap: 6 } },
              ...(
                [
                  ["today", "오늘"],
                  ["yesterday", "어제"],
                  ["thisWeek", "이번 주"],
                  ["lastWeek", "지난 주"],
                  ["last7Days", "최근 7일"],
                  ["last30Days", "최근 30일"],
                  ["thisMonth", "이번 달"],
                  ["lastMonth", "지난 달"],
                ] as const
              ).map(([key, label]) => {
                const rawRange = nativeQuickRange(key);
                const range = nativeClampQuickRange(rawRange, props);
                return actionButton(
                  label,
                  () => {
                    updateDraft({ ...draft, ...range }, !showActions);
                    setViewDate(new Date(range.date.getFullYear(), range.date.getMonth(), 1));
                  },
                  false,
                  nativeQuickRangeDisabled(rawRange, props)
                );
              })
            )
          : null;

      const standaloneTime = hasTime && !hasCalendar && mode === "instant";
      const dialogScrollable = !standaloneTime && Boolean(host.Modal && host.ScrollView);
      const DialogHost = dialogScrollable ? host.ScrollView! : host.View;
      const dialogShellStyle = {
        backgroundColor: semantic.background,
        borderColor: semantic.borderGray,
        borderRadius: standaloneTime ? 10 : 18,
        borderWidth: standaloneTime ? 1 : host.Modal ? 0 : 1,
        flexGrow: 0,
        flexShrink: 1,
        height: standaloneTime ? 335 : undefined,
        maxHeight: host.Modal ? "88%" : undefined,
        maxWidth: standaloneTime ? 300 : 420,
        width: "100%",
      };
      const dialogContentStyle = standaloneTime ? { gap: 0, padding: 0 } : { gap: 12, padding: 16 };
      const dialog = createElement(
        DialogHost,
        {
          accessibilityRole: "dialog",
          accessibilityLabel: standaloneTime ? "시간 선택" : "날짜 선택",
          style: dialogScrollable
            ? dialogShellStyle
            : { ...dialogShellStyle, ...dialogContentStyle },
          ...(dialogScrollable ? { contentContainerStyle: dialogContentStyle } : {}),
          testID: `${props.testID ?? "podo-datepicker"}-dialog`,
        },
        standaloneTime
          ? null
          : createElement(
              host.View,
              {
                style: {
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                },
              },
              createElement(
                host.Text,
                { style: { color: semantic.text, fontSize: 18, fontWeight: "700" } },
                mode === "period" ? "기간 선택" : hasCalendar ? "날짜 선택" : "시간 선택"
              ),
              host.Modal
                ? createElement(
                    host.Pressable,
                    {
                      accessibilityRole: "button",
                      accessibilityLabel: "닫기",
                      onPress: () => {
                        setDraft(currentValue);
                        setOpen(false);
                      },
                      style: { padding: 8 },
                    },
                    nativeGlyph(theme, "close", semantic.iconSubtil, 20)
                  )
                : null
            ),
        quick,
        calendar,
        hasTime ? renderTime(false) : null,
        hasTime && mode === "period" ? renderTime(true) : null,
        showActions && !standaloneTime
          ? createElement(
              host.View,
              { style: { flexDirection: "row", gap: 8, justifyContent: "flex-end" } },
              actionButton("초기화", () => {
                setDraft({});
                if (props.value == null) setInternalValue({});
                props.onChange?.({});
                props.onReset?.();
                setOpen(false);
              }),
              actionButton("취소", () => {
                setDraft(currentValue);
                setOpen(false);
              }),
              actionButton(
                "적용",
                () => emit(draft, true),
                true,
                mode === "period" && hasCalendar && (!draft.date || !draft.endDate)
              )
            )
          : host.Modal
            ? null
            : actionButton("닫기", () => setOpen(false))
      );

      return createElement(
        host.View,
        { style: { gap: 6 }, testID: `${props.testID ?? "podo-datepicker"}-root` },
        createElement(
          host.View,
          { style: { flexDirection: "row", gap: 6 } },
          renderTrigger(false),
          mode === "period" ? renderTrigger(true) : null
        ),
        open
          ? host.Modal
            ? createElement(
                host.Modal,
                {
                  animationType: "fade",
                  onRequestClose: () => {
                    setDraft(currentValue);
                    setOpen(false);
                  },
                  presentationStyle: "overFullScreen",
                  transparent: true,
                  visible: true,
                },
                createElement(
                  host.View,
                  {
                    style: {
                      alignItems: "center",
                      flex: 1,
                      justifyContent: "center",
                      padding: 16,
                    },
                  },
                  createElement(host.Pressable, {
                    accessibilityLabel: standaloneTime ? "시간 선택 닫기" : "날짜 선택 닫기",
                    onPress: () => {
                      setDraft(currentValue);
                      setOpen(false);
                    },
                    style: {
                      backgroundColor: "rgba(17, 17, 19, 0.48)",
                      bottom: 0,
                      left: 0,
                      position: "absolute",
                      right: 0,
                      top: 0,
                    },
                  }),
                  dialog
                )
              )
            : dialog
          : null
      );
    },
    Editor: function NativeEditor(props) {
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
      const editorValue = typeof props.value === "string" ? props.value : "";
      const enabled = new Set(props.toolbar ?? NATIVE_EDITOR_TOOLBAR);
      const [selection, setSelection] = useState({ start: 0, end: 0 });
      const [panel, setPanel] = useState<string | null>(null);
      const [auxValue, setAuxValue] = useState("");
      const [codeMode, setCodeMode] = useState(false);
      const historyRef = useRef<string[]>([editorValue]);
      const historyIndexRef = useRef(0);

      useEffect(() => {
        if (historyRef.current[historyIndexRef.current] !== editorValue) {
          historyRef.current = [
            ...historyRef.current.slice(0, historyIndexRef.current + 1),
            editorValue,
          ];
          historyIndexRef.current = historyRef.current.length - 1;
        }
      }, [editorValue]);

      const WebViewComponent = host.WebView ?? theme.webViewComponent;
      if (WebViewComponent) {
        return createElement(NativeWebEditor, {
          editorProps: props,
          WebViewComponent,
        });
      }

      const emitEditor = (next: string, track = true) => {
        if (track && historyRef.current[historyIndexRef.current] !== next) {
          historyRef.current = [...historyRef.current.slice(0, historyIndexRef.current + 1), next];
          historyIndexRef.current = historyRef.current.length - 1;
        }
        props.onChange(next);
      };
      const replaceSelection = (before: string, after = "", fallback = "텍스트") => {
        const start = Math.max(0, Math.min(selection.start, editorValue.length));
        const end = Math.max(start, Math.min(selection.end, editorValue.length));
        const picked = editorValue.slice(start, end) || fallback;
        const next = `${editorValue.slice(0, start)}${before}${picked}${after}${editorValue.slice(end)}`;
        emitEditor(next);
        const cursor = start + before.length + picked.length + after.length;
        setSelection({ start: cursor, end: cursor });
      };
      const insert = (html: string) => {
        const start = Math.max(0, Math.min(selection.start, editorValue.length));
        const end = Math.max(start, Math.min(selection.end, editorValue.length));
        emitEditor(`${editorValue.slice(0, start)}${html}${editorValue.slice(end)}`);
        const cursor = start + html.length;
        setSelection({ start: cursor, end: cursor });
      };
      const undo = () => {
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current -= 1;
        emitEditor(historyRef.current[historyIndexRef.current] ?? "", false);
      };
      const redo = () => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current += 1;
        emitEditor(historyRef.current[historyIndexRef.current] ?? "", false);
      };
      const editorButton = (label: string, action: () => void, active = false) =>
        createElement(
          host.Pressable,
          {
            accessibilityRole: "button",
            accessibilityLabel: label,
            onPress: action,
            style: {
              alignItems: "center",
              backgroundColor: active ? semantic.foregroundInfoLight : semantic.foregroundGrayLight,
              borderColor: active ? semantic.borderPrimary : semantic.borderGray,
              borderRadius: 7,
              borderWidth: 1,
              justifyContent: "center",
              minHeight: 34,
              minWidth: 34,
              paddingHorizontal: 8,
            },
          },
          createElement(host.Text, { style: { color: semantic.text, fontSize: 13 } }, label)
        );
      const panelButton = (label: string, action: () => void) => editorButton(label, action);
      const openPanel = (name: string) => {
        setAuxValue("");
        setPanel(panel === name ? null : name);
      };
      const toolbarChildren: ReactNode[] = [];
      if (enabled.has("undo-redo")) {
        toolbarChildren.push(editorButton("실행 취소", undo), editorButton("다시 실행", redo));
      }
      if (enabled.has("paragraph"))
        toolbarChildren.push(editorButton("문단", () => openPanel("paragraph")));
      if (enabled.has("text-style")) {
        toolbarChildren.push(
          editorButton("굵게", () => replaceSelection("<strong>", "</strong>")),
          editorButton("기울임", () => replaceSelection("<em>", "</em>")),
          editorButton("밑줄", () => replaceSelection("<u>", "</u>")),
          editorButton("취소선", () => replaceSelection("<s>", "</s>"))
        );
      }
      if (enabled.has("color")) {
        toolbarChildren.push(
          editorButton("글자색", () => openPanel("color")),
          editorButton("배경색", () => openPanel("background"))
        );
      }
      if (enabled.has("align"))
        toolbarChildren.push(editorButton("정렬", () => openPanel("align")));
      if (enabled.has("list")) {
        toolbarChildren.push(
          editorButton("목록", () => replaceSelection("<ul><li>", "</li></ul>", "목록")),
          editorButton("번호 목록", () => replaceSelection("<ol><li>", "</li></ol>", "목록"))
        );
      }
      if (enabled.has("table")) toolbarChildren.push(editorButton("표", () => openPanel("table")));
      if (enabled.has("link")) toolbarChildren.push(editorButton("링크", () => openPanel("link")));
      if (enabled.has("image"))
        toolbarChildren.push(editorButton("이미지", () => openPanel("image")));
      if (enabled.has("youtube"))
        toolbarChildren.push(editorButton("YouTube", () => openPanel("youtube")));
      if (enabled.has("hr")) toolbarChildren.push(editorButton("구분선", () => insert("<hr />")));
      if (enabled.has("format")) {
        toolbarChildren.push(
          editorButton("서식 지우기", () => {
            const start = Math.max(0, Math.min(selection.start, editorValue.length));
            const end = Math.max(start, Math.min(selection.end, editorValue.length));
            const source = editorValue.slice(start, end) || editorValue;
            const plain = nativePlainTextFromHtml(source);
            if (start === end) emitEditor(plain);
            else emitEditor(`${editorValue.slice(0, start)}${plain}${editorValue.slice(end)}`);
          })
        );
      }
      if (enabled.has("code")) {
        toolbarChildren.push(editorButton("HTML", () => setCodeMode(!codeMode), codeMode));
      }

      let panelContent: ReactNode = null;
      if (panel === "paragraph") {
        panelContent = createElement(
          host.View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 6 } },
          ...(
            [
              ["본문", "p"],
              ["제목 1", "h1"],
              ["제목 2", "h2"],
              ["제목 3", "h3"],
            ] as const
          ).map(([label, tag]) =>
            panelButton(label, () => {
              replaceSelection(`<${tag}>`, `</${tag}>`, label);
              setPanel(null);
            })
          )
        );
      } else if (panel === "color" || panel === "background") {
        panelContent = createElement(
          host.View,
          { style: { flexDirection: "row", flexWrap: "wrap", gap: 6 } },
          ...["#F23B3B", "#426CED", "#3EA856", "#FFAA00", "#18181B", "#FFFFFF"].map((color) =>
            createElement(host.Pressable, {
              key: color,
              accessibilityRole: "button",
              accessibilityLabel: `${panel === "color" ? "글자색" : "배경색"} ${color}`,
              onPress: () => {
                replaceSelection(
                  `<span style="${panel === "color" ? "color" : "background-color"}:${color}">`,
                  "</span>"
                );
                setPanel(null);
              },
              style: {
                backgroundColor: color,
                borderColor: semantic.borderGrayDeep,
                borderRadius: 7,
                borderWidth: 1,
                height: 34,
                width: 34,
              },
            })
          )
        );
      } else if (panel === "align") {
        panelContent = createElement(
          host.View,
          { style: { flexDirection: "row", gap: 6 } },
          ...(
            [
              ["왼쪽", "left"],
              ["가운데", "center"],
              ["오른쪽", "right"],
            ] as const
          ).map(([label, align]) =>
            panelButton(label, () => {
              replaceSelection(`<p style="text-align:${align}">`, "</p>", label);
              setPanel(null);
            })
          )
        );
      } else if (panel === "table") {
        panelContent = createElement(
          host.View,
          { style: { flexDirection: "row", gap: 6 } },
          panelButton("2×2 표 삽입", () => {
            insert(nativeTableHtml(2, 2));
            setPanel(null);
          }),
          panelButton("3×3 표 삽입", () => {
            insert(nativeTableHtml(3, 3));
            setPanel(null);
          })
        );
      } else if (panel === "link" || panel === "image" || panel === "youtube") {
        const placeholder =
          panel === "link" ? "https://..." : panel === "image" ? "이미지 URL" : "YouTube URL";
        panelContent = createElement(
          host.View,
          { style: { gap: 8 } },
          createElement(host.TextInput, {
            accessibilityLabel: placeholder,
            autoCapitalize: "none",
            onChangeText: setAuxValue,
            placeholder,
            placeholderTextColor: semantic.placeholder,
            style: {
              borderColor: semantic.borderGray,
              borderRadius: 8,
              borderWidth: 1,
              color: semantic.text,
              minHeight: 40,
              paddingHorizontal: 10,
            },
            value: auxValue,
          }),
          createElement(
            host.View,
            { style: { flexDirection: "row", gap: 6, justifyContent: "flex-end" } },
            panelButton("취소", () => setPanel(null)),
            panelButton("삽입", () => {
              const safeUrl = nativeSafeEditorUrl(auxValue, panel as "link" | "image" | "youtube");
              if (!safeUrl) return;
              if (panel === "link")
                replaceSelection(
                  `<a href="${nativeEscapeEditorUrlAttribute(safeUrl)}">`,
                  "</a>",
                  "링크"
                );
              if (panel === "image")
                insert(`<img src="${nativeEscapeEditorUrlAttribute(safeUrl)}" alt="" />`);
              if (panel === "youtube")
                insert(
                  `<iframe src="${nativeEscapeEditorUrlAttribute(safeUrl)}" title="YouTube video"></iframe>`
                );
              setPanel(null);
            })
          )
        );
      }

      const validation = props.validator?.safeParse(editorValue);
      const validationMessage =
        validation && !validation.success
          ? (validation.error?.issues?.[0]?.message ?? "입력값을 확인하세요")
          : undefined;
      const minHeight = props.minHeight ?? props.height ?? 220;
      const maxHeight = props.maxHeight;

      return createElement(
        host.View,
        {
          style: {
            backgroundColor: semantic.background,
            borderColor: validationMessage ? semantic.borderDanger : semantic.borderGray,
            borderRadius: 12,
            borderWidth: 1,
            gap: 8,
            overflow: "hidden",
            padding: 10,
          },
          testID: props.testID,
          "data-mode": codeMode ? "code" : "rich",
        },
        createElement(
          host.View,
          {
            accessibilityRole: "toolbar",
            style: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
          },
          ...toolbarChildren
        ),
        panelContent
          ? createElement(
              host.View,
              {
                accessibilityRole: "dialog",
                accessibilityLabel: "에디터 도구",
                style: {
                  backgroundColor: semantic.foregroundGray,
                  borderColor: semantic.borderGray,
                  borderRadius: 10,
                  borderWidth: 1,
                  padding: 10,
                },
              },
              panelContent
            )
          : null,
        createElement(host.TextInput, {
          accessibilityLabel: props.accessibilityLabel ?? "리치 텍스트 편집기",
          multiline: true,
          onChangeText: emitEditor,
          onSelectionChange: (event: {
            nativeEvent?: { selection?: { start?: number; end?: number } };
          }) => {
            const next = event.nativeEvent?.selection;
            if (next?.start != null && next.end != null) {
              setSelection({ start: next.start, end: next.end });
            }
          },
          placeholder: props.placeholder ?? "내용을 입력하세요...",
          placeholderTextColor: semantic.placeholder,
          style: {
            color: semantic.text,
            fontFamily: codeMode ? "monospace" : undefined,
            fontSize: codeMode ? 13 : 16,
            lineHeight: 24,
            maxHeight,
            minHeight,
            padding: 10,
            textAlignVertical: "top",
          },
          testID: `${props.testID ?? "podo-editor"}-input`,
          value: editorValue,
        }),
        codeMode
          ? null
          : createElement(
              host.View,
              {
                accessibilityLabel: "에디터 미리보기",
                style: {
                  backgroundColor: semantic.foregroundGray,
                  borderRadius: 8,
                  padding: 10,
                },
              },
              createElement(
                host.Text,
                { style: { color: semantic.text, fontSize: 15, lineHeight: 23 } },
                nativePlainTextFromHtml(editorValue) || props.placeholder || "내용을 입력하세요..."
              )
            ),
        validationMessage
          ? createElement(
              host.Text,
              {
                accessibilityRole: "alert",
                style: { color: semantic.foregroundDanger, fontSize: 13 },
              },
              validationMessage
            )
          : null
      );
    },
    EditorView: function NativeEditorView(props) {
      const theme = usePodoNativeTheme();
      const semantic = nativeSemanticColors(theme);
      const WebViewComponent = host.WebView ?? theme.webViewComponent;
      if (WebViewComponent) {
        return createElement(NativeWebEditorView, {
          viewerProps: props,
          WebViewComponent,
        });
      }
      return createElement(
        host.View,
        {
          accessibilityLabel: "에디터 콘텐츠",
          style: { gap: 6 },
          testID: props.testID,
        },
        createElement(
          host.Text,
          { style: { color: semantic.text, fontSize: 16, lineHeight: 24 } },
          nativePlainTextFromHtml(props.value)
        )
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
  DatePicker,
  Editor,
  EditorView,
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
  const semantic = nativeSemanticColors(theme);
  const textColor =
    stringToken(tokens, ["text", "basic"]) ??
    stringToken(tokens, ["color", "text"]) ??
    defaultNativeTextColor(theme);
  const backgroundColor =
    stringToken(tokens, ["elevation", "basic"]) ??
    stringToken(tokens, ["color", "background"]) ??
    defaultNativeBackgroundColor(theme);
  const dangerColor =
    stringToken(tokens, ["text", "danger"]) ??
    stringToken(tokens, ["color", "danger"]) ??
    "#F23B3B";
  const mutedColor = semantic.placeholder;
  const gap =
    numberToken(tokens, ["spacing", "component", "field-gap"]) ??
    numberToken(tokens, ["spacing", "controlGap"]) ??
    6;
  // Figma border/gary #E4E4E7 (gray.20) for light; dark keeps a visible gray.
  const borderColor = semantic.borderGray;

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
    inputDisabled: { backgroundColor: semantic.disabled, borderColor: semantic.borderDisabled },
    inputControlDisabled: { color: semantic.textDisabled },
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
    inputSuffixText: { color: semantic.textSubtil, fontSize: 16 },
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
      backgroundColor: semantic.background,
      borderColor: semantic.borderGray,
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
    selectCellActive: { backgroundColor: semantic.foregroundGrayLight },
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

interface NativeSemanticColors {
  background: string;
  borderDanger: string;
  borderDisabled: string;
  borderGray: string;
  borderGrayDeep: string;
  borderNatural: string;
  borderPrimary: string;
  disabled: string;
  disabledDark: string;
  foregroundBasicReverse: string;
  foregroundDanger: string;
  foregroundDangerLight: string;
  foregroundGray: string;
  foregroundGrayLight: string;
  foregroundGrayLightDeep: string;
  foregroundInfoLight: string;
  foregroundNatural: string;
  foregroundNaturalLightDeep: string;
  foregroundPrimary: string;
  foregroundStaticInvert: string;
  foregroundSuccessLight: string;
  foregroundWarningLight: string;
  iconSubtil: string;
  placeholder: string;
  text: string;
  textBasicReverse: string;
  textDisabled: string;
  textPrimary: string;
  textStaticInvert: string;
  textSubtil: string;
}

/** Resolve the same semantic variables consumed by the web CSS from a generated native token tree. */
function nativeSemanticColors(theme: NativeTheme): NativeSemanticColors {
  const tokens = adaptReactNativeTokens(theme.tokens);
  const dark = theme.colorScheme === "dark";
  const value = (path: string[], light: string, darkValue = light): string =>
    stringToken(tokens, path) ?? (dark ? darkValue : light);
  return {
    background: value(["elevation", "basic"], "#FFFFFF", "#18181B"),
    borderDanger: value(["border", "danger"], "#F23B3B", "#F56666"),
    borderDisabled: value(["border", "disabled"], "#D1D2D6", "#FFFFFF0D"),
    borderGray: value(["border", "gary"], "#E4E4E7", "#FFFFFF1A"),
    borderGrayDeep: value(["border", "gray-deep"], "#D1D2D6", "#FFFFFF33"),
    borderNatural: value(["border", "natural"], "#9FA2AD", "#50555E"),
    borderPrimary: value(["border", "primary"], "#426CED", "#577DEF"),
    disabled: value(["foreground", "disabled"], "#E4E4E7", "#FFFFFF1A"),
    disabledDark: value(["foreground", "disabled-dark"], "#D1D2D6", "#00000033"),
    foregroundBasicReverse: value(["foreground", "basic-reverse"], "#3E424B", "#E4E4E7"),
    foregroundDanger: value(["foreground", "danger"], "#F23B3B", "#F56666"),
    foregroundDangerLight: value(["foreground", "danger-light"], "#FEF1F1", "#FFADAD"),
    foregroundGray: value(["foreground", "gray"], "#F9F9F9", "#FFFFFF0D"),
    foregroundGrayLight: value(["foreground", "gray-light"], "#F4F4F5", "#FFFFFF1A"),
    foregroundGrayLightDeep: value(["foreground", "gray-lightdeep"], "#E4E4E7", "#FFFFFF33"),
    foregroundInfoLight: value(["foreground", "info-light"], "#EBF5FF", "#8FC8FF"),
    foregroundNatural: value(["foreground", "natural"], "#3E424B", "#767985"),
    foregroundNaturalLightDeep: value(["foreground", "natural-lightdeep"], "#767985", "#9FA2AD"),
    foregroundPrimary: value(["foreground", "primary"], "#426CED", "#577DEF"),
    foregroundStaticInvert: value(["foreground", "static-invert"], "#FFFFFF", "#FFFFFF"),
    foregroundSuccessLight: value(["foreground", "success-light"], "#ECF8EF", "#A9DEB4"),
    foregroundWarningLight: value(["foreground", "warning-light"], "#FFF7E6", "#FFD88A"),
    iconSubtil: value(["icon", "subtil"], "#767985", "#9FA2AD"),
    placeholder: value(["text", "placeholder"], "#9FA2AD", "#FFFFFF66"),
    text: value(["text", "basic"], "#18181B", "#F9F9F9"),
    textBasicReverse: value(["text", "basic-reverse"], "#F9F9F9", "#18181B"),
    textDisabled: value(["text", "disabled"], "#9FA2AD", "#FFFFFF33"),
    textPrimary: value(["text", "primary"], "#426CED", "#577DEF"),
    textStaticInvert: value(["text", "static-invert"], "#FFFFFF", "#FFFFFF"),
    textSubtil: value(["text", "subtil"], "#50555E", "#9FA2AD"),
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
