import { Textarea } from "@podo/react";
import { Card, StageItem } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "사용자가 긴 문장이나 여러 줄에 걸친 내용을 자유롭게 작성하도록 돕는 상호작용 요소로, 한 줄 " +
  "입력(Input)으로는 담기 어려운 설명·메모·문의처럼 분량이 많은 텍스트를 입력할 때 사용해요.";

const USAGE_TABS: CodeTab[] = [
  { target: "react", label: "React", code: `<Textarea placeholder="플레이스홀더" />` },
  {
    target: "web",
    label: "Web",
    code: `<podo-textarea placeholder="플레이스홀더"></podo-textarea>`,
  },
  {
    target: "hono",
    label: "Hono",
    code: `import { Textarea } from "@podo/hono";\n\n<Textarea name="memo" placeholder="플레이스홀더" />`,
  },
  {
    target: "native",
    label: "React Native",
    code: `import { Textarea } from "@podo/native";\n\n<Textarea placeholder="플레이스홀더" />`,
  },
];

export function TextareaPage() {
  return (
    <>
      <PageHeader title="텍스트 영역 (Textarea)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Textarea placeholder="플레이스홀더" aria-label="예시 텍스트 영역" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="상태 (state)"
        description="텍스트 영역 상태는 입력 단계와 결과에 따라 normal, hover, focused, completed, danger, disabled로 구분해 표현해요. normal은 기본 상태, hover는 마우스를 올린 상태, focused는 입력 중인 상태, completed는 값이 올바르게 입력된 상태를 나타내요. danger는 오류나 유효하지 않은 입력을, disabled는 입력할 수 없는 비활성 상태를 뜻하며, 일관된 상태 체계로 사용자가 현재 입력 상황을 즉각 인지하게 해요."
      >
        <Card stage>
          <div className="stage-col">
            <Textarea placeholder="플레이스홀더" aria-label="normal 텍스트 영역" />
            <Textarea
              className="is-hover"
              placeholder="플레이스홀더"
              aria-label="hover 텍스트 영역"
            />
            <Textarea
              className="is-focus"
              placeholder="플레이스홀더"
              aria-label="focused 텍스트 영역"
            />
            <Textarea defaultValue="입력한 텍스트" aria-label="completed 텍스트 영역" />
            <Textarea invalid defaultValue="입력한 텍스트" aria-label="danger 텍스트 영역" />
            <Textarea disabled placeholder="플레이스홀더" aria-label="disabled 텍스트 영역" />
          </div>
        </Card>
        <PropertyTags values={["normal", "hover", "focused", "completed", "danger", "disabled"]} />
      </DocSection>

      <DocSection
        index={2}
        title="응용 (composition)"
        description="텍스트 영역은 목적에 따라 resize grip을 설정할 수 있어요. resize grip은 사용자가 텍스트 영역을 크기 조절이 가능하다고 인지하게 해요."
      >
        <Card stage>
          <StageItem base>
            <Textarea placeholder="플레이스홀더" aria-label="resize 가능 텍스트 영역" />
          </StageItem>
          <Textarea
            resize={false}
            placeholder="플레이스홀더"
            aria-label="resize 불가 텍스트 영역"
          />
        </Card>
        <PropertyTags values={["resize grip"]} />
      </DocSection>

      <DocSection
        index={3}
        title="속성 (props)"
        description="@podo/react의 Textarea가 받는 속성이에요. hover·focused는 브라우저 상호작용으로, completed는 값이 채워진 상태로 자연스럽게 표현되고, danger는 invalid 속성으로 켜요. Field 안에 넣으면 레이블·글자 수 연결이 자동으로 처리돼요. 이 밖에 표준 textarea 속성(value, placeholder, rows, aria-* 등)도 그대로 전달돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>resize</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>true</code>,
              "resize grip 표시와 세로 크기 조절 허용 여부",
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
              "비활성 상태. 크기 조절도 함께 잠겨요",
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
