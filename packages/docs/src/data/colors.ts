// Color foundation data (Figma 516:2311 / 538:7236). Mirrors the primitive
// palette in packages/spec/samples/tokens/color.tokens.json — same hex values,
// grouped into the documentation sections and card layout shown in the design.

export interface Swatch {
  scale: number;
  hex: string;
  /** For alpha ramps: opacity percentage shown instead of a solid hex. */
  percent?: number;
  /** Swatch text color per Figma: dark (#18181b) vs white. */
  darkText: boolean;
}

export interface ColorScale {
  name: string;
  /** Dark tag pill label (system + base sections). */
  tag?: string;
  description?: string;
  /** Scale step marked with the "base" pill below the bar, if any. */
  base?: number;
  /** If set, swatches are this color at the swatch's `percent` opacity. */
  alphaOver?: string;
  swatches: Swatch[];
}

export interface ColorSection {
  title: string;
  description?: string;
  scales: ColorScale[];
}

// Swatch text is dark for scales below `flip`, white at/above it (Figma rule).
// flip is 50 for every hue except warning/gold (bright yellow), which is 60.
const scale = (entries: Record<number, string>, flip = 50): Swatch[] =>
  Object.entries(entries).map(([k, hex]) => {
    const s = Number(k);
    return { scale: s, hex, darkText: s < flip };
  });

const GRAY = scale({
  0: "#FFFFFF",
  5: "#F9F9F9",
  10: "#F4F4F5",
  20: "#E4E4E7",
  30: "#D1D2D6",
  40: "#9FA2AD",
  50: "#767985",
  60: "#50555E",
  70: "#3E424B",
  80: "#27272A",
  90: "#18181B",
  100: "#000000",
});
const PRIMARY = scale({
  5: "#F1F4FD",
  10: "#D0DBFB",
  20: "#ABBEF7",
  30: "#819EF3",
  40: "#577DEF",
  50: "#426CED",
  60: "#1245E2",
  70: "#123BBA",
  80: "#0D2C8B",
  90: "#091D5D",
});
const SECONDARY = scale({
  5: "#F5F9FF",
  10: "#E6F0FE",
  20: "#CEE2FD",
  30: "#A0C2EE",
  40: "#76A0D8",
  50: "#4A78B5",
  60: "#34547E",
  70: "#2D486C",
  80: "#253C5A",
  90: "#1E3048",
});
const ACCENT = scale({
  5: "#FEF1F2",
  10: "#FCD9DC",
  20: "#FAB7BD",
  30: "#F8969E",
  40: "#F66F7A",
  50: "#F15764",
  60: "#D63D4A",
  70: "#BF3742",
  80: "#992C35",
  90: "#732128",
});
const ERROR = scale({
  5: "#FEF1F1",
  10: "#FFE0DF",
  20: "#FFADAD",
  30: "#FF8985",
  40: "#F56666",
  50: "#F23B3B",
  60: "#EE1818",
  70: "#CD0404",
  80: "#8F0000",
  90: "#5F0000",
});
// Warning/gold flips to white text at 60 (50 is still dark) — bright yellow.
const WARNING = scale(
  {
    5: "#FFF7E6",
    10: "#FFEBC2",
    20: "#FFD88A",
    30: "#FFC654",
    40: "#FFBB33",
    50: "#FFAA00",
    60: "#E89B00",
    70: "#B57900",
    80: "#8C5E00",
    90: "#6B4700",
  },
  60
);
const SUCCESS = scale({
  5: "#ECF8EF",
  10: "#C5E9CD",
  20: "#A9DEB4",
  30: "#81CF92",
  40: "#57C16F",
  50: "#3EA856",
  60: "#38994E",
  70: "#308242",
  80: "#256533",
  90: "#1C4D27",
});
const INFO = scale({
  5: "#EBF5FF",
  10: "#C7E3FF",
  20: "#8FC8FF",
  30: "#70B9FF",
  40: "#56ACFF",
  50: "#0095FF",
  60: "#0074E5",
  70: "#0056AA",
  80: "#00407F",
  90: "#002B55",
});
const ORANGE = scale({
  5: "#FFF4F0",
  10: "#FFDACC",
  20: "#FFB599",
  30: "#FE9975",
  40: "#FE8052",
  50: "#FF6A33",
  60: "#FF5212",
  70: "#DB3B00",
  80: "#992900",
  90: "#661C00",
});
const VIOLET = scale({
  5: "#F8F5FF",
  10: "#EEE5FF",
  20: "#D7C2FF",
  30: "#BD99FF",
  40: "#AC80FF",
  50: "#8E51FF",
  60: "#6A3DBF",
  70: "#553199",
  80: "#472980",
  90: "#361F61",
});

