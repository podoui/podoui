import { Icon } from "@podoui/react";
import { podoIconNames } from "../podo/icons/PodoIcons.icons.js";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";
import { nativeComponentUsage } from "../code-examples.js";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code: `import { Icon } from "podo-ui/react";\nimport "podo-ui/icons.css";\n\n<Icon name="search" decorative={false} aria-label="검색" />`,
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
        intro="아이콘은 기능과 상태, 정보의 의미를 직관적으로 전달하는 시각 요소예요. 복잡한 내용을 간결하게 표현해 사용자의 이해와 탐색을 돕고, 버튼·메뉴·알림·상태 표시를 빠르게 구분하게 해요. v2에서는 이름과 코드포인트를 JSON 매니페스트에서 생성하며, 웹에서는 생성된 폰트 CSS를 함께 불러와요."
      />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Icon name="search" decorative={false} aria-label="검색" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="아이콘 에셋 (icon)"
        description={`아이콘은 24px 그리드를 기준으로 제작하고, 선형 스타일과 1.2px 스트로크로 형태·두께·시각적 무게를 일관되게 맞춰요. 아래에는 현재 기본 매니페스트가 생성하는 ${podoIconNames.length}개 아이콘을 모두 보여줘요. 프로젝트의 .podo/icons를 바꾸고 podo build를 실행하면 이 목록과 타입·CSS·폰트가 함께 갱신돼요.`}
      >
        <Card>
          <ul className="icon-gallery" aria-label={`전체 아이콘 ${podoIconNames.length}개`}>
            {podoIconNames.map((name) => (
              <li key={name} className="icon-sample">
                <Icon name={name} size="lg" />
                <code>{name}</code>
              </li>
            ))}
          </ul>
        </Card>
      </DocSection>

      <DocSection
        index={2}
        title="크기 (size)"
        description="Figma 원본은 사용 위치와 정보 중요도에 따라 12·16·20·24·32·40px 체계를 정의해요. 현재 v2 Icon 공개 API는 그중 16px(sm)·24px(md)·32px(lg)를 지원하며, 작은 아이콘은 보조 정보와 밀도 높은 UI에, 큰 아이콘은 주요 기능과 강조 영역에 사용해요."
      >
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
