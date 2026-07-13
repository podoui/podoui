import { Checkbox, Table } from "@podo/react";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "표는 여러 항목의 데이터를 행과 열로 정렬해 한눈에 비교하고 탐색하도록 돕는 요소로, 목록·내역·관리 " +
  "화면처럼 구조화된 정보를 일정한 규칙으로 나열해 사용자가 원하는 값을 빠르게 찾고 서로 비교할 수 있어요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `<Table type="grid">\n` +
      `  <thead>\n` +
      `    <tr>\n` +
      `      <th><Checkbox aria-label="전체 선택" /></th>\n` +
      `      <th>주문</th><th>상품</th><th>금액</th>\n` +
      `    </tr>\n` +
      `  </thead>\n` +
      `  <tbody>\n` +
      `    <tr data-selected="true">\n` +
      `      <td><Checkbox aria-label="#1024 선택" checked /></td>\n` +
      `      <td>#1024</td><td>포도 한 상자</td><td>32,000원</td>\n` +
      `    </tr>\n` +
      `  </tbody>\n` +
      `</Table>`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `<!-- 표 시맨틱 보존을 위해 커스텀 엘리먼트 대신 클래스로 제공돼요 -->\n` +
      `<table class="podo-table" data-type="grid">\n` +
      `  <thead>...</thead>\n  <tbody>...</tbody>\n` +
      `</table>`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Table } from "@podo/hono";\n\n` +
      `<Table type="grid">\n  <thead>...</thead>\n  <tbody>...</tbody>\n</Table>`,
  },
];

const ROWS = [
  ["#1024", "포도 한 상자", "32,000원"],
  ["#1025", "샤인머스캣", "45,000원"],
  ["#1026", "캠벨 포도즙", "18,000원"],
  ["#1027", "거봉 세트", "27,000원"],
];

interface SampleRowState {
  /** Extra tr attributes (is-hover, is-pressed, data-selected, data-disabled...). */
  tr?: Record<string, string>;
  /** The row checkbox's value; 시안처럼 선택된 행은 체크와 함께 표시돼요. */
  checked?: boolean;
  disabled?: boolean;
}

function SampleTable({
  type,
  states = [],
  headerIndeterminate,
}: {
  type: "grid" | "horizon";
  states?: SampleRowState[];
  headerIndeterminate?: boolean;
}) {
  return (
    <Table type={type} aria-label={`${type} 표 예시`}>
      <thead>
        <tr>
          {/* 시안(474:1795)의 체크박스 열: 헤더는 전체 선택. */}
          <th style={{ width: 50 }}>
            <Checkbox aria-label="전체 선택" indeterminate={headerIndeterminate ?? false} />
          </th>
          <th>주문</th>
          <th>상품</th>
          <th>금액</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, i) => {
          const state = states[i] ?? {};
          return (
            <tr key={row[0]} {...(state.tr ?? {})}>
              <td>
                <Checkbox
                  aria-label={`${row[0]} 선택`}
                  defaultChecked={state.checked ?? false}
                  disabled={state.disabled ?? false}
                />
              </td>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export function TablePage() {
  return (
    <>
      <PageHeader title="표 (Table)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <SampleTable type="grid" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="상태 (state)"
        description="표 상태는 사용자의 상호작용에 따라 normal, hover, pressed, disabled로 구분해 표현해요. hover와 pressed는 지금 조작이 일어나고 있음을 즉각적인 피드백으로 알려주고, disabled는 현재 사용할 수 없는 행임을 시각적으로 구분해 혼란을 줄이며, 일관된 상태 체계를 통해 모든 행이 예측 가능하게 반응하도록 해요."
      >
        <Card stage>
          {/* 시안(474:1796) 순서 그대로: normal → hover → pressed(선택) → disabled. */}
          <SampleTable
            type="horizon"
            states={[
              {},
              { tr: { className: "is-hover" } },
              { tr: { className: "is-pressed" }, checked: true },
              { tr: { "data-disabled": "true" }, disabled: true },
            ]}
          />
        </Card>
        <PropertyTags values={["normal", "hover", "pressed", "disabled"]} />
      </DocSection>

      <DocSection
        index={2}
        title="타입 (type)"
        description="표는 horizon, grid 2가지로 horizon은 회원 목록, 주문내역, 게시판과 같이 시각적 부담을 줄이고 행 단위로 읽는 리스트성 데이터, grid는 정산, 재무제표, 요금표와 같이 데이터가 많고 각 데이터끼리 정밀한 확인이 필요한 상황에서 활용돼요."
      >
        <Card stage>
          <div className="stage-col" style={{ width: "100%" }}>
            {/* 시안처럼 일부 행이 선택된 모습: 선택 행은 data-selected, 헤더는 부분 선택. */}
            <SampleTable
              type="horizon"
              headerIndeterminate
              states={[{}, {}, { tr: { "data-selected": "true" }, checked: true }, {}]}
            />
            <SampleTable
              type="grid"
              headerIndeterminate
              states={[{}, {}, { tr: { "data-selected": "true" }, checked: true }, {}]}
            />
          </div>
        </Card>
        <PropertyTags values={["horizon", "grid"]} />
      </DocSection>

      <DocSection
        index={3}
        title="속성 (props)"
        description="@podo/react의 Table이 받는 속성이에요. 내용은 표준 thead·tbody·tr·th·td 마크업을 그대로 사용해 표 시맨틱과 접근성이 플랫폼에서 나와요. hover·pressed 행 상태는 브라우저 상호작용으로 표현되고, 사용할 수 없는 행은 tr에 data-disabled를 표시해요. React Native에는 표 레이아웃이 없어 FlatList 사용을 권장해요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>type</code>
              </span>,
              <span className="prop-type">
                <code>"grid" | "horizon"</code>
              </span>,
              <code>"grid"</code>,
              "grid는 테두리 프레임+셀 구분선(정밀 비교), horizon은 행 구분선만(리스트성)",
            ],
            [
              <span className="prop-name">
                <code>children</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "— (필수)",
              "표준 thead/tbody/tr/th/td 마크업. 선택 열은 셀에 Checkbox를 조합하고, 선택된 행은 tr에 data-selected, 비활성 행은 data-disabled",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
