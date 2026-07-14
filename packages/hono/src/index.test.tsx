/** @jsxImportSource hono/jsx */

import { renderToString } from "hono/jsx/dom/server";
import { describe, expect, it } from "vitest";
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  Field,
  Icon,
  Input,
  Radio,
  Select,
  Switch,
  Table,
  Textarea,
  Toast,
  Tooltip,
  Typography,
  renderCriticalCss,
} from "./index.js";

describe("@podo/hono", () => {
  it("renders static SSR HTML for form components", () => {
    const html = renderToString(
      <Field
        id="email"
        label="Email"
        subLabel="선택"
        helperText="Work email"
        error="Required"
        invalid
        required
        countMax={500}
      >
        <Input name="email" value="team@podo.dev" invalid required />
      </Field>
    );

    expect(html).toContain('class="podo-field"');
    expect(html).toContain('for="email-control"');
    expect(html).toContain('id="email-control"');
    // The error replaces the helper text in the footer, so only its id is referenced.
    expect(html).toContain('aria-describedby="email-error"');
    expect(html).toContain('class="podo-field__requirement"');
    expect(html).toContain('class="podo-field__sub-label"');
    expect(html).toContain("0/500");
    expect(html).not.toContain("Work email");
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('name="email"');
  });

  it("renders the select trigger and open menu statically", () => {
    const html = renderToString(
      <Select
        multiple
        open
        addable
        addPlaceholder="과일 이름 입력"
        placeholder="전체 과일"
        values={["strawberry"]}
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
      />
    );

    expect(html).toContain('class="podo-select"');
    expect(html).toContain('data-open="true"');
    expect(html).toContain('role="combobox"');
    // 선택된 값은 Chip의 제거형 모드로, 셀에는 체크박스가 붙어요.
    expect(html).toContain('data-removable="true"');
    expect(html).toContain("딸기 제거");
    expect(html).toContain('data-checked="true"');
    expect(html).toContain('aria-multiselectable="true"');
    // 추가 입력줄 (동작은 클라이언트 코드).
    expect(html).toContain('class="podo-select__add-input"');
    expect(html).toContain("추가");

    const single = renderToString(
      <Select value="banana" options={[{ value: "banana", label: "바나나" }]} open />
    );
    expect(single).toContain('data-state="selected"');
    expect(single).toContain('class="podo-select__cell-check"');
  });

  it("renders button, icon, typography, and critical css helpers", () => {
    const html = renderToString(
      <>
        {renderCriticalCss({
          theme: "dashboard",
          colorScheme: "dark",
          css: ".podo-button{color:var(--podo-component-button-text)}",
        })}
        <Button theme="outline-primary" prefix={<Icon name="menu" />}>
          Save
        </Button>
        <Chip size="lg" theme="outline-weak" suffix={<Icon name="menu" />}>
          필터
        </Chip>
        <Badge theme="red">99</Badge>
        <Badge theme="green" dot aria-label="온라인">
          무시되는 텍스트
        </Badge>
        <Switch checked size="lg" aria-label="알림" />
        <Checkbox indeterminate bold label="전체 선택" />
        <Radio name="plan" value="basic" checked size="lg" label="베이직" />
        <Toast state="warning" caption="캡션 영역" closable>
          저장 공간이 얼마 남지 않았어요
        </Toast>
        <Tooltip label="임시 저장돼요" position="top" ordinal="second" theme="reverse" />
        <Textarea name="memo" defaultValue="메모" invalid resize={false} />
        <Table type="grid">
          <tbody>
            <tr>
              <td>#1024</td>
            </tr>
          </tbody>
        </Table>
        <Typography as="h1">Dashboard</Typography>
      </>
    );

    expect(html).toContain("data-podo-critical");
    expect(html).toContain("dashboard");
    expect(html).toContain('data-theme="outline-primary"');
    expect(html).toContain('class="podo-chip"');
    expect(html).toContain('data-theme="outline-weak"');
    // SSR badge: static pill; dot renders empty with only the aria-label.
    expect(html).toContain('class="podo-badge"');
    expect(html).toContain('data-theme="red"');
    expect(html).toContain('data-dot="true"');
    expect(html).not.toContain("무시되는 텍스트");
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('data-state="on"');
    // SSR checkbox: every visual state renders from data-state alone.
    expect(html).toContain('class="podo-checkbox"');
    expect(html).toContain('data-state="indeterminate"');
    expect(html).toContain('data-bold="true"');
    // SSR radio: the visual rides the native checked attribute.
    expect(html).toContain('class="podo-radio"');
    expect(html).toContain('type="radio"');
    expect(html).toContain('class="podo-radio-wrap"');
    // SSR toast: static card with the close X (dismissal is client code).
    expect(html).toContain('class="podo-toast"');
    expect(html).toContain('data-state="warning"');
    expect(html).toContain('role="status"');
    expect(html).toContain('class="podo-toast__caption"');
    expect(html).toContain('class="podo-toast__close"');
    // SSR tooltip: static bubble with the arrowhead.
    expect(html).toContain('class="podo-tooltip"');
    expect(html).toContain('role="tooltip"');
    expect(html).toContain('data-position="top"');
    expect(html).toContain('data-ordinal="second"');
    expect(html).toContain('class="podo-tooltip__arrow"');
    expect(html).toContain('class="podo-textarea"');
    expect(html).toContain('data-resize="false"');
    expect(html).toContain(">메모</textarea>");
    expect(html).toContain('class="podo-table"');
    expect(html).toContain('data-type="grid"');
    expect(html).toContain("podo-icon-menu");
    expect(html).toContain("podo-text--h1");
    expect(html).toMatchSnapshot();
  });
});
