/** @jsxImportSource hono/jsx */
//
// T6 — Editor island(계획 D9·§3.6 B): 같은 client.js 번들의 React Editor, uploadUrl 어댑터,
// validator configure, 표 셀 안 Editor(중첩).
import { renderToString } from "hono/jsx/dom/server";
import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { Editor, Table } from "./index.js";
import {
  clientOf,
  collect,
  install,
  page,
  tick,
  useClientBundle,
  type Win,
} from "./test-utils/client-harness.js";

useClientBundle();

const INITIAL = "<p>안녕하세요 <b>굵게</b></p>";

/**
 * jsdom에는 편집 명령 질의(queryCommandState)가 없어요 — 브라우저 API 자리만 채워요
 * (서식 명령 동작은 T7 실브라우저가 확인해요).
 */
/** React Editor의 초기 내용 effect는 다음 프레임에 돌아요 — 프레임을 확실히 넘겨요. */
async function settle(win: Win, ms = 30) {
  await tick(win, ms);
  await new Promise((resolve) => win.requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => win.requestAnimationFrame(() => resolve(null)));
}

function editorPage(markup: Parameters<typeof page>[0]): Win {
  const win = page(markup);
  const doc = win.document as unknown as Record<string, unknown>;
  doc.queryCommandState ??= () => false;
  doc.execCommand ??= () => false;
  return win;
}

const content = (root: ParentNode) => root.querySelector<HTMLElement>(".podo-ed-editorContent")!;

/** 편집 영역 끝에 커서를 두고 내용을 바꾼 뒤 input 이벤트를 보내요(사용자 입력 흉내). */
function typeInto(win: Win, area: HTMLElement, html: string) {
  area.innerHTML = html;
  const range = win.document.createRange();
  range.selectNodeContents(area);
  range.collapse(false);
  const selection = win.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
  area.dispatchEvent(new win.Event("input", { bubbles: true }));
}

function dropImage(win: Win, area: HTMLElement) {
  const range = win.document.createRange();
  range.selectNodeContents(area);
  range.collapse(false);
  win.getSelection()!.removeAllRanges();
  win.getSelection()!.addRange(range);
  const file = new win.File(["png"], "photo.png", { type: "image/png" });
  const drop = new win.Event("drop", { bubbles: true, cancelable: true });
  Object.defineProperty(drop, "dataTransfer", { value: { files: [file] } });
  area.dispatchEvent(drop);
  return file;
}

function mockFetch(win: Win, respond: () => { ok: boolean; status: number; body: unknown }) {
  const calls: Array<{ url: string; method?: string; file: unknown }> = [];
  (win as unknown as { fetch: unknown }).fetch = vi.fn(
    async (url: string, init: { method?: string; body: FormData }) => {
      calls.push({ url, method: init.method, file: init.body.get("file") });
      const { ok, status, body } = respond();
      return { ok, status, json: async () => body };
    }
  );
  return calls;
}

describe("Editor island (B: mount semantics)", () => {
  it("keeps root·toolbar·content·textarea semantics from SSR after mount", async () => {
    const markup = (
      <Editor id="ed" name="body" value={INITIAL} ariaLabel="본문" placeholder="입력" />
    );
    const ssr = new JSDOM(renderToString(markup)).window.document;
    const win = editorPage(markup);
    install(win);
    await settle(win);
    const mounted = win.document.querySelector("[data-podo-mounted]")!;
    expect(mounted).not.toBeNull();

    const root = mounted.firstElementChild!;
    expect(root.classList.contains("podo-ed-editor")).toBe(true);
    expect(ssr.querySelector(".podo-island > .podo-ed-editor")).not.toBeNull();
    expect(root.querySelector(".podo-ed-toolbar")).not.toBeNull();
    expect(ssr.querySelector(".podo-ed-toolbar")).not.toBeNull();
    // 툴바 버튼은 마운트 뒤 React Editor가 그려요(승인 차이: SSR 툴바 자리는 비어 있어요).
    expect(root.querySelectorAll(".podo-ed-toolbar button").length).toBeGreaterThan(0);

    const before = content(ssr);
    const after = content(root);
    // 승인 차이: SSR 편집 영역은 마운트 전까지 편집할 수 없어요(T6 F1).
    expect(before.getAttribute("contenteditable")).toBe("false");
    expect(after.getAttribute("contenteditable")).toBe("true");
    for (const attribute of ["role", "aria-multiline", "aria-label", "data-placeholder"]) {
      expect(after.getAttribute(attribute), attribute).toBe(before.getAttribute(attribute));
    }
    expect(after.innerHTML).toBe(before.innerHTML);
    expect(after.closest(".podo-ed-editorContainer")).not.toBeNull();

    const textarea = (doc: ParentNode) => doc.querySelector<HTMLTextAreaElement>("textarea[name]")!;
    expect(textarea(root).name).toBe("body");
    expect(textarea(root).hidden).toBe(true);
    expect(textarea(root).value).toBe(textarea(ssr).value);
    expect(textarea(root).value).toBe(INITIAL);
  });

  it("syncs typing into the textarea and emits podo:change { content }", async () => {
    const win = editorPage(<Editor id="ed" name="body" value={INITIAL} />);
    const changes = collect(win, "podo:change");
    install(win);
    await settle(win);
    typeInto(win, content(win.document), "<p>새 내용</p>");
    await settle(win);
    expect(changes.at(-1)).toEqual({ content: "<p>새 내용</p>" });
    expect(win.document.querySelector<HTMLTextAreaElement>("textarea[name=body]")!.value).toBe(
      "<p>새 내용</p>"
    );
  });

  it("mounts once even when the client script is loaded twice", async () => {
    const win = editorPage(<Editor value={INITIAL} />);
    install(win);
    install(win);
    await settle(win);
    expect(win.document.querySelectorAll(".podo-ed-editor")).toHaveLength(1);
    expect(win.document.querySelectorAll(".podo-ed-toolbar")).toHaveLength(1);
  });
});

