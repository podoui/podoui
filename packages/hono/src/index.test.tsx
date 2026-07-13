/** @jsxImportSource hono/jsx */

import { renderToString } from "hono/jsx/dom/server";
import { describe, expect, it } from "vitest";
import {
  Button,
  Checkbox,
  Chip,
  Field,
  Icon,
  Input,
  Radio,
  Switch,
  Table,
  Textarea,
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
        <Chip size="sm" theme="outline-weak" suffix={<Icon name="menu" />}>
          필터
        </Chip>
        <Switch checked size="lg" aria-label="알림" />
        <Checkbox indeterminate bold label="전체 선택" />
        <Radio name="plan" value="basic" checked size="lg" label="베이직" />
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
