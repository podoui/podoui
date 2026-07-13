import { Switch } from "@podo/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "스위치는 설정을 켜고 끄는 두 가지 상태를 즉시 전환하는 상호작용 요소로, 사용자가 선택하는 순간 곧바로 " +
  "값이 적용돼요. 켜짐과 꺼짐의 색과 핸들 위치를 뚜렷하게 구분해 현재 설정 상태를 한눈에 알 수 있고, 별도의 " +
  "저장 없이 결과가 반영되므로 알림·표시 전환처럼 즉각 반영이 필요한 설정에 사용해요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code: `<Switch label="알림 받기" checked={enabled} onCheckedChange={setEnabled} />`,
  },
  {
    target: "web",
    label: "Web",
    code: `<podo-switch label="알림 받기"></podo-switch>\n<!-- podo-checked-change 이벤트로 값 수신 -->`,
  },
  {
    target: "hono",
    label: "Hono",
    code: `import { Switch } from "@podo/hono";\n\n<Switch checked label="알림 받기" />`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Switch } from "@podo/native";\n\n<Switch label="알림 받기" checked={enabled} onCheckedChange={setEnabled} />`,
  },
];

export function SwitchPage() {
  return (
    <>
      <PageHeader title="스위치 (Switch)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Switch label="알림 받기" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="스위치 크기는 사용 위치와 정보 밀도에 따라 sm, md(base), lg로 구분해 사용해요. sm은 목록이나 설정 행처럼 촘촘한 영역에, md는 일반적인 설정 화면에, lg는 모바일이나 터치 영역 확보·시각적 강조가 필요한 곳에 사용하며, 함께 놓이는 텍스트·요소와 균형을 맞춰 정렬을 유지해요."
      >
        <Card stage>
          <Switch size="sm" label="텍스트" />
          <StageItem base>
            <Switch size="md" label="텍스트" />
          </StageItem>
          <Switch size="lg" label="텍스트" />
        </Card>
        <PropertyTags values={["sm", "md", "lg"]} />
      </DocSection>

      <DocSection
        index={2}
        title="상태 (state)"
        description="스위치 상태는 설정 값과 사용 가능 여부에 따라 off, on, disabled로 구분해 표현해요. off는 설정이 꺼진 기본 상태, on은 설정이 켜져 적용된 상태를 나타내고, disabled는 지금 변경할 수 없는 비활성 상태로 off·on 어느 쪽에서도 함께 나타나요. 켜짐과 꺼짐의 색과 핸들 위치를 뚜렷하게 구분해, 사용자가 현재 설정 상태를 즉시 인지하게 해요."
      >
        <Card stage>
          <Switch label="텍스트" />
          <Switch defaultChecked label="텍스트" />
          <Switch disabled label="텍스트" />
          <Switch disabled defaultChecked label="텍스트" />
        </Card>
        <PropertyTags values={["off", "on", "disabled"]} />
      </DocSection>

      <DocSection
        index={3}
        title="속성 (props)"
        description="@podo/react의 Switch가 받는 속성이에요. 시안의 state(on·off)는 코드에서 웹 표준(role=switch, aria-checked)에 맞춘 checked로 표현돼요. checked를 생략하면 스스로 상태를 관리하는 비제어형으로 동작해요. 이 밖에 표준 button 속성(className, aria-* 등)도 그대로 전달돼요."
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
              "켜짐/꺼짐 값 (시안 state=on·off). 지정하면 제어형으로 동작해요",
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
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"sm" | "md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "트랙 크기 (sm 30×18 / md 40×24 / lg 56×32)",
            ],
            [
              <span className="prop-name">
                <code>label</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "트랙 옆 라벨(크기 연동: sm 14 / md 16 / lg 18). 클릭 영역이 되고 스위치의 접근성 이름도 돼요 (없으면 aria-label 권장)",
            ],
            [
              <span className="prop-name">
                <code>disabled</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비활성 상태. off·on 어느 쪽에서도 표시돼요",
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
