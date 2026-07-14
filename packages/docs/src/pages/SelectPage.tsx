import { Select } from "@podo/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "선택은 사용자가 정해진 목록에서 값을 고르도록 돕는 상호작용 요소로, 직접 입력하는 부담을 줄이고 " +
  "허용된 값만 선택하게 해 오류를 예방해요. 명확한 플레이스홀더와 선택 결과, 상태 표현을 통해 무엇을 " +
  "고를 수 있고 지금 어떤 값이 선택되었는지를 직관적으로 안내해요.";

const FRUITS = [
  { value: "strawberry", label: "딸기" },
  { value: "banana", label: "바나나" },
  { value: "grape", label: "포도" },
  { value: "apple", label: "사과" },
  { value: "orange", label: "오렌지" },
  { value: "peach", label: "복숭아" },
  { value: "watermelon", label: "수박" },
  { value: "melon", label: "멜론" },
  { value: "blueberry", label: "블루베리" },
  { value: "kiwi", label: "키위" },
];

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `<Select\n` +
      `  placeholder="과일 선택"\n` +
      `  options={[\n` +
      `    { value: "strawberry", label: "딸기" },\n` +
      `    { value: "banana", label: "바나나" },\n` +
      `  ]}\n` +
      `  onValueChange={setFruit}\n` +
      `/>`,
  },
  {
    target: "web",
    label: "Web",
    code: `<podo-select\n  placeholder="과일 선택"\n  options='[{"value":"strawberry","label":"딸기"}]'\n></podo-select>`,
  },
  {
    target: "hono",
    label: "Hono",
    code: `import { Select } from "@podo/hono";\n\n<Select placeholder="과일 선택" options={fruits} />`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Select } from "@podo/native";\n\n<Select placeholder="과일 선택" options={fruits} onValueChange={setFruit} />`,
  },
];

export function SelectPage() {
  return (
    <>
      <PageHeader title="선택 (Select)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Select placeholder="과일 선택" options={FRUITS} />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="선택 크기는 사용 화면의 정보 밀도와 중요도에 따라 md(base), lg로 구분해 사용해요. md는 대시보드나 설정처럼 한 화면에 여러 입력이 모이는 일반 폼에, lg는 모바일 메인 폼이나 강조가 필요한 선택에 사용하며, 같은 크기의 입력·버튼과 높이를 맞춰 한 줄에 놓일 때 자연스럽게 정렬돼요."
      >
        <Card stage>
          <StageItem base>
            <Select size="md" placeholder="플레이스 홀더" options={FRUITS} />
          </StageItem>
          <Select size="lg" placeholder="플레이스 홀더" options={FRUITS} />
        </Card>
        <PropertyTags values={["md", "lg"]} />
      </DocSection>

      <DocSection
        index={2}
        title="테마 (theme)"
        description="선택 테마는 선택 결과를 어떻게 보여줄지에 따라 text, slot으로 구분해요. text는 선택한 값을 한 줄 텍스트로 간결하게 노출해 단일 선택이나 좁은 영역에 적합하고, slot은 선택한 값들을 삭제 가능한 칩(chip)으로 나열해 다중 선택처럼 여러 값을 동시에 확인·해제해야 할 때 사용해요. 코드에서는 multiple 속성이 이 구분을 담당해요 — false면 text, true면 slot."
      >
        <Card stage>
          <StageItem base>
            <Select placeholder="플레이스 홀더" options={FRUITS} />
          </StageItem>
          <Select
            multiple
            placeholder="플레이스 홀더"
            options={FRUITS}
            defaultValues={["strawberry", "banana"]}
          />
        </Card>
        <PropertyTags values={["text", "slot"]} />
      </DocSection>

      <DocSection
        index={3}
        title="상태 (state)"
        description="선택 상태는 선택 단계와 결과에 따라 normal, hover, focused, completed, danger, disabled로 구분해 표현해요. normal은 선택 전 기본 상태, hover는 마우스를 올려 상호작용 가능함을 미리 알리고, focused는 메뉴가 열려 값을 고르는 중임을, completed는 값이 올바르게 선택됐음을, danger는 필수 선택 누락이나 검증 실패를 알리고, disabled는 지금 선택할 수 없는 상태임을 시각적으로 구분해요. hover·focused는 실제 인터랙션으로 표현되고, completed는 값이 선택되면 자연히 나타나요. danger는 포커스 중에도 색을 유지해요."
      >
        <Card stage>
          <div className="stage-col">
            <Select placeholder="플레이스 홀더" options={FRUITS} />
            <Select className="is-hover" placeholder="플레이스 홀더" options={FRUITS} />
            {/* 열린 메뉴가 아래 샘플을 덮지 않게 메뉴 높이만큼 공간 확보 */}
            <span style={{ display: "inline-flex", marginBottom: 118 }}>
              <Select
                defaultOpen
                placeholder="플레이스 홀더"
                options={[
                  { value: "a", label: "작성영역" },
                  { value: "b", label: "작성영역" },
                ]}
              />
            </span>
            <Select defaultValue="strawberry" options={FRUITS} />
            <Select invalid placeholder="플레이스 홀더" options={FRUITS} />
            <Select disabled placeholder="플레이스 홀더" options={FRUITS} />
          </div>
        </Card>
        <PropertyTags values={["normal", "hover", "focused", "completed", "danger", "disabled"]} />
      </DocSection>

      <DocSection
        index={4}
        title="응용 (composition)"
        description="선택의 목적과 데이터 규모에 따라 단일 선택의 경우 text 테마를, 다중 선택의 경우 slot 테마를 사용해서 구성하고, 선택 항목 추가가 필요한 경우 menu 슬롯에 select.input 컴포넌트를 사용해 구성해요(addable — 추가된 값은 목록에 붙고 자동 선택). 세 형태 모두 필요시 검색기능(searchable)을 조합할 수 있어요 — 열린 트리거에 입력하면 입력어를 포함한 항목만 남아요. 아래는 단일 선택, 다중 선택, 선택 항목 추가 각각에 검색을 끄고 켠 6가지 케이스예요."
      >
        <Card stage>
          {/* 단일 선택: 검색 불가능 / 가능 */}
          <Select placeholder="과일 선택" options={FRUITS} />
          <Select searchable placeholder="과일 선택 및 검색" options={FRUITS} />
          {/* 다중 선택: 검색 불가능 / 가능 — 칩 3개 초과는 +N으로 축약 */}
          <Select
            multiple
            placeholder="과일 선택"
            options={FRUITS}
            defaultValues={["strawberry", "banana", "grape", "apple", "orange"]}
          />
          <Select multiple searchable placeholder="과일 선택 및 검색" options={FRUITS} />
          {/* 선택 항목 추가: 검색 불가능 / 가능 */}
          <Select
            multiple
            addable
            placeholder="과일 선택"
            addPlaceholder="과일 이름 입력"
            options={FRUITS}
          />
          <Select
            multiple
            addable
            searchable
            placeholder="과일 선택 및 검색"
            addPlaceholder="과일 이름 입력"
            options={FRUITS}
          />
        </Card>
        <PropertyTags
          values={[
            "단일 선택",
            "단일 선택 + 검색",
            "다중 선택",
            "다중 선택 + 검색",
            "선택 항목 추가",
            "선택 항목 추가 + 검색",
          ]}
        />
      </DocSection>

      <DocSection
        index={5}
        title="속성 (props)"
        description="@podo/react의 Select가 받는 속성이에요. hover·focused는 인터랙션으로 자동 표현되고, completed는 값이 선택되면 파생돼요. 단일 모드는 value 계열, 다중 모드(multiple)는 values 계열을 사용해요. 이 밖에 표준 div 속성(className, aria-* 등)도 그대로 전달돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>options</code>
              </span>,
              <span className="prop-type">
                <code>{"Array<{ value: string; label: string }>"}</code>
              </span>,
              "—",
              "메뉴 항목 목록. 셀 마크업은 컴포넌트가 그려요",
            ],
            [
              <span className="prop-name">
                <code>placeholder</code>
              </span>,
              <span className="prop-type">
                <code>string</code>
              </span>,
              "—",
              "값이 없을 때 트리거에 표시돼요",
            ],
            [
              <span className="prop-name">
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "트리거 높이·둥글기 (md 42px / lg 52px)",
            ],
            [
              <span className="prop-name">
                <code>multiple</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "다중 선택 (시안 theme=slot). 선택 값이 칩으로 나열되고 셀에 체크박스가 붙어요",
            ],
            [
              <span className="prop-name">
                <code>value</code> / <code>defaultValue</code>
              </span>,
              <span className="prop-type">
                <code>string | null</code>
              </span>,
              "— (비제어)",
              "단일 선택 값. value를 지정하면 제어형으로 동작해요",
            ],
            [
              <span className="prop-name">
                <code>onValueChange</code>
              </span>,
              <span className="prop-type">
                <code>(value: string) =&gt; void</code>
              </span>,
              "—",
              "단일 값이 선택될 때 호출돼요",
            ],
            [
              <span className="prop-name">
                <code>values</code> / <code>defaultValues</code>
              </span>,
              <span className="prop-type">
                <code>string[]</code>
              </span>,
              "— (비제어)",
              "다중 선택 값. values를 지정하면 제어형으로 동작해요",
            ],
            [
              <span className="prop-name">
                <code>onValuesChange</code>
              </span>,
              <span className="prop-type">
                <code>(values: string[]) =&gt; void</code>
              </span>,
              "—",
              "다중 값이 토글될 때 다음 배열과 함께 호출돼요",
            ],
            [
              <span className="prop-name">
                <code>maxChips</code>
              </span>,
              <span className="prop-type">
                <code>number</code>
              </span>,
              <code>3</code>,
              '트리거에 보여줄 최대 칩 수. 넘치는 값은 "+N"으로 축약되고 해제는 메뉴에서 해요',
            ],
            [
              <span className="prop-name">
                <code>searchable</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "열리면 트리거가 검색 입력이 되고 입력어를 포함한 항목만 남아요. 단일·다중·추가형 어디에나 조합 가능",
            ],
            [
              <span className="prop-name">
                <code>addable</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "메뉴 상단에 직접 추가 입력줄을 표시해요. 추가된 항목은 목록에 붙고 자동 선택돼요",
            ],
            [
              <span className="prop-name">
                <code>addPlaceholder</code>
              </span>,
              <span className="prop-type">
                <code>string</code>
              </span>,
              "—",
              "추가 입력줄의 플레이스홀더",
            ],
            [
              <span className="prop-name">
                <code>onOptionAdd</code>
              </span>,
              <span className="prop-type">
                <code>(option: SelectOption) =&gt; void</code>
              </span>,
              "—",
              "추가 버튼으로 새 옵션이 만들어졌을 때 호출돼요",
            ],
            [
              <span className="prop-name">
                <code>invalid</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "danger 상태. 포커스(열림) 중에도 danger 색을 유지해요",
            ],
            [
              <span className="prop-name">
                <code>disabled</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비활성 상태. 열리지 않아요",
            ],
            [
              <span className="prop-name">
                <code>prefix</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "값 앞에 붙는 아이콘 (시안 prefix-icon)",
            ],
            [
              <span className="prop-name">
                <code>defaultOpen</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "초기 열림 상태 (문서·데모용)",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
