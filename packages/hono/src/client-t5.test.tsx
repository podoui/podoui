/** @jsxImportSource hono/jsx */
//
// T5 — Toaster·Toast·Tooltip·Table island과 중첩 island(계획 §4 T5, V7-1·V7-2).
import { renderToString } from "hono/jsx/dom/server";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { Chip, DatePicker, Table, Toast, Toaster, Tooltip } from "./index.js";
import { canonical, islandContent } from "./test-utils/markup.js";
import {
  clientOf,
  collect,
  fakeTimers,
  install,
  page,
  tick,
  useClientBundle,
  type Win,
} from "./test-utils/client-harness.js";

useClientBundle();

interface ToastApi {
  (title: string, options?: Record<string, unknown>): number;
  normal: (title: string, options?: Record<string, unknown>) => number;
  success: (title: string, options?: Record<string, unknown>) => number;
  danger: (title: string, options?: Record<string, unknown>) => number;
  info: (title: string, options?: Record<string, unknown>) => number;
  warning: (title: string, options?: Record<string, unknown>) => number;
  dismiss: (id?: number) => void;
}
const toastOf = (win: Win) => (win as unknown as { podo: { toast: ToastApi } }).podo.toast;
const cards = (win: Win) => Array.from(win.document.querySelectorAll(".podo-toaster .podo-toast"));
const pointer = (win: Win, target: Element, type: string, init: MouseEventInit = {}) =>
  target.dispatchEvent(
    new win.MouseEvent(type, {
      bubbles: type !== "pointerenter" && type !== "pointerleave",
      ...init,
    })
  );

/** 마운트 전후 마크업(B) — 슬롯 정의 템플릿·data-podo-* 는 승인된 차이라 빼요. */
async function expectMountParity(markup: Parameters<typeof renderToString>[0]) {
  const ssr = new JSDOM(renderToString(markup)).window.document.querySelector(
    "[data-podo-island]"
  )!;
  const win = page(markup);
  install(win);
  await tick(win);
  const mounted = win.document.querySelector("[data-podo-mounted]")!;
  expect(canonical(islandContent(mounted))).toBe(canonical(islandContent(ssr)));
}

describe("Toaster island and window.podo.toast", () => {
  it("keeps the empty stack after mount (B) and exposes the React toast API", async () => {
    await expectMountParity(<Toaster />);
    const win = page(<Toaster max={2} duration={5000} />);
    install(win);
    await tick(win);
    const toast = toastOf(win);
    for (const method of ["normal", "success", "danger", "info", "warning", "dismiss"] as const) {
      expect(typeof toast[method]).toBe("function");
    }
    toast("저장됐어요");
    toast.success("성공");
    await tick(win);
    expect(cards(win).map((card) => card.getAttribute("data-state"))).toEqual([
      "success",
      "normal",
    ]);
    // CSS 변수 순번·개수는 단위 없는 숫자예요(calc 안에서 곱해져요).
    expect(cards(win).map((card) => card.getAttribute("style"))).toEqual([
      "--podo-toast-index: 0;",
      "--podo-toast-index: 1;",
    ]);
    expect(win.document.querySelector(".podo-toaster")!.getAttribute("style")).toBe(
      "--podo-toast-count: 2;"
    );

    // 최대 개수를 넘으면 가장 오래된 토스트가 퇴장(애니메이션)으로 빠져요.
    toast.danger("실패");
    await tick(win);
    expect(
      cards(win)
        .find((card) => card.textContent?.includes("저장됐어요"))
        ?.getAttribute("data-leaving")
    ).toBe("true");
    await tick(win, 260);
    expect(cards(win).some((card) => card.textContent?.includes("저장됐어요"))).toBe(false);

    const id = toast.info("곧 닫혀요");
    await tick(win);
    toast.dismiss(id);
    await tick(win);
    expect(
      cards(win)
        .find((card) => card.textContent?.includes("곧 닫혀요"))
        ?.getAttribute("data-leaving")
    ).toBe("true");
  });

  it("pauses auto-dismiss while hovered and resumes after leaving", async () => {
    const win = page(<Toaster duration={80} />);
    install(win);
    await tick(win);
    const stack = win.document.querySelector(".podo-toaster")!;
    toastOf(win)("머무는 토스트");
    await tick(win, 10);
    pointer(win, stack, "pointerenter");
    await tick(win, 200);
    expect(stack.getAttribute("data-expanded")).toBe("true");
    expect(cards(win)[0]?.hasAttribute("data-leaving")).toBe(false);
    pointer(win, stack, "pointerleave");
    await tick(win, 400);
    expect(cards(win)).toHaveLength(0);
  });
});

