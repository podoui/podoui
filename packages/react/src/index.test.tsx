// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Button,
  Chip,
  Field,
  Icon,
  Input,
  PodoThemeProvider,
  Switch,
  Table,
  Textarea,
  Typography,
  usePodoTheme,
} from "./index.js";

describe("@podo/react", () => {
  it("renders typed button props and emits onPress", async () => {
    const user = userEvent.setup();
    let presses = 0;
    render(
      <Button prefix={<Icon name="menu" />} onPress={() => (presses += 1)}>
        Save
      </Button>
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(presses).toBe(1);
    expect(screen.getByRole("button").getAttribute("data-theme")).toBe("solid-primary");
  });

  it("stretches to the parent width with fill", () => {
    render(<Button fill>Submit</Button>);
    expect(screen.getByRole("button", { name: "Submit" }).getAttribute("data-fill")).toBe("true");
  });

  it("renders chip themes/sizes and blocks presses while disabled", async () => {
    const user = userEvent.setup();
    let presses = 0;
    render(
      <>
        <Chip
          size="sm"
          theme="outline-weak"
          suffix={<Icon name="menu" />}
          onPress={() => (presses += 1)}
        >
          필터
        </Chip>
        <Chip disabled onPress={() => (presses += 1)}>
          비활성
        </Chip>
      </>
    );

    await user.click(screen.getByRole("button", { name: /필터/ }));
    await user.click(screen.getByRole("button", { name: "비활성" }));

    expect(presses).toBe(1);
    const chip = screen.getByRole("button", { name: /필터/ });
    expect(chip.className).toBe("podo-chip");
    expect(chip.getAttribute("data-theme")).toBe("outline-weak");
    expect(chip.getAttribute("data-size")).toBe("sm");
  });

  it("tracks the character count automatically and caps input at countMax", async () => {
    const user = userEvent.setup();
    render(
      <Field label="제목" countMax={5}>
        <Input aria-label="본문" defaultValue="ab" />
      </Field>
    );

    // Initial count reflects the control's defaultValue.
    expect(screen.getByText("2/5")).toBeDefined();
    await user.type(screen.getByLabelText("본문"), "cde");
    expect(screen.getByText("5/5")).toBeDefined();

    // countMax maps to the native maxLength, so extra typing is blocked.
    await user.type(screen.getByLabelText("본문"), "xyz");
    expect((screen.getByLabelText("본문") as HTMLInputElement).value).toBe("abcde");
    expect(screen.getByText("5/5")).toBeDefined();
  });

  it("toggles the switch uncontrolled and respects disabled", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <>
        <Switch aria-label="알림" size="lg" onCheckedChange={(next) => changes.push(next)} />
        <Switch
          aria-label="잠김"
          disabled
          defaultChecked
          onCheckedChange={() => changes.push(false)}
        />
      </>
    );

    const toggle = screen.getByRole("switch", { name: "알림" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.getAttribute("data-state")).toBe("off");
    expect(toggle.getAttribute("data-size")).toBe("lg");

    await user.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.getAttribute("data-state")).toBe("on");

    await user.click(screen.getByRole("switch", { name: "잠김" }));
    expect(changes).toEqual([true]);
    expect(screen.getByRole("switch", { name: "잠김" }).getAttribute("data-state")).toBe("on");
  });

  it("names and toggles the switch through its visible label", async () => {
    const user = userEvent.setup();
    render(<Switch label="야간 모드" />);

    // The label wrapper names the switch and clicking the text toggles it.
    const toggle = screen.getByRole("switch", { name: "야간 모드" });
    expect(screen.getByText("야간 모드").className).toBe("podo-switch__text");
    await user.click(screen.getByText("야간 모드"));
    expect(toggle.getAttribute("data-state")).toBe("on");
  });

  it("renders the textarea states and resize toggle", async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    render(
      <>
        <Textarea aria-label="메모장" resize={false} onValueChange={(v) => values.push(v)} />
        <Textarea aria-label="오류" invalid />
        <Textarea aria-label="잠긴 메모" disabled />
      </>
    );

    const area = screen.getByLabelText("메모장");
    expect(area.tagName).toBe("TEXTAREA");
    expect(area.className).toBe("podo-textarea");
    expect(area.getAttribute("data-resize")).toBe("false");
    await user.type(area, "메모");
    expect(values.at(-1)).toBe("메모");

    expect(screen.getByLabelText("오류").getAttribute("data-state")).toBe("invalid");
    expect(screen.getByLabelText("오류").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("잠긴 메모").getAttribute("data-state")).toBe("disabled");
  });

  it("wraps native table semantics with the type variant", () => {
    render(
      <Table type="horizon" aria-label="주문 목록">
        <thead>
          <tr>
            <th>주문</th>
          </tr>
        </thead>
        <tbody>
          <tr data-disabled="true">
            <td>#1024</td>
          </tr>
        </tbody>
      </Table>
    );

    const table = screen.getByRole("table", { name: "주문 목록" });
    expect(table.className).toBe("podo-table");
    expect(table.getAttribute("data-type")).toBe("horizon");
    expect(screen.getByText("#1024").closest("tr")?.getAttribute("data-disabled")).toBe("true");
  });

  it("supports controlled and uncontrolled input value changes", async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    render(
      <>
        <Input aria-label="controlled" value="a" onValueChange={(value) => values.push(value)} />
        <Input aria-label="uncontrolled" defaultValue="x" />
      </>
    );

    await user.type(screen.getByLabelText("controlled"), "b");
    await user.clear(screen.getByLabelText("uncontrolled"));
    await user.type(screen.getByLabelText("uncontrolled"), "done");

    expect(values).toEqual(["ab"]);
    expect((screen.getByLabelText("uncontrolled") as HTMLInputElement).value).toBe("done");
  });

  it("provides theme context and field markup", () => {
    function Probe(): React.ReactElement {
      const theme = usePodoTheme();
      return <span data-testid="theme">{`${theme.theme}:${theme.colorScheme}`}</span>;
    }

    render(
      <PodoThemeProvider theme="dashboard" colorScheme="dark">
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
          <Input aria-label="Email" invalid required />
        </Field>
        <Typography as="h1">Dashboard</Typography>
        <Probe />
      </PodoThemeProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("dashboard:dark");
    expect(screen.getByText("Email").closest("label")?.getAttribute("for")).toBe("email-control");
    expect(screen.getByLabelText(/Email/).getAttribute("id")).toBe("email-control");
    // The error replaces the helper text in the footer, so only its id is referenced.
    expect(screen.getByLabelText(/Email/).getAttribute("aria-describedby")).toBe("email-error");
    expect(screen.getByText("*").className).toBe("podo-field__requirement");
    expect(screen.getByText("선택").className).toBe("podo-field__sub-label");
    expect(screen.getByText("Required").className).toBe("podo-field__error");
    expect(screen.queryByText("Work email")).toBeNull();
    expect(screen.getByText("0/500").className).toBe("podo-field__count");
    expect(screen.getByRole("heading", { name: "Dashboard" }).className).toContain("podo-text--h1");
  });

  it("snapshots themed variant markup for visual regression", () => {
    const { container } = render(
      <PodoThemeProvider theme="dashboard" colorScheme="dark">
        <Button theme="solid-assistive" size="lg" prefix={<Icon name="menu" />}>
          Save
        </Button>
        <Field
          id="email"
          label="Email"
          subLabel="선택"
          suffixIcon={<Icon name="menu" />}
          helperText="Work email"
          count={0}
          countMax={500}
          invalid
        >
          <Input
            aria-label="Email"
            size="lg"
            prefix={<Icon name="menu" />}
            suffixText="@podo.dev"
            invalid
          />
        </Field>
      </PodoThemeProvider>
    );

    expect(container.firstElementChild).toMatchSnapshot();
  });
});