describe("Editor image upload", () => {
  it("posts the file to uploadUrl and inserts the returned { url }", async () => {
    const win = editorPage(<Editor id="ed" uploadUrl="/upload" value="<p>사진</p>" />);
    const calls = mockFetch(win, () => ({
      ok: true,
      status: 200,
      body: { url: "/img/photo.png" },
    }));
    install(win);
    await settle(win);
    const file = dropImage(win, content(win.document));
    await settle(win, 60);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ url: "/upload", method: "POST" });
    expect(calls[0]!.file).toBe(file);
    expect(content(win.document).querySelector("img")?.getAttribute("src")).toBe("/img/photo.png");
  });

  it("reports HTTP failures with podo:image-upload-error and inserts nothing", async () => {
    const win = editorPage(<Editor id="ed" uploadUrl="/upload" value="<p>사진</p>" />);
    mockFetch(win, () => ({ ok: false, status: 500, body: {} }));
    const errors = collect(win, "podo:image-upload-error");
    install(win);
    await settle(win);
    const file = dropImage(win, content(win.document));
    await settle(win, 60);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.file).toBe(file);
    expect(String(errors[0]!.error)).toContain("HTTP 500");
    expect(content(win.document).querySelector("img")).toBeNull();
  });

  it("prefers configure(onImageUpload) over uploadUrl", async () => {
    const win = editorPage(<Editor id="ed" uploadUrl="/upload" value="<p>사진</p>" />);
    const calls = mockFetch(win, () => ({ ok: true, status: 200, body: { url: "/never.png" } }));
    install(win);
    await settle(win);
    const handler = vi.fn(async () => ({ src: "/custom.png", alt: "직접" }));
    clientOf(win).configure("ed", { onImageUpload: handler });
    await settle(win);
    dropImage(win, content(win.document));
    await settle(win, 60);
    expect(calls).toHaveLength(0);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(content(win.document).querySelector("img")?.getAttribute("src")).toBe("/custom.png");
  });
});

describe("Editor validator (configure)", () => {
  it("defers the mount until configure(validator) and then shows the failure", async () => {
    const schema = z.string().min(20, "20자 이상 입력하세요");
    const win = editorPage(<Editor id="ed" name="body" value={INITIAL} validator={schema} />);
    install(win);
    await settle(win);
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
    // SSR 셸 그대로 — 폼 값은 그대로 제출돼요.
    expect(win.document.querySelector<HTMLTextAreaElement>("textarea[name=body]")!.value).toBe(
      INITIAL
    );

    clientOf(win).configure("ed", { validator: schema });
    await settle(win);
    expect(win.document.querySelector("[data-podo-mounted]")).not.toBeNull();
    typeInto(win, content(win.document), "<p>짧음</p>");
    await settle(win);
    expect(win.document.querySelector(".podo-ed-validator")?.textContent).toBe(
      "20자 이상 입력하세요"
    );
    expect(
      win.document.querySelector(".podo-ed-editor")!.classList.contains("podo-ed-danger")
    ).toBe(true);
  });
});