describe("Toaster timers on a controlled clock (T5 F6)", () => {
  it("covers every toast method, duration and exit boundaries, focus pause, and dismiss()", async () => {
    const win = page(<Toaster duration={1000} max={5} />);
    install(win);
    const clock = fakeTimers(win);
    await clock.advance(0);
    const toast = toastOf(win);
    const stack = win.document.querySelector(".podo-toaster")!;
    const stateOf = (title: string) => cards(win).find((card) => card.textContent?.includes(title));

    toast.normal("보통");
    toast.warning("주의");
    await clock.advance(0);
    expect(stateOf("보통")?.getAttribute("data-state")).toBe("normal");
    expect(stateOf("주의")?.getAttribute("data-state")).toBe("warning");

    // 지속 시간 경계: 999ms까진 그대로, 1000ms에 퇴장 시작, 퇴장 애니메이션(180ms) 뒤 제거.
    await clock.advance(999);
    expect(stateOf("보통")?.hasAttribute("data-leaving")).toBe(false);
    await clock.advance(1);
    expect(stateOf("보통")?.getAttribute("data-leaving")).toBe("true");
    await clock.advance(179);
    expect(stateOf("보통")).toBeDefined();
    await clock.advance(1);
    expect(stateOf("보통")).toBeUndefined();
    expect(stateOf("주의")).toBeUndefined();

    // focus 동안은 멈추고, blur(스택 밖으로) 뒤 새 타이머가 처음부터 돌아요.
    toast.info("포커스");
    await clock.advance(500);
    const close = stateOf("포커스")!.querySelector<HTMLButtonElement>("button")!;
    close.focus();
    await clock.advance(5000);
    expect(stack.getAttribute("data-expanded")).toBe("true");
    expect(stateOf("포커스")?.hasAttribute("data-leaving")).toBe(false);
    close.blur();
    await clock.advance(999);
    expect(stack.hasAttribute("data-expanded")).toBe(false);
    expect(stateOf("포커스")?.hasAttribute("data-leaving")).toBe(false);
    await clock.advance(1);
    expect(stateOf("포커스")?.getAttribute("data-leaving")).toBe("true");
    await clock.advance(180);

    // 인자 없는 dismiss()는 모두 퇴장시켜요.
    toast("하나", { manual: true });
    toast.danger("둘", { manual: true });
    toast.success("셋", { manual: true });
    await clock.advance(0);
    expect(cards(win)).toHaveLength(3);
    toast.dismiss();
    await clock.advance(0);
    expect(cards(win).every((card) => card.getAttribute("data-leaving") === "true")).toBe(true);
    await clock.advance(180);
    expect(cards(win)).toHaveLength(0);
  });
});

describe("server flash Toast delegation (T1 D-4)", () => {
  it("closes on the X with podo:close, keeps it when cancelled, and auto-closes with duration", async () => {
    const win = page(
      <>
        <Toast closable>닫기</Toast>
        <Toast closable state="info">
          유지
        </Toast>
        <Toast duration={50}>자동</Toast>
      </>
    );
    const closed = collect(win, "podo:close");
    win.document.addEventListener("podo:close", (event) => {
      if ((event.target as Element).textContent?.includes("유지")) {
        event.preventDefault();
      }
    });
    install(win);
    await tick(win);
    const closeButtons = win.document.querySelectorAll<HTMLElement>(".podo-toast__close");
    closeButtons[0]!.click();
    closeButtons[1]!.click();
    await tick(win, 120);
    const left = Array.from(win.document.querySelectorAll(".podo-toast")).map(
      (card) => card.textContent
    );
    expect(left).toEqual(["유지"]);
    expect(closed).toHaveLength(3);
  });
});

