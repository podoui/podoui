// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Button,
  Field,
  Icon,
  Input,
  PodoThemeProvider,
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
