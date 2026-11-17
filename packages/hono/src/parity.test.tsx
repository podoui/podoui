// @vitest-environment jsdom
/** @jsxImportSource hono/jsx */
//
// 패리티 A(계획 §3.6) — Hono SSR island 래퍼 안의 루트가 같은 props의 React
// 서버 렌더(renderToStaticMarkup)와 정규화 후 같은지. 래퍼·data-podo-*·id 문자열은
// 승인된 차이라 비교에서 빼요(id는 참조 관계만 비교).
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderToString } from "hono/jsx/dom/server";
import type { JSX } from "hono/jsx/jsx-runtime";
import { describe, expect, it } from "vitest";
import * as React from "../../react/src/index.js";
import { Chip, Select, Switch } from "./index.js";
import { canonical, islandRoot, parseHtml } from "./test-utils/markup.js";

const fruit = [
  { value: "apple", label: "사과" },
  { value: "pear", label: "배" },
  { value: "grape", label: "포도" },
  { value: "peach", label: "복숭아" },
];

function expectParity(hono: JSX.Element, react: ReactElement) {
  const honoRoot = islandRoot(renderToString(hono));
  const reactRoot = parseHtml(renderToStaticMarkup(react)).firstElementChild!;
  expect(canonical(honoRoot)).toBe(canonical(reactRoot));
}

