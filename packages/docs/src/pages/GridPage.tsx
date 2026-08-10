import { legacyGridContract } from "@podoui/tokens";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { SpecTable } from "../components/SpecTable.js";

const BREAKPOINTS = [
  {
    name: "PC",
    range: `${legacyGridContract.breakpoints.pc.minWidth} 이상`,
    ...legacyGridContract.breakpoints.pc,
  },
  {
    name: "Tablet",
    range: `${legacyGridContract.breakpoints.tablet.minWidth}–${legacyGridContract.breakpoints.tablet.maxWidth}`,
    ...legacyGridContract.breakpoints.tablet,
  },
  {
    name: "Mobile",
    range: `${legacyGridContract.breakpoints.mobile.maxWidth} 이하`,
    ...legacyGridContract.breakpoints.mobile,
  },
] as const;

export function GridPage() {
  return (
    <>
      <PageHeader
        title="그리드 (Grid)"
        intro="그리드는 화면을 일정한 컬럼과 간격으로 나누어 콘텐츠의 시작점, 폭, 정렬을 일관되게 만드는 레이아웃 기준이에요. Podo는 화면 폭에 따라 PC 12개, Tablet 6개, Mobile 4개 컬럼으로 전환하며, v2에서도 기존 클래스와 반응형 규칙을 재현 가능한 CSS·SCSS로 생성해요."
      />

      <DocSection
        index={0}
        title="반응형 컬럼"
        description="넓은 화면에서는 많은 컬럼으로 정보 밀도와 정렬 선택지를 확보하고, 좁은 화면에서는 컬럼 수와 간격을 줄여 콘텐츠의 가독성을 유지해요. 브라우저 폭을 바꾸면 아래 예제가 현재 구간의 컬럼 수와 간격으로 즉시 바뀝니다."
      >
        <div className="grid-breakpoint-cards">
          {BREAKPOINTS.map((item) => (
            <article className="grid-breakpoint-card" key={item.name}>
              <span>{item.name}</span>
              <strong>{item.columns} columns</strong>
              <small>{item.range}</small>
            </article>
          ))}
        </div>
        <Card>
          <div className="foundation-grid" aria-label="반응형 그리드 예제">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
        </Card>
        <SpecTable
          columns={["Viewport", "Range", "Columns", "Gap", "Inline padding"]}
          rows={BREAKPOINTS.map((item) => [
            item.name,
            item.range,
            String(item.columns),
            item.gap,
            item.paddingInline,
          ])}
        />
      </DocSection>

      <DocSection
        index={1}
        title="컬럼 Span"
        description="콘텐츠의 중요도와 필요한 폭에 따라 여러 컬럼을 묶어 사용해요. 직접 자식에 w-{n}을 적용하면 지정한 컬럼 수만큼 차지하고, w-full은 현재 화면의 전체 컬럼을 채워요."
      >
        <Card>
          <div className="foundation-grid foundation-grid--spans" aria-label="컬럼 span 예제">
            <span className="foundation-grid__span-2">.w-2</span>
            <span className="foundation-grid__span-4">.w-4</span>
            <span className="foundation-grid__span-2">.w-2</span>
            <span className="foundation-grid__full">.w-full</span>
          </div>
        </Card>
      </DocSection>

      <DocSection
        index={2}
        title="호환 클래스"
        description="클래스 범위는 v1과 동일하며, 변경 시 마이그레이션이 필요한 호환 계약으로 관리해요."
      >
        <SpecTable
          columns={["Class", "Range", "Behavior"]}
          rows={[
            [
              ".grid-fix-{n}",
              `${legacyGridContract.fixedColumns.min}–${legacyGridContract.fixedColumns.max}`,
              "고정 n 컬럼",
            ],
            [
              ".w-{n}",
              `${legacyGridContract.spanColumns.min}–${legacyGridContract.spanColumns.max}`,
              "grid에서는 n 컬럼 span, 그 밖에서는 12분율 width",
            ],
            [".w-{n}_{d}", "d = 2–6", "고정 컬럼 그리드의 분수 span"],
            [".w-full", "전체", "현재 breakpoint의 전체 컬럼 span"],
            [
              ".w-{n}px",
              `${legacyGridContract.pixelWidth.min}–${legacyGridContract.pixelWidth.max}`,
              "고정 pixel width",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
