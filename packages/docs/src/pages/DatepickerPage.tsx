import { DatePicker } from "@podoui/react";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React / Next.js",
    code:
      `"use client";\n\n` +
      `import { DatePicker } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n` +
      `import "./podo/icons/PodoIcons.css";\n\n` +
      `<DatePicker mode="instant" type="date" onChange={setDate} />`,
  },
];

export function DatepickerPage() {
  return (
    <>
      <PageHeader
        title="날짜 선택 (DatePicker)"
        intro="날짜 선택은 단일 날짜·기간과 시간 값을 달력 및 시간 목록에서 고르게 해요. Figma Web 페이지의 Datepicker 시안을 구현한 컴포넌트이며 현재 React와 Next.js 클라이언트 컴포넌트에서 지원해요."
      />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <DatePicker mode="instant" type="date" placeholder="날짜를 선택하세요" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="모드와 값 타입"
        description="instant는 하나의 값, period는 시작·종료 값을 선택해요. date, time, datetime을 조합할 수 있어요."
      >
        <Card stage>
          <div className="stage-col">
            <DatePicker mode="instant" type="date" placeholder="단일 날짜" />
            <DatePicker mode="period" type="date" placeholder="기간" />
            <DatePicker mode="instant" type="time" placeholder="시간" minuteStep={5} />
            <DatePicker mode="instant" type="datetime" placeholder="날짜와 시간" minuteStep={15} />
          </div>
        </Card>
        <PropertyTags values={["instant", "period", "date", "time", "datetime"]} />
      </DocSection>

      <DocSection
        index={2}
        title="지원 범위"
        description="Web Custom Elements, Hono SSR, React Native에는 아직 DatePicker renderer가 없어요. 이 환경에서 React 예제를 그대로 가져오면 동작하지 않으므로 지원 대상으로 표시하지 않아요."
      >
        <SpecTable
          columns={["React", "Next.js", "Web", "Hono", "React Native"]}
          rows={[["지원", "지원 (use client)", "미지원", "미지원", "미지원"]]}
        />
      </DocSection>

      <DocSection index={3} title="주요 속성 (props)">
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <code>mode</code>,
              <code>"instant" | "period"</code>,
              <code>"instant"</code>,
              "단일 또는 기간 선택",
            ],
            [
              <code>type</code>,
              <code>"date" | "time" | "datetime"</code>,
              <code>"date"</code>,
              "선택 값 종류",
            ],
            [
              <code>value / defaultValue</code>,
              <code>DatePickerValue</code>,
              "—",
              "제어형/비제어형 값",
            ],
            [
              <code>onChange</code>,
              <code>(value) =&gt; void</code>,
              "—",
              "값 확정 또는 초기화 콜백",
            ],
            [
              <code>minuteStep</code>,
              <code>1 | 5 | 10 | 15 | 20 | 30</code>,
              <code>1</code>,
              "분 간격",
            ],
            [
              <code>disable / enable</code>,
              <code>DateCondition[]</code>,
              "—",
              "선택 가능 날짜 조건",
            ],
            [
              <code>minDate / maxDate</code>,
              <code>Date | DateTimeLimit</code>,
              "—",
              "날짜·시간 경계",
            ],
            [
              <code>yearRange</code>,
              <code>{`{ min?: number; max?: number }`}</code>,
              "—",
              "연도 선택 범위",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
