/** @jsxImportSource hono/jsx */
//
// T3 — podo-ui/hono/client(배포와 같은 번들 설정)를 매 테스트 새 jsdom 창에 설치해
// SSR 마크업 위에서 동작을 확인해요(계획 §3.6 B·C, §4 T3).
import { renderToString } from "hono/jsx/dom/server";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { Button, Checkbox, Chip, Field, Input, Select, Switch, Textarea } from "./index.js";
import { Island } from "./island.js";
import { canonical } from "./test-utils/markup.js";
import {
  clientOf,
  collect,
  fruit,
  hidden,
  install,
  key,
  page,
  tick,
  useClientBundle,
} from "./test-utils/client-harness.js";

useClientBundle();

describe("podo-ui/hono/client — install", () => {
  it("mounts outermost islands, fires podo:ready once, and ignores a second load", async () => {
    const win = page(
      <>
        <Select id="s" options={fruit} />
        <Button>저장</Button>
      </>
    );
    const ready = collect(win, "podo:ready");
    const presses = collect(win, "podo:press");
    install(win);
    install(win);
    await tick(win);
    expect(ready).toEqual([{ entry: "client" }]);
    expect(win.document.querySelectorAll("[data-podo-mounted]")).toHaveLength(1);
    expect((win as unknown as { React?: unknown }).React).toBeUndefined();
    const podo = (win as unknown as { podo: { client: { installed: boolean; version: string } } })
      .podo;
    expect(podo.client.installed).toBe(true);
    // 리스너도 한 번만 걸려요.
    win.document.querySelector<HTMLButtonElement>("button.podo-button")!.click();
    expect(presses).toHaveLength(1);
  });

  it("keeps the SSR markup of every closed island after mount (parity B)", async () => {
    const markup = (
      <>
        <Select id="a" name="a" options={fruit} value="pear" />
        <Select multiple clearable name="m" options={fruit} values={["apple", "grape"]} />
        <Chip selected>필터</Chip>
        <Chip removable removeLabel="필터 제거">
          필터
        </Chip>
        <Switch checked label="알림" />
      </>
    );
    const ssr = new JSDOM(renderToString(markup)).window.document;
    const win = page(markup);
    install(win);
    await tick(win);
    const before = Array.from(ssr.querySelectorAll("[data-podo-island] > *"));
    const after = Array.from(win.document.querySelectorAll("[data-podo-mounted] > *"));
    expect(after).toHaveLength(before.length);
    after.forEach((element, index) => expect(canonical(element)).toBe(canonical(before[index]!)));
  });

  it("silently skips a broken island and still mounts the others (D14)", async () => {
    const good = renderToString(<Select id="ok" options={fruit} />);
    const broken = good
      .replace('data-podo-props="', 'data-podo-props="{broken')
      .replace('data-podo-id="ok"', 'data-podo-id="bad"');
    const win = page(broken + good);
    const errors: unknown[] = [];
    win.console.error = (...args: unknown[]) => errors.push(args);
    win.console.warn = (...args: unknown[]) => errors.push(args);
    install(win);
    await tick(win);
    const wrappers = win.document.querySelectorAll("[data-podo-island]");
    expect(wrappers[0]!.hasAttribute("data-podo-mounted")).toBe(false);
    expect(wrappers[1]!.hasAttribute("data-podo-mounted")).toBe(true);
    expect(errors).toEqual([]);
  });

  it("isolates a missing root or a slot conversion failure to that island (D14)", async () => {
    const empty = '<span class="podo-island" data-podo-island="Chip" data-podo-props="{}"></span>';
    const boom = renderToString(<Chip id="boom">라벨</Chip>).replace(
      "라벨",
      '<input data-boom="" value="x">'
    );
    const good = renderToString(<Chip id="good">정상</Chip>);
    const win = page(empty + boom + good);
    const valueGetter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value")!;
    Object.defineProperty(win.HTMLInputElement.prototype, "value", {
      ...valueGetter,
      get(this: HTMLInputElement) {
        if (this.hasAttribute("data-boom")) {
          throw new Error("boom");
        }
        return valueGetter.get!.call(this);
      },
    });
    const errors: unknown[] = [];
    win.console.error = (...args: unknown[]) => errors.push(args);
    win.console.warn = (...args: unknown[]) => errors.push(args);
    install(win);
    await tick(win);
    const [first, second, third] = Array.from(win.document.querySelectorAll("[data-podo-island]"));
    expect(first!.hasAttribute("data-podo-mounted")).toBe(false);
    expect(second!.hasAttribute("data-podo-mounted")).toBe(false);
    // 실패한 island는 SSR 마크업을 그대로 둬요(반쪽 트리 없음).
    expect(second!.querySelector("input[data-boom]")).not.toBeNull();
    expect(third!.hasAttribute("data-podo-mounted")).toBe(true);
    expect(errors).toEqual([]);
  });

  it("mounts islands added later through podo.client.mount", async () => {
    const win = page("");
    install(win);
    await tick(win);
    const host = win.document.createElement("div");
    host.innerHTML = renderToString(<Chip>추가</Chip>);
    win.document.body.append(host);
    (win as unknown as { podo: { client: { mount: (root: Element) => void } } }).podo.client.mount(
      host
    );
    expect(host.querySelector("[data-podo-mounted]")).not.toBeNull();
  });
});

