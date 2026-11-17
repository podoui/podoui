// @vitest-environment jsdom
/** @jsxImportSource hono/jsx */
//
// T4 — DatePicker island. 같은 조작 시나리오를 React(react-dom) 렌더와 Hono SSR +
// podo-ui/hono/client에 각각 돌려, 최초 마운트부터 단계마다 제출값(hidden)·확정·초기화
// 횟수가 같은지 비교해요(계획 §3 T4·§4 T4: instant/period × date/time/datetime/hour).
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "hono/jsx/dom/server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "../../react/src/index.js";
import { DatePicker, type HonoDatePickerProps } from "./index.js";
import { canonical, parseHtml } from "./test-utils/markup.js";
import {
  clientOf,
  collect,
  fixClock,
  hidden,
  install,
  page,
  tick,
  useClientBundle,
} from "./test-utils/client-harness.js";

useClientBundle();
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// 양쪽이 같은 「오늘」을 보게 시계를 고정해요(quickSelect 프리셋·오늘 표시).
const NOW = new Date(2026, 10, 17, 10, 0, 0).getTime();
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
});
afterAll(() => {
  vi.useRealTimers();
});

type Action = (root: Element) => void;

const doc = (root: Element) => root.ownerDocument;
const click = (element: Element | null | undefined) => (element as HTMLElement).click();
const open =
  (index = 0): Action =>
  (root) =>
    click(root.querySelectorAll(".podo-dp-inputPart")[index]);
const pickDay =
  (day: number, month = 11): Action =>
  (root) =>
    click(doc(root).querySelector(`button[aria-label="2026년 ${month}월 ${day}일"]`));
const apply: Action = (root) =>
  click(doc(root).querySelector(".podo-dp-actionButtons .podo-dp-apply"));
const reset: Action = (root) =>
  click(doc(root).querySelector(".podo-dp-actionButtons .podo-dp-reset"));
