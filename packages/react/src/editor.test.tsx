// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import Editor from "./editor/index.js";

describe("Editor", () => {
  beforeAll(() => {
    // jsdom에는 문서 편집 명령 API가 없다 — 상태 감지가 던지지 않도록 스텁
    (document as Document & { queryCommandState: (command: string) => boolean }).queryCommandState =
      () => false;
    (
      document as Document & { execCommand: (command: string, ui?: boolean, v?: string) => boolean }
    ).execCommand = () => true;
  });

  // vitest globals가 꺼져 있어 RTL 자동 cleanup이 동작하지 않는다 — 명시적으로 정리
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    // 이전 테스트의 선택 영역(분리된 노드를 가리키는 Range)이 다음 테스트의
    // 삽입 경로에 흘러들지 않도록 초기화한다
    window.getSelection()?.removeAllRanges();
  });

  /** 주어진 노드 경계를 현재 선택 영역으로 만든다 */
  const select = (setup: (range: Range) => void) => {
    const range = document.createRange();
    setup(range);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  };

  it("does not intercept Ctrl+Z originating from an input outside the editor", () => {
    const onChange = vi.fn();
    render(
      <>
        <input aria-label="바깥 입력" />
        <Editor value="<p>본문</p>" onChange={onChange} />
      </>
    );

    const outside = screen.getByLabelText("바깥 입력");
    outside.focus();

    // fireEvent는 preventDefault가 호출되면 false를 반환한다.
    const undoNotPrevented = fireEvent.keyDown(outside, { key: "z", ctrlKey: true });
    const redoNotPrevented = fireEvent.keyDown(outside, { key: "y", ctrlKey: true });
    const enterNotPrevented = fireEvent.keyDown(outside, { key: "Enter" });

    expect(undoNotPrevented).toBe(true);
    expect(redoNotPrevented).toBe(true);
    expect(enterNotPrevented).toBe(true);
    // 에디터 undo가 실행되어 onChange가 불리는 일도 없어야 한다
    expect(onChange).not.toHaveBeenCalled();
  });

  it("still undoes with Ctrl+Z when the editor has focus", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<Editor value="<p>처음</p>" onChange={onChange} />);

    const editable = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });

    // 입력을 시뮬레이션하고 히스토리 디바운스(500ms)를 흘려보낸다
    editable.innerHTML = "<p>수정됨</p>";
    fireEvent.input(editable);
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(onChange).toHaveBeenLastCalledWith("<p>수정됨</p>");

    const notPrevented = fireEvent.keyDown(editable, { key: "z", ctrlKey: true });

    // 에디터 내부에서는 여전히 단축키가 처리되고(preventDefault) 내용이 되돌아간다
    expect(notPrevented).toBe(false);
    expect(editable.innerHTML).toBe("<p>처음</p>");
    expect(onChange).toHaveBeenLastCalledWith("<p>처음</p>");
  });

  it("propagates code-view edits through onChange as they are typed", () => {
    const onChange = vi.fn();
    render(<Editor value="<p>본문</p>" onChange={onChange} />);

    // HTML 코드 보기로 전환
    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    const textarea = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });
    expect(textarea.tagName).toBe("TEXTAREA");

    fireEvent.change(textarea, { target: { value: "<p>코드에서 수정</p>" } });

    // 코드 보기 종료를 기다리지 않고 입력 즉시 controlled 소비자에 전파된다
    expect(onChange).toHaveBeenCalledWith("<p>코드에서 수정</p>");
  });

  it("exposes textbox semantics on the editable region", () => {
    render(<Editor value="<p>본문</p>" onChange={() => {}} />);

    const editable = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });
    expect(editable.getAttribute("aria-multiline")).toBe("true");
    expect(editable.getAttribute("contenteditable")).toBe("true");
  });

  it("accepts a custom ariaLabel for the editable region", () => {
    render(<Editor value="" onChange={() => {}} ariaLabel="공지 본문 편집" />);
    expect(screen.getByRole("textbox", { name: "공지 본문 편집" })).toBeTruthy();
  });

  it("runs the validator on code-view edits", () => {
    const onChange = vi.fn();
    render(
      <Editor
        value="<p>본문</p>"
        onChange={onChange}
        validator={z.string().max(5, "본문이 너무 깁니다")}
      />
    );

    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    const textarea = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });
    fireEvent.change(textarea, { target: { value: "<p>코드에서 수정한 본문</p>" } });

    // 코드 편집도 리치 텍스트 편집(handleInput)과 동일한 검증 흐름을 거친다
    expect(onChange).toHaveBeenCalledWith("<p>코드에서 수정한 본문</p>");
    expect(screen.getByText("본문이 너무 깁니다")).toBeTruthy();
  });

  it("keeps a following validation error visible past the success auto-clear window", () => {
    vi.useFakeTimers();
    render(
      <Editor
        value="<p>본문</p>"
        onChange={() => {}}
        validator={z.string().max(20, "본문이 너무 깁니다")}
      />
    );

    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    const textarea = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });

    // 성공 검증이 2초 자동 해제 타이머를 건다
    fireEvent.change(textarea, { target: { value: "<p>짧음</p>" } });
    expect(screen.getByText("검증 성공")).toBeTruthy();

    // 2초가 지나기 전에 새 검증 오류가 표시되면
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.change(textarea, {
      target: { value: "<p>스무 글자를 넘도록 길게 늘어난 본문입니다</p>" },
    });
    expect(screen.getByText("본문이 너무 깁니다")).toBeTruthy();

    // 직전 성공의 낡은 타이머가 오류 메시지를 지우면 안 된다
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByText("본문이 너무 깁니다")).toBeTruthy();
  });

  it("marks the editor border with the danger class on validation failure", () => {
    const { container } = render(
      <Editor
        value="<p>본문</p>"
        onChange={() => {}}
        validator={z.string().max(5, "너무 깁니다")}
      />
    );

    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    fireEvent.change(screen.getByRole("textbox", { name: "리치 텍스트 편집기" }), {
      target: { value: "<p>다섯 글자를 넘는 본문</p>" },
    });

    // styles.error는 맵에 없던 키 — 실패 테두리는 .podo-ed-danger가 담당한다.
    const editor = container.querySelector(".podo-ed-editor") as HTMLElement;
    expect(editor.classList.contains("podo-ed-danger")).toBe(true);
    expect(screen.getByText("너무 깁니다")).toBeTruthy();
  });

  it("maps every styles key referenced by the editor to a real class", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(here, "editor/index.tsx"), "utf8");
    const { styles: stylesMap } = await import("./editor/styles-map.js");

    const used = new Set<string>();
    for (const match of source.matchAll(/styles\.([a-zA-Z]+)/g)) {
      used.add(match[1] as string);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const key of used) {
      expect(stylesMap[key], `styles.${key}`).toMatch(/^podo-ed-/);
    }
  });

  it("renders exactly one file input, wired to the image upload flow", () => {
    const { container } = render(<Editor value="<p>본문</p>" onChange={() => {}} />);
    // 배선 없는 두 번째 숨은 파일 입력이 조용히 업로드를 삼키던 결함의 회귀 방지.
    const fileInputs = container.querySelectorAll('input[type="file"]');
    expect(fileInputs).toHaveLength(1);
    expect((fileInputs[0] as HTMLInputElement).accept).toContain("image/");
  });

  it("clamps the table context menu inside the viewport", () => {
    const { container } = render(
      <Editor value="<table><tbody><tr><td>a1</td></tr></tbody></table>" onChange={() => {}} />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.contextMenu(content.querySelector("td")!);
    const menu = document.querySelector(".podo-ed-tableContextMenu") as HTMLElement;
    expect(menu).toBeTruthy();

    // jsdom엔 레이아웃이 없으니 메뉴가 뷰포트 아래로 넘친 상황을 흉내낸다.
    menu.getBoundingClientRect = () =>
      ({
        top: 700,
        bottom: 900,
        height: 200,
        left: 10,
        right: 150,
        width: 140,
        x: 10,
        y: 700,
        toJSON: () => ({}),
      }) as DOMRect;

    // 같은 셀에 다시 열면 클램프 효과가 재실행된다.
    fireEvent.contextMenu(content.querySelector("td")!);
    const expectedTop = window.innerHeight - 200 - 8;
    expect(menu.style.top).toBe(`${expectedTop}px`);
    // 오른쪽은 넘치지 않았으므로 left는 건드리지 않는다.
    expect(parseInt(menu.style.left, 10)).toBeLessThan(window.innerWidth - 8);
  });

  it("applies an external update equal to a previously emitted value (A→B→A)", () => {
    const { rerender } = render(<Editor value="<p>본문</p>" onChange={() => {}} />);

    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    const textarea = screen.getByRole("textbox", {
      name: "리치 텍스트 편집기",
    }) as HTMLTextAreaElement;

    // 코드 보기에서 A를 방출한 뒤 외부에서 B가 반영되고,
    fireEvent.change(textarea, { target: { value: "<p>A</p>" } });
    rerender(<Editor value="<p>B</p>" onChange={() => {}} />);
    expect(textarea.value).toContain("B");

    // 과거에 방출했던 값과 같은 외부 업데이트 A도 에코가 아니라 적용돼야 한다
    rerender(<Editor value="<p>A</p>" onChange={() => {}} />);
    expect(textarea.value).toContain("A");
  });

  it("names the color swatches for assistive tech", () => {
    const { container } = render(<Editor value="<p>본문</p>" onChange={() => {}} />);

    // 색상 팔레트는 텍스트 선택이 있을 때만 열린다
    const editable = container.querySelector('[contenteditable="true"]') as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(editable);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);

    fireEvent.click(screen.getByTitle("글꼴 색상"));
    const swatch = screen.getByRole("button", { name: "글자색 #ff0000" });
    expect(swatch.getAttribute("title")).toBe("글자색 #ff0000");

    // 배경 색상 팔레트도 같은 방식으로 이름을 갖는다
    fireEvent.click(screen.getByTitle("배경 색상"));
    expect(screen.getByRole("button", { name: "배경색 #ff0000" })).toBeTruthy();
  });

  it("inserts a table from the size grid with the keyboard", () => {
    const { container } = render(<Editor value="<p>본문</p>" onChange={() => {}} />);
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    // 크기 셀은 마우스 전용 div가 아니라 포커스 가능한 button 역할이다
    fireEvent.click(screen.getByTitle("표 삽입"));
    const cell = screen.getByRole("button", { name: "2×3 표 삽입" });
    expect(cell.getAttribute("tabindex")).toBe("0");

    fireEvent.keyDown(cell, { key: "Enter" });
    const table = content.querySelector("table");
    expect(table).not.toBeNull();
    expect(table!.querySelectorAll("tr")).toHaveLength(2);
    expect(table!.querySelectorAll("tr")[0]!.querySelectorAll("td")).toHaveLength(3);

    // Space도 같은 활성화 경로를 탄다
    fireEvent.click(screen.getByTitle("표 삽입"));
    fireEvent.keyDown(screen.getByRole("button", { name: "1×1 표 삽입" }), { key: " " });
    expect(content.querySelectorAll("table")).toHaveLength(2);
  });

  it("renders distinct stable editor ids for multiple SSR instances", () => {
    const html = renderToString(
      <>
        <Editor value="<p>하나</p>" onChange={() => {}} />
        <Editor value="<p>둘</p>" onChange={() => {}} />
      </>
    );

    const ids = html.match(/id="podo-editor[^"]*"/g) ?? [];
    expect(ids).toHaveLength(2);
    // 두 인스턴스의 id가 서로 다르고, 하드코딩된 "podo-editor" 중복이 없다
    expect(new Set(ids).size).toBe(2);
    expect(ids).not.toContain('id="podo-editor"');
  });

  it("refreshes the code view when the controlled value changes externally", () => {
    const { rerender } = render(<Editor value="<p>처음</p>" onChange={() => {}} />);

    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    const textarea = screen.getByRole("textbox", {
      name: "리치 텍스트 편집기",
    }) as HTMLTextAreaElement;
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.value).toContain("처음");

    // 코드 보기가 열린 동안 외부(controlled)에서 value가 갱신되면
    rerender(<Editor value="<p>외부 갱신</p>" onChange={() => {}} />);

    // 에디터 div가 언마운트 상태여도 textarea 내용이 새 값으로 갱신된다
    expect(textarea.value).toContain("외부 갱신");
  });

  // ========== 색상 적용 ==========

  it("applies color per block instead of wrapping block elements in an inline span", () => {
    const onChange = vi.fn();
    const { container } = render(<Editor value="<h1>제목</h1><p>본문</p>" onChange={onChange} />);
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    select((range) => range.selectNodeContents(content));
    fireEvent.click(screen.getByTitle("글꼴 색상"));
    onChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "글자색 #ff0000" }));

    // 블록 태그(h1/p)가 인라인 span 안으로 들어가면 안 된다 (유효하지 않은 HTML)
    expect(content.querySelector("span h1")).toBeNull();
    expect(content.querySelector("span p")).toBeNull();

    // 각 블록 내부의 텍스트 런에만 색상 span이 적용된다
    const h1Span = content.querySelector("h1 > span") as HTMLElement;
    const pSpan = content.querySelector("p > span") as HTMLElement;
    expect(h1Span?.textContent).toBe("제목");
    expect(pSpan?.textContent).toBe("본문");
    expect(h1Span.style.getPropertyPriority("color")).toBe("important");
    expect(pSpan.style.color).toBe("rgb(255, 0, 0)");
    expect(onChange).toHaveBeenCalled();
  });

  it("styles only the selected text runs across partially selected blocks", () => {
    const { container } = render(
      <Editor value="<h1>Hello World</h1><p>Para text</p>" onChange={() => {}} />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;
    const h1 = content.querySelector("h1")!;
    const p = content.querySelector("p")!;

    select((range) => {
      range.setStart(h1.firstChild!, 6);
      range.setEnd(p.firstChild!, 4);
    });
    fireEvent.click(screen.getByTitle("배경 색상"));
    fireEvent.click(screen.getByRole("button", { name: "배경색 #ffff00" }));

    // 블록이 쪼개지거나 span에 싸이지 않고 그대로 남는다
    expect(content.querySelectorAll("h1")).toHaveLength(1);
    expect(content.querySelectorAll("p")).toHaveLength(1);
    expect(content.querySelector("span h1, span p")).toBeNull();
    expect(h1.textContent).toBe("Hello World");
    expect(p.textContent).toBe("Para text");

    // 선택된 부분 런에만 배경색이 적용된다
    expect(h1.querySelector("span")?.textContent).toBe("World");
    expect(p.querySelector("span")?.textContent).toBe("Para");
  });

  it("keeps the simple inline wrap for a selection inside one text run", () => {
    const { container } = render(<Editor value="<p>quick brown fox</p>" onChange={() => {}} />);
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;
    const p = content.querySelector("p")!;

    select((range) => {
      range.setStart(p.firstChild!, 6);
      range.setEnd(p.firstChild!, 11);
    });
    fireEvent.click(screen.getByTitle("글꼴 색상"));
    fireEvent.click(screen.getByRole("button", { name: "글자색 #ff0000" }));

    // 인라인 런 내부 선택은 기존과 같이 단일 span 래핑을 유지한다
    const spans = content.querySelectorAll("span");
    expect(spans).toHaveLength(1);
    expect(spans[0].textContent).toBe("brown");
    expect(spans[0].parentElement).toBe(p);
    expect(p.textContent).toBe("quick brown fox");
    expect(spans[0].getAttribute("style")).toContain("!important");
  });

  it("restyles the existing span instead of nesting on repeated color application", () => {
    const { container } = render(
      <Editor
        value='<p>quick <span style="color: #ff0000 !important;">brown</span> fox</p>'
        onChange={() => {}}
      />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;
    const span = content.querySelector("span")!;

    select((range) => {
      range.setStart(span.firstChild!, 0);
      range.setEnd(span.firstChild!, 5);
    });
    fireEvent.click(screen.getByTitle("글꼴 색상"));
    fireEvent.click(screen.getByRole("button", { name: "글자색 #0000ff" }));

    // 같은 런에 다시 적용하면 span-in-span 중첩 대신 기존 span을 갱신한다
    expect(content.querySelector("span span")).toBeNull();
    const spans = content.querySelectorAll("span");
    expect(spans).toHaveLength(1);
    expect(spans[0].style.color).toBe("rgb(0, 0, 255)");
    expect(spans[0].textContent).toBe("brown");
  });

  it("does not wrap table structure nodes when coloring across a table", () => {
    const { container } = render(
      <Editor
        value={"<p>머리</p><table><tbody><tr>\n<td>셀A</td>\n<td>셀B</td>\n</tr></tbody></table>"}
        onChange={() => {}}
      />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    select((range) => range.selectNodeContents(content));
    fireEvent.click(screen.getByTitle("글꼴 색상"));
    fireEvent.click(screen.getByRole("button", { name: "글자색 #ff0000" }));

    // 표 전체나 구조 노드(tr/tbody)가 span으로 감싸이면 안 된다
    expect(content.querySelector("span table")).toBeNull();
    expect(content.querySelector("table > span, tbody > span, tr > span")).toBeNull();
    expect(content.querySelectorAll("table")).toHaveLength(1);

    // 각 셀과 문단의 텍스트 런에는 색상이 적용된다
    const tds = content.querySelectorAll("td");
    expect(tds[0].querySelector("span")?.textContent).toBe("셀A");
    expect(tds[1].querySelector("span")?.textContent).toBe("셀B");
    expect(content.querySelector("p > span")?.textContent).toBe("머리");
  });

  // ========== 툴바 필터링 ==========

  it("renders only the requested toolbar items", () => {
    render(<Editor value="<p>본문</p>" onChange={() => {}} toolbar={["text-style", "link"]} />);

    expect(screen.getByTitle("굵게")).toBeTruthy();
    expect(screen.getByTitle("링크")).toBeTruthy();
    expect(screen.queryByTitle("실행 취소")).toBeNull();
    expect(screen.queryByTitle("글꼴 색상")).toBeNull();
    expect(screen.queryByTitle("표 삽입")).toBeNull();
    expect(screen.queryByTitle("이미지")).toBeNull();
    expect(screen.queryByTitle("HTML 코드보기")).toBeNull();
  });

  it("opens dropdown tools when the toolbar is filtered to a subset", () => {
    const { container } = render(
      <Editor value="<p>본문</p>" onChange={() => {}} toolbar={["paragraph", "color"]} />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    // 문단 형식 드롭다운이 열리고 옵션 선택이 에러 없이 동작한다
    fireEvent.click(screen.getByTitle("문단 형식"));
    fireEvent.click(screen.getByRole("button", { name: "제목 1" }));
    expect(screen.queryByText("제목 2")).toBeNull();

    // 색상 팔레트도 선택 영역이 있으면 열린다
    select((range) => range.selectNodeContents(content));
    fireEvent.click(screen.getByTitle("글꼴 색상"));
    expect(screen.getByRole("button", { name: "글자색 #ff0000" })).toBeTruthy();
  });

  it("keeps undo/redo keyboard shortcuts active when undo-redo is excluded from the toolbar", () => {
    vi.useFakeTimers();
    render(<Editor value="<p>처음</p>" onChange={() => {}} toolbar={["text-style"]} />);
    const editable = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });

    editable.innerHTML = "<p>수정됨</p>";
    fireEvent.input(editable);
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // 툴바에서 undo-redo 버튼을 제외해도 단축키는 편집 기본기로서 동작한다
    // (텍스트 입력 요소의 네이티브 undo와 같은 위상 — 의도된 전역 설계)
    fireEvent.keyDown(editable, { key: "z", ctrlKey: true });
    expect(editable.innerHTML).toBe("<p>처음</p>");
  });

  // ========== 높이/리사이즈 모드 ==========

  it("does not let the default minHeight override an explicit smaller height", () => {
    const { container } = render(<Editor value="" onChange={() => {}} height="150px" />);
    const box = container.querySelector(".podo-ed-editorContainer") as HTMLElement;

    expect(box.style.height).toBe("150px");
    // CSS에서 min-height가 height보다 우선한다 — 기본 200px min-height가
    // 명시된 더 작은 높이를 무력화하면 안 된다
    expect(box.style.minHeight).toBe("");
  });

  it("applies explicit min/max heights and keeps the height in code view", () => {
    const { container } = render(
      <Editor
        value="<p>본문</p>"
        onChange={() => {}}
        height="320px"
        minHeight="120px"
        maxHeight="500px"
        resizable
      />
    );
    const box = container.querySelector(".podo-ed-editorContainer") as HTMLElement;
    expect(box.style.height).toBe("320px");
    expect(box.style.minHeight).toBe("120px");
    expect(box.style.maxHeight).toBe("500px");
    expect(box.style.resize).toBe("vertical");

    // 코드 보기로 전환해도 컨테이너 높이 설정은 동일하게 유지된다
    fireEvent.click(screen.getByTitle("HTML 코드보기"));
    const boxInCode = container.querySelector(".podo-ed-editorContainer") as HTMLElement;
    expect(boxInCode.style.height).toBe("320px");
    expect(boxInCode.style.minHeight).toBe("120px");
    expect(boxInCode.style.maxHeight).toBe("500px");
    const textarea = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("lets the content define the size in contents mode without a resize grip", () => {
    const { container } = render(
      <Editor value="<p>본문</p>" onChange={() => {}} height="contents" />
    );
    const box = container.querySelector(".podo-ed-editorContainer") as HTMLElement;
    const editable = screen.getByRole("textbox", { name: "리치 텍스트 편집기" });

    expect(box.style.minHeight).toBe("100px");
    expect(box.style.resize).toBe("none");
    // 편집 영역이 내용만큼 늘어나도록 flex/overflow가 설정된다
    expect(editable.style.flex).toBe("0 0 auto");
    expect(editable.style.overflowY).toBe("visible");
  });

  // ========== 표 편집/삭제 플로우 ==========

  it("targets the right table for structural edits and fires onChange each time", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Editor
        value="<table><tbody><tr><td>a1</td></tr></tbody></table><table><tbody><tr><td>b1</td></tr></tbody></table>"
        onChange={onChange}
      />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;
    const tables = () => content.querySelectorAll("table");
    onChange.mockClear();

    // 두 번째 표의 셀에서 컨텍스트 메뉴 → 아래에 행 추가
    fireEvent.contextMenu(tables()[1].querySelector("td")!);
    fireEvent.click(screen.getByRole("button", { name: "아래에 행 추가" }));
    expect(tables()[0].querySelectorAll("tr")).toHaveLength(1);
    expect(tables()[1].querySelectorAll("tr")).toHaveLength(2);
    expect(onChange).toHaveBeenCalledTimes(1);

    // 오른쪽에 열 추가 — 대상 표의 모든 행에 적용되고 첫 표는 그대로
    fireEvent.contextMenu(tables()[1].querySelector("td")!);
    fireEvent.click(screen.getByRole("button", { name: "오른쪽에 열 추가" }));
    expect(tables()[1].querySelectorAll("tr")[0].querySelectorAll("td")).toHaveLength(2);
    expect(tables()[1].querySelectorAll("tr")[1].querySelectorAll("td")).toHaveLength(2);
    expect(tables()[0].querySelectorAll("td")).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(2);

    // 행 삭제
    fireEvent.contextMenu(tables()[1].querySelector("td")!);
    fireEvent.click(screen.getByRole("button", { name: "행 삭제" }));
    expect(tables()[1].querySelectorAll("tr")).toHaveLength(1);
    expect(onChange).toHaveBeenCalledTimes(3);

    // 표 삭제 — 두 번째 표만 사라지고 첫 표는 남는다
    fireEvent.contextMenu(tables()[1].querySelector("td")!);
    fireEvent.click(screen.getByRole("button", { name: "표 삭제" }));
    expect(tables()).toHaveLength(1);
    expect(content.textContent).toContain("a1");
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it("returns focus to the editable area after table structure edits", () => {
    const { container } = render(
      <Editor value="<table><tbody><tr><td>a1</td></tr></tbody></table>" onChange={() => {}} />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.contextMenu(content.querySelector("td")!);
    fireEvent.click(screen.getByRole("button", { name: "위에 행 추가" }));

    // 컨텍스트 메뉴로 구조를 바꾼 뒤 캐럿/포커스가 에디터로 돌아와야 한다
    expect(content.querySelectorAll("tr")).toHaveLength(2);
    expect(document.activeElement).toBe(content);
  });

  // ========== 미디어(이미지/유튜브) 편집/삭제 플로우 ==========

  it("opens the image edit popup when an image is clicked", () => {
    vi.useFakeTimers();
    const { container } = render(
      <Editor
        value='<div style="text-align: center;"><img src="a.png" alt="사진"></div><p>다음</p>'
        onChange={() => {}}
      />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.click(content.querySelector("img")!);
    act(() => {
      vi.advanceTimersByTime(60);
    });

    // 이미지 클릭으로 편집 팝업이 열려야 크기/정렬/삭제 UI에 도달할 수 있다
    expect(screen.getByRole("button", { name: "이미지 삭제" })).toBeTruthy();
  });

  it("keeps a single wrapper and handle set when the selected image is clicked again", () => {
    vi.useFakeTimers();
    const { container } = render(
      <Editor value='<p><img src="a.png" alt="사진"></p>' onChange={() => {}} />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.click(content.querySelector("img")!);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(content.querySelectorAll(".image-wrapper")).toHaveLength(1);
    expect(content.querySelectorAll(".resize-handle")).toHaveLength(8);

    // 이미 선택된 이미지를 다시 클릭 — wrapper가 중첩되거나 핸들이 중복되면 안 된다
    fireEvent.click(content.querySelector("img")!);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(content.querySelectorAll(".image-wrapper")).toHaveLength(1);
    expect(content.querySelectorAll(".resize-handle")).toHaveLength(8);
    // 편집 팝업은 그대로 열려 있다
    expect(screen.getByRole("button", { name: "이미지 삭제" })).toBeTruthy();
  });

  it("deletes an image without leaving an empty alignment wrapper", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { container } = render(
      <Editor
        value='<div style="text-align: center;"><img src="a.png" alt="사진"></div><p>다음</p>'
        onChange={onChange}
      />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.click(content.querySelector("img")!);
    act(() => {
      vi.advanceTimersByTime(60);
    });
    onChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "이미지 삭제" }));

    expect(content.querySelector("img")).toBeNull();
    // 정렬용으로 감쌌던 빈 <div style="text-align:...">가 남으면 안 된다
    expect(content.querySelector("div")).toBeNull();
    expect(content.textContent).toContain("다음");
    expect(onChange).toHaveBeenCalled();
  });

  it("opens the youtube edit popup and deletes the whole embed cleanly", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Editor
        value='<div style="text-align: center;"><div class="youtube-container" style="position: relative; width: 100%;"><iframe src="https://www.youtube.com/embed/abc123" title="YouTube video player"></iframe><div class="youtube-overlay"></div></div></div><p>다음</p>'
        onChange={onChange}
      />
    );
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.click(content.querySelector(".youtube-overlay")!);
    expect(screen.getByText("유튜브 편집")).toBeTruthy();

    onChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    // 정렬 컨테이너/래퍼까지 함께 지워지고 빈 껍데기가 남지 않는다
    expect(content.querySelector("iframe")).toBeNull();
    expect(content.querySelector(".youtube-container")).toBeNull();
    expect(content.querySelector("div")).toBeNull();
    expect(content.textContent).toContain("다음");
    expect(onChange).toHaveBeenCalled();
  });

  it("keeps the default center alignment after cancelling the youtube dropdown", () => {
    render(<Editor value="<p>본문</p>" onChange={() => {}} />);

    fireEvent.click(screen.getByTitle("유튜브"));
    expect(screen.getByTitle("가운데 정렬").className).toContain("active");

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.click(screen.getByTitle("유튜브"));

    // 취소 후 다시 열어도 최초 기본값(가운데 정렬)이 유지되어야 한다
    expect(screen.getByTitle("가운데 정렬").className).toContain("active");
  });

  it("inserts a youtube iframe with the intended embed attributes", () => {
    const onChange = vi.fn();
    const { container } = render(<Editor value="<p>본문</p>" onChange={onChange} />);
    const content = container.querySelector(".podo-ed-editorContent") as HTMLElement;

    fireEvent.click(screen.getByTitle("유튜브"));
    fireEvent.change(screen.getByPlaceholderText(/youtube\.com\/watch/), {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    onChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "삽입" }));

    const iframe = content.querySelector("iframe")!;
    expect(iframe.src).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    // 코드가 의도한 allow 목록/전체화면 허용이 그대로 실린다 (sandbox는 의도에 없음)
    expect(iframe.getAttribute("allow")).toContain("encrypted-media");
    expect(iframe.getAttribute("allowfullscreen")).toBe("true");
    expect(content.querySelector(".youtube-container")).toBeTruthy();
    expect(onChange).toHaveBeenCalled();
  });
});
