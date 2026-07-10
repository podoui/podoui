// Typography foundation data (Figma 538:6695). Values mirror the typography
// tokens in packages/spec/samples/tokens/typography.tokens.json.

export interface TypeStyle {
  /** Style name, e.g. "Display-xlarge" (used as the preview sample text). */
  name: string;
  pc: number;
  tablet: number;
  mobile: number;
  weight: number;
  weightLabel: string;
  lineHeight: string;
}

export interface TypeSection {
  title: string;
  description: string;
  /** Preview sample uses this pc size cap so huge display text stays readable. */
  styles: TypeStyle[];
}

const disp = (name: string, pc: number, tablet: number, mobile: number): TypeStyle => ({
  name,
  pc,
  tablet,
  mobile,
  weight: 700,
  weightLabel: "bold",
  lineHeight: "120%",
});

const body = (
  name: string,
  pc: number,
  tablet: number,
  mobile: number,
  weight: number,
  lineHeight: string
): TypeStyle => ({
  name,
  pc,
  tablet,
  mobile,
  weight,
  weightLabel: weight >= 600 ? "semibold" : "regular",
  lineHeight,
});

export const TYPE_SECTIONS: TypeSection[] = [
  {
    title: "Display",
    description:
      "디스플레이(Display)는 히어로, 랜딩 페이지, 배너 등 시각적 임팩트가 필요한 영역에 사용하는 대형 텍스트에 사용해요.",
    styles: [
      disp("Display-xlarge", 60, 48, 36),
      disp("Display-large", 52, 42, 32),
      disp("Display-medium", 44, 36, 28),
      disp("Display-small", 38, 34, 26),
      disp("Display-xsmall", 34, 30, 24),
    ],
  },
  {
    title: "Heading",
    description:
      "제목(Heading)은 섹션 제목, 카드 제목, 리스트 타이틀 등 콘텐츠의 위계를 나타내는 텍스트로 HTML 시멘틱 태그(h1~h6)의 스타일은 이 디자인 시스템에 포함되지 않으며, 각 프로젝트에서 텍스트 스타일 h1~h6 토큰을 활용하여 개별 설정해서 사용해요.",
    styles: [
      disp("Heading-xlarge", 32, 28, 24),
      disp("Heading-large", 28, 24, 20),
      disp("Heading-medium", 24, 20, 18),
      disp("Heading-small", 20, 18, 16),
      disp("Heading-xsmall", 16, 16, 14),
      disp("Heading-xxsmall", 14, 14, 13),
    ],
  },
  {
    title: "Body",
    description:
      "본문(Body)은 문단, 설명문, 리스트, 입력 안내 등 사용자가 실제로 읽고 이해해야 하는 주요 콘텐츠에 사용하는 기본 텍스트예요. 가독성과 정보 전달력을 가장 중요하게 고려하며, 다양한 화면 크기와 사용 환경에서도 편안하게 읽을 수 있도록 적절한 크기, 행간, 굵기를 유지해요. Body 스타일은 콘텐츠의 성격과 중요도에 따라 여러 단계로 구분해 사용하며, 화면 전반의 정보 밀도와 읽기 흐름을 안정적으로 만드는 역할을 해요.",
    styles: [
      body("Body-xlarge", 20, 20, 18, 400, "150%"),
      body("Body-xlarge-bold", 20, 20, 18, 600, "150%"),
      body("Body-large", 18, 18, 16, 400, "160%"),
      body("Body-large-bold", 18, 18, 16, 600, "160%"),
      body("Body-medium", 16, 16, 14, 400, "160%"),
      body("Body-medium-bold", 16, 16, 14, 600, "160%"),
      body("Body-small", 14, 14, 13, 400, "160%"),
      body("Body-small-bold", 14, 14, 13, 600, "160%"),
      body("Body-xsmall", 13, 13, 12, 400, "160%"),
      body("Body-xsmall-bold", 13, 13, 12, 600, "160%"),
    ],
  },
];

export const TYPO_INTRO =
  "타이포그래피는 정보를 읽고 이해하는 방식을 결정하는 핵심 시각 요소로, 글자의 크기와 굵기, 행간, " +
  "자간, 정렬 방식 등을 통해 콘텐츠의 구조와 우선순위를 명확하게 보여줘요. 잘 설계된 타이포그래피 " +
  "체계는 사용자가 중요한 정보를 빠르게 인식하고 자연스럽게 읽어 내려갈 수 있도록 돕고, 화면 전반의 " +
  "분위기와 브랜드의 성격을 일관되게 전달하는 역할을 해요.";
