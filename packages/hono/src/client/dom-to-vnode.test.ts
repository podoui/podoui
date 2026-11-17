// @vitest-environment jsdom
//
// T1 스파이크(계획 R3): 서버가 낸 슬롯 마크업을 DOM→vnode로 바꿔, hono/jsx/dom
// 별칭으로 돌린 React 컴포넌트 소스의 children·슬롯 prop으로 넘겨도 동작하는지
// 확인한다. 이 테스트 프로젝트는 vitest.config.ts에서 react → hono/jsx/dom 별칭을
// 쓴다 — 아래 Table·Tooltip·Chip·Select는 packages/react 소스 그대로다.
import { jsx, render } from "hono/jsx/dom";
import { version as reactAlias } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chip, Select, Table, Tooltip } from "../../../react/src/index.js";
import { domToVNode, type VChild } from "./dom-to-vnode.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

function slotChildren(container: Element, name: string): VChild | VChild[] {
  const slot = container.querySelector(`[data-podo-slot="${name}"]`);
  if (!slot) {
    throw new Error(`missing slot ${name}`);
  }
  const children = domToVNode(slot.childNodes);
  return children.length === 1 ? children[0]! : children;
}

function mountFrom(ssr: string, build: (source: Element) => ReturnType<typeof jsx>): HTMLElement {
  const source = document.createElement("div");
  source.innerHTML = ssr;
  const host = document.createElement("div");
  document.body.append(host);
  render(build(source), host);
  return host;
}

