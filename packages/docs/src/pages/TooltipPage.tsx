import { Button, Tooltip } from "@podoui/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "툴팁은 요소에 마우스를 올리거나 포커스했을 때 짧은 보조 설명을 말풍선으로 보여주는 요소로, 아이콘" +
  "처럼 이름만으로 뜻이 다 전달되지 않는 대상에 맥락을 더할 때 사용해요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `{/* hover/focus에 표시, Escape로 닫힘 — 기본은 document.body 포탈 */}\n` +
      `<Tooltip label="임시 저장돼요" position="top" ordinal="second">\n` +
      `  <Button size="sm">저장</Button>\n` +
      `</Tooltip>`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `<!-- 정적 말풍선 — 표시/배치는 직접 제어해요 -->\n` +
      `<podo-tooltip label="임시 저장돼요" position="top" ordinal="second"></podo-tooltip>`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Tooltip } from "@podoui/hono";\n\n` +
      `<Tooltip label="임시 저장돼요" position="top" ordinal="second" />`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `import { Tooltip } from "@podoui/native";\n\n` +
      `{/* 앱이 직접 앵커에 배치하고 토글해요 */}\n` +
      `<Tooltip label="임시 저장돼요" position="top" />`,
  },
];

/** 정적 미리보기: 트리거 없이 말풍선만 흐름 안에 렌더해요. */
function StaticTooltip(props: {
  label: string;
  theme?: "default" | "reverse";
  position?: "right" | "left" | "bottom" | "top";
  ordinal?: "first" | "second" | "third";
}) {
  return (
    <Tooltip open portal={false} {...props}>
      <span hidden />
    </Tooltip>
  );
}

export function TooltipPage() {
  return (
    <>
      <PageHeader title="툴팁 (Tooltip)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <div className="stage-col">
            <Tooltip label="임시 저장돼요" position="top" ordinal="second">
              <Button size="sm" theme="outline-assistive">
                저장 (호버해 보세요)
              </Button>
            </Tooltip>
          </div>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="테마 (theme)"
        description="툴팁의 배경과 글자 색 조합을 정하는 속성이에요. default는 어두운 배경에 밝은 글자로, reverse는 밝은 배경에 어두운 글자로 표시돼요. 툴팁이 놓이는 화면 배경과 대비되는 쪽을 골라 내용이 잘 읽히도록 해요."
      >
        <Card stage>
          <StageItem base>
            <StaticTooltip label="툴팁 내용을 작성해주세요" theme="default" />
          </StageItem>
          <StaticTooltip label="툴팁 내용을 작성해주세요" theme="reverse" />
        </Card>
        <PropertyTags values={["default", "reverse"]} />
      </DocSection>

      <DocSection
        index={2}
        title="위치 (position)"
        description="기준이 되는 요소를 중심으로 툴팁이 어느 방향에 나타날지 정하는 속성이에요. right·left·bottom·top 중에서 골라, 화살표가 대상을 가리키도록 연결해요. 툴팁이 화면 밖으로 잘리거나 다른 요소를 가리지 않는 방향을 선택해요."
      >
        <Card stage>
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="right" />
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="left" />
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="bottom" />
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="top" />
        </Card>
        <PropertyTags values={["right", "left", "bottom", "top"]} />
      </DocSection>

      <DocSection
        index={3}
        title="순서 (ordinal)"
        description="화살표가 툴팁의 어느 지점에 붙을지 정하는 속성이에요. first·second·third 순서로 화살표가 시작점에서 가운데, 끝점으로 이동해요. 가리키려는 대상의 위치에 맞춰 화살표를 정렬할 때 사용해요."
      >
        <Card stage>
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="left" ordinal="first" />
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="left" ordinal="second" />
          <StaticTooltip label="툴팁 내용을 작성해주세요" position="left" ordinal="third" />
        </Card>
        <PropertyTags values={["first", "second", "third"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podoui/react의 Tooltip이 받는 속성이에요. 트리거 요소 하나를 자식으로 감싸면 hover/focus 핸들러와 aria-describedby가 주입되고, 말풍선은 기본적으로 document.body 포탈에 fixed 좌표로 붙어 overflow·z-index에 잘리지 않아요. 열려 있는 동안 스크롤·리사이즈가 일어나면 좌표가 무효라 닫혀요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>label</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "— (필수)",
              "말풍선 내용 (14px)",
            ],
            [
              <span className="prop-name">
                <code>children</code>
              </span>,
              <span className="prop-type">
                <code>ReactElement</code>
              </span>,
              "— (필수)",
              "트리거 요소 하나. hover/focus/Escape 핸들러와 aria-describedby가 주입돼요",
            ],
            [
              <span className="prop-name">
                <code>position</code>
              </span>,
              <span className="prop-type">
                <code>"right" | "left" | "bottom" | "top"</code>
              </span>,
              <code>"right"</code>,
              "대상 기준 표시 방향. 화살표가 대상을 가리켜요",
            ],
            [
              <span className="prop-name">
                <code>ordinal</code>
              </span>,
              <span className="prop-type">
                <code>"first" | "second" | "third"</code>
              </span>,
              <code>"first"</code>,
              "화살표가 말풍선의 시작/가운데/끝 어디에 붙는지. 포탈 배치도 화살표가 대상 중심을 가리키도록 맞춰져요",
            ],
            [
              <span className="prop-name">
                <code>theme</code>
              </span>,
              <span className="prop-type">
                <code>"default" | "reverse"</code>
              </span>,
              <code>"default"</code>,
              "어두운 배경(default) / 밝은 배경(reverse)",
            ],
            [
              <span className="prop-name">
                <code>portal</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>true</code>,
              "document.body 포탈 + 트리거 좌표 고정. false면 흐름 안에 그대로 렌더돼요",
            ],
            [
              <span className="prop-name">
                <code>open</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              "— (비제어)",
              "표시 여부를 코드에서 제어해요. 생략하면 hover/focus로 스스로 열고 닫아요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
