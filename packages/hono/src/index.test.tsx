/** @jsxImportSource hono/jsx */

import { renderToString } from "hono/jsx/dom/server";
import { describe, expect, it } from "vitest";
import {
  Button,
  Chip,
  Field,
  Icon,
  Input,
  Switch,
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
    expect(html).toContain("podo-icon-menu");
    expect(html).toContain("podo-text--h1");
    expect(html).toMatchSnapshot();
  });
});