describe("domToVNode → shared React source on hono/jsx/dom (spike)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("runs the React sources on hono/jsx/dom (not React)", () => {
    expect(reactAlias).toBe("19.0.0-hono-jsx");
  });

  it("drives Table checkbox row selection from converted thead/tbody rows", async () => {
    const selections: number[][] = [];
    const host = mountFrom(
      '<table data-podo-slot="children"><thead><tr><th>이름</th></tr></thead>' +
        '<tbody><tr><td>r0</td></tr><tr><td class="cell" style="color: red">r1</td></tr>' +
        '<tr data-disabled="true"><td>r2</td></tr></tbody></table>',
      (source) =>
        jsx(
          Table as never,
          { checkbox: true, onSelectionChange: (next: number[]) => selections.push(next) },
          ...([] as VChild[]).concat(slotChildren(source, "children"))
        )
    );
    await tick();
    const rows = host.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(3);
    expect(host.querySelectorAll('input[type="checkbox"]')).toHaveLength(4);
    expect(host.querySelector("td.cell")?.getAttribute("style")).toContain("color: red");

    (rows[1] as HTMLElement).click();
    await tick();
    expect(selections).toEqual([[1]]);
    expect(host.querySelectorAll("tbody tr")[1]?.getAttribute("data-selected")).toBe("true");

    // data-disabled 행은 변환 vnode의 props에서도 읽혀 선택되지 않아요.
    (host.querySelectorAll("tbody tr")[2] as HTMLElement).click();
    await tick();
    expect(selections).toEqual([[1]]);
  });

  it("clones the converted Tooltip trigger and opens on hover and focus", async () => {
    const host = mountFrom(
      '<span data-podo-slot="children"><button type="button" aria-describedby="hint">?</button></span>',
      (source) =>
        jsx(Tooltip as never, { label: "도움말", portal: false }, slotChildren(source, "children"))
    );
    await tick();
    const trigger = host.querySelector("button")!;
    expect(host.querySelector('[role="tooltip"]')).toBeNull();

    trigger.dispatchEvent(new Event("pointerenter"));
    await tick();
    const bubble = host.querySelector('[role="tooltip"]');
    expect(bubble?.textContent).toBe("도움말");
    expect(trigger.getAttribute("aria-describedby")).toBe(`hint ${bubble?.id}`);

    trigger.dispatchEvent(new Event("pointerleave"));
    await tick();
    expect(host.querySelector('[role="tooltip"]')).toBeNull();

    trigger.dispatchEvent(new FocusEvent("focus"));
    await tick();
    expect(host.querySelector('[role="tooltip"]')).not.toBeNull();
  });

  it("renders a converted Chip label and keeps the toggle working", async () => {
    const changes: boolean[] = [];
    const host = mountFrom(
      '<span class="podo-chip__label" data-podo-slot="children">필터 <b>A</b></span>',
      (source) =>
        jsx(
          Chip as never,
          { onSelectedChange: (next: boolean) => changes.push(next) },
          ...([] as VChild[]).concat(slotChildren(source, "children"))
        )
    );
    await tick();
    const chip = host.querySelector("button.podo-chip")!;
    expect(chip.querySelector(".podo-chip__label")?.innerHTML).toBe("필터 <b>A</b>");
    expect(chip.getAttribute("aria-pressed")).toBe("false");
    (chip as HTMLElement).click();
    await tick();
    expect(changes).toEqual([true]);
    expect(host.querySelector("button.podo-chip")?.getAttribute("aria-pressed")).toBe("true");
  });

  it("passes a converted Select prefix and still opens and picks", async () => {
    const picks: string[] = [];
    const host = mountFrom(
      '<span data-podo-slot="prefix"><i class="podo-icon podo-icon-search" aria-hidden="true"></i></span>',
      (source) =>
        jsx(Select as never, {
          portal: false,
          name: "fruit",
          options: [
            { value: "a", label: "사과" },
            { value: "b", label: "배" },
          ],
          prefix: slotChildren(source, "prefix"),
          onValueChange: (next: string) => picks.push(next),
        })
    );
    await tick();
    expect(host.querySelector(".podo-select__prefix i.podo-icon-search")).not.toBeNull();
    (host.querySelector('[role="combobox"]') as HTMLElement).click();
    await tick();
    (host.querySelectorAll('[role="option"]')[1] as HTMLElement).click();
    await tick();
    expect(picks).toEqual(["b"]);
    expect(host.querySelector('input[type="hidden"][name="fruit"]')?.getAttribute("value")).toBe(
      "b"
    );
  });

  it("serializes boolean ARIA the same way React does (trigger and search input)", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    render(
      jsx(Select as never, {
        searchable: true,
        portal: false,
        options: [{ value: "a", label: "사과" }],
        "aria-invalid": true,
        "aria-required": false,
      }),
      host
    );
    await tick();
    const trigger = host.querySelector('[role="combobox"]')!;
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(trigger.getAttribute("aria-required")).toBe("false");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    (trigger as HTMLElement).click();
    await tick();
    const search = host.querySelector(".podo-select__search")!;
    expect(search.getAttribute("role")).toBe("combobox");
    expect(search.getAttribute("aria-invalid")).toBe("true");
    expect(search.getAttribute("aria-required")).toBe("false");
    expect(search.getAttribute("aria-expanded")).toBe("true");
  });

  it("documents that hono/jsx/dom does not reflect defaultValue/defaultChecked", () => {
    // 그래서 공유 소스의 폼 hidden 값은 defaultValue가 아니라 value로 렌더해요.
    const host = document.createElement("div");
    render(
      jsx(
        "div",
        {},
        jsx("input", { defaultValue: "x" }),
        jsx("input", { type: "checkbox", defaultChecked: true })
      ),
      host
    );
    const [text, box] = Array.from(host.querySelectorAll("input"));
    expect(text!.value).toBe("");
    expect(box!.checked).toBe(false);
  });

  it("keeps live form state instead of server boolean attributes", () => {
    const source = document.createElement("div");
    source.innerHTML =
      '<input type="checkbox" checked=""><input value="server"><textarea>server</textarea>';
    const [box, text, area] = Array.from(source.children) as [
      HTMLInputElement,
      HTMLInputElement,
      HTMLTextAreaElement,
    ];
    box.checked = false;
    text.value = "typed";
    area.value = "typed area";
    const host = document.createElement("div");
    render(jsx("div", {}, ...domToVNode(source.childNodes)), host);
    const [nextBox, nextText, nextArea] = Array.from(host.firstElementChild!.children) as [
      HTMLInputElement,
      HTMLInputElement,
      HTMLTextAreaElement,
    ];
    expect(nextBox.checked).toBe(false);
    expect(nextText.value).toBe("typed");
    expect(nextArea.value).toBe("typed area");
  });

  it("moves a selected FileList to the new file input instead of copying its value", () => {
    const source = document.createElement("div");
    source.innerHTML = '<input type="file" name="upload" value="ignored"><span>x</span>';
    const fileInput = source.querySelector("input")!;
    // jsdom에서는 사용자가 고른 파일 목록을 만들 수 없어 선택 상태를 흉내 내요 —
    // 실제 브라우저처럼 value는 fakepath, files는 그 입력의 FileList예요.
    const selected = document.createElement("input");
    selected.type = "file";
    const files = selected.files!;
    Object.defineProperty(fileInput, "files", { get: () => files });
    Object.defineProperty(fileInput, "value", { get: () => "C:\\fakepath\\a.txt" });
    Object.defineProperty(files, "length", { value: 1 });
    const setFiles = vi.spyOn(HTMLInputElement.prototype, "files", "set");

    const host = document.createElement("div");
    // value를 복사했다면 여기서 InvalidStateError로 렌더가 멈춰요.
    expect(() => render(jsx("div", {}, ...domToVNode(source.childNodes)), host)).not.toThrow();
    const next = host.querySelector("input")!;
    expect(next.type).toBe("file");
    expect(next.getAttribute("name")).toBe("upload");
    expect(setFiles).toHaveBeenCalledWith(files);
    expect(host.querySelector("span")?.textContent).toBe("x");
    setFiles.mockRestore();
  });

  it("hands nested island wrappers to the island callback", () => {
    const source = document.createElement("div");
    source.innerHTML = '<p>앞 <span data-podo-island="Chip">x</span> 뒤</p>';
    const seen: string[] = [];
    const children = domToVNode(source.childNodes, {
      island: (wrapper) => {
        seen.push(wrapper.getAttribute("data-podo-island")!);
        return "[chip]";
      },
    });
    const host = document.createElement("div");
    render(jsx("div", {}, ...children), host);
    expect(seen).toEqual(["Chip"]);
    expect(host.textContent).toBe("앞 [chip] 뒤");
  });

  it("strips SSR-only id tokens from id reference attributes (T5 F4)", () => {
    const source = document.createElement("div");
    source.innerHTML =
      '<button aria-describedby="hint podo-tip-1">a</button><button aria-describedby="podo-tip-1">b</button>';
    const host = document.createElement("div");
    render(
      jsx("div", {}, ...domToVNode(source.childNodes, { dropIds: new Set(["podo-tip-1"]) })),
      host
    );
    const [first, second] = Array.from(host.querySelectorAll("button"));
    expect(first!.getAttribute("aria-describedby")).toBe("hint");
    expect(second!.hasAttribute("aria-describedby")).toBe(false);
  });
});