describe("Tooltip island", () => {
  it("keeps the closed SSR markup (B) and opens on hover/focus with a portal bubble", async () => {
    const markup = (
      <Tooltip label={<b>도움말</b>} position="top">
        <button type="button" aria-describedby="hint">
          ?
        </button>
      </Tooltip>
    );
    await expectMountParity(markup);
    const win = page(
      <>
        {markup}
        <p id="hint">추가 설명</p>
      </>
    );
    install(win);
    await tick(win);
    const trigger = win.document.querySelector("[data-podo-mounted] button")!;
    pointer(win, trigger, "pointerenter");
    await tick(win);
    const bubble = win.document.querySelector('[role="tooltip"]')!;
    expect(bubble.parentElement).toBe(win.document.body);
    expect(bubble.querySelector("b")?.textContent).toBe("도움말");
    const ids = trigger.getAttribute("aria-describedby")!.split(" ");
    expect(ids[0]).toBe("hint");
    expect(ids.every((id) => win.document.getElementById(id))).toBe(true);
    pointer(win, trigger, "pointerleave");
    await tick(win);
    expect(win.document.querySelector('[role="tooltip"]')).toBeNull();
    trigger.dispatchEvent(new win.FocusEvent("focus"));
    await tick(win);
    expect(win.document.querySelector('[role="tooltip"]')).not.toBeNull();
  });

  it("replaces an SSR-open bubble without leaving a dangling aria-describedby", async () => {
    const win = page(
      <Tooltip label="열림" open>
        <button type="button">?</button>
      </Tooltip>
    );
    install(win);
    await tick(win);
    const bubbles = win.document.querySelectorAll('[role="tooltip"]');
    expect(bubbles).toHaveLength(1);
    expect(bubbles[0]!.parentElement).toBe(win.document.body);
    const trigger = win.document.querySelector("[data-podo-mounted] button")!;
    expect(trigger.getAttribute("aria-describedby")).toBe(bubbles[0]!.id);
  });
});

describe("Tooltip label islands and Chip triggers (T5 F3·F4)", () => {
  it("mounts islands inside a rich label and lets configure reach them", async () => {
    const win = page(
      <Tooltip id="tip" label={<Chip id="label-chip">라벨 칩</Chip>}>
        <button type="button">?</button>
      </Tooltip>
    );
    install(win);
    await tick(win);
    clientOf(win).configure("label-chip", { theme: "outline" });
    await tick(win);
    pointer(win, win.document.querySelector("[data-podo-mounted] button")!, "pointerenter");
    await tick(win);
    const chip = win.document.querySelector('[role="tooltip"] .podo-chip');
    expect(chip?.textContent).toBe("라벨 칩");
    expect(chip?.getAttribute("data-theme")).toBe("outline");
  });

  it("waits for a deferred island inside the label before mounting the Tooltip (V7-2)", async () => {
    const markup = (
      <Tooltip
        label={
          <DatePicker id="label-dp" name="d" disable={[(date: Date) => date.getDay() === 0]} />
        }
      >
        <button type="button">?</button>
      </Tooltip>
    );
    const win = page(markup);
    install(win);
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
    clientOf(win).configure("label-dp", { disable: [(date: Date) => date.getDay() === 0] });
    await tick(win);
    expect(win.document.querySelectorAll("[data-podo-mounted]")).toHaveLength(1);
  });

  it("keeps one copy of label islands for an SSR-open bubble", async () => {
    const win = page(
      <Tooltip label={<Chip id="open-chip">열린 칩</Chip>} open portal={false}>
        <button type="button">?</button>
      </Tooltip>
    );
    install(win);
    await tick(win);
    clientOf(win).configure("open-chip", { selected: true });
    await tick(win);
    const chips = win.document.querySelectorAll(".podo-chip");
    expect(chips).toHaveLength(1);
    expect(chips[0]!.getAttribute("aria-pressed")).toBe("true");
  });

  it("connects an open Tooltip to a Chip trigger before and after mount", async () => {
    const markup = (
      <>
        <Tooltip label="칩 설명" open portal={false}>
          <Chip aria-describedby="hint">칩</Chip>
        </Tooltip>
        <p id="hint">추가 설명</p>
      </>
    );
    const ssr = new JSDOM(renderToString(markup)).window.document;
    const ssrIds = ssr.querySelector(".podo-chip")!.getAttribute("aria-describedby")!.split(" ");
    expect(ssrIds[0]).toBe("hint");
    expect(ssr.getElementById(ssrIds[1]!)?.getAttribute("role")).toBe("tooltip");

    const win = page(markup);
    install(win);
    await tick(win);
    const chip = win.document.querySelector("[data-podo-mounted] .podo-chip")!;
    const ids = chip.getAttribute("aria-describedby")!.split(" ");
    expect(ids[0]).toBe("hint");
    expect(ids).toHaveLength(2);
    expect(win.document.getElementById(ids[1]!)?.getAttribute("role")).toBe("tooltip");
    expect(win.document.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
  });
});

// 배열로 넘겨요 — Fragment로 감싸기는 지원 범위 밖이에요(React는 선택 열을 안 만들지만
// Hono는 마운트 때 Fragment 경계가 사라져 달라질 수 있어요, docs/hono-parity.md §1.4).
const tableBody = [
  <thead>
    <tr>
      <th>이름</th>
    </tr>
  </thead>,
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
    <tr>
      <td>라</td>
    </tr>
  </tbody>,
];

describe("Table island", () => {
  it("selects rows, all, and drag ranges with podo:selection-change", async () => {
    await expectMountParity(
      <Table checkbox defaultSelected={[1]}>
        {tableBody}
      </Table>
    );
    const win = page(<Table checkbox>{tableBody}</Table>);
    const changes = collect(win, "podo:selection-change");
    install(win);
    await tick(win);
    const rows = () => Array.from(win.document.querySelectorAll<HTMLElement>("tbody tr"));
    rows()[1]!.click();
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [1] });
    expect(rows()[1]!.getAttribute("data-selected")).toBe("true");

    win.document.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!.click();
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [0, 1, 3] });
    win.document.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!.click();
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [] });

    const checkCell = (index: number) => rows()[index]!.querySelector(".podo-table__check")!;
    pointer(win, checkCell(0), "pointerdown", { button: 0 });
    await tick(win);
    pointer(win, checkCell(1), "pointerenter", { buttons: 1 });
    pointer(win, checkCell(3), "pointerenter", { buttons: 1 });
    await tick(win);
    win.document.dispatchEvent(new win.MouseEvent("pointerup", { bubbles: true }));
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [0, 1, 3] });
  });
});