describe("parity A — Hono SSR == React server render", () => {
  it("normalizer still tells real differences apart", () => {
    const hono = islandRoot(renderToString(<Select options={fruit} value="pear" />));
    const react = parseHtml(
      renderToStaticMarkup(createElement(React.Select, { options: fruit, defaultValue: "apple" }))
    ).firstElementChild!;
    expect(canonical(hono)).not.toBe(canonical(react));
    // id 문자열은 달라도 참조 관계가 같으면 같아요.
    expect(canonical(parseHtml('<a id="x" aria-controls="y"></a><b id="y"></b>'))).toBe(
      canonical(parseHtml('<a id="p" aria-controls="q"></a><b id="q"></b>'))
    );
  });

  it("gives identical id-less inline menus distinct listbox/option ids (F5)", () => {
    const html = renderToString(
      <>
        <Select open portal={false} options={fruit} />
        <Select open portal={false} options={fruit} />
      </>
    );
    const doc = parseHtml(html);
    const triggers = Array.from(doc.querySelectorAll('[role="combobox"]'));
    const listboxes = triggers.map((trigger) =>
      doc.querySelector(`[id="${trigger.getAttribute("aria-controls")}"]`)
    );
    expect(new Set(listboxes.map((listbox) => listbox?.id)).size).toBe(2);
    listboxes.forEach((listbox, index) => {
      expect(listbox?.getAttribute("role")).toBe("listbox");
      expect(listbox?.closest(".podo-select")).toBe(triggers[index]!.closest(".podo-select"));
    });
    const optionIds = Array.from(doc.querySelectorAll('[role="option"]')).map(
      (option) => option.id
    );
    expect(new Set(optionIds).size).toBe(optionIds.length);
  });

  const selectCases: Array<[string, JSX.Element, ReactElement]> = [
    [
      "single with value, name, id",
      <Select id="fruit" name="fruit" options={fruit} value="pear" />,
      createElement(React.Select, {
        id: "fruit",
        name: "fruit",
        options: fruit,
        defaultValue: "pear",
      }),
    ],
    [
      "placeholder without value",
      <Select options={fruit} placeholder="선택" aria-label="과일" />,
      createElement(React.Select, { options: fruit, placeholder: "선택", "aria-label": "과일" }),
    ],
    [
      "multiple + clearable + overflow chips",
      <Select
        multiple
        clearable
        name="m"
        options={fruit}
        values={["apple", "pear", "grape", "peach"]}
      />,
      createElement(React.Select, {
        multiple: true,
        clearable: true,
        name: "m",
        options: fruit,
        defaultValues: ["apple", "pear", "grape", "peach"],
      }),
    ],
    [
      "searchable",
      <Select searchable options={fruit} value="apple" />,
      createElement(React.Select, { searchable: true, options: fruit, defaultValue: "apple" }),
    ],
    [
      "disabled + invalid",
      <Select disabled invalid options={fruit} value="apple" size="lg" />,
      createElement(React.Select, {
        disabled: true,
        invalid: true,
        options: fruit,
        defaultValue: "apple",
        size: "lg",
      }),
    ],
    [
      "readOnly multiple (static chips)",
      <Select readOnly multiple options={fruit} values={["apple", "pear"]} />,
      createElement(React.Select, {
        readOnly: true,
        multiple: true,
        options: fruit,
        defaultValues: ["apple", "pear"],
      }),
    ],
    [
      "defaultOpen inline single",
      <Select open portal={false} id="s" options={fruit} value="pear" />,
      createElement(React.Select, {
        defaultOpen: true,
        portal: false,
        id: "s",
        options: fruit,
        defaultValue: "pear",
      }),
    ],
    [
      "defaultOpen inline multiple + addable, no id",
      <Select
        open
        portal={false}
        multiple
        addable
        addPlaceholder="추가"
        options={fruit}
        values={["grape"]}
      />,
      createElement(React.Select, {
        defaultOpen: true,
        portal: false,
        multiple: true,
        addable: true,
        addPlaceholder: "추가",
        options: fruit,
        defaultValues: ["grape"],
      }),
    ],
    [
      "defaultOpen + portal renders no menu before mount",
      <Select open options={fruit} />,
      createElement(React.Select, { defaultOpen: true, options: fruit }),
    ],
    [
      "prefix slot + aria wiring",
      <Select
        options={fruit}
        prefix={<i class="podo-icon podo-icon-search" aria-hidden="true" />}
        aria-describedby="hint"
        aria-invalid="true"
        aria-required="true"
      />,
      createElement(React.Select, {
        options: fruit,
        prefix: createElement("i", {
          className: "podo-icon podo-icon-search",
          "aria-hidden": "true",
        }),
        "aria-describedby": "hint",
        "aria-invalid": "true",
        "aria-required": "true",
      }),
    ],
  ];
  for (const [name, hono, react] of selectCases) {
    it(`Select — ${name}`, () => expectParity(hono, react));
  }

  const chipCases: Array<[string, JSX.Element, ReactElement]> = [
    ["toggle", <Chip>필터</Chip>, createElement(React.Chip, null, "필터")],
    [
      "selected outline lg with prefix/suffix",
      <Chip selected theme="outline-strong" size="lg" prefix={<b>P</b>} suffix={<b>S</b>}>
        필터
      </Chip>,
      createElement(
        React.Chip,
        {
          defaultSelected: true,
          theme: "outline-strong",
          size: "lg",
          prefix: createElement("b", null, "P"),
          suffix: createElement("b", null, "S"),
        },
        "필터"
      ),
    ],
    ["disabled", <Chip disabled>필터</Chip>, createElement(React.Chip, { disabled: true }, "필터")],
    [
      "removable",
      <Chip removable removeLabel="필터 제거">
        필터
      </Chip>,
      createElement(React.Chip, { onRemove: () => undefined, removeLabel: "필터 제거" }, "필터"),
    ],
    [
      "removable disabled with id",
      <Chip removable disabled id="c1">
        필터
      </Chip>,
      createElement(React.Chip, { onRemove: () => undefined, disabled: true, id: "c1" }, "필터"),
    ],
  ];
  for (const [name, hono, react] of chipCases) {
    it(`Chip — ${name}`, () => expectParity(hono, react));
  }

  const switchCases: Array<[string, JSX.Element, ReactElement]> = [
    ["off", <Switch aria-label="알림" />, createElement(React.Switch, { "aria-label": "알림" })],
    [
      "on with label, size, bold",
      <Switch checked label="알림" size="lg" bold />,
      createElement(React.Switch, { defaultChecked: true, label: "알림", size: "lg", bold: true }),
    ],
    [
      "disabled with id",
      <Switch disabled id="sw" aria-describedby="hint" />,
      createElement(React.Switch, { disabled: true, id: "sw", "aria-describedby": "hint" }),
    ],
  ];
  for (const [name, hono, react] of switchCases) {
    it(`Switch — ${name}`, () => expectParity(hono, react));
  }
});