// Alpha ramp: scale label → opacity percent (note 20 → 25%, per Figma).
const ALPHA_STEPS: Record<number, number> = {
  5: 5,
  10: 10,
  20: 25,
  30: 30,
  40: 40,
  50: 50,
  60: 60,
  70: 70,
  80: 80,
  90: 90,
};
// Alpha rows compute their own text color from opacity (see ColorPage), so
// darkText here is a placeholder to satisfy the type.
const alpha = (): Swatch[] =>
  Object.entries(ALPHA_STEPS).map(([k, percent]) => ({
    scale: Number(k),
    hex: "",
    percent,
    darkText: true,
  }));

export const COLOR_SECTIONS: ColorSection[] = [
  {
    title: "그레이 색상 (gray color)",
    description:
      "그레이 색상(gray color)은 주요 UI 요소와 조화를 이루는 중립적인 색상으로 주로 배경, 텍스트, 구분 선에 사용해요.",
    scales: [{ name: "gray", swatches: GRAY }],
  },
  {
    title: "프라이머리 색상 (primary color)",
    description:
      "프라이머리 색상(primary color)은 브랜드나 서비스의 정체성을 가장 강하게 드러내는 대표 색상으로, 주요 버튼, 핵심 액션, 선택 상태 등 사용자의 주목이 필요한 요소에 사용해요.",
    scales: [{ name: "primary", base: 70, swatches: PRIMARY }],
  },
  {
    title: "세컨더리 색상 (secondary color)",
    description:
      "세컨더리 색상(secondary color)은 프라이머리를 보완해 화면에 위계와 리듬을 더하는 색상으로, 보조 강조나 정보 표현에 사용해요.",
    scales: [{ name: "secondary", base: 60, swatches: SECONDARY }],
  },
  {
    title: "강조 색상 (accent color)",
    description:
      "강조 색상(accent color)은 특정 정보나 상호작용을 돋보이게 해 시선을 끌어야 하는 요소에 제한적으로 사용해요.",
    scales: [{ name: "accent", base: 50, swatches: ACCENT }],
  },
  {
    title: "시스템 색상 (system color)",
    description:
      "시스템 색상(system color)은 사용자의 행동 결과나 상태 정보를 명확하게 전달하기 위한 기능적 색상으로, 위험·주의·성공·정보와 같은 상황별 의미를 일관되게 표현하는 데 사용해요.",
    scales: [
      {
        name: "error",
        tag: "danger",
        base: 50,
        description:
          "오류, 삭제, 실패, 중단처럼 사용자의 주의가 즉시 필요한 부정적이거나 위험한 상태를 나타낼 때 사용해요.",
        swatches: ERROR,
      },
      {
        name: "warning",
        tag: "warning",
        base: 50,
        description:
          "확인이 필요하거나 잠재적인 문제가 있는 상태를 안내할 때 사용하며, 사용자가 신중하게 판단하도록 돕는 역할을 해요.",
        swatches: WARNING,
      },
      {
        name: "success",
        tag: "success",
        base: 50,
        description:
          "저장, 완료, 승인, 정상 처리처럼 작업이 성공적으로 끝났거나 긍정적인 상태를 나타낼 때 사용해요.",
        swatches: SUCCESS,
      },
      {
        name: "info",
        tag: "info",
        base: 50,
        description:
          "안내, 도움말, 업데이트, 참고 메시지처럼 사용자에게 중립적인 정보를 전달할 때 사용해요.",
        swatches: INFO,
      },
    ],
  },
  {
    title: "베이스 색상 (base color)",
    description:
      "베이스 색상(base color)은 디자인 시스템에서 사용할 색상을 미리 모아 둔 기본 색상 팔레트로, 실제 화면에서는 이 값을 직접 사용하기보다 토큰이나 변수와 연결해 사용해요.",
    scales: [
      { name: "red", tag: "red", swatches: ERROR },
      { name: "rose", tag: "rose", swatches: ACCENT },
      { name: "green", tag: "green", swatches: SUCCESS },
      { name: "gold", tag: "gold", swatches: WARNING },
      { name: "orange", tag: "orange", swatches: ORANGE },
      { name: "blue", tag: "blue", swatches: INFO },
      { name: "royal-blue", tag: "royal-blue", swatches: PRIMARY },
      { name: "classic-blue", tag: "classic-blue", swatches: SECONDARY },
      { name: "violet", tag: "violet", swatches: VIOLET },
      { name: "gray", tag: "gray", swatches: GRAY },
      {
        name: "alpha-white",
        tag: "alpha/white (#FFFFFF)",
        alphaOver: "#FFFFFF",
        swatches: alpha(),
      },
      {
        name: "alpha-black",
        tag: "alpha/black (#000000)",
        alphaOver: "#000000",
        swatches: alpha(),
      },
    ],
  },
];
