import { Icon } from "@podoui/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";
import { nativeComponentUsage } from "../code-examples.js";

const ICONS = [
  "menu",
  "chevron-left",
  "chevron-right",
  "calendar",
  "time",
  "refresh",
  "check",
  "close",
  "search",
] as const;

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code: `import { Icon } from "podo-ui/react";\nimport "./podo/icons/PodoIcons.css";\n\n<Icon name="search" decorative={false} aria-label="검색" />`,
  },
  {
    target: "web",
    label: "Web",
    code: `import { registerPodoElements } from "podo-ui/web";\nimport "./podo/icons/PodoIcons.css";\n\nregisterPodoElements();\n\n<podo-icon name="search" decorative="false" aria-label="검색"></podo-icon>`,
  },
  {
    target: "hono",
    label: "Hono",
    code: `import { Icon } from "podo-ui/hono";\n\n{/* 서버가 생성된 PodoIcons.css와 폰트 파일도 제공해야 해요. */}\n<Icon name="search" decorative={false} aria-label="검색" />`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      nativeComponentUsage(
        ["Icon"],
        `<Icon name="search" decorative={false} accessibilityLabel="검색" />`
      ) +
      `\n\n// 생성된 PodoIcons.ttf를 로드하고 Provider에\n// iconFontFamily="PodoIcons"와 codepoint→문자 iconGlyphs를 전달하세요.`,
  },
];

export function IconPage() {
  return (
    <>
      <PageHeader
        title="아이콘 (Icon)"
        intro="아이콘은 동작과 상태를 작은 시각 기호로 전달해요. 현재 이름과 코드포인트는 JSON 아이콘 매니페스트에서 생성되며, 웹에서는 생성 폰트 CSS를 함께 불러와야 해요."
      />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Icon name="search" decorative={false} aria-label="검색" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="아이콘 목록"
        description="현재 기본 매니페스트가 생성하는 9개 아이콘이에요. 프로젝트의 .podo/icons를 바꾸고 podo build를 실행하면 타입·CSS·폰트가 함께 갱신돼요."
      >
        <Card stage>
          {ICONS.map((name) => (
            <span key={name} className="icon-sample">
              <Icon name={name} />
              <code>{name}</code>
            </span>
          ))}
        </Card>
      </DocSection>

      <DocSection index={2} title="크기 (size)">
        <Card stage>
          <StageItem>
            <Icon name="search" size="sm" />
          </StageItem>
          <StageItem base>
            <Icon name="search" size="md" />
          </StageItem>
          <StageItem>
            <Icon name="search" size="lg" />
          </StageItem>
        </Card>
        <PropertyTags values={["sm (16)", "md (24)", "lg (32)"]} />
      </DocSection>

      <DocSection
        index={3}
        title="속성 (props)"
        description="장식 아이콘은 기본적으로 접근성 트리에서 숨겨져요. 의미를 전달하는 아이콘은 decorative={false}와 aria-label을 함께 지정하세요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [<code>name</code>, <code>string</code>, "—", "생성된 아이콘 이름"],
            [<code>size</code>, <code>"sm" | "md" | "lg"</code>, <code>"md"</code>, "글리프 크기"],
            [
              <code>decorative</code>,
              <code>boolean</code>,
              <code>true</code>,
              "보조기기에서 장식 아이콘 숨김",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