describe("Editor inside a Table cell (nested)", () => {
  it("mounts only the Table, edits in the cell, and re-renders on configure(editorId)", async () => {
    const win = editorPage(
      <Table checkbox id="tbl">
        {[
          <thead>
            <tr>
              <th>메모</th>
            </tr>
          </thead>,
          <tbody>
            <tr>
              <td>
                <Editor id="cell-ed" name="memo" value="<p>셀</p>" height="contents" />
              </td>
            </tr>
          </tbody>,
        ]}
      </Table>
    );
    const changes = collect(win, "podo:change");
    install(win);
    await settle(win);
    expect(win.document.querySelectorAll("[data-podo-mounted]")).toHaveLength(1);
    expect(win.document.querySelectorAll("[data-podo-island]")).toHaveLength(1);
    const area = () => content(win.document.querySelector("table")!);
    expect(area().innerHTML).toBe("<p>셀</p>");

    typeInto(win, area(), "<p>셀 수정</p>");
    await settle(win);
    expect(changes.at(-1)).toEqual({ content: "<p>셀 수정</p>", id: "cell-ed" });
    expect(win.document.querySelector<HTMLTextAreaElement>("textarea[name=memo]")!.value).toBe(
      "<p>셀 수정</p>"
    );

    clientOf(win).configure("cell-ed", { placeholder: "메모 입력" });
    await settle(win);
    expect(area().getAttribute("data-placeholder")).toBe("메모 입력");
    expect(area().innerHTML).toBe("<p>셀 수정</p>");
    expect(win.document.querySelector("table")).not.toBeNull();
  });
});

describe("T6 review regressions", () => {
  it("keeps a deferred Editor read-only so nothing typed before mount is lost (F1)", async () => {
    const schema = z.string();
    const win = editorPage(
      <form>
        <Editor id="solo" name="solo" value="<p>단독</p>" validator={schema} />
        <Table checkbox id="tbl">
          {[
            <thead>
              <tr>
                <th>메모</th>
              </tr>
            </thead>,
            <tbody>
              <tr>
                <td>
                  <Editor id="cell" name="cell" value="<p>셀</p>" validator={schema} />
                </td>
              </tr>
            </tbody>,
          ]}
        </Table>
      </form>
    );
    install(win);
    await settle(win);
    const areas = () =>
      Array.from(win.document.querySelectorAll<HTMLElement>(".podo-ed-editorContent"));
    expect(win.document.querySelector("[data-podo-mounted]")).toBeNull();
    expect(areas().map((area) => area.getAttribute("contenteditable"))).toEqual(["false", "false"]);
    const submitted = () =>
      Array.from(new win.FormData(win.document.querySelector("form")!).entries()).filter(
        ([key]) => key === "solo" || key === "cell"
      );
    expect(submitted()).toEqual([
      ["solo", "<p>단독</p>"],
      ["cell", "<p>셀</p>"],
    ]);

    clientOf(win).configure("solo", { validator: schema });
    clientOf(win).configure("cell", { validator: schema });
    await settle(win);
    expect(areas().map((area) => area.getAttribute("contenteditable"))).toEqual(["true", "true"]);
    expect(areas().map((area) => area.innerHTML)).toEqual(["<p>단독</p>", "<p>셀</p>"]);
  });

  it("does not toggle the row when clicking inside a cell Editor (F2)", async () => {
    const win = editorPage(
      <Table checkbox id="tbl">
        {[
          <thead>
            <tr>
              <th>메모</th>
              <th>이름</th>
            </tr>
          </thead>,
          <tbody>
            <tr>
              <td>
                <Editor id="cell-ed" value="<p>본문</p>" />
              </td>
              <td>일반 셀</td>
            </tr>
          </tbody>,
        ]}
      </Table>
    );
    const changes = collect(win, "podo:selection-change");
    install(win);
    await settle(win);
    const row = () => win.document.querySelector("tbody tr")!;
    content(row())
      .querySelector("p")!
      .dispatchEvent(new win.MouseEvent("click", { bubbles: true }));
    await settle(win);
    expect(changes).toEqual([]);
    expect(row().getAttribute("data-selected")).toBeNull();

    const plain = Array.from(row().querySelectorAll("td")).find(
      (cell) => cell.textContent === "일반 셀"
    )!;
    plain.click();
    await settle(win);
    expect(changes.at(-1)).toEqual({ selected: [0] });
  });

  it("accepts http(s)·relative·image data URLs and rejects other schemes (F3)", async () => {
    for (const [url, inserted] of [
      ["javascript:alert(1)", false],
      [" java\tscript:alert(1)", false],
      ["data:text/html;base64,PGI+", false],
      ["data:image/png;base64,iVBORw==", true],
      ["https://cdn.example.com/a.png", true],
    ] as const) {
      const win = editorPage(<Editor id="ed" uploadUrl="/upload" value="<p>사진</p>" />);
      mockFetch(win, () => ({ ok: true, status: 200, body: { url } }));
      const errors = collect(win, "podo:image-upload-error");
      install(win);
      await settle(win);
      dropImage(win, content(win.document));
      await settle(win, 60);
      expect(content(win.document).querySelector("img")?.getAttribute("src") ?? null, url).toBe(
        inserted ? url : null
      );
      expect(errors, url).toHaveLength(inserted ? 0 : 1);
    }
  });
});
