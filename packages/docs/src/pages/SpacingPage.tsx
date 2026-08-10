import { legacyGridContract } from "@podoui/tokens";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { SpecTable } from "../components/SpecTable.js";
import { tokens } from "../podo/tokens.js";

const PRIMITIVE_SPACING = Object.entries(tokens.spacing.scale).map(([name, value]) => ({
  name,
  value,
  cssVariable: `--podo-spacing-scale-${name}`,
}));

const COMPONENT_SPACING = [
  {
    name: "field-gap",
    value: tokens.spacing.component["field-gap"],
    cssVariable: "--podo-spacing-component-field-gap",
  },
] as const;

const GRID_COMPATIBILITY_SPACING = [
  {
    name: "s(5)",
    value: legacyGridContract.breakpoints.tablet.gap,
    usage: "Tablet/Mobile grid gap · inline padding",
  },
  {
    name: "s(6)",
    value: legacyGridContract.breakpoints.pc.gap,
    usage: "PC grid gap · inline padding",
  },
] as const;

function SpacingScale({ items }: { items: readonly { name: string; value: string }[] }) {
  return (
    <div className="spacing-scale">
      {items.map((item) => (
        <div className="spacing-scale__row" key={item.name}>
          <code>{item.name}</code>
          <div className="spacing-scale__measure" aria-label={`${item.name}: ${item.value}`}>
            <span style={{ width: item.value }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function SpacingPage() {
  return (
    <>
      <PageHeader
        title="간격 (Spacing)"
        intro="간격 토큰은 요소 사이의 리듬과 정보 위계를 일관되게 만들어요. v2의 JSON 토큰을 우선 사용하고, 기존 그리드는 v1 호환 간격을 그대로 유지합니다."
      />

      <DocSection
        index={0}
        title="기본 간격 토큰"
        description="프로젝트의 JSON 스펙에서 생성된 primitive spacing scale이에요. CSS 변수와 TypeScript 토큰은 같은 원본에서 만들어집니다."
      >
        <Card>
          <SpacingScale items={PRIMITIVE_SPACING} />
        </Card>
        <SpecTable
          columns={["Token", "CSS variable", "Value"]}
          rows={PRIMITIVE_SPACING.map((item) => [
            <code key={`${item.name}-token`}>spacing.scale.{item.name}</code>,
            <code key={`${item.name}-css`}>{item.cssVariable}</code>,
            item.value,
          ])}
        />
      </DocSection>

      <DocSection
        index={1}
        title="컴포넌트 간격"
        description="의미가 정해진 간격은 primitive 값을 직접 반복하지 않고 component token으로 사용해요."
      >
        <Card>
          <SpacingScale items={COMPONENT_SPACING} />
        </Card>
        <SpecTable
          columns={["Token", "CSS variable", "Value", "Usage"]}
          rows={COMPONENT_SPACING.map((item) => [
            <code key={`${item.name}-token`}>spacing.component.{item.name}</code>,
            <code key={`${item.name}-css`}>{item.cssVariable}</code>,
            item.value,
            "Field 내부 요소 간격",
          ])}
        />
      </DocSection>

      <DocSection
        index={2}
        title="v1 그리드 호환 간격"
        description="그리드의 16px·24px 간격은 새 spacing scale로 재해석하지 않고 v1 호환 계약으로 고정돼요. 자세한 반응형 동작은 Grid 문서에서 확인할 수 있습니다."
      >
        <Card>
          <SpacingScale items={GRID_COMPATIBILITY_SPACING} />
        </Card>
        <SpecTable
          columns={["Legacy alias", "Value", "Usage"]}
          rows={GRID_COMPATIBILITY_SPACING.map((item) => [item.name, item.value, item.usage])}
        />
      </DocSection>
    </>
  );
}