describe("nested islands inside a Table (V7-1·V7-2)", () => {
  const nested = (deferDisable: boolean) => (
    <Table checkbox id="tbl">
      <thead>
        <tr>
          <th>칩</th>
          <th>날짜</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td id="cell">
            <Chip id="keep" removable>
              유지
            </Chip>
            <Chip id="drop" removable>
              삭제
            </Chip>
            <Tooltip label="셀 도움말">
              <button type="button" id="tip">
                ?
              </button>
            </Tooltip>
          </td>
          <td>
            <DatePicker
              id="dp"
              name="day"
              value={{ date: new Date(2026, 10, 17) }}
              {...(deferDisable ? { disable: [(date: Date) => date.getDay() === 0] } : {})}
            />
          </td>
        </tr>
      </tbody>
    </Table>
  );

  it("parses island wrappers inside cells where the SSR tree put them (C)", () => {
    const doc = new JSDOM(`<!doctype html><body>${renderToString(nested(false))}</body>`).window
      .document;
    const parents = Array.from(doc.querySelectorAll("[data-podo-island]")).map(
      (wrapper) => wrapper.parentElement?.localName
    );
    expect(parents).toEqual(["body", "td", "td", "td", "td"]);
  });

  it("mounts only the Table, routes nested events, and removes a nested chip for good", async () => {
    const win = page(nested(false));
    const removed = collect(win, "podo:remove");
    win.document.addEventListener("podo:remove", (event) => {
      if ((event as CustomEvent<{ id?: string }>).detail.id === "keep") {
        event.preventDefault();
      }
    });
    install(win);
    await tick(win);
    expect(win.document.querySelectorAll("[data-podo-mounted]")).toHaveLength(1);
    expect(win.document.querySelectorAll("[data-podo-island]")).toHaveLength(1);

    for (const id of ["keep", "drop"]) {
      win.document.querySelector<HTMLElement>(`#${id} .podo-chip__remove`)!.click();
      await tick(win);
    }
    expect(removed.map((detail) => detail.id)).toEqual(["keep", "drop"]);
    expect(win.document.getElementById("keep")).not.toBeNull();
    expect(win.document.getElementById("drop")).toBeNull();
    expect(win.document.getElementById("tip")).not.toBeNull();
    expect(win.document.querySelector("table")).not.toBeNull();

    // 부모를 다시 렌더해도 지운 칩은 돌아오지 않고, 안쪽 island도 configure를 받아요.
    clientOf(win).configure("tbl", { type: "grid" });
    clientOf(win).configure("keep", { removeLabel: "유지 칩 제거" });
    await tick(win);
    expect(win.document.querySelector("table")!.getAttribute("data-type")).toBe("grid");
    expect(win.document.getElementById("drop")).toBeNull();
    expect(win.document.querySelector("#keep .podo-chip__remove")!.getAttribute("aria-label")).toBe(
      "유지 칩 제거"
    );

    // 안쪽 Tooltip도 같은 React 소스로 동작해요.
    pointer(win, win.document.getElementById("tip")!, "pointerenter");
    await tick(win);
    expect(win.document.querySelector('[role="tooltip"]')?.textContent).toBe("셀 도움말");
  });

  it("waits for a nested DatePicker's configure before mounting the whole Table (V7-2)", async () => {
    const win = page(nested(true));
    install(win);
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
    expect(win.document.querySelectorAll("[data-podo-island]")).toHaveLength(5);
    // configure 전에는 셀 안 island도 동작하지 않아요(SSR 마크업 그대로).
    win.document.querySelector<HTMLElement>("#drop .podo-chip__remove")!.click();
    await tick(win);
    expect(win.document.getElementById("drop")).not.toBeNull();

    clientOf(win).configure("dp", { disable: [(date: Date) => date.getDay() === 0] });
    await tick(win);
    expect(win.document.querySelectorAll("[data-podo-mounted]")).toHaveLength(1);
    win.document.querySelector<HTMLElement>(".podo-dp-inputPart")!.click();
    await tick(win);
    const cell = (day: number) =>
      win.document.querySelector<HTMLButtonElement>(`button[aria-label="2026년 11월 ${day}일"]`)!;
    expect(cell(22).disabled).toBe(true);
    expect(cell(23).disabled).toBe(false);
  });
});

