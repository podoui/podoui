import { Input } from "@podo/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "텍스트 입력은 사용자가 직접 정보를 입력하고 수정하도록 돕는 기본 상호작용 요소로, 명확한 레이블과 " +
  "플레이스홀더, 상태 표현을 통해 무엇을 어떻게 입력해야 하는지를 직관적으로 안내해요. 일관된 입력 체계는 " +
  "크기와 상태, 구성 방식을 규칙에 맞게 정의해 사용자가 입력 과정을 예측하고 신뢰하게 하며, 폼 전반의 " +
  "사용성과 시각적 완성도를 높이는 역할을 해요.";

const USAGE_TABS: CodeTab[] = [
  { target: "react", label: "React", code: `<Input placeholder="플레이스홀더" />` },
  { target: "web", label: "Web", code: `<podo-input placeholder="플레이스홀더"></podo-input>` },
  {
    target: "hono",
    label: "Hono",
    code: `import { Input } from "@podo/hono";\n\n<Input name="title" placeholder="플레이스홀더" />`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Input } from "@podo/native";\n\n<Input placeholder="플레이스홀더" />`,
  },
];

// Placeholder glyph used to demonstrate prefix/suffix icon slots.
const Dot = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

export function InputPage() {
  return (
    <>
      <PageHeader title="입력 (Input)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Input placeholder="플레이스홀더" aria-label="예시 입력" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="크기 (size)"
        description="텍스트 입력 크기는 사용 화면의 정보 밀도와 중요도에 따라 md(base), lg로 구분해 사용해요. md는 대시보드나 설정처럼 한 화면에 여러 입력이 모이는 일반 폼에, lg는 모바일 메인 폼이나 강조가 필요한 입력에 사용하며, 같은 크기의 버튼과 높이를 맞춰 한 줄에 놓일 때 자연스럽게 정렬돼요."
      >
        <Card stage>
          <StageItem base>
            <Input size="md" placeholder="플레이스홀더" aria-label="md 입력" />
          </StageItem>
          <Input size="lg" placeholder="플레이스홀더" aria-label="lg 입력" />
        </Card>
        <PropertyTags values={["md", "lg"]} />
      </DocSection>

      <DocSection
        index={2}
        title="상태 (state)"
        description="텍스트 입력 상태는 입력 단계와 결과에 따라 normal, hover, focused, completed, read-only, danger, disabled로 구분해 표현해요. normal은 입력 전 기본 상태, hover는 마우스를 올려 상호작용 가능함을 미리 알리고, focused는 현재 입력 중임을, completed는 입력이 올바르게 끝났음을, read-only는 값을 보여주되 수정할 수 없음을, danger는 형식 오류나 검증 실패를 알리고, disabled는 지금 입력할 수 없는 상태임을 시각적으로 구분해요. 일관된 상태 체계를 통해 사용자가 입력 과정에서 무엇이 일어나는지 즉각 인지하게 해요."
      >
        <Card stage>
          <div className="stage-col">
            <Input placeholder="플레이스홀더" aria-label="normal 입력" />
            <Input className="is-hover" placeholder="플레이스홀더" aria-label="hover 입력" />
            <Input className="is-focus" placeholder="플레이스홀더" aria-label="focused 입력" />
            <Input defaultValue="입력한 텍스트" aria-label="completed 입력" />
            <Input readOnly defaultValue="입력한 텍스트" aria-label="read-only 입력" />
            <Input invalid defaultValue="입력한 텍스트" aria-label="danger 입력" />
            <Input disabled placeholder="플레이스홀더" aria-label="disabled 입력" />
          </div>
        </Card>
        <PropertyTags
          values={["normal", "hover", "focused", "completed", "read-only", "danger", "disabled"]}
        />
      </DocSection>

      <DocSection
        index={3}
        title="응용 (composition)"
        description="입력값의 성격을 보조하기 위해 prefix, suffix-text, suffix-icon을 조합해 구성해요. prefix는 통화 기호나 아이콘처럼 입력 앞에 맥락을 제시할 때, suffix-text는 단위(원, kg 등)나 도메인처럼 입력 뒤에 고정 정보를 붙일 때, suffix-icon은 지우기·검색·표시 전환 같은 동작을 입력 안에서 제공할 때 사용해요. 목적에 맞게 조합하면 입력의 의미가 분명해지고 불필요한 안내 문구를 줄일 수 있어요."
      >
        <Card stage>
          <div className="stage-col">
            <Input prefix={<Dot />} placeholder="플레이스홀더" aria-label="prefix 입력" />
            <Input suffixText="텍스트" placeholder="플레이스홀더" aria-label="suffix-text 입력" />
            <Input suffixIcon={<Dot />} placeholder="플레이스홀더" aria-label="suffix-icon 입력" />
          </div>
        </Card>
        <PropertyTags values={["prefix", "suffix-text", "suffix-icon"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podo/react의 Input이 받는 속성이에요. hover·focused는 브라우저 상호작용으로, completed는 값이 채워진 상태로 자연스럽게 표현되고, danger는 invalid 속성으로 켜요. 이 밖에 표준 input 속성(value, placeholder, name, aria-* 등)도 그대로 전달돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>size</code>
              </span>,
              <span className="prop-type">
                <code>"md" | "lg"</code>
              </span>,
              <code>"md"</code>,
              "높이·radius·폰트 (md 42 / lg 52)",
            ],
            [
              <span className="prop-name">
                <code>prefix</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "입력 앞에 맥락을 주는 아이콘·기호 (통화 기호 등)",
            ],
            [
              <span className="prop-name">
                <code>suffixText</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "입력 뒤 고정 정보 텍스트 (원, kg, 도메인 등)",
            ],
            [
              <span className="prop-name">
                <code>suffixIcon</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "입력 안 동작 아이콘 (지우기·검색·표시 전환)",
            ],
            [
              <span className="prop-name">
                <code>readOnly</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "읽기 전용. 값은 보이지만 수정할 수 없고, 박스 없이 값만 표시돼요",
            ],
            [
              <span className="prop-name">
                <code>invalid</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "danger 상태. aria-invalid를 함께 적용해요",
            ],
            [
              <span className="prop-name">
                <code>disabled</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "비활성 상태",
            ],
            [
              <span className="prop-name">
                <code>required</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "필수 입력. aria-required를 적용해요",
            ],
            [
              <span className="prop-name">
                <code>onValueChange</code>
              </span>,
              <span className="prop-type">
                <code>(value, e) =&gt; void</code>
              </span>,
              "—",
              "값이 바뀔 때 새 값과 함께 호출돼요 (onChange도 지원)",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