const escape: Action = (root) => {
  const view = doc(root).defaultView!;
  doc(root).dispatchEvent(new view.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
};
const openTime =
  (index = 0): Action =>
  (root) =>
    click(root.querySelectorAll(".podo-dp-timeTrigger")[index]);
const pickTime =
  (column: number, value: number): Action =>
  (root) => {
    const columns = doc(root).querySelectorAll(".podo-dp-timeColumn");
    click(columns[column]?.querySelector(`[data-time-value="${value}"]`));
  };
const timeApply: Action = (root) =>
  click(doc(root).querySelector(".podo-dp-timeController .podo-dp-apply"));
const preset =
  (label: string): Action =>
  (root) =>
    click(
      Array.from(doc(root).querySelectorAll(".podo-dp-quickSelectPanel button")).find(
        (button) => button.textContent === label
      )
    );
const nav =
  (direction: "Left" | "Right"): Action =>
  (root) =>
    click(root.querySelector(`.podo-dp-navArrow${direction}`));
const selectHour =
  (hour: number): Action =>
  (root) => {
    const select = root.querySelector<HTMLSelectElement>("select.podo-dp-timeNativeSelect")!;
    select.value = String(hour);
    // 브라우저처럼 input → change 순서로 — React는 change, hono/jsx/dom의 onChange는 input을 들어요.
    const view = doc(root).defaultView!;
    for (const type of ["input", "change"]) {
      select.dispatchEvent(new view.Event(type, { bubbles: true }));
    }
  };

interface Snapshot {
  values: string[];
  changes: number;
  resets: number;
}

/** 이름이 같은 hidden도 문서 순서대로 모두(FormData.getAll과 같아요). */
const formValues = (root: Element, names: string[]) =>
  Array.from(root.querySelectorAll<HTMLInputElement>('input[type="hidden"]'))
    .filter((input) => names.includes(input.name))
    .map((input) => `${input.name}=${input.value}`);

async function runReact(props: HonoDatePickerProps, names: string[], actions: Action[]) {
  // id는 Hono configure 키라 React에는 넘기지 않아요(React DatePicker에 id prop 없음).
  const { value, class: className, ...withId } = props;
  const rest = { ...withId };
  delete rest.id;
  const container = document.createElement("div");
  document.body.append(container);
  let changes = 0;
  let resets = 0;
  const root = createRoot(container);
  await act(async () => {
    root.render(
      createElement(React.DatePicker, {
        ...(rest as Record<string, never>),
        ...(value ? { defaultValue: value } : {}),
        ...(className ? { className } : {}),
        onChange: () => {
          changes += 1;
        },
        onReset: () => {
          resets += 1;
        },
      })
    );
  });
  const snapshots: Snapshot[] = [{ values: formValues(container, names), changes, resets }];
  for (const action of actions) {
    await act(async () => action(container));
    snapshots.push({ values: formValues(container, names), changes, resets });
  }
  await act(async () => root.unmount());
  container.remove();
  return snapshots;
}

async function runHono(props: HonoDatePickerProps, names: string[], actions: Action[]) {
  const win = page(<DatePicker {...props} />);
  fixClock(win, NOW);
  const changes = collect(win, "podo:change");
  const resets = collect(win, "podo:reset");
  install(win);
  await tick(win);
  const body = win.document.body;
  const snapshots: Snapshot[] = [
    { values: formValues(body, names), changes: changes.length, resets: resets.length },
  ];
  for (const action of actions) {
    action(body);
    await tick(win);
    snapshots.push({
      values: formValues(body, names),
      changes: changes.length,
      resets: resets.length,
    });
  }
  return snapshots;
}

const d = new Date(2026, 10, 17);
const e = new Date(2026, 10, 20);

const scenarios: Array<[string, HonoDatePickerProps, string[], Action[]]> = [
  [
    "instant date: consecutive changes from an initial value, then Escape",
    { name: "day", value: { date: d } },
    ["day"],
    [open(), pickDay(3), open(), pickDay(25), open(), escape],
  ],
  [
    "instant date with showActions: cancel then apply",
    { name: "day", showActions: true, value: { date: d } },
    ["day"],
    [open(), pickDay(3), escape, open(), pickDay(4), apply],
  ],
  [
    "minDate/maxDate bounds block days outside the range",
    {
      name: "day",
      value: { date: d },
      minDate: new Date(2026, 10, 10),
      maxDate: new Date(2026, 10, 20),
    },
    ["day"],
    [open(), pickDay(5), pickDay(25), pickDay(12)],
  ],
  [
    "period date: reversed range applied, then a cancelled edit",
    { mode: "period", fromName: "from", toName: "to", value: { date: d, endDate: e } },
    ["from", "to"],
    [open(), pickDay(20), pickDay(10), apply, open(), pickDay(5), escape],
  ],
  [
    "period date without actions commits each pick",
    { mode: "period", showActions: false, fromName: "from", toName: "to" },
    ["from", "to"],
    [open(), pickDay(10), pickDay(20)],
  ],
  [
    "period date reset clears and fires onReset",
    { mode: "period", fromName: "from", toName: "to", value: { date: d, endDate: e } },
    ["from", "to"],
    [open(), reset, pickDay(2), pickDay(9), apply],
  ],
  [
    "period date with the same name for both ends",
    { mode: "period", fromName: "range", toName: "range", value: { date: d, endDate: e } },
    ["range"],
    [open(), pickDay(1), pickDay(30), apply],
  ],
  [
    "quickSelect preset and previous/next navigation",
    {
      mode: "period",
      quickSelect: true,
      fromName: "from",
      toName: "to",
      value: { date: d, endDate: e },
    },
    ["from", "to"],
    [open(), preset("최근 7일"), apply, nav("Left"), nav("Right"), nav("Right")],
  ],
  [
    "instant time through the time panel, then a cancelled edit",
    { type: "time", name: "t", minuteStep: 10, value: { time: { hour: 9, minute: 0 } } },
    ["t"],
    [openTime(0), pickTime(0, 15), pickTime(1, 30), timeApply, openTime(0), pickTime(0, 3), escape],
  ],
  [
    "period time: start and end through the panel",
    { type: "time", mode: "period", fromName: "s", toName: "e" },
    ["s", "e"],
    [openTime(0), pickTime(0, 9), timeApply, openTime(2), pickTime(0, 18), timeApply],
  ],
  [
    "instant datetime: date change keeps the time, then a time change",
    { type: "datetime", name: "at", value: { date: d, time: { hour: 7, minute: 30 } } },
    ["at"],
    [open(), pickDay(3), openTime(0), pickTime(0, 15), timeApply],
  ],
  [
    "instant datetime with a date-only initial value",
    { type: "datetime", name: "at", value: { date: d } },
    ["at"],
    [openTime(0), pickTime(0, 8), timeApply],
  ],
  [
    "instant datetime with a time-only initial value",
    { type: "datetime", name: "at", value: { time: { hour: 6, minute: 0 } } },
    ["at"],
    [open(), pickDay(9)],
  ],
  [
    "period datetime: range then time",
    {
      type: "datetime",
      mode: "period",
      fromName: "from",
      toName: "to",
      value: { date: d, time: { hour: 9, minute: 0 } },
    },
    ["from", "to"],
    [open(), pickDay(10), pickDay(20), apply, openTime(0), pickTime(0, 8), timeApply],
  ],
  [
    "period date with a start-only initial value",
    { mode: "period", fromName: "from", toName: "to", value: { date: d } },
    ["from", "to"],
    [open(), pickDay(22), apply],
  ],
  [
    "period date with an end-only initial value",
    { mode: "period", fromName: "from", toName: "to", value: { endDate: e } },
    ["from", "to"],
    [open(), pickDay(5), pickDay(9), apply],
  ],
  [
    "period datetime with date-only start and time-only end",
    {
      type: "datetime",
      mode: "period",
      fromName: "from",
      toName: "to",
      value: { date: d, endTime: { hour: 18, minute: 0 } },
    },
    ["from", "to"],
    [openTime(0), pickTime(0, 9), timeApply, open(), pickDay(25), apply],
  ],
  [
    "period datetime with time-only start and date-only end",
    {
      type: "datetime",
      mode: "period",
      fromName: "from",
      toName: "to",
      value: { time: { hour: 9, minute: 0 }, endDate: e },
    },
    ["from", "to"],
    [open(), pickDay(3), pickDay(19), apply, openTime(2), pickTime(0, 20), timeApply],
  ],
  [
    "instant hour commits from the native select",
    { type: "hour", name: "h", value: { time: { hour: 9, minute: 0 } } },
    ["h"],
    [selectHour(15)],
  ],
  [
    "period hour through the panel",
    { type: "hour", mode: "period", fromName: "s", toName: "e", hourFormat: "12" },
    ["s", "e"],
    [openTime(0), pickTime(0, 9), timeApply, openTime(1), pickTime(0, 18), timeApply],
  ],
];

describe("DatePicker island — same results as the React component (T4)", () => {
  for (const [name, props, names, actions] of scenarios) {
    it(name, async () => {
      const react = await runReact(props, names, actions);
      const hono = await runHono(props, names, actions);
      expect(hono).toEqual(react);
      // 시나리오가 실제로 값을 바꾸는지(빈 비교 방지).
      expect(react.at(-1)!.changes).toBeGreaterThan(0);
    });
  }
});

describe("DatePicker island — protocol", () => {
  for (const [name, props] of scenarios) {
    it(`keeps the closed SSR markup after mount (parity B) — ${name}`, async () => {
      const markup = <DatePicker {...props} />;
      const ssr = parseHtml(renderToString(markup)).querySelector("[data-podo-island] > *")!;
      const win = page(markup);
      fixClock(win, NOW);
      install(win);
      await tick(win);
      const mounted = win.document.querySelector("[data-podo-mounted] > *")!;
      expect(canonical(mounted)).toBe(canonical(ssr));
    });
  }

  it("mounts a deferred DatePicker after configure and applies the function condition", async () => {
    const sunday = (date: Date) => date.getDay() === 0;
    const win = page(<DatePicker id="dp" name="day" value={{ date: d }} disable={[sunday]} />);
    install(win);
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
    clientOf(win).configure("dp", { disable: [sunday] });
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).not.toBeNull();
    open()(win.document.body);
    await tick(win);
    // 2026-11-22는 일요일.
    const cell = (day: number) =>
      win.document.querySelector<HTMLButtonElement>(`button[aria-label="2026년 11월 ${day}일"]`)!;
    expect(cell(22).disabled).toBe(true);
    expect(cell(23).disabled).toBe(false);
  });

  it("reads hidden values changed before mount (including same-name ends) and supports configure(value)", async () => {
    const win = page(
      <>
        <DatePicker id="c" name="day" value={{ date: d }} />
        <DatePicker mode="period" fromName="range" toName="range" value={{ date: d, endDate: e }} />
      </>
    );
    win.document.querySelector<HTMLInputElement>('input[name="day"]')!.value = "2026-11-05";
    win.document.querySelectorAll<HTMLInputElement>('input[name="range"]')[1]!.value = "2026-11-28";
    const changes = collect(win, "podo:change");
    install(win);
    await tick(win);
    expect(win.document.querySelector(".podo-dp-inputPart")!.textContent).toBe("2026 - 11 - 05");
    const form = win.document.getElementById("f") as HTMLFormElement;
    expect(new win.FormData(form).getAll("range")).toEqual(["2026-11-17", "2026-11-28"]);
    clientOf(win).configure("c", { value: { date: new Date(2026, 10, 9) } });
    await tick(win);
    expect(hidden(win, "day")).toEqual(["2026-11-09"]);
    open()(win.document.body);
    await tick(win);
    pickDay(12)(win.document.body);
    await tick(win);
    expect(hidden(win, "day")).toEqual(["2026-11-12"]);
    expect((changes.at(-1)!.value as { date: Date }).date.getDate()).toBe(12);
  });

  it("keeps partial initial values, applies a cleared hidden, and ignores impossible text", async () => {
    const win = page(
      <>
        <DatePicker type="datetime" name="partial" value={{ date: d }} />
        <DatePicker
          type="datetime"
          name="cleared"
          value={{ date: d, time: { hour: 7, minute: 30 } }}
        />
        <DatePicker name="bad" value={{ date: d }} />
      </>
    );
    win.document.querySelector<HTMLInputElement>('input[name="cleared"]')!.value = "";
    win.document.querySelector<HTMLInputElement>('input[name="bad"]')!.value = "2026-02-31";
    install(win);
    await tick(win);
    const parts = Array.from(win.document.querySelectorAll(".podo-dp-input")).map(
      (input) => input.querySelector(".podo-dp-inputPart")!.textContent
    );
    // 날짜만 있는 초기값은 hidden이 ""여도 지워지지 않아요.
    expect(parts[0]).toBe("2026 - 11 - 17");
    // 사용자가 비운 완전한 값은 비워져요.
    expect(parts[1]).toBe("YYYY - MM - DD");
    // 달력에 없는 값은 무시하고 초기값을 둬요.
    expect(parts[2]).toBe("2026 - 11 - 17");
  });

  it("keeps period partial initial values and applies a cleared end before mount", async () => {
    const win = page(
      <>
        <DatePicker
          type="datetime"
          mode="period"
          fromName="pf"
          toName="pt"
          value={{ date: d, endTime: { hour: 18, minute: 0 } }}
        />
        <DatePicker mode="period" fromName="cf" toName="ct" value={{ date: d, endDate: e }} />
      </>
    );
    win.document.querySelector<HTMLInputElement>('input[name="ct"]')!.value = "";
    install(win);
    await tick(win);
    const [partial, cleared] = Array.from(win.document.querySelectorAll(".podo-dp-input"));
    // 부분 초기값(시작 날짜만·종료 시간만)은 hidden이 둘 다 ""여도 그대로예요.
    expect(partial!.querySelectorAll(".podo-dp-inputPart")[0]!.textContent).toBe("2026 - 11 - 17");
    expect(partial!.querySelectorAll(".podo-dp-timeTrigger")[2]!.textContent).toBe("18");
    // 사용자가 비운 종료값은 비워지고 시작값은 남아요.
    const clearedParts = cleared!.querySelectorAll(".podo-dp-inputPart");
    expect(clearedParts[0]!.textContent).toBe("2026 - 11 - 17");
    expect(clearedParts[1]!.textContent).toBe("YYYY - MM - DD");
    expect(hidden(win, "cf")).toEqual(["2026-11-17"]);
    expect(hidden(win, "ct")).toEqual([""]);
  });

  it("portals the dropdown to document.body when portal is set", async () => {
    const win = page(<DatePicker portal name="day" value={{ date: d }} />);
    install(win);
    await tick(win);
    open()(win.document.body);
    await tick(win);
    const dropdown = win.document.querySelector(".podo-dp-dropdown");
    expect(dropdown?.parentElement).toBe(win.document.body);
  });
});