describe("Select island", () => {
  it("opens, picks, and submits single values from an initial value (R1)", async () => {
    const win = page(<Select id="s" name="fruit" portal={false} options={fruit} value="pear" />);
    const changes = collect(win, "podo:value-change");
    install(win);
    await tick(win);
    const trigger = win.document.getElementById("s")!;
    expect(hidden(win, "fruit")).toEqual(["pear"]);

    for (const [label, value] of [
      ["사과", "apple"],
      ["포도", "grape"],
    ] as const) {
      trigger.click();
      await tick(win);
      const option = Array.from(win.document.querySelectorAll('[role="option"]')).find(
        (cell) => cell.textContent === label
      ) as HTMLElement;
      option.click();
      await tick(win);
      expect(win.document.querySelector(".podo-select__value-content")?.textContent).toBe(label);
      expect(hidden(win, "fruit")).toEqual([value]);
    }
    expect(changes).toEqual([{ value: "apple" }, { value: "grape" }]);
    expect(new win.FormData(win.document.getElementById("f") as HTMLFormElement).get("fruit")).toBe(
      "grape"
    );
    expect(win.document.querySelector('[role="listbox"]')).toBeNull();
  });

  it("keeps the field name through empty → select → clear all → reselect (multiple)", async () => {
    const win = page(<Select multiple clearable name="m" portal={false} options={fruit} />);
    const changes = collect(win, "podo:values-change");
    install(win);
    await tick(win);
    const root = win.document.querySelector(".podo-select")!;
    expect(hidden(win, "m")).toEqual([]);
    expect(root.getAttribute("data-name")).toBe("m");

    (root.querySelector('[role="combobox"]') as HTMLElement).click();
    await tick(win);
    const cells = () => Array.from(win.document.querySelectorAll<HTMLElement>('[role="option"]'));
    cells()[0]!.click();
    await tick(win);
    cells()[2]!.click();
    await tick(win);
    expect(hidden(win, "m")).toEqual(["apple", "grape"]);

    (win.document.querySelector(".podo-select__clear") as HTMLElement).click();
    await tick(win);
    expect(hidden(win, "m")).toEqual([]);
    expect(win.document.querySelector(".podo-select")!.getAttribute("data-name")).toBe("m");

    cells()[1]!.click();
    await tick(win);
    expect(hidden(win, "m")).toEqual(["pear"]);
    expect(changes).toEqual([
      { values: ["apple"] },
      { values: ["apple", "grape"] },
      { values: [] },
      { values: ["pear"] },
    ]);
  });

  it("reads hidden values changed before the script loaded (readState → default*)", async () => {
    const win = page(<Select name="fruit" options={fruit} value="pear" />);
    win.document.querySelector<HTMLInputElement>('input[name="fruit"]')!.value = "grape";
    install(win);
    await tick(win);
    expect(win.document.querySelector(".podo-select__value-content")?.textContent).toBe("포도");
    expect(hidden(win, "fruit")).toEqual(["grape"]);
  });

  it("switches to controlled mode only through configure(value)", async () => {
    const win = page(<Select id="c" name="c" portal={false} options={fruit} value="pear" />);
    install(win);
    await tick(win);
    const client = (
      win as unknown as {
        podo: { client: { configure: (id: string, props: Record<string, unknown>) => void } };
      }
    ).podo.client;
    client.configure("c", { value: "apple" });
    await tick(win);
    expect(hidden(win, "c")).toEqual(["apple"]);
    // 제어 모드에서도 사용자의 선택이 반영돼요(브리지가 저장 값을 갱신).
    win.document.getElementById("c")!.click();
    await tick(win);
    (Array.from(win.document.querySelectorAll('[role="option"]')).at(2) as HTMLElement).click();
    await tick(win);
    expect(hidden(win, "c")).toEqual(["grape"]);
    client.configure("c", { value: "pear" });
    await tick(win);
    expect(hidden(win, "c")).toEqual(["pear"]);
    // 모르는 id는 무시해요.
    client.configure("missing", { value: "apple" });
  });

  it("supports the keyboard flow and outside pointerdown", async () => {
    const win = page(<Select id="k" name="k" portal={false} options={fruit} />);
    install(win);
    await tick(win);
    const trigger = win.document.getElementById("k")!;
    trigger.focus();
    key(win, trigger, "ArrowDown");
    await tick(win);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    key(win, trigger, "ArrowDown");
    await tick(win);
    key(win, trigger, "Enter");
    await tick(win);
    expect(hidden(win, "k")).toEqual(["pear"]);
    expect(win.document.activeElement).toBe(trigger);

    key(win, trigger, "ArrowDown");
    await tick(win);
    key(win, trigger, "Escape");
    await tick(win);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    trigger.click();
    await tick(win);
    win.document.body.dispatchEvent(new win.MouseEvent("pointerdown", { bubbles: true }));
    await tick(win);
    expect(win.document.querySelector('[role="listbox"]')).toBeNull();
  });

  it("portals an initially open menu to document.body with resolvable aria-controls (B)", async () => {
    const win = page(<Select id="p" open options={fruit} value="pear" />);
    install(win);
    await tick(win);
    const trigger = win.document.getElementById("p")!;
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const listbox = win.document.getElementById(trigger.getAttribute("aria-controls")!);
    expect(listbox?.getAttribute("role")).toBe("listbox");
    expect(listbox?.closest("[data-podo-island]")).toBeNull();
    expect(listbox?.closest(".podo-select__menu-list")?.parentElement).toBe(win.document.body);
  });

  it("returns focus to the same id after mount", async () => {
    const win = page(<Select id="focus" options={fruit} />);
    win.document.getElementById("focus")!.focus();
    install(win);
    await tick(win);
    expect(win.document.activeElement?.id).toBe("focus");
    expect(win.document.querySelector("[data-podo-mounted]")).not.toBeNull();
  });
});

