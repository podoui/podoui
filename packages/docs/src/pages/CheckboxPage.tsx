import { Checkbox } from "@podo/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "체크박스는 사용자가 여러 항목 중 원하는 것을 독립적으로 켜고 끄며 선택하도록 돕는 요소로, 약관 동의나 " +
  "필터·목록의 다중 선택처럼 각 항목을 서로 영향 없이 개별적으로 고르거나 해제해야 할 때 사용해요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code: `<Checkbox label="이용약관 동의" checked={agreed} onCheckedChange={setAgreed} />`,
  },
  {
    target: "web",
    label: "Web",
    code: `<podo-checkbox label="이용약관 동의"></podo-checkbox>\n<!-- podo-checked-change 이벤트로 값 수신 -->`,
  },
  {
    target: "hono",
    label: "Hono",
    code: `import { Checkbox } from "@podo/hono";\n\n<Checkbox checked label="이용약관 동의" />`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Checkbox } from "@podo/native";\n\n<Checkbox label="이용약관 동의" checked={agreed} onCheckedChange={setAgreed} />`,
  },
];

export function CheckboxPage() {
  return (
    <>
      <PageHeader title="체크박스 (Checkbox)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Checkbox label="이용약관 동의" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="체크박스 크기는 사용 위치와 정보 밀도에 따라 md(base), lg로 구분해 사용해요. md는 폼이나 목록처럼 항목이 촘촘히 모이는 일반적인 상황에, lg는 모바일이나 터치 영역 확보가 필요한 화면, 시각적 강조가 필요한 선택에 사용하며, 함께 놓이는 텍스트·요소와 균형을 맞춰 정렬을 유지해요. 박스는 18px로 고정되고 크기는 라벨 텍스트에 적용돼요."
      >
        <Card stage>
          <StageItem base>
            <Checkbox size="md" label="텍스트" />
          </StageItem>
          <Checkbox size="lg" label="텍스트" />
        </Card>
        <PropertyTags values={["md", "lg"]} />
      </DocSection>

      <DocSection
        index={2}
        title="상태 (state)"
        description="체크박스 상태는 선택 정도에 따라 unchecked, checked, indeterminate로 구분해 표현해요. unchecked는 선택되지 않은 기본 상태, checked는 항목이 선택된 상태를, indeterminate는 하위 항목 중 일부만 선택된 부분 선택 상태를 나타내요. indeterminate는 주로 상위 체크박스가 자식 항목의 전체·일부·미선택을 한 번에 보여줄 때 사용하며, 선택할 수 없는 경우 disabled를 더해 비활성 상태임을 함께 구분해요."
      >
        <Card stage>
          <Checkbox label="텍스트" />
          <Checkbox defaultChecked label="텍스트" />
          <Checkbox indeterminate label="텍스트" />
          <Checkbox disabled label="텍스트" />
          <Checkbox disabled defaultChecked label="텍스트" />
          <Checkbox disabled indeterminate label="텍스트" />
        </Card>
        <PropertyTags values={["unchecked", "checked", "indeterminate", "disabled"]} />
      </DocSection>

      <DocSection
        index={3}
        title="강조 (bold)"
        description="체크박스는 함께 표시되는 레이블 텍스트의 강조 정도를 bold로 조절해요. 기본은 일반 굵기로 본문과 자연스럽게 어울리게 하고, bold는 항목의 중요도가 높거나 그룹의 제목·대표 선택지처럼 강조가 필요할 때 사용해요."
      >
        <Card stage>
          <Checkbox bold label="텍스트" />
        </Card>
        <PropertyTags values={["bold"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podo/react의 Checkbox가 받는 속성이에요. 시안의 state(checked·unchecked)는 웹 표준 input[type=checkbox]에 맞춘 checked로, indeterminate는 별도 속성으로 표현돼요(스크린리더에는 mixed로 안내). checked를 생략하면 스스로 상태를 관리하는 비제어형으로 동작하고, 표준 input 속성(name, className, aria-* 등)도 그대로 전달돼요."
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
              "선택 값 (시안 state=checked·unchecked). 지정하면 제어형으로 동작해요",
            ],
            [
              <span className="prop-name">
                <code>defaultChecked</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비제어형일 때의 초기 값",
            ],
            [
              <span className="prop-name">
                <code>indeterminate</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "부분 선택 표시 (시안 state=indeterminate). 상위 체크박스가 자식의 일부 선택을 보여줄 때 사용해요",
            ],
            [
              <span className="prop-name">
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "라벨 크기 (md 14 / lg 16). 박스는 18px로 고정이에요",
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
              "박스 옆 라벨. 클릭 영역이 되고 체크박스의 접근성 이름도 돼요 (없으면 aria-label 권장)",
            ],
            [
              <span className="prop-name">
                <code>disabled</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비활성 상태. unchecked·checked·indeterminate 어디에서도 표시돼요",
            ],
            [
              <span className="prop-name">
                <code>onCheckedChange</code>
              </span>,
              <span className="prop-type">
                <code>(checked: boolean) =&gt; void</code>
              </span>,
              "—",
              "전환될 때 다음 값과 함께 호출돼요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
