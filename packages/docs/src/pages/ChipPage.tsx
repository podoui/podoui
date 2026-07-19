import { useState } from "react";
import { Chip } from "@podoui/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "칩은 선택·필터·태그처럼 짧은 정보를 압축해 보여주고 조작하게 하는 작은 상호작용 요소예요. 레이블과 " +
  "아이콘을 조합해 현재 선택된 값이나 적용된 조건을 한눈에 드러내고, 눌러서 선택·해제하거나 삭제하는 " +
  "동작을 즉시 처리할 수 있어요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `{/* 클릭하면 스스로 선택/해제 토글 — selected로 제어형 전환 */}\n` +
      `<Chip onSelectedChange={setOn}>Label</Chip>`,
  },
  { target: "web", label: "Web", code: `<podo-chip>Label</podo-chip>` },
  {
    target: "hono",
    label: "Hono",
    code: `import { Chip } from "@podoui/hono";\n\n<Chip>Label</Chip>`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Chip } from "@podoui/native";\n\n<Chip onPress={toggle}>Label</Chip>`,
  },
];

// Placeholder glyph for the prefix-icon slot.
const Dot = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

// Close glyph for the suffix-icon (removal) slot.
const Close = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 제거형 데모: X를 누르면 실제로 사라지고, 다 지우면 리필 칩이 나타나요.
const REMOVABLE_FRUITS = ["딸기", "바나나", "멜론"];

function RemovableStage() {
  const [items, setItems] = useState(REMOVABLE_FRUITS);
  return (
    <>
      {items.map((fruit) => (
        <Chip
          key={fruit}
          removeLabel={`${fruit} 제거`}
          onRemove={() => setItems(items.filter((item) => item !== fruit))}
        >
          {fruit}
        </Chip>
      ))}
      {items.length === 0 ? (
        <Chip onPress={() => setItems(REMOVABLE_FRUITS)}>다시 채우기</Chip>
      ) : null}
    </>
  );
}

export function ChipPage() {
  return (
    <>
      <PageHeader title="칩 (Chip)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Chip>Label</Chip>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="칩은 사용 화면의 정보 밀도와 중요도에 따라 md(base), lg로 구분해 사용해요. md는 공간이 제한적이거나 칩이 보조적인 역할을 할 때 적합해요. 테이블 셀 안, 리스트 아이템 내부, 인풋 필드 안에 선택값이 쌓이는 멀티 셀렉트 등 밀도가 높은 UI에서 콘텐츠와 균형을 맞출 때 쓰이고, lg는 클릭 영역이 충분해 터치 환경 및 레이블이 명확하게 읽혀야 하는 필터·카테고리 선택·태그 입력 등 주요 인터랙션 맥락에 써요."
      >
        <Card stage>
          <StageItem base>
            <Chip size="md">Label</Chip>
          </StageItem>
          <Chip size="lg">Label</Chip>
        </Card>
        <PropertyTags values={["md", "lg"]} />
      </DocSection>

      <DocSection
        index={2}
        title="테마 (theme)"
        description="칩 테마는 배경 대비와 강조 정도에 따라 solid, outline-strong, outline-weak로 구분해요. solid는 진한 배경으로 선택·활성 상태를 뚜렷하게 강조할 때, outline-strong는 한 단계 낮은 대비로 여러 칩이 함께 놓여 보조적으로 쓰일 때, outline-weak는 밝은 배경에 얇은 외곽선으로 주변과 자연스럽게 어울려야 할 때 사용해요. 맥락에 맞는 테마를 선택하면 칩의 위계가 분명해지고 화면 전체의 강약이 정돈돼요."
      >
        <Card stage>
          <StageItem base>
            <Chip theme="solid">Label</Chip>
          </StageItem>
          <Chip theme="outline-strong">Label</Chip>
          <Chip theme="outline-weak">Label</Chip>
        </Card>
        <PropertyTags values={["solid", "outline-strong", "outline-weak"]} />
      </DocSection>

      <DocSection
        index={3}
        title="상태 (state)"
        description="칩 상태는 선택 여부와 사용자의 조작 단계에 따라 unselected, unselected-pressed, selected, selected-pressed, disabled로 구분해 표현해요. unselected는 아직 선택되지 않은 기본 상태, selected는 선택·활성된 상태를 나타내고, 각 pressed는 누르는 순간의 피드백을 줘요. disabled는 지금 조작할 수 없는 비활성 상태를 낮은 대비로 구분해요. 선택·미선택과 눌림 피드백을 뚜렷하게 나눠, 사용자가 어떤 칩이 켜져 있고 지금 어떤 반응이 일어나는지 즉각 인지하게 해요."
      >
        <Card stage>
          <Chip>Label</Chip>
          <Chip className="is-pressed">Label</Chip>
          <Chip defaultSelected>Label</Chip>
          <Chip defaultSelected className="is-pressed">
            Label
          </Chip>
          <Chip disabled>Label</Chip>
        </Card>
        <PropertyTags
          values={["unselected", "unselected-pressed", "selected", "selected-pressed", "disabled"]}
        />
      </DocSection>

      <DocSection
        index={4}
        title="제거형 (removable)"
        description="제거형 칩은 선택·해제를 오가는 토글이 아니라, 이미 선택된 값을 표시하고 지우는 용도로 사용해요. onRemove를 지정하면 칩이 선택된 모습으로 고정되고 X 버튼이 붙으며, 칩 본체는 눌리지 않고 X 클릭만 콜백을 불러요. 멀티 셀렉트의 선택 값 칩처럼 필터·태그 목록에서 값을 담아두고 하나씩 걷어낼 때 적합해요."
      >
        <Card stage>
          <RemovableStage />
        </Card>
        <PropertyTags values={["onRemove", "removeLabel"]} />
      </DocSection>

      <DocSection
        index={5}
        title="응용 (composition)"
        description="칩은 레이블의 의미를 보조하기 위해 prefix-icon, suffix-icon을 조합해 구성해요. prefix-icon은 카테고리나 상태를 상징하는 아이콘을 레이블 앞에 두어 종류를 빠르게 식별하게 할 때, suffix-icon은 삭제(close)처럼 칩 자체를 제거하는 동작을 레이블 뒤에서 제공할 때 사용해요. 목적에 맞게 조합하면 칩의 역할이 분명해지고 불필요한 안내 없이도 조작 방법을 직관적으로 전달할 수 있어요."
      >
        <Card stage>
          <Chip prefix={<Dot />}>Label</Chip>
          <Chip suffix={<Close />}>Label</Chip>
        </Card>
        <PropertyTags values={["prefix-icon", "suffix-icon"]} />
      </DocSection>

      <DocSection
        index={6}
        title="속성 (props)"
        description="@podoui/react의 Chip이 받는 속성이에요. pressed 계열은 누르는 동안(:active) 자동으로 표현되고, 선택 여부만 selected로 제어해요. 이 밖에 표준 button 속성(className, type, aria-* 등)도 그대로 전달돼요."
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
                <code>"solid" | "outline-strong" | "outline-weak"</code>
              </span>,
              <code>"solid"</code>,
              "배경 대비와 강조 정도",
            ],
            [
              <span className="prop-name">
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "레이블·아이콘 크기 (md 14px / lg 16px)",
            ],
            [
              <span className="prop-name">
                <code>prefix</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "레이블 앞 카테고리·상태 아이콘",
            ],
            [
              <span className="prop-name">
                <code>suffix</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "레이블 뒤 동작 아이콘 (삭제 등)",
            ],
            [
              <span className="prop-name">
                <code>selected</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              "— (비제어)",
              "선택 값 (시안 state). 지정하면 제어형으로 동작하고, 생략하면 클릭할 때 스스로 토글돼요",
            ],
            [
              <span className="prop-name">
                <code>defaultSelected</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비제어형일 때의 초기 선택 값",
            ],
            [
              <span className="prop-name">
                <code>onSelectedChange</code>
              </span>,
              <span className="prop-type">
                <code>(selected: boolean) =&gt; void</code>
              </span>,
              "—",
              "토글될 때 다음 값과 함께 호출돼요",
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
                <code>onPress</code>
              </span>,
              <span className="prop-type">
                <code>(e: PodoPressEvent) =&gt; void</code>
              </span>,
              "—",
              "칩이 눌렸을 때 호출돼요 (onClick도 지원)",
            ],
            [
              <span className="prop-name">
                <code>onRemove</code>
              </span>,
              <span className="prop-type">
                <code>(e: MouseEvent) =&gt; void</code>
              </span>,
              "—",
              "제거형 전환. 선택된 모습으로 고정되고 X 클릭이 이 콜백을 불러요. 토글·onPress는 비활성화돼요",
            ],
            [
              <span className="prop-name">
                <code>removeLabel</code>
              </span>,
              <span className="prop-type">
                <code>string</code>
              </span>,
              <code>"제거"</code>,
              '제거 버튼의 접근성 이름 (예: "딸기 제거")',
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
