import { Button } from "@podoui/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const SIZES = ["xs", "sm", "md", "lg"] as const;
const THEMES = [
  "solid-primary",
  "solid-assistive",
  "solid-white",
  "solid-danger",
  "outline-primary",
  "outline-assistive",
  "outline-white",
  "outline-danger",
] as const;

const INTRO =
  "버튼은 사용자가 특정 동작을 실행하거나 다음 단계로 나아가도록 돕는 핵심 상호작용 요소로, 명확한 " +
  "레이블과 시각적 강조를 통해 지금 무엇을 할 수 있는지를 직관적으로 전달해요. 일관된 버튼 체계는 " +
  "크기·스타일·색상·상태를 규칙에 맞게 구분해 행동의 중요도와 우선순위를 빠르게 인지하게 해주며, 화면 " +
  "전반의 조작성과 시각적 완성도를 높이는 역할을 해요.";

// Usage stays: live @podoui/react preview with per-target code tabs.
const USAGE_TABS: CodeTab[] = [
  { target: "react", label: "React", code: `<Button theme="solid-primary">Save</Button>` },
  { target: "web", label: "Web", code: `<podo-button theme="solid-primary">Save</podo-button>` },
  {
    target: "hono",
    label: "Hono",
    code: `import { Button } from "@podoui/hono";\n\n<Button theme="solid-primary">Save</Button>`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Button } from "@podoui/native";\n\n<Button theme="solid-primary">Save</Button>`,
  },
];

// Simple icon used to demonstrate prefix/suffix layout.
const Dot = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export function ButtonPage() {
  return (
    <>
      <PageHeader title="버튼 (Button)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Button theme="solid-primary">Save</Button>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="버튼 크기는 사용 위치와 동작의 중요도에 따라 xs(32), sm(36), md(42), lg(52) 사이즈로 구분해 사용해요. xs·sm은 테이블이나 카드처럼 밀도가 높은 영역의 보조 동작에, md는 일반 화면 대부분의 기본 동작에, lg는 주요 CTA나 인풋과 함께 쓰여 강조가 필요한 동작에 사용하며, 일관된 크기 체계를 통해 화면 전반의 정렬과 균형을 유지해요."
      >
        <Card stage>
          {SIZES.map((size) => (
            <StageItem key={size} base={size === "sm"}>
              <Button size={size}>버튼명</Button>
            </StageItem>
          ))}
        </Card>
        <PropertyTags values={[...SIZES]} />
      </DocSection>

      <DocSection
        index={2}
        title="레이아웃 (layout)"
        description="버튼 레이아웃은 전달할 정보와 동작의 성격에 따라 text, prefix, suffix 구성으로 구분해 사용해요. text는 레이블만으로 동작이 충분히 전달될 때, prefix는 동작의 의미를 보조하는 아이콘을 텍스트 앞에 두어 인지를 빠르게 할 때, suffix는 이동·확장·다음 단계처럼 방향성이나 결과를 암시하는 아이콘을 텍스트 뒤에 둘 때 사용해요. 텍스트와 아이콘을 목적에 맞게 조합하면 버튼의 의미가 더 명확해지고, 일관된 레이아웃 체계를 통해 화면 전반의 정렬과 시각적 균형을 유지해요."
      >
        <Card stage>
          <StageItem base>
            <Button size="sm">버튼명</Button>
          </StageItem>
          <Button size="sm" prefix={<Dot />}>
            버튼명
          </Button>
          <Button size="sm" suffix={<Dot />}>
            버튼명
          </Button>
        </Card>
        <PropertyTags values={["text", "prefix", "suffix"]} />
      </DocSection>

      <DocSection
        index={3}
        title="테마 (theme)"
        description="동작의 위계와 사용 맥락에 따라 solid·outline의 형태와 primary·assistive·white·danger의 테마를 조합해 사용해요. solid는 가장 중요한 주요 동작을 또렷하게 강조할 때, outline은 주요 동작을 보조하거나 부담을 줄여야 할때 쓰고, 핵심 동작에 primary, 중립적·보조적 동작에 assistive, 색상 배경이나 이미지 위에서는 white, 삭제처럼 되돌리기 어려운 파괴적 동작에는 danger를 사용해요. 테마를 위계에 맞게 조합하면 한 화면 안에서도 동작의 중요도와 성격이 명확히 구분되어, 사용자의 선택을 자연스럽게 유도해요."
      >
        <Card stage>
          {THEMES.map((theme, index) => (
            <StageItem key={theme} base={index === 0}>
              <Button size="sm" theme={theme}>
                버튼명
              </Button>
            </StageItem>
          ))}
        </Card>
        <PropertyTags values={[...THEMES]} />
      </DocSection>

      <DocSection
        index={4}
        title="상태 (state)"
        description="버튼 상태는 사용자의 상호작용에 따라 normal, hover, pressed, disabled로 구분해 표현해요. hover와 pressed는 지금 조작이 일어나고 있음을 즉각적인 피드백으로 알려주고, disabled는 현재 사용할 수 없는 동작임을 시각적으로 구분해 혼란을 줄이며, 일관된 상태 체계를 통해 모든 버튼이 예측 가능하게 반응하도록 해요."
      >
        <Card stage>
          <Button size="sm">버튼명</Button>
          <Button size="sm" className="is-hover">
            버튼명
          </Button>
          <Button size="sm" className="is-pressed">
            버튼명
          </Button>
          <Button size="sm" disabled>
            버튼명
          </Button>
        </Card>
        <PropertyTags values={["normal", "hover", "pressed", "disabled"]} />
      </DocSection>

      <DocSection
        index={5}
        title="속성 (props)"
        description="@podoui/react의 Button이 받는 속성이에요. 앞서 시안의 layout(text·prefix·suffix)은 코드에서는 prefix·suffix 두 슬롯(ReactNode)으로 표현하며, 둘을 동시에 넣을 수도 있어요. 이 밖에 표준 button 속성(className, aria-*, type 등)도 그대로 전달돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>theme</code>
              </span>,
              <span className="prop-type">
                <code>ButtonTheme</code>
              </span>,
              <code>"solid-primary"</code>,
              "형태(solid·outline)와 색 위계(primary·assistive·white·danger)를 조합한 8가지 테마",
            ],
            [
              <span className="prop-name">
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"xs" | "sm" | "md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "높이·패딩·폰트·radius (xs 32 / sm 36 / md 42 / lg 52)",
            ],
            [
              <span className="prop-name">
                <code>prefix</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "레이블 앞에 놓이는 아이콘 슬롯",
            ],
            [
              <span className="prop-name">
                <code>suffix</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "레이블 뒤에 놓이는 아이콘 슬롯",
            ],
            [
              <span className="prop-name">
                <code>disabled</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비활성 상태. press·click이 발생하지 않아요",
            ],
            [
              <span className="prop-name">
                <code>fill</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "부모 너비를 꽉 채워요 (모바일 CTA, 폼 제출, 모달 푸터 등)",
            ],
            [
              <span className="prop-name">
                <code>onPress</code>
              </span>,
              <span className="prop-type">
                <code>(e: PodoPressEvent) =&gt; void</code>
              </span>,
              "—",
              "버튼이 눌렸을 때 호출돼요. disabled면 발생하지 않아요",
            ],
            [
              <span className="prop-name">
                <code>onClick</code>
              </span>,
              <span className="prop-type">
                <code>(e: MouseEvent) =&gt; void</code>
              </span>,
              "—",
              "표준 클릭 핸들러. onPress보다 먼저 호출돼요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
