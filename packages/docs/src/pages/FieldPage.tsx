import { Field, Input } from "@podo/react";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "필드는 레이블과 입력 요소, 보조 텍스트를 하나로 묶어 사용자가 무엇을 어떻게 입력해야 하는지 명확히 " +
  "안내하는 폼 단위예요. 제목과 필수·선택 표시로 입력의 목적과 요구 조건을 알려주고, 도움말 텍스트나 글자 " +
  "수처럼 입력을 돕는 정보를 함께 제공해 사용자가 망설임 없이 정확하게 입력하도록 도와요. 일관된 필드 " +
  "체계는 구성 요소를 규칙에 맞게 배치해 폼 전반의 가독성과 작성 흐름을 일정하게 유지하는 역할을 해요.";

const COMPOSITION =
  "필드 응용은 입력의 맥락과 안내 수준에 따라 requirement, sub-label, suffix-icon, footer, helper-text, " +
  "character-count를 조합해 구성해요. requirement는 필수(*)·선택 여부를 제목 옆에 표시하고, sub-label은 " +
  "제목을 보충하는 부가 설명을, suffix-icon은 도움말이나 상태를 알리는 보조 아이콘을 제목 영역에 더해요. " +
  "footer는 입력 아래 안내 영역으로, 그 안에서 helper-text는 입력 방법이나 오류를 안내하고 " +
  "character-count는 입력 길이를 실시간으로 보여줘요. 필요한 요소만 선택해 조합하면 과하지 않게 꼭 필요한 " +
  "안내만 전달할 수 있어요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `// countMax만 지정하면 글자 수는 필드가 스스로 세요.\n` +
      `<Field label="제목" required helperText="도움말 텍스트" countMax={500}>\n` +
      `  <Input placeholder="내용을 입력해 주세요" />\n` +
      `</Field>`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `<podo-field required count-max="500">\n` +
      `  <span slot="label">제목</span>\n` +
      `  <span slot="helper-text">도움말 텍스트</span>\n` +
      `  <podo-input></podo-input>\n` +
      `</podo-field>`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Field, Input } from "@podo/hono";\n\n` +
      `<Field label="제목" required helperText="도움말 텍스트" countMax={500}>\n` +
      `  <Input name="title" />\n` +
      `</Field>`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `import { Field, Input } from "@podo/native";\n\n` +
      `<Field label="제목" required helperText="도움말 텍스트" countMax={500}>\n` +
      `  <Input />\n` +
      `</Field>`,
  },
];

// Info glyph used to demonstrate the suffix-icon slot (Figma name=info).
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="10" cy="6.4" r="0.9" fill="currentColor" />
  </svg>
);

export function FieldPage() {
  return (
    <>
      <PageHeader title="필드 (Field)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Field label="제목" required helperText="도움말 텍스트" countMax={500}>
            <Input placeholder="내용을 입력해 주세요" />
          </Field>
        </Preview>
      </DocSection>

      <DocSection index={1} title="응용 (composition)" description={COMPOSITION}>
        <Card stage>
          <Field
            label="제목"
            required
            subLabel="선택"
            suffixIcon={<InfoIcon />}
            helperText="도움말 텍스트"
            countMax={500}
          >
            <Input placeholder="내용을 입력해 주세요" />
          </Field>
        </Card>
        <PropertyTags
          values={[
            "requirement",
            "sub-label",
            "suffix-icon",
            "footer",
            "helper-text",
            "character-count",
          ]}
        />
      </DocSection>

      <DocSection
        index={2}
        title="속성 (props)"
        description="@podo/react의 Field가 받는 속성이에요. children은 슬롯이라 인풋뿐 아니라 버튼, 콤보박스 등 어떤 컨트롤이든 넣을 수 있고, 필드가 레이블·설명의 접근성 연결(aria)을 자동으로 처리해요. 이 밖에 표준 div 속성(className, id 등)도 그대로 전달돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>label</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "— (필수)",
              "필드 제목. 컨트롤과 label로 연결돼요",
            ],
            [
              <span className="prop-name">
                <code>subLabel</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "제목을 보충하는 부가 설명 (시안 sub-label)",
            ],
            [
              <span className="prop-name">
                <code>suffixIcon</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "제목 영역 오른쪽 보조 아이콘 (시안 suffix-icon)",
            ],
            [
              <span className="prop-name">
                <code>helperText</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "입력 아래 도움말 (시안 helper-text)",
            ],
            [
              <span className="prop-name">
                <code>error</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "오류 메시지. helperText 자리를 대체하고 danger 색으로 표시돼요",
            ],
            [
              <span className="prop-name">
                <code>count</code>
              </span>,
              <span className="prop-type">
                <code>number</code>
              </span>,
              "— (자동)",
              "현재 글자 수. 생략하면 필드가 컨트롤의 입력을 따라 자동으로 세고, 지정하면 그 값으로 고정돼요(제어형)",
            ],
            [
              <span className="prop-name">
                <code>countMax</code>
              </span>,
              <span className="prop-type">
                <code>number</code>
              </span>,
              "—",
              "최대 글자 수. 지정하면 footer에 글자 수 카운터가 나타나요",
            ],
            [
              <span className="prop-name">
                <code>required</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "필수 입력 표시(*)와 aria-required를 함께 적용해요",
            ],
            [
              <span className="prop-name">
                <code>invalid</code>
              </span>,
              <span className="prop-type">
                <code>boolean</code>
              </span>,
              <code>false</code>,
              "오류 상태. 컨트롤에 aria-invalid를 전달해요",
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
                <code>children</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "— (필수)",
              "컨트롤 슬롯. 인풋·버튼·콤보박스 등 어떤 컨트롤이든 넣을 수 있어요",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
