import { Badge } from "@podo/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "배지는 아이콘이나 메뉴, 목록 항목 곁에 붙어 개수·상태·알림 여부를 작게 표시하는 요소로, 읽지 않은 " +
  "알림 수나 진행 상태처럼 사용자가 놓치지 말아야 할 정보를 눈에 띄게 알려줄 때 사용해요.";

const USAGE_TABS: CodeTab[] = [
  { target: "react", label: "React", code: `<Badge>99</Badge>` },
  { target: "web", label: "Web", code: `<podo-badge>99</podo-badge>` },
  {
    target: "hono",
    label: "Hono",
    code: `import { Badge } from "@podo/hono";\n\n<Badge>99</Badge>`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Badge } from "@podo/native";\n\n<Badge>99</Badge>`,
  },
];

export function BadgePage() {
  return (
    <>
      <PageHeader title="배지 (Badge)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Badge>99</Badge>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="시스템 상태 (system state)"
        description="시스템 상태 배지는 알림의 의미와 중요도에 따라 natural, danger, success, warning, info로 구분해 사용해요. natural은 단순 개수나 기본 알림에, danger는 오류나 즉시 확인이 필요한 경고에, success는 완료·정상 처리에, warning은 주의가 필요한 상황에, info는 안내성 정보에 사용하며, 상태별로 색을 뚜렷하게 구분해 사용자가 알림의 성격을 즉시 인지하게 해요."
      >
        <Card stage>
          <StageItem base>
            <Badge theme="natural">99</Badge>
          </StageItem>
          <Badge theme="danger">99</Badge>
          <Badge theme="success">99</Badge>
          <Badge theme="warning">99</Badge>
          <Badge theme="info">99</Badge>
        </Card>
        <PropertyTags values={["natural", "danger", "success", "warning", "info"]} />
      </DocSection>

      <DocSection
        index={2}
        title="색상 표기 (color)"
        description="색상 표기 배지는 정해진 의미 없이 항목의 분류나 라벨을 시각적으로 구분할 때 gray, red, green, yellow, blue, purple, orange로 사용해요. 연한 배경과 짙은 텍스트로 대비를 낮춰 주변 콘텐츠를 방해하지 않으며, 카테고리·태그처럼 종류를 색으로만 나눠 표시해야 할 때 사용해 목록을 한눈에 훑어보게 해요."
      >
        <Card stage>
          <Badge theme="gray">99</Badge>
          <Badge theme="red">99</Badge>
          <Badge theme="green">99</Badge>
          <Badge theme="yellow">99</Badge>
          <Badge theme="blue">99</Badge>
          <Badge theme="purple">99</Badge>
          <Badge theme="orange">99</Badge>
        </Card>
        <PropertyTags values={["gray", "red", "green", "yellow", "blue", "purple", "orange"]} />
      </DocSection>

      <DocSection
        index={3}
        title="도트 (dot)"
        description="도트 배지는 숫자나 텍스트 없이 작은 점 하나로 상태나 알림 여부만 간결하게 표시할 때 사용해요. 새 알림의 유무나 온·오프 상태처럼 정확한 값이 필요 없는 상황에서 아이콘이나 항목 곁에 최소한의 면적으로 존재감을 더하며, 색상으로 종류를 구분해 공간이 좁은 UI에서도 부담 없이 상태를 알려요."
      >
        <Card stage>
          <Badge theme="gray" dot aria-label="gray" />
          <Badge theme="red" dot aria-label="red" />
          <Badge theme="green" dot aria-label="green" />
          <Badge theme="yellow" dot aria-label="yellow" />
          <Badge theme="blue" dot aria-label="blue" />
          <Badge theme="purple" dot aria-label="purple" />
          <Badge theme="orange" dot aria-label="orange" />
        </Card>
        <PropertyTags values={["gray", "red", "green", "yellow", "blue", "purple", "orange"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podo/react의 Badge가 받는 속성이에요. 표시할 숫자·텍스트는 children으로 전달하고, 이 밖에 표준 span 속성(className, aria-* 등)도 그대로 전달돼요. 도트처럼 보이는 텍스트가 없을 땐 aria-label로 의미를 제공하세요."
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
                <code>
                  "natural" | "danger" | "success" | "warning" | "info" | "gray" | "red" | "green" |
                  "yellow" | "blue" | "purple" | "orange"
                </code>
              </span>,
              <code>"natural"</code>,
              "상태·의미 색상. natural~info는 진한 배경의 시스템 상태, gray~orange는 연한 배경의 색상 표기예요",
            ],
            [
              <span className="prop-name">
                <code>dot</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "숫자·텍스트 없이 6px 점만 표시해요. children은 무시돼요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
