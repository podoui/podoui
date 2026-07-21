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

describe("@podoui/hono", () => {
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
    // 추가 입력줄 (동작은 클라이언트 코드) — 리스트박스의 자식은 option만
    // 허용되므로 입력줄은 role="listbox" 밖, 같은 메뉴 박스 위쪽에 렌더돼요.
    expect(html).toContain('class="podo-select__add-input"');
    expect(html).toContain("추가");
    const addIndex = html.indexOf('class="podo-select__add"');
    const listboxIndex = html.indexOf('role="listbox"');
    expect(addIndex).toBeGreaterThan(-1);
    expect(addIndex).toBeLessThan(listboxIndex);
    expect(html.slice(listboxIndex)).not.toContain("podo-select__add");

    const single = renderToString(
      <Select value="banana" options={[{ value: "banana", label: "바나나" }]} open />
    );
    expect(single).toContain('data-state="selected"');
    expect(single).toContain('class="podo-select__cell-check"');
  });

  it("wires select combobox/listbox ids and accessible names", () => {
    const fruits = [
      { value: "strawberry", label: "딸기" },
      { value: "banana", label: "바나나" },
    ];
    const html = renderToString(
      <Select id="fruit" aria-label="과일 선택" open value="banana" options={fruits} />
    );
    expect(html).toContain('id="fruit"');
    expect(html).toContain('aria-label="과일 선택"');
    expect(html).toContain('aria-controls="fruit-listbox"');
    expect(html).toContain('id="fruit-listbox"');
    expect(html).toContain('role="listbox"');

    const labelled = renderToString(
      <Select id="fruit" aria-labelledby="fruit-label" options={fruits} />
    );
    expect(labelled).toContain('aria-labelledby="fruit-label"');
    // 닫힌 셀렉트는 렌더되지 않은 리스트박스를 가리키지 않아요.
    expect(labelled).not.toContain("aria-controls");
  });

  it("keeps read-only and disabled selects closed", () => {
    const fruits = [{ value: "banana", label: "바나나" }];
    const readOnly = renderToString(<Select readOnly open value="banana" options={fruits} />);
    expect(readOnly).not.toContain("data-open");
    expect(readOnly).toContain('aria-expanded="false"');
    expect(readOnly).not.toContain('role="listbox"');

    const disabled = renderToString(<Select disabled open value="banana" options={fruits} />);
    expect(disabled).not.toContain("data-open");
    expect(disabled).toContain('aria-expanded="false"');
    expect(disabled).not.toContain('role="listbox"');
  });

  it("exposes select invalid and read-only states on the combobox for AT", () => {
    const fruits = [{ value: "banana", label: "바나나" }];

    const invalid = renderToString(<Select invalid value="banana" options={fruits} />);
    expect(invalid).toContain('data-state="invalid"');
    expect(invalid).toMatch(/<div[^>]*role="combobox"[^>]*aria-invalid="true"/);
    expect(invalid).not.toContain("aria-readonly");

    const readOnly = renderToString(<Select readOnly value="banana" options={fruits} />);
    expect(readOnly).toContain('data-state="read-only"');
    expect(readOnly).toMatch(/<div[^>]*role="combobox"[^>]*aria-readonly="true"/);
    expect(readOnly).not.toContain("aria-invalid");
  });

  it("locks a disabled multi-select's value chips against removal", () => {
    const fruits = [{ value: "banana", label: "바나나" }];
    const html = renderToString(<Select disabled multiple values={["banana"]} options={fruits} />);
    // disabled 값 칩은 read-only처럼 X 없는 정적 칩이에요.
    expect(html).toContain('data-disabled="true"');
    expect(html).not.toContain("podo-chip__remove");
    expect(html).not.toContain("바나나 제거");
  });

  it("derives distinct deterministic field ids from labels and preserves child wiring", () => {
    const html = renderToString(
      <>
        <Field label="Email" helperText="회사 메일">
          <Input name="email" />
        </Field>
        <Field label="Nickname">
          <Input name="nickname" />
        </Field>
        <Field label="이름">
          <Input name="name" />
        </Field>
      </>
    );
    expect(html).toContain('id="podo-field-email-control"');
    expect(html).toContain('for="podo-field-email-control"');
    expect(html).toContain('id="podo-field-nickname-control"');
    expect(html).toContain('id="podo-field-이름-control"');

    // 자식이 명시한 id는 유지되고 aria-describedby는 덮어쓰지 않고 합쳐져요.
    // 레이블의 for=도 생성 id가 아니라 그 명시 id를 가리켜야 해요.
    const custom = renderToString(
      <Field label="Email" helperText="회사 메일">
        <Input id="my-input" aria-describedby="external-hint" name="email" />
      </Field>
    );
    expect(custom).toContain('id="my-input"');
    expect(custom).toContain('for="my-input"');
    expect(custom).not.toContain("podo-field-email-control");
    expect(custom).toContain('aria-describedby="external-hint podo-field-email-description"');
    expect(custom).toContain('id="podo-field-email-description"');
  });

  it("disables the wired control when the field is disabled", () => {
    const html = renderToString(
      <Field label="Email" disabled>
        <Input name="email" />
      </Field>
    );
    expect(html).toContain('data-disabled="true"');
    expect(html).toMatch(/<input[^>]*\sdisabled/);

    // 크로스 렌더러 결정(OR 의미론): disabled Field는 자식의 disabled={false}
    // 로도 해제할 수 없어요 — 필드가 이겨요.
    const explicit = renderToString(
      <Field label="Email" disabled>
        <Input name="email" disabled={false} />
      </Field>
    );
    expect(explicit).toContain('data-disabled="true"');
    expect(explicit).toMatch(/<input[^>]*\sdisabled/);

    // Field가 정상일 때는 자식 자신의 disabled가 그대로 유지돼요.
    const own = renderToString(
      <Field label="Email">
        <Input name="email" disabled />
      </Field>
    );
    expect(own).not.toContain('data-disabled="true"');
    expect(own).toMatch(/<input[^>]*\sdisabled/);
  });

  it("wires field ids and aria attributes into checkbox, switch, and select controls", () => {
    const checkbox = renderToString(
      <Field id="agree" label="약관 동의" error="필수 항목이에요" invalid required>
        <Checkbox />
      </Field>
    );
    expect(checkbox).toContain('for="agree-control"');
    expect(checkbox).toMatch(/<input[^>]*id="agree-control"/);
    expect(checkbox).toMatch(/<input[^>]*aria-labelledby="agree-label"/);
    expect(checkbox).toMatch(/<input[^>]*aria-describedby="agree-error"/);
    expect(checkbox).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(checkbox).toMatch(/<input[^>]*aria-required="true"/);

    const switchHtml = renderToString(
      <Field id="alarm" label="알림 수신" helperText="언제든 끌 수 있어요" required>
        <Switch />
      </Field>
    );
    expect(switchHtml).toContain('for="alarm-control"');
    expect(switchHtml).toMatch(/<button[^>]*id="alarm-control"[^>]*role="switch"/);
    expect(switchHtml).toMatch(/<button[^>]*aria-labelledby="alarm-label"/);
    expect(switchHtml).toMatch(/<button[^>]*aria-describedby="alarm-description"/);
    expect(switchHtml).toMatch(/<button[^>]*aria-required="true"/);

    const select = renderToString(
      <Field id="fruit" label="과일" error="과일을 선택해 주세요" invalid required>
        <Select options={[{ value: "banana", label: "바나나" }]} />
      </Field>
    );
    expect(select).toContain('for="fruit-control"');
    expect(select).toMatch(/<div[^>]*id="fruit-control"[^>]*role="combobox"/);
    expect(select).toMatch(/role="combobox"[^>]*aria-labelledby="fruit-label"/);
    expect(select).toMatch(/role="combobox"[^>]*aria-describedby="fruit-error"/);
    expect(select).toMatch(/role="combobox"[^>]*aria-invalid="true"/);
    expect(select).toMatch(/role="combobox"[^>]*aria-required="true"/);
  });

  it("marks field-required checkbox and radio inputs natively required", () => {
    // Field가 주입한 required가 aria만이 아니라 네이티브 폼 검증에도 참여해요.
    const checkbox = renderToString(
      <form>
        <Field id="agree" label="약관 동의" required>
          <Checkbox />
        </Field>
      </form>
    );
    expect(checkbox).toMatch(/<input[^>]*type="checkbox"[^>]*\srequired/);
    expect(checkbox).toMatch(/<input[^>]*aria-required="true"/);

    const radio = renderToString(
      <form>
        <Field id="plan" label="요금제" required>
          <Radio name="plan" value="basic" />
        </Field>
      </form>
    );
    expect(radio).toMatch(/<input[^>]*type="radio"[^>]*\srequired/);
    expect(radio).toMatch(/<input[^>]*aria-required="true"/);

    // 직접 prop으로도 동일하게 동작하고, 없으면 붙지 않아요.
    expect(renderToString(<Checkbox required aria-label="약관 동의" />)).toMatch(
      /<input[^>]*\srequired/
    );
    expect(renderToString(<Radio required aria-label="베이직" />)).toMatch(/<input[^>]*\srequired/);
    expect(renderToString(<Checkbox aria-label="약관 동의" />)).not.toContain("required");
  });

  it("propagates field invalid into the wired control's visual state", () => {
    // 자식이 자신의 invalid prop 없이도 필드의 invalid가 시각 상태를 만들어요.
    const html = renderToString(
      <Field id="email" label="Email" error="Required" invalid>
        <Input name="email" />
      </Field>
    );
    expect(html).toMatch(/class="podo-input"[^>]*data-state="invalid"/);
    expect(html).toMatch(/<input[^>]*aria-invalid="true"/);
    expect(html).toMatch(/<input[^>]*data-invalid="true"/);

    // Field가 정상일 때는 자식 자신의 invalid가 그대로 유지돼요.
    const own = renderToString(
      <Field id="email" label="Email">
        <Input name="email" invalid />
      </Field>
    );
    expect(own).toMatch(/class="podo-input"[^>]*data-state="invalid"/);

    // Field invalid는 셀렉트의 시각 상태(data-state)도 강제해요.
    const select = renderToString(
      <Field id="fruit" label="과일" error="선택해 주세요" invalid>
        <Select options={[{ value: "banana", label: "바나나" }]} />
      </Field>
    );
    expect(select).toMatch(/class="podo-select"[^>]*data-state="invalid"/);
  });

  it("marks the disabled switch with aria-disabled", () => {
    // switch.component.json의 aria 요건: 비활성 스위치는 aria-disabled도 노출해요.
    const html = renderToString(<Switch disabled aria-label="알림" />);
    expect(html).toMatch(/<button[^>]*role="switch"[^>]*aria-disabled="true"/);
    expect(html).toMatch(/<button[^>]*\sdisabled/);

    const enabled = renderToString(<Switch aria-label="알림" />);
    expect(enabled).not.toContain("aria-disabled");
  });

  it("routes toast suffixIcon into the close button when closable", () => {
    // React 렌더러와 동일: closable이면 suffixIcon이 기본 X 글리프를 대체해요.
    const closable = renderToString(
      <Toast closable suffixIcon={<Icon name="refresh" />}>
        새 버전이 있어요
      </Toast>
    );
    expect(closable).toContain(
      'aria-label="닫기"><i class="podo-icon podo-icon-refresh" data-size="md" aria-hidden="true"></i></button>'
    );
    expect(closable).not.toContain("M6 6l12 12");
    expect(closable).not.toContain("podo-toast__suffix-icon");

    // closable 없이 suffixIcon만 있으면 일반 suffix 스팬으로 렌더돼요.
    const suffixOnly = renderToString(
      <Toast suffixIcon={<Icon name="refresh" />}>새 버전이 있어요</Toast>
    );
    expect(suffixOnly).toContain('class="podo-toast__suffix-icon"');
    expect(suffixOnly).not.toContain("podo-toast__close");

    // suffixIcon이 없으면 기본 X 글리프가 유지돼요.
    const defaultClose = renderToString(<Toast closable>저장됨</Toast>);
    expect(defaultClose).toContain('class="podo-toast__close"');
    expect(defaultClose).toContain("M6 6l12 12");
  });

  it("renders icon sizes and non-decorative naming per the icon spec", () => {
    // 기본: md 크기의 장식용 아이콘 — AT에서 숨겨져요 (icon.component.json 기본값).
    const decorative = renderToString(<Icon name="menu" />);
    expect(decorative).toContain('class="podo-icon podo-icon-menu"');
    expect(decorative).toContain('data-size="md"');
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain('role="img"');
    expect(decorative).not.toContain("aria-label");

    // 스펙 size variant 어휘(sm/md/lg)가 다른 컴포넌트처럼 data-size로 노출돼요.
    expect(renderToString(<Icon name="menu" size="sm" />)).toContain('data-size="sm"');
    expect(renderToString(<Icon name="menu" size="lg" />)).toContain('data-size="lg"');

    // 비장식 아이콘은 role="img" + aria-label로 접근성 이름을 얻어요.
    const labeled = renderToString(<Icon name="search" decorative={false} aria-label="검색" />);
    expect(labeled).toContain('role="img"');
    expect(labeled).toContain('aria-label="검색"');
    expect(labeled).not.toContain("aria-hidden");
  });

  it("exposes the indeterminate checkbox as aria-checked=mixed", () => {
    const html = renderToString(<Checkbox indeterminate label="전체 선택" />);
    expect(html).toContain('aria-checked="mixed"');
    expect(html).toContain('data-state="indeterminate"');

    const checked = renderToString(<Checkbox checked label="약관 동의" />);
    // true/false는 네이티브 checked가 전달하므로 aria-checked를 덧대지 않아요.
    expect(checked).not.toContain("aria-checked");
  });

  it("renders a disabled removable chip with a genuinely disabled remove control", () => {
    const html = renderToString(
      <Chip removable disabled removeLabel="필터 제거">
        필터
      </Chip>
    );
    expect(html).toContain('data-removable="true"');
    expect(html).toContain('data-disabled="true"');
    expect(html).toMatch(/<button[^>]*class="podo-chip__remove"[^>]*disabled/);

    const enabled = renderToString(
      <Chip removable removeLabel="필터 제거">
        필터
      </Chip>
    );
    expect(enabled).not.toContain("data-disabled");
    expect(enabled).not.toMatch(/<button[^>]*class="podo-chip__remove"[^>]*disabled/);
  });

  it("escapes critical css theme values against script breakout", () => {
    const html = renderToString(<>{renderCriticalCss({ theme: "</script><script>alert(1)//" })}</>);
    expect(html).not.toContain("</script><script>");
    // 인라인 스크립트를 닫는 "</script"는 요소 자신의 닫는 태그 하나뿐이에요.
    expect(html.indexOf("</script")).toBe(html.lastIndexOf("</script"));
    expect(html).toContain("\\u003c/script");
  });

  it("escapes critical css payloads against style breakout", () => {
    const html = renderToString(
      <>{renderCriticalCss({ css: '.x{content:"a"}</style><script>alert(1)</script></STYLE>' })}</>
    );
    // "</style"는 요소 자신의 닫는 태그 하나뿐이에요 — 대소문자 변형 포함.
    expect(html.match(/<\/style/gi)).toHaveLength(1);
    // 주입 시도는 CSS 이스케이프("<\/style")로 무력화된 채 스타일 원문에 남아요.
    expect(html).toContain('.x{content:"a"}<\\/style><script>alert(1)</script><\\/STYLE>');
    // 주입된 "<script>"는 style 원문 텍스트 안(닫는 태그 앞)에 갇혀 요소가 되지
    // 않아요 — 실제 script 요소는 renderCriticalCss의 테마 스크립트 하나뿐이에요.
    expect(html.indexOf("<script>alert(1)")).toBeGreaterThan(-1);
    expect(html.indexOf("<script>alert(1)")).toBeLessThan(html.indexOf("</style>"));
    expect(html.match(/<script data-podo-theme/g)).toHaveLength(1);
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
    // A labeled dot needs role="img" — a generic span cannot carry an
    // author-provided aria-label. The text badge keeps its plain markup.
    expect(html).toContain('<span class="podo-badge" data-theme="red">99</span>');
    expect(html).toContain(
      '<span class="podo-badge" role="img" data-theme="green" data-dot="true" aria-label="온라인"></span>'
    );
    expect(html).not.toContain("무시되는 텍스트");
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('data-state="on"');
    // SSR checkbox: visuals ride data-state; AT expects aria-checked=mixed.
    expect(html).toContain('class="podo-checkbox"');
    expect(html).toContain('data-state="indeterminate"');
    expect(html).toContain('aria-checked="mixed"');
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

  it("keeps an unlabeled dot Badge role-free", () => {
    // Without an accessible name there is nothing to announce — no bare
    // image role, no aria-label.
    const html = renderToString(<Badge theme="gray" dot />);
    expect(html).toBe('<span class="podo-badge" data-theme="gray" data-dot="true"></span>');
  });

  it("renders the Tooltip id so a consumer trigger can reference the bubble", () => {
    // Spec contract (tooltip.component.json): the trigger's aria-describedby
    // points at the bubble. hono ships no trigger by design, so consumers put
    // aria-describedby={id} on their own trigger element.
    const html = renderToString(<Tooltip id="save-hint" label="임시 저장돼요" />);
    expect(html).toMatch(/<div id="save-hint"[^>]*role="tooltip"/);
    // Without the prop the bubble renders without an id, as before.
    expect(renderToString(<Tooltip label="힌트" />)).not.toMatch(/<div id=/);
  });
});
