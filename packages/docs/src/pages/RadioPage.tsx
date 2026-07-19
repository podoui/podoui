import { Radio } from "@podoui/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "라디오 버튼은 사용자가 여러 항목 중 하나만 선택하도록 돕는 요소로, 선택지 가운데 반드시 하나만 골라야 " +
  "할 때 사용해요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `{/* 같은 name의 라디오는 플랫폼이 하나만 선택되게 해요 */}\n` +
      `<Radio name="plan" value="basic" label="베이직" defaultChecked />\n` +
      `<Radio name="plan" value="pro" label="프로" />`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `<!-- 그룹 배타 선택 보존을 위해 커스텀 엘리먼트 대신 클래스로 제공돼요 -->\n` +
      `<label class="podo-radio-wrap">\n` +
      `  <input type="radio" class="podo-radio" name="plan" checked />\n` +
      `  <span class="podo-radio__text">베이직</span>\n` +
      `</label>`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Radio } from "@podoui/hono";\n\n` +
      `<Radio name="plan" value="basic" checked label="베이직" />\n` +
      `<Radio name="plan" value="pro" label="프로" />`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `import { Radio } from "@podoui/native";\n\n` +
      `{/* 네이티브 그룹이 없어 선택 하나 유지는 소비자 몫이에요 */}\n` +
      `<Radio checked={plan === "basic"} onCheckedChange={() => setPlan("basic")} label="베이직" />`,
  },
];

export function RadioPage() {
  return (
    <>
      <PageHeader title="라디오 버튼 (Radio)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <div className="stage-col" style={{ alignItems: "flex-start" }}>
            <Radio name="radio-usage" label="베이직" defaultChecked />
            <Radio name="radio-usage" label="프로" />
          </div>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="라디오 버튼 크기는 사용 위치와 정보 밀도에 따라 md(base), lg로 구분해 사용해요. md는 폼이나 목록처럼 항목이 촘촘히 모이는 일반적인 상황에, lg는 모바일이나 터치 영역 확보가 필요한 화면, 시각적 강조가 필요한 선택에 사용하며, 함께 놓이는 텍스트·요소와 균형을 맞춰 정렬을 유지해요. 원은 18px로 고정되고 크기는 라벨 텍스트에 적용돼요."
      >
        <Card stage>
          <StageItem base>
            <Radio size="md" label="텍스트" />
          </StageItem>
          <Radio size="lg" label="텍스트" />
        </Card>
        <PropertyTags values={["md", "lg"]} />
      </DocSection>

      <DocSection
        index={2}
        title="상태 (state)"
        description="라디오 버튼 상태는 선택 여부에 따라 unchecked, checked로 구분해 표현해요. unchecked는 선택되지 않은 기본 상태, checked는 해당 항목이 선택된 상태를 나타내요. 선택할 수 없는 경우 disabled를 더해 비활성 상태임을 함께 구분하며, 일관된 상태 체계를 통해 사용자가 현재 선택 상황을 즉각 인지하게 해요."
      >
        <Card stage>
          <Radio label="텍스트" />
          <Radio defaultChecked label="텍스트" />
          <Radio disabled label="텍스트" />
          <Radio disabled defaultChecked label="텍스트" />
        </Card>
        <PropertyTags values={["unchecked", "checked", "disabled"]} />
      </DocSection>

      <DocSection
        index={3}
        title="강조 (bold)"
        description="라디오 버튼은 함께 표시되는 레이블 텍스트의 강조 정도를 bold로 조절해요. 기본은 일반 굵기로 본문과 자연스럽게 어울리게 하고, bold는 항목의 중요도가 높거나 그룹의 제목·대표 선택지처럼 강조가 필요할 때 사용해요."
      >
        <Card stage>
          <Radio defaultChecked bold label="텍스트" />
        </Card>
        <PropertyTags values={["bold"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podoui/react의 Radio가 받는 속성이에요. 웹 표준 input[type=radio] 위에 그려져서 같은 name을 가진 라디오끼리는 플랫폼이 하나만 선택되게 유지하고, 방향키 이동·포커스도 브라우저가 처리해요. 이 밖에 표준 input 속성(name, value, className, aria-* 등)도 그대로 전달돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>checked</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              "— (비제어)",
              "선택 값 (시안 checked). 지정하면 제어형으로 동작해요",
            ],
            [
              <span className="prop-name">
                <code>defaultChecked</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비제어형일 때의 초기 값. 같은 name 그룹의 배타 선택은 플랫폼이 유지해요",
            ],
            [
              <span className="prop-name">
                <code>name</code>
              </span>,
              <span className="prop-type">
                <code>string</code>
              </span>,
              "—",
              "같은 name의 라디오가 하나의 배타 선택 그룹이 돼요 (표준 속성)",
            ],
            [
              <span className="prop-name">
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "라벨 크기 (md 14 / lg 16). 원은 18px로 고정이에요",
            ],
            [
              <span className="prop-name">
                <code>bold</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "라벨을 SemiBold로 강조해요",
            ],
            [
              <span className="prop-name">
                <code>label</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "원 옆 라벨. 클릭 영역이 되고 라디오의 접근성 이름도 돼요 (없으면 aria-label 권장)",
            ],
            [
              <span className="prop-name">
                <code>disabled</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비활성 상태. unchecked·checked 어디에서도 표시돼요",
            ],
            [
              <span className="prop-name">
                <code>onCheckedChange</code>
              </span>,
              <span className="prop-type">
                <code>(checked: boolean) =&gt; void</code>
              </span>,
              "—",
              "선택될 때 호출돼요. 그룹의 다른 라디오가 해제될 때는 브라우저 특성상 이벤트가 없어요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
