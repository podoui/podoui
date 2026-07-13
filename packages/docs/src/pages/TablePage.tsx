import { Chip, Table } from "@podo/react";
import { BaseMarker } from "../components/BaseMarker.js";
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
      `{/* 기본 타입은 horizon. checkbox: 선택 열 자동 주입 — 헤더는 전체 선택/해제 */}\n` +
      `<Table checkbox onSelectionChange={setSelected}>\n` +
      `  <thead>\n    <tr><th>주문</th><th>상품</th><th>금액</th></tr>\n  </thead>\n` +
      `  <tbody>\n    <tr><td>#1024</td><td>포도 한 상자</td><td>32,000원</td></tr>\n  </tbody>\n` +
      `</Table>`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `<!-- 표 시맨틱 보존을 위해 커스텀 엘리먼트 대신 클래스로 제공돼요 -->\n` +
      `<!-- 선택 열은 셀에 podo-checkbox를 직접 조합해요 -->\n` +
      `<table class="podo-table" data-type="horizon">\n` +
      `  <thead>...</thead>\n  <tbody>...</tbody>\n` +
      `</table>`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Table } from "@podo/hono";\n\n` +
      `{/* 선택 열은 셀에 Checkbox를 직접 조합해요 (SSR) */}\n` +
      `<Table>\n  <thead>...</thead>\n  <tbody>...</tbody>\n</Table>`,
  },
];

const ROWS = [
  ["#1024", "포도 한 상자", "32,000원"],
  ["#1025", "샤인머스캣", "45,000원"],
  ["#1026", "캠벨 포도즙", "18,000원"],
  ["#1027", "거봉 세트", "27,000원"],
];

function SampleTable({
  type,
  rowProps = [],
  defaultSelected,
}: {
  type: "grid" | "horizon";
  /** Extra tr attributes (is-hover, is-pressed, data-disabled...). */
  rowProps?: Array<Record<string, string> | undefined>;
  defaultSelected?: number[];
}) {
  return (
    <Table
      type={type}
      checkbox
      defaultSelected={defaultSelected ?? []}
      aria-label={`${type} 표 예시`}
    >
      <thead>
        <tr>
          <th>주문</th>
          <th>상품</th>
          <th>금액</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, i) => (
          <tr key={row[0]} {...(rowProps[i] ?? {})}>
            {row.map((cell) => (
              <td key={cell}>{cell}</td>
            ))}
          </tr>
        ))}
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
          <SampleTable type="horizon" />
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
            defaultSelected={[2]}
            rowProps={[
              undefined,
              { className: "is-hover" },
              { className: "is-pressed" },
              { "data-disabled": "true" },
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
            {/* 시안처럼 일부 행이 선택된 모습 — 헤더는 자동으로 부분 선택 표시. */}
            <SampleTable type="horizon" defaultSelected={[2]} />
            {/* horizon이 기본(base) 타입 — 시안처럼 두 표 사이에 마커를 둬요. */}
            <BaseMarker />
            <SampleTable type="grid" defaultSelected={[2]} />
          </div>
        </Card>
        <PropertyTags values={["horizon", "grid"]} />
      </DocSection>

      <DocSection
        index={3}
        title="정렬 (align)"
        description="셀 정렬은 내용 성격에 따라 세 가지로 나눠요. 단일 텍스트(전화번호·이메일·생년월일 포함)와 텍스트+칩은 좌측, 버튼(상태에 따라 나타나는 경우 포함)·단일 칩·음성파일은 중앙, 수량·날짜·건수·금액·퍼센트·n명은 우측 정렬이 기준이에요. 기본은 좌측이고 th/td에 data-align을 붙여 지정하며, 우측 정렬 셀은 숫자 폭이 고정(tabular numbers)되어 자릿수가 세로로 나란히 맞아요."
      >
        <Card stage>
          <Table aria-label="정렬 예시">
            <thead>
              <tr>
                <th>이름</th>
                <th data-align="center">상태</th>
                <th data-align="right">주문 수</th>
                <th data-align="right">금액</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["김포도", "결제완료", "3건", "32,000원"],
                ["이머루", "배송중", "12건", "145,000원"],
                ["박캠벨", "취소", "1건", "8,500원"],
              ].map(([name, status, count, amount]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td data-align="center">
                    <Chip size="md">{status}</Chip>
                  </td>
                  <td data-align="right">{count}</td>
                  <td data-align="right">{amount}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <PropertyTags values={["left", "center", "right"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podo/react의 Table이 받는 속성이에요. 내용은 표준 thead·tbody·tr·th·td 마크업을 그대로 사용해 표 시맨틱과 접근성이 플랫폼에서 나와요. hover·pressed 행 상태는 브라우저 상호작용으로 표현돼요. 행·셀 단위 설정은 마크업에 data-* 속성으로 표시해요 — 아래 표의 data-align, data-disabled 항목을 참고하세요. React Native에는 표 레이아웃이 없어 FlatList 사용을 권장해요."
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
                <code>"horizon" | "grid"</code>
              </span>,
              <code>"horizon"</code>,
              "horizon(기본)은 행 구분선만(리스트성), grid는 테두리 프레임+셀 구분선(정밀 비교)",
            ],
            [
              <span className="prop-name">
                <code>checkbox</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "체크박스 선택 열을 자동 주입해요. 헤더는 전체 선택/해제(일부 선택 시 indeterminate), 행을 클릭해도 그 행이 토글되고, 체크박스 열을 누른 채 끌면 연속 구간이 한 번에 선택/해제돼요(마우스·펜). 선택된 행은 data-selected로 표시돼요",
            ],
            [
              <span className="prop-name">
                <code>defaultSelected</code>
              </span>,
              <span className="prop-type">
                <code>number[]</code>
              </span>,
              <code>[]</code>,
              "checkbox 사용 시 초기 선택 행 인덱스 (tbody 순서, 0부터)",
            ],
            [
              <span className="prop-name">
                <code>onSelectionChange</code>
              </span>,
              <span className="prop-type">
                <code>(selected: number[]) =&gt; void</code>
              </span>,
              "—",
              "선택이 바뀔 때 선택된 행 인덱스 목록과 함께 호출돼요",
            ],
            [
              <span className="prop-name">
                <code>children</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "— (필수)",
              "표준 thead/tbody/tr/th/td 마크업",
            ],
            [
              <span className="prop-name">
                <code>data-align</code> <small>(th·td 속성)</small>
              </span>,
              <span className="prop-type">
                <code>"center" | "right"</code>
              </span>,
              "— (좌측)",
              "셀 정렬 기준: 텍스트는 좌측(기본), 버튼·단일 칩·음성파일은 center, 수량·날짜·금액·퍼센트는 right (숫자 폭 고정)",
            ],
            [
              <span className="prop-name">
                <code>data-disabled</code> <small>(tr 속성)</small>
              </span>,
              <span className="prop-type">
                <code>"true"</code>
              </span>,
              "—",
              "사용할 수 없는 행 표시. checkbox 사용 시 선택 대상에서도 제외돼요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
