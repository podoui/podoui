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
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "../../react/src/index.js";
import { Chip, DatePicker, Select, Switch, Table, Toaster, Tooltip } from "./index.js";
import { canonical, islandContent, islandRoot, parseHtml } from "./test-utils/markup.js";

// quickSelect 프리셋 라벨이 「오늘」을 읽어요 — 픽스처와 양쪽 렌더가 같은 날을 보게 고정해요.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
});
afterAll(() => {
  vi.useRealTimers();
});

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

  const d = new Date(2026, 10, 17);
  const e = new Date(2026, 10, 20);
  const datePickerCases: Array<[string, Record<string, unknown>]> = [
    ["instant date empty", {}],
    ["instant date with value, name, class", { value: { date: d }, name: "day", class: "wide" }],
    ["placeholder prop", { placeholder: "날짜 선택" }],
    [
      "period date disabled with fromName/toName",
      {
        mode: "period",
        value: { date: d, endDate: e },
        disabled: true,
        fromName: "a",
        toName: "b",
      },
    ],
    [
      "time with unaligned minute (step 15)",
      { type: "time", value: { time: { hour: 9, minute: 5 } }, minuteStep: 15 },
    ],
    ["time period empty", { type: "time", mode: "period" }],
    [
      "hour 12h step 3 with disabled hours",
      { type: "hour", hourFormat: "12", hourStep: 3, disabledHours: [0] },
    ],
    [
      "hour period with value",
      {
        type: "hour",
        mode: "period",
        value: { time: { hour: 13, minute: 0 }, endTime: { hour: 18, minute: 0 } },
      },
    ],
    [
      "datetime period with min/max times",
      {
        type: "datetime",
        mode: "period",
        value: {
          date: d,
          time: { hour: 1, minute: 2 },
          endDate: e,
          endTime: { hour: 22, minute: 50 },
        },
        minDate: { date: d, time: { hour: 1, minute: 0 } },
        maxDate: { date: e, time: { hour: 22, minute: 30 } },
        name: "ignored-in-period",
        fromName: "from",
        toName: "to",
      },
    ],
    [
      "datetime instant with format",
      {
        type: "datetime",
        value: { date: d, time: { hour: 7, minute: 30 } },
        format: "y.m.d h:i",
        name: "at",
      },
    ],
    [
      "quickSelect period with format",
      { mode: "period", quickSelect: true, value: { date: d, endDate: e }, format: "y.m.d" },
    ],
    [
      "quickSelect preset label + nav limits",
      {
        mode: "period",
        quickSelect: true,
        // 시계를 2026-11-17로 고정해 「최근 7일」 프리셋과 같은 범위예요.
        value: { date: new Date(2026, 10, 11), endDate: d },
        maxDate: d,
        minDate: new Date(2026, 10, 11),
      },
    ],
    ["quickSelect hideNavArrow", { mode: "period", quickSelect: true, hideNavArrow: true }],
  ];
  for (const [name, props] of datePickerCases) {
    it(`DatePicker — ${name}`, () => {
      const {
        value,
        class: className,
        ...rest
      } = props as Record<string, unknown> & {
        value?: unknown;
        class?: string;
      };
      expectParity(
        <DatePicker {...(props as Record<string, never>)} />,
        createElement(React.DatePicker, {
          ...(rest as Record<string, never>),
          ...(value ? { defaultValue: value } : {}),
          ...(className ? { className } : {}),
        })
      );
    });
  }

  it("DatePicker — the fixed clock really yields the preset label", () => {
    const html = renderToString(
      <DatePicker mode="period" quickSelect value={{ date: new Date(2026, 10, 11), endDate: d }} />
    );
    expect(html).toContain('<span class="podo-dp-presetLabel">최근 7일:</span>');
  });

  it("DatePicker — function conditions are left to configure (defer) without changing markup", () => {
    const html = renderToString(
      <DatePicker
        id="dp"
        disable={[(date: Date) => date.getDay() === 0, d]}
        enable={[{ from: d, to: e }]}
      />
    );
    const wrapper = parseHtml(html).querySelector("[data-podo-island]")!;
    expect(wrapper.hasAttribute("data-podo-defer")).toBe(true);
    expect(wrapper.getAttribute("data-podo-id")).toBe("dp");
    const props = JSON.parse(wrapper.getAttribute("data-podo-props")!);
    expect(props.disable).toBeUndefined();
    expect(props.enable).toEqual([
      { from: { $date: "2026-11-17T00:00:00" }, to: { $date: "2026-11-20T00:00:00" } },
    ]);
  });

  it("Toaster — empty stack", () =>
    expectParity(
      <Toaster position="bottom-right" max={2} />,
      createElement(React.Toaster, { position: "bottom-right", max: 2 })
    ));

  const tooltipCases: Array<[string, JSX.Element, ReactElement]> = [
    [
      "closed with a text label",
      <Tooltip label="도움말" position="top">
        <button type="button" aria-describedby="hint">
          ?
        </button>
      </Tooltip>,
      createElement(
        React.Tooltip,
        { label: "도움말", position: "top" },
        createElement("button", { type: "button", "aria-describedby": "hint" }, "?")
      ),
    ],
    [
      "closed with a rich label",
      <Tooltip label={<b>굵게</b>}>
        <button type="button">?</button>
      </Tooltip>,
      createElement(
        React.Tooltip,
        { label: createElement("b", null, "굵게") },
        createElement("button", { type: "button" }, "?")
      ),
    ],
    [
      "open inline (portal false)",
      <Tooltip label="열림" open portal={false} theme="reverse" ordinal="second">
        <button type="button" aria-describedby="hint">
          ?
        </button>
      </Tooltip>,
      createElement(
        React.Tooltip,
        { label: "열림", open: true, portal: false, theme: "reverse", ordinal: "second" },
        createElement("button", { type: "button", "aria-describedby": "hint" }, "?")
      ),
    ],
    [
      "open with portal (before mount)",
      <Tooltip label="열림" open>
        <button type="button">?</button>
      </Tooltip>,
      createElement(
        React.Tooltip,
        { label: "열림", open: true },
        createElement("button", { type: "button" }, "?")
      ),
    ],
    [
      "open inline on a Chip trigger (T5 F4)",
      <Tooltip label="칩 설명" open portal={false}>
        <Chip aria-describedby="hint">칩</Chip>
      </Tooltip>,
      createElement(
        React.Tooltip,
        { label: "칩 설명", open: true, portal: false },
        createElement(React.Chip, { "aria-describedby": "hint" }, "칩")
      ),
    ],
  ];
  for (const [name, hono, react] of tooltipCases) {
    it(`Tooltip — ${name}`, () => {
      const wrapper = parseHtml(renderToString(hono)).querySelector("[data-podo-island]")!;
      expect(canonical(islandContent(wrapper))).toBe(
        canonical(parseHtml(renderToStaticMarkup(react)))
      );
    });
  }

  const tableCases: Array<[string, { defaultSelected?: number[]; type?: "grid"; id?: string }]> = [
    ["nothing selected", {}],
    ["some selected (header indeterminate)", { defaultSelected: [0] }],
    [
      "all selectable selected (disabled row ignored)",
      { defaultSelected: [0, 1, 2], type: "grid", id: "t" },
    ],
  ];
  for (const [name, options] of tableCases) {
    it(`Table checkbox — ${name}`, () => {
      const hono = (
        <Table checkbox {...options}>
          <thead>
            <tr>
              <th>이름</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>가</td>
            </tr>
            <tr>
              <td>나</td>
            </tr>
            <tr data-disabled="true">
              <td>다</td>
            </tr>
          </tbody>
        </Table>
      );
      const react = createElement(
        React.Table,
        { checkbox: true, ...options },
        createElement("thead", null, createElement("tr", null, createElement("th", null, "이름"))),
        createElement(
          "tbody",
          null,
          createElement("tr", null, createElement("td", null, "가")),
          createElement("tr", null, createElement("td", null, "나")),
          createElement("tr", { "data-disabled": "true" }, createElement("td", null, "다"))
        )
      );
      expectParity(hono, react);
    });
  }

  // data-disabled 원본값 — boolean false·생략은 선택 가능, true·문자열은 비활성(T5 F2).
  it("Table checkbox — data-disabled false/true/string/omitted", () => {
    const rows: Array<[string, Record<string, unknown>]> = [
      ["가", { "data-disabled": false }],
      ["나", { "data-disabled": true }],
      ["다", { "data-disabled": "true" }],
      ["라", {}],
    ];
    expectParity(
      <Table checkbox defaultSelected={[0, 1, 2, 3]}>
        {[
          <thead>
            <tr>
              <th>이름</th>
            </tr>
          </thead>,
          <tbody>
            {rows.map(([label, attrs]) => (
              <tr {...attrs}>
                <td>{label}</td>
              </tr>
            ))}
          </tbody>,
        ]}
      </Table>,
      createElement(
        React.Table,
        { checkbox: true, defaultSelected: [0, 1, 2, 3] },
        createElement("thead", null, createElement("tr", null, createElement("th", null, "이름"))),
        createElement(
          "tbody",
          null,
          ...rows.map(([label, attrs]) =>
            createElement("tr", { key: label, ...attrs }, createElement("td", null, label))
          )
        )
      )
    );
  });
});
