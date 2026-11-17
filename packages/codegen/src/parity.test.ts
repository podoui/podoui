import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseComponentDocument, type ComponentDocument } from "@podoui/spec";
import { generateComponentFiles, type CodegenTarget } from "./index.js";

const componentRoot = resolve(process.cwd(), "packages/spec/samples/components");
const targets: CodegenTarget[] = ["web", "react", "hono", "native"];

describe("cross-target component parity", () => {
  it("keeps Button props, slots, and token bindings aligned across all targets", () => {
    const button = loadComponent("button");
    const files = generateComponentFiles({ specs: [button], targets, outDir: ".podo/generated" });

    expect(files.map((file) => file.path)).toEqual(
      targets.map((target) => `.podo/generated/${target}/button.${target}.ts`).sort()
    );
    for (const target of targets) {
      expect(button.targets[target]?.supported).toBe(true);
      expect(files.find((file) => file.path.includes(`/${target}/`))?.contents).toContain("Button");
    }

    expect(button.props.map((prop) => prop.name)).toEqual([
      "theme",
      "size",
      "disabled",
      "fill",
      "onPress",
      "type",
      "form",
      "formAction",
      "formMethod",
      "name",
      "value",
    ]);
    expect(button.slots.map((slot) => slot.name)).toEqual(["prefix", "children", "suffix"]);
    expect(button.tokens).toMatchObject({
      "root.background": "{component.button.background}",
      "label.color": "{component.button.text}",
      "icon.color": "{component.button.text}",
    });
    expect(button.variants.find((variant) => variant.name === "theme")?.tokens).toMatchObject({
      "root.background": "{component.button.background}",
      "label.color": "{component.button.text}",
    });
  });
});

describe("Hono parity spec additions", () => {
  it("declares the ported DatePicker, Toaster, Editor, and EditorView per target", () => {
    const support = (name: string) => {
      const spec = loadComponent(name);
      return Object.fromEntries(targets.map((target) => [target, spec.targets[target].supported]));
    };
    expect(support("datepicker")).toEqual({ web: false, react: true, hono: true, native: true });
    expect(support("toaster")).toEqual({ web: false, react: true, hono: true, native: false });
    expect(support("editor")).toEqual({ web: false, react: true, hono: true, native: true });
    expect(support("editor-view")).toEqual({ web: false, react: true, hono: true, native: true });
  });

  it("documents the form submission names and Hono-only props", () => {
    const propNames = (name: string) => loadComponent(name).props.map((prop) => prop.name);
    expect(propNames("datepicker")).toEqual(expect.arrayContaining(["name", "fromName", "toName"]));
    // React MinuteStep·HourStep은 숫자 리터럴이라 spec도 숫자 타입·숫자 기본값이에요.
    const datepicker = loadComponent("datepicker");
    for (const name of ["minuteStep", "hourStep"]) {
      const prop = datepicker.props.find((item) => item.name === name);
      expect(prop?.type).toEqual({ kind: "number" });
      expect(prop?.default).toBe(1);
    }
    expect(propNames("editor")).toEqual(
      expect.arrayContaining(["name", "defaultValue", "uploadUrl", "validator"])
    );
    expect(propNames("input")).toContain("type");
    expect(propNames("textarea")).toContain("rows");
    expect(loadComponent("tooltip").slots.map((slot) => slot.name)).toContain("trigger");
    // select.component.json은 기존 state 이름("completed")이 스키마 enum 밖이라
    // 파서를 거치지 않고 원본 JSON에서 prop만 확인해요.
    const select = JSON.parse(
      readFileSync(resolve(componentRoot, "select.component.json"), "utf8")
    ) as { props: Array<{ name: string }> };
    expect(select.props.map((prop) => prop.name)).toContain("name");
  });
});

function loadComponent(name: string): ComponentDocument {
  return parseComponentDocument(
    JSON.parse(readFileSync(resolve(componentRoot, `${name}.component.json`), "utf8"))
  );
}