describe("Chip and Switch islands", () => {
  it("toggles a chip and reports podo:selected-change / podo:press", async () => {
    const win = page(<Chip id="c">필터</Chip>);
    const selected = collect(win, "podo:selected-change");
    const presses = collect(win, "podo:press");
    install(win);
    await tick(win);
    const chip = win.document.getElementById("c")!;
    expect(chip.querySelector(".podo-chip__remove")).toBeNull();
    chip.click();
    await tick(win);
    expect(win.document.getElementById("c")!.getAttribute("aria-pressed")).toBe("true");
    expect(selected).toEqual([{ selected: true }]);
    expect(presses[0]?.source).toBe("chip");
  });

  it("removes a top-level removable chip unless podo:remove is cancelled", async () => {
    const win = page(
      <>
        <Chip removable id="keep">
          유지
        </Chip>
        <Chip removable id="drop">
          삭제
        </Chip>
      </>
    );
    win.document.addEventListener("podo:remove", (event) => {
      if ((event.target as Element).querySelector("#keep")) {
        event.preventDefault();
      }
    });
    install(win);
    await tick(win);
    for (const id of ["keep", "drop"]) {
      win.document.querySelector<HTMLElement>(`#${id} .podo-chip__remove`)!.click();
      await tick(win);
    }
    expect(win.document.getElementById("keep")).not.toBeNull();
    expect(win.document.getElementById("drop")).toBeNull();
    expect(win.document.querySelectorAll("[data-podo-island]")).toHaveLength(1);
  });

  it("toggles a switch (island, T1 D-2) and keeps the Field label wiring", async () => {
    const win = page(
      <Field id="alarm" label="알림">
        <Switch />
      </Field>
    );
    const changes = collect(win, "podo:checked-change");
    install(win);
    await tick(win);
    const control = win.document.getElementById("alarm-control")!;
    expect(control.getAttribute("role")).toBe("switch");
    expect(win.document.querySelector('label[for="alarm-control"]')).not.toBeNull();
    control.click();
    await tick(win);
    expect(win.document.getElementById("alarm-control")!.getAttribute("aria-checked")).toBe("true");
    expect(changes).toEqual([{ checked: true }]);
  });
});

