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
        intro="간격은 요소 사이의 여백을 일정한 규칙으로 관리해 화면의 리듬과 정보 위계를 만드는 기준이에요. 관련된 요소는 가깝게, 다른 그룹은 충분히 떨어뜨려 관계를 분명히 하고, 반복되는 간격으로 정렬과 밀도를 일관되게 유지해요. v2에서는 JSON 스펙을 원본으로 CSS 변수와 TypeScript 토큰을 생성하며, 기존 그리드 간격은 v1 호환 계약으로 분리해요."
      />

      <DocSection
        index={0}
        title="기본 간격 토큰"
        description="최신 Figma 원본의 spacing/0부터 spacing/18까지 19개 primitive 변수를 모두 사용해요. 0 · 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 24 · 36 · 48 · 64 · 80 · 96 · 120 · 200px 값이 JSON 원본에서 CSS 변수와 TypeScript 토큰으로 함께 생성돼요."
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
        description="입력 필드 내부처럼 쓰임이 정해진 간격은 primitive 값을 직접 반복하지 않고 component token으로 연결해요. 원본 값이 바뀌어도 같은 역할의 간격을 한 번에 갱신할 수 있어요."
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
        description="v1 그리드의 s(5) 16px와 s(6) 24px 계약은 각각 현재 spacing.scale.8과 spacing.scale.11 값에 대응해요. 기존 별칭은 호환성을 위해 유지하며, 자세한 반응형 동작은 Grid 문서에서 확인할 수 있습니다."
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