describe("T5 review regressions (F1·F2·F5)", () => {
  it("keeps a sibling Chip's state when an earlier Chip in the cell is removed (F1)", async () => {
    const win = page(
      <Table checkbox id="tbl">
        {[
          <thead>
            <tr>
              <th>칩</th>
            </tr>
          </thead>,
          <tbody>
            <tr>
              <td>
                <Chip removable>앞 칩</Chip>
                <Chip>뒤 칩</Chip>
              </td>
            </tr>
          </tbody>,
        ]}
      </Table>
    );
    install(win);
    await tick(win);
    const chipNamed = (label: string) =>
      Array.from(win.document.querySelectorAll(".podo-chip")).find((chip) =>
        chip.textContent?.includes(label)
      );
    (chipNamed("뒤 칩") as HTMLElement).click();
    await tick(win);
    expect(chipNamed("뒤 칩")!.getAttribute("aria-pressed")).toBe("true");
    chipNamed("앞 칩")!.querySelector<HTMLElement>(".podo-chip__remove")!.click();
    await tick(win);
    expect(chipNamed("앞 칩")).toBeUndefined();
    expect(chipNamed("뒤 칩")!.getAttribute("aria-pressed")).toBe("true");
  });

  it("treats data-disabled={false} rows as selectable after mount (F2)", async () => {
    const rows: Array<[string, Record<string, unknown>]> = [
      ["가", { "data-disabled": false }],
      ["나", { "data-disabled": true }],
      ["다", { "data-disabled": "true" }],
      ["라", {}],
    ];
    const markup = (
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
      </Table>
    );
    const win = page(markup);
    const changes = collect(win, "podo:selection-change");
    install(win);
    await tick(win);
    const body = () => Array.from(win.document.querySelectorAll<HTMLElement>("tbody tr"));
    expect(body().map((row) => row.getAttribute("data-selected"))).toEqual([
      "true",
      null,
      null,
      "true",
    ]);
    body()[0]!.click();
    body()[1]!.click();
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [3] });
    win.document.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!.click();
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [0, 3] });
  });

  it("auto-closes a flash Toast inside a deferred island after it mounts (F5)", async () => {
    const win = page(
      <Table checkbox id="tbl">
        {[
          <thead>
            <tr>
              <th>알림</th>
            </tr>
          </thead>,
          <tbody>
            <tr>
              <td>
                <Toast duration={120}>잠깐</Toast>
                <DatePicker id="dp" name="d" disable={[(date: Date) => date.getDay() === 0]} />
              </td>
            </tr>
          </tbody>,
        ]}
      </Table>
    );
    const closed = collect(win, "podo:close");
    install(win);
    await tick(win, 20);
    clientOf(win).configure("dp", { disable: [(date: Date) => date.getDay() === 0] });
    await tick(win, 40);
    const toastLeft = () => win.document.querySelector(".podo-toast") !== null;
    expect(win.document.querySelector("[data-podo-mounted]") !== null).toBe(true);
    expect(toastLeft()).toBe(true);
    await tick(win, 200);
    expect(toastLeft()).toBe(false);
    expect(closed).toHaveLength(1);
    // 부모가 다시 렌더돼도 닫힌 토스트는 돌아오지 않아요.
    clientOf(win).configure("tbl", { type: "grid" });
    await tick(win);
    expect(win.document.querySelector("table")!.getAttribute("data-type")).toBe("grid");
    expect(toastLeft()).toBe(false);
  });

  it("ignores islands inside an unused user <template> when gating the mount (R1)", async () => {
    const win = page(
      <Table checkbox id="tbl">
        {[
          <thead>
            <tr>
              <th>보관</th>
            </tr>
          </thead>,
          <tbody>
            <tr>
              <td>
                <template>
                  <DatePicker name="later" disable={[(date: Date) => date.getDay() === 0]} />
                </template>
                가
              </td>
            </tr>
          </tbody>,
        ]}
      </Table>
    );
    const changes = collect(win, "podo:selection-change");
    install(win);
    await tick(win);
    expect(win.document.querySelectorAll("[data-podo-mounted]")).toHaveLength(1);
    win.document.querySelector<HTMLElement>("tbody tr")!.click();
    await tick(win);
    expect(changes.at(-1)).toEqual({ selected: [0] });
  });

  it("drops a nested open Tooltip's SSR id from a Chip inside a closed label (R2)", async () => {
    const win = page(
      <>
        <Tooltip
          label={
            <Tooltip label="안쪽" open portal={false}>
              <Chip aria-describedby="hint">칩</Chip>
            </Tooltip>
          }
        >
          <button type="button" id="outer">
            ?
          </button>
        </Tooltip>
        <p id="hint">추가 설명</p>
      </>
    );
    const template = win.document.querySelector("template[data-podo-slot]") as HTMLTemplateElement;
    const ssrIds = template.content
      .querySelector(".podo-chip")!
      .getAttribute("aria-describedby")!
      .split(" ");
    expect(ssrIds).toHaveLength(2);
    install(win);
    await tick(win);
    pointer(win, win.document.getElementById("outer")!, "pointerenter");
    await tick(win);
    const chip = win.document.querySelector('[role="tooltip"] .podo-chip')!;
    const ids = chip.getAttribute("aria-describedby")!.split(" ");
    expect(ids[0]).toBe("hint");
    expect(ids).toHaveLength(2);
    expect(ids).not.toContain(ssrIds[1]);
    expect(ids.every((id) => win.document.getElementById(id))).toBe(true);
  });

  it("keeps user id references inside an SSR-open Tooltip label (R3)", async () => {
    const win = page(
      <Tooltip
        open
        portal={false}
        label={[<span id="name">이름</span>, <input aria-labelledby="name" />]}
      >
        <button type="button">열기</button>
      </Tooltip>
    );
    install(win);
    await tick(win);
    const input = win.document.querySelector<HTMLInputElement>("[role='tooltip'] input")!;
    expect(input.getAttribute("aria-labelledby")).toBe("name");
    expect(win.document.getElementById("name")?.textContent).toBe("이름");
  });
});