describe("configure ordering and ids (T3 review F1·F3·F4)", () => {
  it("lets a configure made inside the callback or event win over the bridge update (F1)", async () => {
    const win = page(
      <>
        <Select id="one" name="one" portal={false} options={fruit} value="pear" />
        <Select id="many" name="many" multiple portal={false} options={fruit} />
        <Chip id="chip">칩</Chip>
        <Switch id="sw" aria-label="스위치" />
      </>
    );
    install(win);
    await tick(win);
    const client = clientOf(win);
    client.configure("one", { value: "apple" });
    win.document.addEventListener("podo:value-change", () =>
      client.configure("one", { value: "pear" })
    );
    client.configure("many", {
      values: [],
      onValuesChange: () => client.configure("many", { values: ["apple"] }),
    });
    client.configure("chip", { selected: false });
    win.document.addEventListener("podo:selected-change", () =>
      client.configure("chip", { selected: false })
    );
    client.configure("sw", {
      checked: false,
      onCheckedChange: () => client.configure("sw", { checked: false }),
    });
    await tick(win);

    const pick = async (triggerId: string, label: string) => {
      win.document.getElementById(triggerId)!.click();
      await tick(win);
      (
        Array.from(win.document.querySelectorAll('[role="option"]')).find(
          (cell) => cell.textContent === label
        ) as HTMLElement
      ).click();
      await tick(win);
    };
    await pick("one", "포도");
    expect(hidden(win, "one")).toEqual(["pear"]);
    await pick("many", "포도");
    expect(hidden(win, "many")).toEqual(["apple"]);
    win.document.getElementById("chip")!.click();
    win.document.getElementById("sw")!.click();
    await tick(win);
    expect(win.document.getElementById("chip")!.getAttribute("aria-pressed")).toBe("false");
    expect(win.document.getElementById("sw")!.getAttribute("aria-checked")).toBe("false");
  });

  it("keeps onRemove out of toggle chips and runs a configured onRemove on removable ones (F3)", async () => {
    const win = page(
      <>
        <Chip id="toggle">토글</Chip>
        <Chip id="keep" removable>
          유지
        </Chip>
        <Chip id="drop" removable>
          삭제
        </Chip>
      </>
    );
    const removed: string[] = [];
    win.document.addEventListener("podo:remove", (event) => {
      if ((event.target as Element).querySelector("#keep")) {
        event.preventDefault();
      }
    });
    install(win);
    await tick(win);
    const client = clientOf(win);
    client.configure("toggle", { onRemove: () => removed.push("toggle") });
    client.configure("keep", { onRemove: () => removed.push("keep") });
    client.configure("drop", { onRemove: () => removed.push("drop") });
    await tick(win);
    const toggle = win.document.getElementById("toggle")!;
    expect(toggle.tagName).toBe("BUTTON");
    expect(toggle.querySelector(".podo-chip__remove")).toBeNull();
    for (const id of ["keep", "drop"]) {
      win.document.querySelector<HTMLElement>(`#${id} .podo-chip__remove`)!.click();
      await tick(win);
    }
    expect(removed).toEqual(["keep", "drop"]);
    expect(win.document.getElementById("keep")).not.toBeNull();
    expect(win.document.getElementById("drop")).toBeNull();
  });

  it("hands a removed chip's id to a new island with the same id (F4)", async () => {
    const win = page(
      <Chip id="x" removable>
        이전
      </Chip>
    );
    install(win);
    await tick(win);
    win.document.querySelector<HTMLElement>("#x .podo-chip__remove")!.click();
    await tick(win);
    expect(win.document.getElementById("x")).toBeNull();

    const host = win.document.createElement("div");
    host.innerHTML = renderToString(<Chip id="x">새 칩</Chip>);
    win.document.body.append(host);
    const client = clientOf(win);
    client.mount(host);
    client.configure("x", { selected: true });
    await tick(win);
    expect(win.document.getElementById("x")!.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("deferred islands (configure before mount)", () => {
  const deferred = (id?: string) => (
    <Island name="Select" id={id} props={{ options: fruit, name: "d", onValueChange: () => 1 }}>
      {/* SSR 루트는 같은 모양이면 충분해요. */}
      <div class="podo-select" />
    </Island>
  );

  it("waits for configure(id, fn) and then mounts with the given callback", async () => {
    const win = page(deferred("late"));
    install(win);
    await tick(win);
    const wrapper = win.document.querySelector("[data-podo-island]")!;
    expect(wrapper.hasAttribute("data-podo-defer")).toBe(true);
    expect(wrapper.hasAttribute("data-podo-mounted")).toBe(false);
    const picked: string[] = [];
    (
      win as unknown as {
        podo: { client: { configure: (id: string, props: Record<string, unknown>) => void } };
      }
    ).podo.client.configure("late", {
      onValueChange: (value: string) => picked.push(value),
      portal: false,
    });
    await tick(win);
    expect(wrapper.hasAttribute("data-podo-mounted")).toBe(true);
    (wrapper.querySelector('[role="combobox"]') as HTMLElement).click();
    await tick(win);
    (wrapper.querySelector('[role="option"]') as HTMLElement).click();
    expect(picked).toEqual(["apple"]);
  });

  it("reads form state changed while waiting for configure (F2)", async () => {
    const ssr = renderToString(<Select id="d" name="d" options={fruit} value="pear" />).replace(
      'data-podo-id="d"',
      'data-podo-id="d" data-podo-defer=""'
    );
    const win = page(ssr);
    install(win);
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
    win.document.querySelector<HTMLInputElement>('input[name="d"]')!.value = "grape";
    clientOf(win).configure("d", { portal: false });
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).not.toBeNull();
    expect(win.document.querySelector(".podo-select__value-content")?.textContent).toBe("포도");
    expect(hidden(win, "d")).toEqual(["grape"]);
    expect(new win.FormData(win.document.getElementById("f") as HTMLFormElement).get("d")).toBe(
      "grape"
    );
  });

  it("never mounts a deferred island without an id", async () => {
    const win = page(deferred());
    install(win);
    await tick(win);
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
  });
});

describe("non-island delegation", () => {
  it("emits podo:press, podo:value-change, podo:checked-change and keeps native events", async () => {
    const win = page(
      <>
        <Button id="b">저장</Button>
        <Button id="off" disabled>
          막힘
        </Button>
        <Input name="title" />
        <Textarea name="memo" />
        <Checkbox name="agree" indeterminate />
      </>
    );
    const presses = collect(win, "podo:press");
    const values = collect(win, "podo:value-change");
    const checks = collect(win, "podo:checked-change");
    install(win);
    await tick(win);
    const doc = win.document;
    doc.getElementById("b")!.click();
    doc.getElementById("off")!.click();
    expect(presses).toHaveLength(1);
    expect(presses[0]?.source).toBe("button");

    const input = doc.querySelector<HTMLInputElement>('input[name="title"]')!;
    input.value = "제목";
    input.dispatchEvent(new win.Event("input", { bubbles: true }));
    const area = doc.querySelector<HTMLTextAreaElement>('textarea[name="memo"]')!;
    area.value = "메모";
    area.dispatchEvent(new win.Event("input", { bubbles: true }));
    expect(values.map((detail) => detail.value)).toEqual(["제목", "메모"]);

    const box = doc.querySelector<HTMLInputElement>('input[name="agree"]')!;
    expect(box.indeterminate).toBe(true);
    box.click();
    expect(checks).toEqual([{ checked: true }]);
  });

  it("counts characters for an auto-counting Field (T1 D-3)", async () => {
    const win = page(
      <Field id="memo" label="메모" countMax={20}>
        <Textarea name="memo" />
      </Field>
    );
    install(win);
    await tick(win);
    const area = win.document.querySelector<HTMLTextAreaElement>("textarea")!;
    area.value = "안녕하세요";
    area.dispatchEvent(new win.Event("input", { bubbles: true }));
    expect(win.document.querySelector(".podo-field__count")?.textContent).toBe("5/20");
  });
});

describe("wrapper parsing (parity C)", () => {
  it("keeps island wrappers where the SSR tree put them (td, label)", () => {
    const html = renderToString(
      <>
        <table>
          <tbody>
            <tr>
              <td id="cell">
                <Chip>셀</Chip>
                <Select options={fruit} />
              </td>
            </tr>
          </tbody>
        </table>
        <label id="lab">
          과일 <Select options={fruit} />
        </label>
      </>
    );
    const doc = new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
    const parents = Array.from(doc.querySelectorAll("[data-podo-island]")).map(
      (wrapper) => wrapper.parentElement?.id
    );
    expect(parents).toEqual(["cell", "cell", "lab"]);
    for (const wrapper of Array.from(doc.querySelectorAll("[data-podo-island]"))) {
      expect(wrapper.childElementCount).toBe(1);
    }
  });
});
