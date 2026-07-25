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
      `<DatePicker mode="instant" type="date" value={date} onChange={setDate} />`,
  },
];

export function DatepickerPage() {
  return (
    <>
      <PageHeader
        title="날짜 선택 (DatePicker)"
        intro="날짜 선택은 단일 날짜·기간, 날짜+시간, 시간 전용 값을 고르게 해요. 원본 Figma의 single/multiple 변형과 날짜 상태를 따르며 v1.2.1의 공개 기능을 React와 Next.js 클라이언트 컴포넌트에서 지원해요."
      />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <DatePicker mode="instant" type="date" placeholder="날짜를 선택하세요" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="모드와 값 타입"
        description="instant는 하나의 값, period는 시작·종료 값을 선택해요. date, time, datetime, hour를 사용할 수 있어요."
      >
        <Card stage>
          <div className="stage-col">
            <DatePicker mode="instant" type="date" placeholder="단일 날짜" />
            <DatePicker mode="period" type="date" placeholder="기간" />
            <DatePicker mode="instant" type="time" placeholder="시간" minuteStep={5} />
            <DatePicker mode="instant" type="datetime" placeholder="날짜와 시간" minuteStep={15} />
            <DatePicker
              mode="instant"
              type="hour"
              placeholder="시간(12시간제)"
              hourFormat="12"
              hourStep={2}
              disabledHours={[0, 2, 4]}
            />
            <DatePicker mode="period" type="date" placeholder="빠른 기간" quickSelect />
          </div>
        </Card>
        <PropertyTags values={["instant", "period", "date", "time", "datetime", "hour"]} />
      </DocSection>

      <DocSection
        index={2}
        title="지원 범위"
        description="Hono 서버 렌더러와 React Native에는 DatePicker가 없어요. Hono가 호스트인 앱은 React client island에서 같은 React 컴포넌트를 사용해야 하며, React Native는 웹 DatePicker를 가져오지 않아야 해요."
      >
        <SpecTable
          columns={["React", "Next.js", "Web", "Hono", "React Native"]}
          rows={[
            ["전체 지원", "전체 지원 (use client)", "미지원", "React island에서 지원", "미지원"],
          ]}
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
              <code>"date" | "time" | "datetime" | "hour"</code>,
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
              <code>hourFormat / hourStep</code>,
              <code>"12" | "24" / 1 | 2 | 3 | 4 | 6 | 12</code>,
              <code>"24" / 1</code>,
              "hour 타입 표시 방식과 간격",
            ],
            [
              <code>disabledHours</code>,
              <code>number[]</code>,
              "—",
              "hour 타입에서 비활성화할 시각(0~23)",
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
            [
              <code>quickSelect</code>,
              <code>boolean</code>,
              <code>false</code>,
              "period 빠른 기간 선택과 이전·다음 기간 이동",
            ],
            [
              <code>portal / direction</code>,
              <code>{`boolean / "down" | "up" | "auto"`}</code>,
              <code>false / "auto"</code>,
              "body 포털 렌더링과 열림 방향",
            ],
            [
              <code>hideNavArrow</code>,
              <code>boolean</code>,
              <code>false</code>,
              "빠른 기간 이전·다음 화살표 숨김",
            ],
            [
              <code>onReset</code>,
              <code>() =&gt; void</code>,
              "—",
              "초기화 클릭 알림; 초기화 후 팝업은 열린 상태 유지",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        index={4}
        title="v1 호환 동작"
        description="빠른 선택 프리셋은 v1.2.1 API(today, yesterday, thisWeek, lastWeek, last7Days, last30Days, thisMonth, lastMonth)를 유지해요. Figma 예시의 다음 주·다음 달·연도 문구는 공개 v1 API와 달라 시각 구조의 참고로만 사용해요."
      >
        <SpecTable
          columns={["영역", "지원 기능"]}
          rows={[
            ["값", "controlled/uncontrolled, instant/period, reset/apply/cancel"],
            ["날짜", "disable, enable, min/max, initialCalendar, yearRange, format"],
            ["시간", "minuteStep, hourFormat, hourStep, disabledHours"],
            ["오버레이", "align, portal, direction, 외부 클릭 닫기, 모바일 단일 달력"],
          ]}
        />
      </DocSection>
    </>
  );
}
