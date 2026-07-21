// @vitest-environment jsdom

import React from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  Field,
  Icon,
  Input,
  PodoThemeProvider,
  Radio,
  Select,
  Switch,
  Table,
  Textarea,
  Toast,
  Toaster,
  Tooltip,
  Typography,
  toast,
  DatePicker,
  Editor,
  EditorView,
  usePodoTheme,
} from "./index.js";

describe("@podoui/react", () => {
  // The toast store is a module singleton — flush any leftovers between tests
  // (dismiss marks leaving, then the 180ms exit timer unmounts) so a lingering
  // toast can't bleed into the next test.
  afterEach(() => {
    vi.useFakeTimers();
    act(() => {
      toast.dismiss();
      vi.advanceTimersByTime(500);
    });
    vi.useRealTimers();
  });
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

  it("stretches to the parent width with fill", () => {
    render(<Button fill>Submit</Button>);
    expect(screen.getByRole("button", { name: "Submit" }).getAttribute("data-fill")).toBe("true");
  });

  it("renders badge themes and collapses to a dot without children", () => {
    render(
      <>
        <Badge aria-label="기본">99</Badge>
        <Badge theme="red" aria-label="빨강">
          99
        </Badge>
        <Badge theme="green" dot aria-label="온라인">
          무시되는 텍스트
        </Badge>
      </>
    );

    const natural = screen.getByLabelText("기본");
    expect(natural.className).toBe("podo-badge");
    expect(natural.getAttribute("data-theme")).toBe("natural");
    expect(natural.textContent).toBe("99");

    expect(screen.getByLabelText("빨강").getAttribute("data-theme")).toBe("red");

    const dot = screen.getByLabelText("온라인");
    expect(dot.getAttribute("data-dot")).toBe("true");
    expect(dot.textContent).toBe("");
  });

  it("renders chip themes/sizes and blocks presses while disabled", async () => {
    const user = userEvent.setup();
    let presses = 0;
    render(
      <>
        <Chip
          size="lg"
          theme="outline-weak"
          suffix={<Icon name="menu" />}
          onPress={() => (presses += 1)}
        >
          필터
        </Chip>
        <Chip disabled onPress={() => (presses += 1)}>
          비활성
        </Chip>
      </>
    );

    await user.click(screen.getByRole("button", { name: /필터/ }));
    await user.click(screen.getByRole("button", { name: "비활성" }));

    expect(presses).toBe(1);
    const chip = screen.getByRole("button", { name: /필터/ });
    expect(chip.className).toBe("podo-chip");
    expect(chip.getAttribute("data-theme")).toBe("outline-weak");
    expect(chip.getAttribute("data-size")).toBe("lg");
    // Chips toggle: the click above selected it.
    expect(chip.getAttribute("aria-pressed")).toBe("true");
    expect(chip.getAttribute("data-state")).toBe("selected");
  });

  it("toggles chip selection on click, controlled or not", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <>
        <Chip onSelectedChange={(next) => changes.push(next)}>토글</Chip>
        <Chip selected={false}>제어형</Chip>
      </>
    );

    // Uncontrolled: clicking flips the selection itself.
    const toggle = screen.getByRole("button", { name: "토글" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await user.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.getAttribute("data-state")).toBe("selected");
    await user.click(toggle);
    expect(toggle.getAttribute("data-state")).toBeNull();
    expect(changes).toEqual([true, false]);

    // Controlled: the prop wins — clicking doesn't change the look.
    const controlled = screen.getByRole("button", { name: "제어형" });
    await user.click(controlled);
    expect(controlled.getAttribute("aria-pressed")).toBe("false");
  });

  it("renders a removable chip that only removes via its X", async () => {
    const user = userEvent.setup();
    let removed = 0;
    const { container } = render(
      <Chip onRemove={() => (removed += 1)} removeLabel="딸기 제거">
        딸기
      </Chip>
    );

    const chip = container.querySelector(".podo-chip");
    // 제거형은 토글 버튼이 아니라 정적 span — X만 컨트롤이에요.
    expect(chip?.tagName).toBe("SPAN");
    expect(chip?.getAttribute("data-state")).toBe("selected");
    expect(chip?.getAttribute("data-removable")).toBe("true");
    expect(chip?.getAttribute("aria-pressed")).toBeNull();

    await user.click(within(container).getByRole("button", { name: "딸기 제거" }));
    expect(removed).toBe(1);
  });

  it("forwards the ref to the span root in removable mode and the button otherwise", () => {
    // ref 타입은 두 루트의 합집합이에요 — 제거형은 span, 토글형은 button을
    // 받아요 (createRef<union>이 그대로 통과하는 게 타입 검증).
    const removableRef = React.createRef<HTMLButtonElement | HTMLSpanElement>();
    const toggleRef = React.createRef<HTMLButtonElement | HTMLSpanElement>();
    render(
      <>
        <Chip ref={removableRef} onRemove={() => {}}>
          딸기
        </Chip>
        <Chip ref={toggleRef}>토글</Chip>
      </>
    );

    // 제거형 칩의 ref는 X 버튼이 아니라 span 루트를 받아요.
    expect(removableRef.current).toBeInstanceOf(HTMLSpanElement);
    expect(removableRef.current?.className).toBe("podo-chip");
    expect(removableRef.current?.getAttribute("data-removable")).toBe("true");
    // 토글형 칩은 그대로 button 루트를 받아요.
    expect(toggleRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(toggleRef.current?.className).toBe("podo-chip");
  });

  it("disables the removable chip and turns its X into a no-op", async () => {
    const user = userEvent.setup();
    let removed = 0;
    const { container } = render(
      <Chip disabled onRemove={() => (removed += 1)} removeLabel="잠긴 딸기 제거">
        잠긴 딸기
      </Chip>
    );

    // 루트는 span이라 [disabled] 속성 대신 data-disabled로 비활성을 표시해요.
    const chip = container.querySelector(".podo-chip");
    expect(chip?.tagName).toBe("SPAN");
    expect(chip?.getAttribute("data-disabled")).toBe("true");
    expect(chip?.getAttribute("data-state")).toBe("selected");

    const remove = within(container).getByRole("button", {
      name: "잠긴 딸기 제거",
    }) as HTMLButtonElement;
    expect(remove.disabled).toBe(true);
    // 실제 클릭도, 강제로 흘려보낸 click 이벤트도 onRemove를 부르지 않아요.
    await user.click(remove);
    fireEvent.click(remove);
    expect(removed).toBe(0);
  });

  it("opens the select, picks a single value, and closes", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    const { container } = render(
      <Select
        portal={false}
        placeholder="과일 선택"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        onValueChange={(next) => changes.push(next)}
      />
    );
    const q = within(container);

    const trigger = q.getByRole("combobox");
    expect(
      q.getByText("과일 선택").closest(".podo-select__value")?.getAttribute("data-placeholder")
    ).toBe("true");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await user.click(q.getByRole("option", { name: "딸기" }));

    expect(changes).toEqual(["strawberry"]);
    expect(q.queryByRole("listbox")).toBeNull();
    expect(q.getByText("딸기")).toBeDefined();
    // 선택 후 다시 열면 해당 셀이 selected로 표시돼요.
    await user.click(trigger);
    expect(q.getByRole("option", { name: "딸기" }).getAttribute("aria-selected")).toBe("true");
  });

  it("toggles multi-select values as removable chips", async () => {
    const user = userEvent.setup();
    let latest: string[] = [];
    const { container } = render(
      <Select
        multiple
        portal={false}
        placeholder="전체 과일"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        onValuesChange={(next) => {
          latest = next;
        }}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    await user.click(q.getByRole("option", { name: "딸기" }));
    await user.click(q.getByRole("option", { name: "바나나" }));
    // 다중 선택은 메뉴가 열린 채 유지돼요.
    expect(q.getByRole("listbox")).toBeDefined();
    expect(latest).toEqual(["strawberry", "banana"]);

    // 칩 X로 해제 — 메뉴 토글 없이 그 값만 빠져요.
    await user.click(q.getByRole("button", { name: "딸기 제거" }));
    expect(latest).toEqual(["banana"]);
    expect(q.getByRole("listbox")).toBeDefined();
  });

  it("activates chip-remove and clear-all with the keyboard instead of toggling the menu", async () => {
    const user = userEvent.setup();
    let latest: string[] | null = null;
    const { container } = render(
      <Select
        multiple
        clearable
        portal={false}
        placeholder="키보드 과일"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        defaultValues={["strawberry", "banana"]}
        onValuesChange={(next) => {
          latest = next;
        }}
      />
    );
    const q = within(container);

    // 칩 제거 버튼에 포커스를 두고 Enter — 버튼의 네이티브 키보드 클릭이
    // 동작해야 해요 (트리거 onKeyDown이 preventDefault로 삼키면 안 돼요).
    q.getByRole("button", { name: "딸기 제거" }).focus();
    await user.keyboard("{Enter}");
    expect(latest).toEqual(["banana"]);
    // 트리거 토글로 번져 메뉴가 열리면 안 돼요.
    expect(q.queryByRole("listbox")).toBeNull();

    // 모두 해제 버튼은 Space로도 동작해야 해요 (Space 클릭은 keyup에서 합성).
    q.getByRole("button", { name: "모두 해제" }).focus();
    await user.keyboard(" ");
    expect(latest).toEqual([]);
    expect(q.queryByRole("listbox")).toBeNull();
  });

  it("collapses chips past maxChips into a +N summary", () => {
    const options = [
      { value: "a", label: "딸기" },
      { value: "b", label: "바나나" },
      { value: "c", label: "포도" },
      { value: "d", label: "사과" },
      { value: "e", label: "오렌지" },
    ];
    const { container, rerender } = render(
      <Select multiple options={options} defaultValues={["a", "b", "c", "d", "e"]} />
    );
    const q = within(container);

    // 기본 3개까지 칩, 나머지는 +N 일반 텍스트 (해제는 메뉴에서).
    expect(q.getAllByRole("button", { name: /제거$/ })).toHaveLength(3);
    expect(q.getByText("+2").className).toBe("podo-select__chip-more");
    expect(q.getByLabelText("외 2개 선택됨")).toBeDefined();

    rerender(
      <Select multiple maxChips={5} options={options} defaultValues={["a", "b", "c", "d", "e"]} />
    );
    expect(q.getAllByRole("button", { name: /제거$/ })).toHaveLength(5);
    expect(q.queryByText("+2")).toBeNull();
  });

  it("navigates select options with the keyboard", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    const { container } = render(
      <Select
        portal={false}
        placeholder="과일 키보드"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        onValueChange={(next) => changes.push(next)}
      />
    );
    const q = within(container);

    act(() => q.getByRole("combobox").focus());
    expect(q.getByRole("combobox")).toBe(document.activeElement);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(changes).toEqual(["banana"]);
    expect(q.queryByRole("listbox")).toBeNull();

    await user.keyboard("{Enter}");
    expect(q.getByRole("listbox")).toBeDefined();
    await user.keyboard("{Escape}");
    expect(q.queryByRole("listbox")).toBeNull();
  });

  it("filters options while typing when searchable", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        searchable
        portal={false}
        placeholder="과일 선택 및 검색"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    // 검색 중에도 값 콘텐츠는 레이아웃에 남아(숨김 처리) 트리거 너비를 지켜요.
    const content = container.querySelector(".podo-select__value-content");
    expect(content?.getAttribute("data-hidden")).toBe("true");
    await user.keyboard("바나");
    expect(q.queryByRole("option", { name: "딸기" })).toBeNull();
    await user.click(q.getByRole("option", { name: "바나나" }));
    expect(q.getByText("바나나")).toBeDefined();
    expect(content?.getAttribute("data-hidden")).toBeNull();
  });

  it("hands the combobox wiring to the focused search input while searching", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        searchable
        portal={false}
        placeholder="검색 배선"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));

    // 포커스가 옮겨간 검색 입력이 콤보박스 역할과 배선을 넘겨받고,
    // 트리거는 역할을 이중으로 갖지 않아요 (ARIA combobox 패턴).
    const search = container.querySelector(".podo-select__search") as HTMLInputElement;
    expect(document.activeElement).toBe(search);
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(1);
    expect(q.getByRole("combobox")).toBe(search);
    expect(search.getAttribute("aria-expanded")).toBe("true");
    expect(search.getAttribute("aria-autocomplete")).toBe("list");
    expect(search.getAttribute("aria-controls")).toBe(q.getByRole("listbox").id);
    expect(search.getAttribute("aria-activedescendant")).toBeNull();

    // 키보드 활성 옵션을 aria-activedescendant가 따라가요.
    await user.keyboard("{ArrowDown}");
    const active = q.getByRole("option", { name: "딸기" });
    expect(active.getAttribute("data-active")).toBe("true");
    expect(search.getAttribute("aria-activedescendant")).toBe(active.id);

    // 입력에서의 Enter 선택 경로도 그대로 동작해요.
    await user.keyboard("{Enter}");
    expect(q.queryByRole("listbox")).toBeNull();
    expect(q.getByText("딸기")).toBeDefined();
    // 닫히면 트리거가 콤보박스 배선을 되찾아요.
    const trigger = q.getByRole("combobox");
    expect(trigger.className).toBe("podo-select__trigger");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("returns focus to the trigger when a searchable select closes", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        searchable
        portal={false}
        placeholder="검색 포커스"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
      />
    );
    const q = within(container);
    const trigger = container.querySelector(".podo-select__trigger") as HTMLElement;

    // 키보드 선택으로 닫힐 때: 검색 입력이 언마운트돼도 포커스가 body로
    // 떨어지지 않고 트리거로 돌아온다 (spec focusManagement).
    await user.click(trigger);
    expect((document.activeElement as HTMLElement).className).toContain("podo-select__search");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(q.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);

    // Escape로 닫힐 때도 같다.
    await user.click(trigger);
    expect((document.activeElement as HTMLElement).className).toContain("podo-select__search");
    await user.keyboard("{Escape}");
    expect(q.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps chips visible with an inline caret when searching a multi select", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        multiple
        searchable
        portal={false}
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        defaultValues={["strawberry"]}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    // 칩은 그대로 남고 커서가 칩 뒤에 인라인으로 붙어요 (react-select식).
    expect(q.getByRole("button", { name: "딸기 제거" })).toBeDefined();
    expect(container.querySelector("[data-hidden]")).toBeNull();
    expect(container.querySelector(".podo-select__search--inline")).not.toBeNull();

    await user.keyboard("바나");
    expect(q.queryByRole("option", { name: "딸기" })).toBeNull();
    await user.click(q.getByRole("option", { name: "바나나" }));
    // 다중 선택은 검색 중에도 메뉴가 열린 채 칩이 추가되고,
    // 선택하면 입력값이 초기화돼 전체 목록으로 돌아와요.
    expect(q.getByRole("button", { name: "바나나 제거" })).toBeDefined();
    expect(
      (container.querySelector(".podo-select__search--inline") as HTMLInputElement).value
    ).toBe("");
    expect(q.getByRole("option", { name: "딸기" })).toBeDefined();
  });

  it("adds and auto-selects a new option through the add row", async () => {
    const user = userEvent.setup();
    const addedOptions: string[] = [];
    let latest: string[] = [];
    const { container } = render(
      <Select
        multiple
        addable
        portal={false}
        placeholder="추가형 과일"
        addPlaceholder="과일 이름 입력"
        options={[{ value: "strawberry", label: "딸기" }]}
        onOptionAdd={(option) => addedOptions.push(option.value)}
        onValuesChange={(next) => {
          latest = next;
        }}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    await user.type(q.getByPlaceholderText("과일 이름 입력"), "멜론");
    await user.click(q.getByRole("button", { name: "추가" }));

    expect(addedOptions).toEqual(["멜론"]);
    expect(latest).toEqual(["멜론"]);
    // 추가된 옵션이 활성 셀이 돼 스크롤이 따라가요 (scrollIntoView 대상).
    expect(q.getByRole("option", { name: "멜론" }).getAttribute("data-active")).toBe("true");
  });

  it("keeps the addable row outside the listbox element", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        multiple
        addable
        portal={false}
        placeholder="추가형 구조"
        addPlaceholder="과일 이름 입력"
        options={[{ value: "strawberry", label: "딸기" }]}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    const listbox = q.getByRole("listbox");
    const addRow = container.querySelector(".podo-select__add") as HTMLElement;

    // role="listbox"의 자식은 option/group만 허용돼요 — 추가 입력줄은
    // 리스트박스 자손이 아니라 같은 메뉴 박스 안 위쪽에 렌더돼요.
    expect(listbox.className).toBe("podo-select__listbox");
    expect(listbox.contains(addRow)).toBe(false);
    expect(addRow.parentElement?.className).toBe("podo-select__menu");
    expect(addRow.parentElement).toBe(listbox.parentElement);
    expect([...listbox.children].every((cell) => cell.getAttribute("role") === "option")).toBe(
      true
    );
    // 콤보박스 배선은 리스트박스 id를 가리켜요.
    expect(q.getByRole("combobox").getAttribute("aria-controls")).toBe(listbox.id);

    // 추가 동작은 그대로예요 — 새 옵션이 리스트박스 안에 생기고 활성화돼요.
    await user.type(q.getByPlaceholderText("과일 이름 입력"), "멜론");
    await user.click(q.getByRole("button", { name: "추가" }));
    const added = q.getByRole("option", { name: "멜론" });
    expect(listbox.contains(added)).toBe(true);
    expect(q.getByRole("combobox").getAttribute("aria-activedescendant")).toBe(added.id);
    expect([...listbox.children].every((cell) => cell.getAttribute("role") === "option")).toBe(
      true
    );
  });

  it("clears every multi-select value through the clearable X", async () => {
    const user = userEvent.setup();
    let latest: string[] | null = null;
    const { container } = render(
      <Select
        multiple
        clearable
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
        defaultValues={["strawberry", "banana"]}
        onValuesChange={(next) => {
          latest = next;
        }}
      />
    );
    const q = within(container);

    await user.click(q.getByRole("button", { name: "모두 해제" }));
    expect(latest).toEqual([]);
    // 전부 해제되면 칩·해제 버튼이 사라지고 플레이스홀더로 돌아가요.
    expect(q.queryByRole("button", { name: "모두 해제" })).toBeNull();
    // 모두 해제 클릭은 메뉴 토글로 번지지 않아요.
    expect(q.queryByRole("listbox")).toBeNull();
  });

  it("renders read-only selects without the box, chevron, or chip removal", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Select
          readOnly
          defaultValue="strawberry"
          options={[{ value: "strawberry", label: "딸기" }]}
        />
        <Select
          readOnly
          multiple
          defaultValues={["strawberry"]}
          options={[{ value: "strawberry", label: "딸기" }]}
        />
      </>
    );
    const q = within(container);

    const [single] = q.getAllByRole("combobox");
    expect(single!.closest(".podo-select")?.getAttribute("data-state")).toBe("read-only");
    expect(single!.getAttribute("aria-readonly")).toBe("true");
    // 열리지 않고 체브론도 없어요.
    await user.click(single!);
    expect(q.queryByRole("listbox")).toBeNull();
    expect(container.querySelector(".podo-select__chevron")).toBeNull();
    // 다중 read-only 칩은 X 버튼 없이 값만 보여요.
    expect(q.getByText("딸기", { selector: ".podo-chip__label" })).toBeDefined();
    expect(q.queryByRole("button", { name: "딸기 제거" })).toBeNull();
  });

  it("locks a disabled multi-select's chips against removal", () => {
    const { container } = render(
      <Select
        disabled
        multiple
        defaultValues={["strawberry"]}
        options={[{ value: "strawberry", label: "딸기" }]}
      />
    );
    const q = within(container);
    // disabled 값 칩은 read-only처럼 X 없는 정적 칩이에요.
    const chip = q.getByText("딸기", { selector: ".podo-chip__label" }).closest(".podo-chip");
    expect(chip?.getAttribute("data-disabled")).toBe("true");
    expect(q.queryByRole("button", { name: "딸기 제거" })).toBeNull();
    expect(container.querySelector(".podo-chip__remove")).toBeNull();
  });

  it("portals the menu to document.body by default", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select placeholder="포탈 과일" options={[{ value: "grape-green", label: "청포도" }]} />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    // 메뉴는 루트 밖(document.body)에 떠요 — overflow 잘림 방지.
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    const menuList = document.body.querySelector(".podo-select__menu-list[data-portal]");
    expect(menuList).not.toBeNull();

    // 포탈 메뉴 안 클릭은 외부 클릭으로 닫히지 않고 정상 선택돼요.
    await user.click(within(menuList as HTMLElement).getByRole("option", { name: "청포도" }));
    expect(q.getByText("청포도")).toBeDefined();
    expect(document.body.querySelector(".podo-select__menu-list[data-portal]")).toBeNull();
  });

  it("survives SSR with defaultOpen and portals the menu after mount", () => {
    const options = [{ value: "grape", label: "포도" }];

    // renderToString은 포탈을 지원하지 않아요 — 마운트 전엔 메뉴를 그리지
    // 않아야 서버 렌더(Next.js 프리렌더)가 죽지 않아요.
    const markup = renderToString(<Select defaultOpen placeholder="SSR 과일" options={options} />);
    expect(markup).toContain("podo-select");
    expect(markup).not.toContain("podo-select__menu");

    // 클라이언트에선 마운트 직후 렌더에서 포탈 메뉴가 나타나요.
    const { container } = render(<Select defaultOpen placeholder="CSR 과일" options={options} />);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    const menuList = document.body.querySelector(".podo-select__menu-list[data-portal]");
    expect(menuList).not.toBeNull();
    expect(within(menuList as HTMLElement).getByRole("option", { name: "포도" })).toBeDefined();
  });

  it("keeps SSR aria-expanded closed until the portal menu actually mounts", () => {
    const options = [{ value: "grape", label: "포도" }];

    // SSR(portal 기본값): 메뉴는 마운트 전엔 존재하지 않아요 — aria가 없는
    // listbox를 가리키면 안 돼요 (aria-expanded=false, aria-controls 생략).
    const markup = renderToString(<Select defaultOpen placeholder="SSR 과일" options={options} />);
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).not.toContain("aria-controls");

    // portal={false}는 SSR에서도 메뉴가 인라인으로 함께 렌더되므로 기존대로
    // 열린 ARIA 상태를 유지해요.
    const inlineMarkup = renderToString(
      <Select defaultOpen portal={false} placeholder="SSR 인라인" options={options} />
    );
    expect(inlineMarkup).toContain('aria-expanded="true"');
    expect(inlineMarkup).toContain("aria-controls");
    expect(inlineMarkup).toContain('role="listbox"');

    // 클라이언트: 마운트 직후 메뉴가 나타나면서 ARIA도 함께 열려요 —
    // aria-controls는 실제로 존재하는 listbox 요소를 가리켜야 해요.
    const { container } = render(<Select defaultOpen placeholder="CSR 과일" options={options} />);
    const combo = within(container).getByRole("combobox");
    expect(combo.getAttribute("aria-expanded")).toBe("true");
    const controls = combo.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    const listbox = document.getElementById(controls!);
    expect(listbox).not.toBeNull();
    expect(listbox!.getAttribute("role")).toBe("listbox");
  });

  // jsdom은 레이아웃이 없어 포탈 배치 검증은 트리거 rect·뷰포트 높이·메뉴
  // 콘텐츠 높이(scrollHeight)를 직접 지정해요. restore로 반드시 원복합니다.
  const mockSelectGeometry = (
    root: Element,
    geometry: {
      trigger: { top: number; bottom: number; left: number; width: number };
      innerHeight: number;
      menuHeight: number;
    }
  ) => {
    const { trigger, innerHeight, menuHeight } = geometry;
    const rectSpy = vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      ...trigger,
      height: trigger.bottom - trigger.top,
      right: trigger.left + trigger.width,
      x: trigger.left,
      y: trigger.top,
      toJSON: () => ({}),
    } as DOMRect);
    const innerHeightDesc = Object.getOwnPropertyDescriptor(window, "innerHeight");
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: innerHeight,
      writable: true,
    });
    const scrollHeightDesc = Object.getOwnPropertyDescriptor(Element.prototype, "scrollHeight")!;
    Object.defineProperty(Element.prototype, "scrollHeight", {
      configurable: true,
      get(this: Element) {
        return this.classList.contains("podo-select__menu") ? menuHeight : 0;
      },
    });
    return {
      rectSpy,
      restore: () => {
        rectSpy.mockRestore();
        if (innerHeightDesc) {
          Object.defineProperty(window, "innerHeight", innerHeightDesc);
        } else {
          Reflect.deleteProperty(window, "innerHeight");
        }
        Object.defineProperty(Element.prototype, "scrollHeight", scrollHeightDesc);
      },
    };
  };

  it("flips the portal menu above the trigger when the space below runs out", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        placeholder="아래 공간 부족"
        options={[
          { value: "a", label: "사과" },
          { value: "b", label: "바나나" },
        ]}
      />
    );
    const root = container.querySelector(".podo-select") as HTMLElement;
    // 트리거가 화면 하단(top 500 / viewport 600)이라 아래엔 38px뿐이지만
    // 위엔 486px — 메뉴(300px)가 위로 뒤집혀 전부 보여야 해요.
    const { restore } = mockSelectGeometry(root, {
      trigger: { top: 500, bottom: 548, left: 20, width: 200 },
      innerHeight: 600,
      menuHeight: 300,
    });
    try {
      await user.click(within(container).getByRole("combobox"));
      const menuList = document.body.querySelector(
        ".podo-select__menu-list[data-portal]"
      ) as HTMLElement;
      // top 고정 대신 트리거 위 6px에 bottom 고정 (600 - 500 + 6).
      expect(menuList.style.top).toBe("auto");
      expect(menuList.style.bottom).toBe("106px");
      // 위 공간엔 다 들어가니 max-height 캡은 없어요.
      const menu = menuList.querySelector(".podo-select__menu") as HTMLElement;
      expect(menu.style.maxHeight).toBe("");
    } finally {
      restore();
    }
  });

  it("caps the portal menu height to the remaining space when neither side fits", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select
        placeholder="좁은 화면"
        options={Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `옵션 ${i}` }))}
      />
    );
    const root = container.querySelector(".podo-select") as HTMLElement;
    // 낮은 뷰포트(400px): 아래 238px, 위 86px — 꽉 찬 메뉴(474px)는 어느
    // 쪽도 다 못 들어가니 아래에 남기되 줄여서 내부 스크롤로 닿게 해요.
    const { rectSpy, restore } = mockSelectGeometry(root, {
      trigger: { top: 100, bottom: 148, left: 20, width: 200 },
      innerHeight: 400,
      menuHeight: 474,
    });
    try {
      await user.click(within(container).getByRole("combobox"));
      const menuList = document.body.querySelector(
        ".podo-select__menu-list[data-portal]"
      ) as HTMLElement;
      expect(menuList.style.top).toBe("148px");
      expect(menuList.style.bottom).toBe("");
      const menu = menuList.querySelector(".podo-select__menu") as HTMLElement;
      // 400 - 148(트리거 bottom) - 6(간격) - 8(가장자리 여백) = 238.
      expect(menu.style.maxHeight).toBe("238px");

      // 리사이즈로 트리거가 내려가면 닫히지 않고 위로 뒤집혀 다시 배치돼요
      // — 위 공간 286px(300 - 6 - 8)로 캡.
      rectSpy.mockReturnValue({
        top: 300,
        bottom: 348,
        left: 20,
        width: 200,
        height: 48,
        right: 220,
        x: 20,
        y: 300,
        toJSON: () => ({}),
      } as DOMRect);
      fireEvent(window, new Event("resize"));
      expect(within(menuList).getByRole("listbox")).toBeDefined();
      expect(menuList.style.top).toBe("auto");
      expect(menuList.style.bottom).toBe("106px");
      expect(menu.style.maxHeight).toBe("286px");
    } finally {
      restore();
    }
  });

  it("keeps the default downward placement when the space below suffices", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Select placeholder="아래 배치" options={[{ value: "a", label: "사과" }]} />
    );
    const root = container.querySelector(".podo-select") as HTMLElement;
    const { restore } = mockSelectGeometry(root, {
      trigger: { top: 100, bottom: 148, left: 20, width: 200 },
      innerHeight: 800,
      menuHeight: 300,
    });
    try {
      await user.click(within(container).getByRole("combobox"));
      const menuList = document.body.querySelector(
        ".podo-select__menu-list[data-portal]"
      ) as HTMLElement;
      expect(menuList.style.top).toBe("148px");
      expect(menuList.style.bottom).toBe("");
      expect(menuList.style.left).toBe("20px");
      expect(menuList.style.width).toBe("200px");
      const menu = menuList.querySelector(".podo-select__menu") as HTMLElement;
      expect(menu.style.maxHeight).toBe("");
    } finally {
      restore();
    }
  });

  it("closes the select on outside click and blocks it while disabled", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Select portal={false} placeholder="바깥 과일" options={[{ value: "a", label: "사과" }]} />
        <Select disabled placeholder="비활성" options={[]} />
      </>
    );
    const q = within(container);

    const [enabled, blocked] = q.getAllByRole("combobox");
    await user.click(enabled!);
    expect(q.getByRole("listbox")).toBeDefined();
    fireEvent.pointerDown(document.body);
    expect(q.queryByRole("listbox")).toBeNull();

    await user.click(blocked!);
    expect(q.queryByRole("listbox")).toBeNull();
  });

  it("never renders the menu for defaultOpen while disabled or read-only", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    const { container } = render(
      <>
        <Select
          defaultOpen
          disabled
          portal={false}
          placeholder="잠긴 기본 열림"
          options={[{ value: "strawberry", label: "딸기" }]}
          onValueChange={(next) => changes.push(next)}
        />
        <Select
          defaultOpen
          readOnly
          portal={false}
          placeholder="읽기전용 기본 열림"
          options={[{ value: "banana", label: "바나나" }]}
          onValueChange={(next) => changes.push(next)}
        />
      </>
    );
    const q = within(container);

    // 메뉴도 옵션도 렌더되지 않아요.
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(container.querySelector(".podo-select__menu")).toBeNull();
    const [locked, frozen] = q.getAllByRole("combobox");
    expect(locked!.getAttribute("aria-expanded")).toBe("false");
    expect(frozen!.getAttribute("aria-expanded")).toBe("false");
    expect(locked!.closest(".podo-select")?.getAttribute("data-open")).toBeNull();

    // 옵션이 있었을 자리를 클릭해도 열리지도, 콜백이 불리지도 않아요.
    await user.click(locked!);
    await user.click(frozen!);
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(changes).toEqual([]);

    // 서버 렌더(포탈 없이 인라인)에서도 메뉴 마크업이 새어 나가지 않아요.
    const markup = renderToString(
      <Select
        defaultOpen
        disabled
        portal={false}
        placeholder="SSR 잠금"
        options={[{ value: "strawberry", label: "딸기" }]}
      />
    );
    expect(markup).not.toContain("podo-select__menu");
  });

  it("closes the menu when disabled flips true while open", async () => {
    const user = userEvent.setup();
    const options = [{ value: "strawberry", label: "딸기" }];
    const { container, rerender } = render(
      <Select portal={false} placeholder="전환 과일" options={options} />
    );
    const q = within(container);

    await user.click(q.getByRole("combobox"));
    expect(q.getByRole("listbox")).toBeDefined();

    // 열린 채 disabled가 되면 메뉴가 즉시 사라져요.
    rerender(<Select portal={false} placeholder="전환 과일" options={options} disabled />);
    expect(q.queryByRole("listbox")).toBeNull();
    expect(q.getByRole("combobox").getAttribute("aria-expanded")).toBe("false");

    // 다시 활성화해도 닫힌 채예요 — 열림 상태가 몰래 살아남지 않아요.
    rerender(<Select portal={false} placeholder="전환 과일" options={options} />);
    expect(q.queryByRole("listbox")).toBeNull();
  });

  it("routes id and aria-label to the combobox element, not the wrapper", () => {
    render(
      <>
        <Field label="과일 필드">
          <Select id="fruit" placeholder="과일" options={[{ value: "a", label: "사과" }]} />
        </Field>
        <Select id="standalone" aria-label="독립 과일" options={[]} />
      </>
    );

    // Field label[for]는 레이아웃 래퍼가 아니라 combobox 요소를 가리켜요.
    const label = screen.getByText("과일 필드").closest("label") as HTMLLabelElement;
    const wired = document.getElementById("fruit") as HTMLElement;
    expect(label.htmlFor).toBe("fruit");
    expect(wired.getAttribute("role")).toBe("combobox");
    expect(wired.className).toBe("podo-select__trigger");
    expect(wired.getAttribute("aria-labelledby")).toBe(label.id);
    // 래퍼는 id 없이 레이아웃 전용으로 남아요.
    expect((wired.closest(".podo-select") as HTMLElement).id).toBe("");

    // aria-label도 combobox에 실려 접근 가능한 이름이 돼요.
    const standalone = screen.getByRole("combobox", { name: "독립 과일" });
    expect(standalone.id).toBe("standalone");
    expect(standalone.className).toBe("podo-select__trigger");
  });

  it("tracks the character count automatically and caps input at countMax", async () => {
    const user = userEvent.setup();
    render(
      <Field label="제목" countMax={5}>
        <Input aria-label="본문" defaultValue="ab" />
      </Field>
    );

    // Initial count reflects the control's defaultValue.
    expect(screen.getByText("2/5")).toBeDefined();
    await user.type(screen.getByLabelText("본문"), "cde");
    expect(screen.getByText("5/5")).toBeDefined();

    // countMax maps to the native maxLength, so extra typing is blocked.
    await user.type(screen.getByLabelText("본문"), "xyz");
    expect((screen.getByLabelText("본문") as HTMLInputElement).value).toBe("abcde");
    expect(screen.getByText("5/5")).toBeDefined();
  });

  it("keeps the counter in sync with external controlled value updates", () => {
    const { rerender } = render(
      <Field label="제목" countMax={10}>
        <Input aria-label="본문" value="ab" onChange={() => {}} />
      </Field>
    );
    expect(screen.getByText("2/10")).toBeDefined();

    // controlled 자식의 value가 외부에서 갱신돼 리렌더되면 (change 이벤트 없이)
    // 카운터도 현재 value를 따라간다 — 초기값에 머무르지 않아요.
    rerender(
      <Field label="제목" countMax={10}>
        <Input aria-label="본문" value="abcd" onChange={() => {}} />
      </Field>
    );
    expect(screen.getByText("4/10")).toBeDefined();
  });

  it("disables the wrapped control through the field's disabled prop", () => {
    render(
      <>
        <Field label="비활성 필드" disabled>
          <Input aria-label="잠긴 입력" />
        </Field>
        <Field label="예외 시도 필드" disabled>
          <Input aria-label="예외 시도 입력" disabled={false} />
        </Field>
        <Field label="자체 비활성 필드">
          <Input aria-label="자체 잠긴 입력" disabled />
        </Field>
      </>
    );

    // Field disabled는 래퍼 스타일링만이 아니라 컨트롤도 실제로 잠가요.
    const locked = screen.getByLabelText("잠긴 입력") as HTMLInputElement;
    expect(locked.disabled).toBe(true);
    expect(locked.closest(".podo-input")?.getAttribute("data-state")).toBe("disabled");
    expect(locked.closest(".podo-field")?.getAttribute("data-disabled")).toBe("true");

    // 결정: disabled Field는 컨트롤을 강제로 잠가요 — OR 의미 (childDisabled
    // || fieldDisabled, native fieldset 규약). 자식이 disabled={false}를
    // 명시해도 비활성 그룹에서 빠져나갈 수 없어요 (react/hono/native 공통).
    expect((screen.getByLabelText("예외 시도 입력") as HTMLInputElement).disabled).toBe(true);

    // Field가 disabled가 아니면 자식의 자체 disabled가 그대로예요.
    expect((screen.getByLabelText("자체 잠긴 입력") as HTMLInputElement).disabled).toBe(true);
  });

  it("propagates the field's invalid state into the wrapped control", () => {
    render(
      <>
        <Field label="오류 필드" invalid error="필수 값이에요">
          <Input aria-label="오류 입력" />
        </Field>
        <Field label="오류 텍스트영역" invalid>
          <Textarea aria-label="오류 메모" />
        </Field>
        <Field label="정상 필드">
          <Input aria-label="자체 오류 입력" invalid />
        </Field>
      </>
    );

    // Field invalid는 aria-invalid만이 아니라 컨트롤의 시각적 invalid 상태
    // (data-state)까지 강제해요 — 소비자가 Input에 invalid를 또 줄 필요가
    // 없어요 (childInvalid || fieldInvalid).
    const control = screen.getByLabelText("오류 입력") as HTMLInputElement;
    expect(control.closest(".podo-input")?.getAttribute("data-state")).toBe("invalid");
    expect(control.getAttribute("aria-invalid")).toBe("true");
    // a11y 주입분과 자식 behavior 산출분이 겹쳐도 컨트롤 하나에 하나의
    // aria-invalid="true"로 합의돼요 — 값이 충돌하는 중복 속성이 없어요.
    const errorField = control.closest(".podo-field") as HTMLElement;
    expect(errorField.querySelectorAll("[aria-invalid]")).toHaveLength(1);
    expect(errorField.querySelector("[aria-invalid]")).toBe(control);
    // 에러 문구가 aria-describedby로 연결돼요.
    expect(control.getAttribute("aria-describedby")).toBe(screen.getByText("필수 값이에요").id);

    // Textarea도 같은 배선을 타요 — data-state는 textarea 자신에 실려요.
    const memo = screen.getByLabelText("오류 메모") as HTMLTextAreaElement;
    expect(memo.getAttribute("data-state")).toBe("invalid");
    expect(memo.getAttribute("aria-invalid")).toBe("true");

    // Field가 invalid가 아니면 자식의 자체 invalid가 그대로예요.
    const own = screen.getByLabelText("자체 오류 입력") as HTMLInputElement;
    expect(own.closest(".podo-input")?.getAttribute("data-state")).toBe("invalid");
    expect(own.getAttribute("aria-invalid")).toBe("true");
  });

  it("targets the child's explicit id from the field label", () => {
    render(
      <Field label="메일 주소" helperText="회사 메일을 입력해요">
        <Input id="work-email" aria-describedby="external-hint" />
      </Field>
    );

    // clone에선 자식의 명시적 id가 이기므로 label[for]도 그 id를 따라가요.
    const label = screen.getByText("메일 주소").closest("label") as HTMLLabelElement;
    expect(label.htmlFor).toBe("work-email");
    const input = screen.getByLabelText("메일 주소") as HTMLInputElement;
    expect(input.id).toBe("work-email");
    // aria-describedby 병합은 그대로예요 — 자식의 것 뒤에 헬퍼 텍스트 id.
    const helperId = screen.getByText("회사 메일을 입력해요").id;
    expect(input.getAttribute("aria-describedby")).toBe(`external-hint ${helperId}`);
  });

  it("toggles the switch uncontrolled and respects disabled", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <>
        <Switch aria-label="알림" size="lg" onCheckedChange={(next) => changes.push(next)} />
        <Switch
          aria-label="잠김"
          disabled
          defaultChecked
          onCheckedChange={() => changes.push(false)}
        />
      </>
    );

    const toggle = screen.getByRole("switch", { name: "알림" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.getAttribute("data-state")).toBe("off");
    expect(toggle.getAttribute("data-size")).toBe("lg");

    await user.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.getAttribute("data-state")).toBe("on");

    await user.click(screen.getByRole("switch", { name: "잠김" }));
    expect(changes).toEqual([true]);
    expect(screen.getByRole("switch", { name: "잠김" }).getAttribute("data-state")).toBe("on");
  });

  it("toggles the checkbox uncontrolled and announces indeterminate as mixed", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <>
        <Checkbox label="이용약관" onCheckedChange={(next) => changes.push(next)} />
        <Checkbox aria-label="그룹 전체" indeterminate />
        <Checkbox
          aria-label="잠김"
          disabled
          defaultChecked
          onCheckedChange={() => changes.push(false)}
        />
      </>
    );

    // The label wrapper names the checkbox and clicking the text toggles it.
    const box = screen.getByRole("checkbox", { name: "이용약관" }) as HTMLInputElement;
    expect(box.getAttribute("data-state")).toBe("unchecked");
    await user.click(screen.getByText("이용약관"));
    expect(box.checked).toBe(true);
    expect(box.getAttribute("data-state")).toBe("checked");

    // indeterminate only exists as a DOM property, plus the data/aria state.
    const parent = screen.getByRole("checkbox", { name: "그룹 전체" }) as HTMLInputElement;
    expect(parent.indeterminate).toBe(true);
    expect(parent.getAttribute("data-state")).toBe("indeterminate");

    await user.click(screen.getByRole("checkbox", { name: "잠김" }));
    expect(changes).toEqual([true]);
  });

  it("keeps same-name radios exclusive and fires onCheckedChange", async () => {
    const user = userEvent.setup();
    const picks: string[] = [];
    render(
      <>
        <Radio
          name="fruit"
          label="포도"
          defaultChecked
          onCheckedChange={() => picks.push("포도")}
        />
        <Radio name="fruit" label="샤인머스캣" onCheckedChange={() => picks.push("샤인머스캣")} />
        <Radio aria-label="잠긴 라디오" disabled onCheckedChange={() => picks.push("잠김")} />
      </>
    );

    const grape = screen.getByRole("radio", { name: "포도" }) as HTMLInputElement;
    const shine = screen.getByRole("radio", { name: "샤인머스캣" }) as HTMLInputElement;
    expect(grape.checked).toBe(true);

    // The platform keeps the group exclusive — no JS state tracking involved.
    await user.click(screen.getByText("샤인머스캣"));
    expect(shine.checked).toBe(true);
    expect(grape.checked).toBe(false);
    expect(picks).toEqual(["샤인머스캣"]);

    await user.click(screen.getByRole("radio", { name: "잠긴 라디오" }));
    expect(picks).toEqual(["샤인머스캣"]);
  });

  it("scales and emphasizes the radio label with size and bold", () => {
    render(<Radio size="lg" bold label="강조 라디오" />);

    const wrap = screen.getByText("강조 라디오").closest("label");
    expect(screen.getByText("강조 라디오").className).toBe("podo-radio__text");
    expect(wrap?.getAttribute("data-size")).toBe("lg");
    expect(wrap?.getAttribute("data-bold")).toBe("true");
  });

  it("scales and emphasizes the checkbox label with size and bold", () => {
    render(<Checkbox size="lg" bold label="강조" />);

    const wrap = screen.getByText("강조").closest("label");
    expect(screen.getByText("강조").className).toBe("podo-checkbox__text");
    expect(wrap?.getAttribute("data-size")).toBe("lg");
    expect(wrap?.getAttribute("data-bold")).toBe("true");
  });

  it("names and toggles the switch through its visible label", async () => {
    const user = userEvent.setup();
    render(<Switch bold label="야간 모드" />);

    // The label wrapper names the switch and clicking the text toggles it.
    const toggle = screen.getByRole("switch", { name: "야간 모드" });
    expect(screen.getByText("야간 모드").className).toBe("podo-switch__text");
    expect(screen.getByText("야간 모드").closest("label")?.getAttribute("data-bold")).toBe("true");
    await user.click(screen.getByText("야간 모드"));
    expect(toggle.getAttribute("data-state")).toBe("on");
  });

  it("renders the textarea states and resize toggle", async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    render(
      <>
        <Textarea aria-label="메모장" resize={false} onValueChange={(v) => values.push(v)} />
        <Textarea aria-label="오류" invalid />
        <Textarea aria-label="잠긴 메모" disabled />
        <Textarea aria-label="읽기전용 메모" readOnly defaultValue="고정 값" />
      </>
    );

    const area = screen.getByLabelText("메모장");
    expect(area.tagName).toBe("TEXTAREA");
    expect(area.className).toBe("podo-textarea");
    expect(area.getAttribute("data-resize")).toBe("false");
    await user.type(area, "메모");
    expect(values.at(-1)).toBe("메모");

    expect(screen.getByLabelText("오류").getAttribute("data-state")).toBe("invalid");
    expect(screen.getByLabelText("오류").getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByLabelText("잠긴 메모").getAttribute("data-state")).toBe("disabled");

    // read-only shows the value without the box; the platform blocks edits.
    const frozen = screen.getByLabelText("읽기전용 메모") as HTMLTextAreaElement;
    expect(frozen.readOnly).toBe(true);
    expect(frozen.getAttribute("data-state")).toBe("read-only");
    await user.type(frozen, "추가");
    expect(frozen.value).toBe("고정 값");
  });

  it("wraps native table semantics with the type variant", () => {
    render(
      <Table type="horizon" aria-label="주문 목록">
        <thead>
          <tr>
            <th>주문</th>
          </tr>
        </thead>
        <tbody>
          <tr data-disabled="true">
            <td>#1024</td>
          </tr>
        </tbody>
      </Table>
    );

    const table = screen.getByRole("table", { name: "주문 목록" });
    expect(table.className).toBe("podo-table");
    expect(table.getAttribute("data-type")).toBe("horizon");
    expect(screen.getByText("#1024").closest("tr")?.getAttribute("data-disabled")).toBe("true");
  });

  it("injects the checkbox column and toggles select-all from the header", async () => {
    const user = userEvent.setup();
    const selections: number[][] = [];
    render(
      <Table
        checkbox
        defaultSelected={[0]}
        onSelectionChange={(next) => selections.push(next)}
        aria-label="선택 표"
      >
        <thead>
          <tr>
            <th>주문</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#1</td>
          </tr>
          <tr>
            <td>#2</td>
          </tr>
          <tr data-disabled="true">
            <td>#3</td>
          </tr>
        </tbody>
      </Table>
    );

    // Row 0 is preselected: its tr is marked and the header shows partial.
    expect(screen.getByText("#1").closest("tr")?.getAttribute("data-selected")).toBe("true");
    const selectAll = screen.getByRole("checkbox", { name: "전체 선택" }) as HTMLInputElement;
    expect(selectAll.indeterminate).toBe(true);
    expect((screen.getByRole("checkbox", { name: "행 3 선택" }) as HTMLInputElement).disabled).toBe(
      true
    );

    // Select-all picks every selectable row (data-disabled rows are skipped)...
    await user.click(selectAll);
    expect(selections.at(-1)).toEqual([0, 1]);
    expect(screen.getByText("#2").closest("tr")?.getAttribute("data-selected")).toBe("true");
    expect(screen.getByText("#3").closest("tr")?.getAttribute("data-selected")).toBeNull();

    // ...and clears them all on the next press.
    await user.click(selectAll);
    expect(selections.at(-1)).toEqual([]);
    expect(screen.getByText("#1").closest("tr")?.getAttribute("data-selected")).toBeNull();

    // Row boxes toggle their own row only.
    await user.click(screen.getByRole("checkbox", { name: "행 2 선택" }));
    expect(selections.at(-1)).toEqual([1]);
  });

  it("drops disabled rows from defaultSelected at initialization", () => {
    render(
      <Table checkbox defaultSelected={[0, 2]} aria-label="기본 선택 표">
        <thead>
          <tr>
            <th>주문</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>#1</td>
          </tr>
          <tr>
            <td>#2</td>
          </tr>
          <tr data-disabled="true">
            <td>#3</td>
          </tr>
        </tbody>
      </Table>
    );

    const stage = within(screen.getByRole("table", { name: "기본 선택 표" }));
    // 활성 행 0은 초기 선택을 유지하고,
    expect(stage.getByText("#1").closest("tr")?.getAttribute("data-selected")).toBe("true");
    // 비활성 행 2는 defaultSelected에 있어도 선택 없이 렌더된다 — 선택 토글·
    // 드래그·전체 선택과 같은 규칙이다.
    expect(stage.getByText("#3").closest("tr")?.getAttribute("data-selected")).toBeNull();
    const disabledBox = stage.getByRole("checkbox", { name: "행 3 선택" }) as HTMLInputElement;
    expect(disabledBox.checked).toBe(false);
    expect(disabledBox.disabled).toBe(true);
  });

  it("toggles rows on click and range-selects by dragging the checkbox column", async () => {
    const user = userEvent.setup();
    const selections: number[][] = [];
    render(
      <Table checkbox onSelectionChange={(next) => selections.push(next)} aria-label="드래그 표">
        <thead>
          <tr>
            <th>주문</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>r0</td>
          </tr>
          <tr>
            <td>r1</td>
          </tr>
          <tr data-disabled="true">
            <td>r2</td>
          </tr>
          <tr>
            <td>r3</td>
          </tr>
        </tbody>
      </Table>
    );

    const stage = within(screen.getByRole("table", { name: "드래그 표" }));

    // Clicking anywhere in a row toggles it; disabled rows ignore clicks.
    await user.click(stage.getByText("r0"));
    await user.click(stage.getByText("r0"));
    await user.click(stage.getByText("r2"));
    // The row handler defers to the checkbox itself — no double toggle.
    await user.click(stage.getByRole("checkbox", { name: "행 2 선택" }));
    expect(selections).toEqual([[0], [], [1]]);

    // Dragging along the checkbox column selects the anchor..current range
    // (skipping disabled rows); shrinking the range reverts rows.
    const cell = (name: string) => stage.getByRole("checkbox", { name }).closest("td")!;
    fireEvent.pointerDown(cell("행 1 선택"), { button: 0 });
    fireEvent.pointerOver(cell("행 4 선택"), { buttons: 1 });
    expect(selections.at(-1)).toEqual([0, 1, 3]);
    fireEvent.pointerOver(cell("행 2 선택"), { buttons: 1 });
    expect(selections.at(-1)).toEqual([0, 1]);
    fireEvent.pointerUp(cell("행 2 선택"));

    // The anchor's toggle direction rules the drag: starting on a selected
    // row turns the pass into a range deselect.
    const before = selections.length;
    fireEvent.pointerDown(cell("행 1 선택"), { button: 0 });
    fireEvent.pointerOver(cell("행 2 선택"), { buttons: 1 });
    expect(selections.at(-1)).toEqual([]);
    fireEvent.pointerUp(cell("행 2 선택"));

    // Drags cannot start from data cells.
    fireEvent.pointerDown(stage.getByText("r0"), { button: 0 });
    fireEvent.pointerOver(cell("행 4 선택"), { buttons: 1 });
    expect(selections.length).toBe(before + 1);
  });

  it("ends a checkbox drag released outside the table without eating the next click", async () => {
    const user = userEvent.setup();
    const selections: number[][] = [];
    render(
      <Table checkbox onSelectionChange={(next) => selections.push(next)} aria-label="이탈 드래그">
        <thead>
          <tr>
            <th>주문</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>r0</td>
          </tr>
          <tr>
            <td>r1</td>
          </tr>
        </tbody>
      </Table>
    );

    const stage = within(screen.getByRole("table", { name: "이탈 드래그" }));
    const cell = (name: string) => stage.getByRole("checkbox", { name }).closest("td")!;

    // Drag down the checkbox column, then release OUTSIDE the table — only
    // the document sees the pointerup.
    fireEvent.pointerDown(cell("행 1 선택"), { button: 0 });
    fireEvent.pointerOver(cell("행 2 선택"), { buttons: 1 });
    expect(selections.at(-1)).toEqual([0, 1]);
    fireEvent.pointerUp(document);
    // The user's next click comes later than the drag-end click, so let the
    // deferred dragMovedRef reset flush before clicking.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // 수정 전에는 밖에서 놓은 드래그가 dragMovedRef를 남겨서 이 클릭이
    // 통째로 삼켜졌어요 — 이제 행 0이 정상적으로 토글돼요.
    await user.click(stage.getByText("r0"));
    expect(selections.at(-1)).toEqual([1]);
  });

  it("shows the tooltip on hover/focus through a body portal", () => {
    render(
      <Tooltip label="임시 저장돼요" position="top" ordinal="second" theme="reverse">
        <button type="button">저장</button>
      </Tooltip>
    );

    const trigger = screen.getByRole("button", { name: "저장" });
    expect(screen.queryByRole("tooltip")).toBeNull();

    fireEvent.pointerEnter(trigger);
    const bubble = screen.getByRole("tooltip");
    // Portaled to document.body so overflow/stacking contexts can't clip it.
    expect(bubble.parentElement).toBe(document.body);
    expect(bubble.getAttribute("data-position")).toBe("top");
    expect(bubble.getAttribute("data-ordinal")).toBe("second");
    expect(bubble.getAttribute("data-theme")).toBe("reverse");
    expect(bubble.textContent).toContain("임시 저장돼요");
    expect(trigger.getAttribute("aria-describedby")).toBe(bubble.id);

    // Escape closes it; leaving does too.
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeDefined();
    fireEvent.blur(trigger);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders the tooltip in place when portal is off or open is forced", () => {
    const { container } = render(
      <Tooltip label="정적 말풍선" portal={false} open>
        <span hidden />
      </Tooltip>
    );

    const bubble = within(container).getByRole("tooltip");
    expect(bubble.getAttribute("data-position")).toBe("right");
    expect(bubble.getAttribute("style")).toBeNull();
  });

  it("survives SSR with a forced-open tooltip and portals it after mount", () => {
    // 서버 렌더엔 document가 없어 포탈이 불가능해요 — 말풍선은 인라인으로
    // 그대로 담겨요 (클라이언트 첫 렌더와 동일해 hydration이 어긋나지 않아요).
    const markup = renderToString(
      <Tooltip label="SSR 말풍선" open>
        <button type="button">저장</button>
      </Tooltip>
    );
    expect(markup).toContain('role="tooltip"');
    expect(markup).toContain("SSR 말풍선");

    // 클라이언트에선 마운트 후 같은 말풍선이 document.body 포탈로 옮겨가요.
    const { container } = render(
      <Tooltip label="CSR 말풍선" open>
        <button type="button">저장</button>
      </Tooltip>
    );
    const bubble = screen.getByText("CSR 말풍선").closest(".podo-tooltip") as HTMLElement;
    expect(bubble.getAttribute("role")).toBe("tooltip");
    expect(bubble.parentElement).toBe(document.body);
    expect(container.querySelector(".podo-tooltip")).toBeNull();
  });

  it("re-measures a controlled tooltip on scroll and resize instead of freezing", () => {
    render(
      <Tooltip label="고정 열림" open position="right" ordinal="second">
        <button type="button">기준</button>
      </Tooltip>
    );

    const trigger = screen.getByRole("button", { name: "기준" });
    const bubble = screen.getByText("고정 열림").closest(".podo-tooltip") as HTMLElement;
    const rect = (top: number, left: number) =>
      ({
        top,
        bottom: top + 40,
        left,
        right: left + 100,
        width: 100,
        height: 40,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;

    // controlled(open prop)는 스크롤로 닫을 수 없어요 — 트리거가 움직이면
    // 고정 좌표를 다시 재야 해요 (말풍선 rect는 jsdom 기본 0 크기).
    const spy = vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(rect(100, 20));
    fireEvent.scroll(window);
    // ordinal=second/right: top = t.top + t.height/2 - 0/2, left = t.right.
    expect(bubble.style.top).toBe("120px");
    expect(bubble.style.left).toBe("120px");

    spy.mockReturnValue(rect(300, 40));
    fireEvent(window, new Event("resize"));
    expect(bubble.style.top).toBe("320px");
    expect(bubble.style.left).toBe("140px");
    spy.mockRestore();
  });

  it("renders toast states and composition slots", () => {
    let closed = 0;
    render(
      <>
        <Toast
          state="danger"
          caption="다시 시도해 주세요"
          suffixText="실행 취소"
          onClose={() => (closed += 1)}
        >
          저장에 실패했어요
        </Toast>
        <Toast prefix={<Icon name="menu" />}>기본 안내예요</Toast>
      </>
    );

    // danger interrupts; everything else politely waits.
    const danger = screen.getByRole("alert");
    expect(danger.className).toBe("podo-toast");
    expect(danger.getAttribute("data-state")).toBe("danger");
    expect(screen.getByText("다시 시도해 주세요").className).toBe("podo-toast__caption");
    expect(screen.getByText("실행 취소").className).toBe("podo-toast__suffix-text");
    expect(screen.getByRole("status").getAttribute("data-state")).toBe("normal");

    fireEvent.click(screen.getByRole("button", { name: "닫기" }));
    expect(closed).toBe(1);
  });

  it("stacks toasts, auto-dismisses, and keeps manual ones until closed", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Toaster duration={1000} max={2} />);
      const stage = within(container);

      act(() => {
        toast("하나");
        toast.success("둘", { duration: 5000 });
      });
      expect(stage.getByText("하나")).toBeDefined();
      expect(stage.getByText("둘").closest(".podo-toast")?.getAttribute("data-state")).toBe(
        "success"
      );

      // Overflow evicts the oldest: it lingers through the 180ms leave
      // animation (data-leaving), then unmounts for good (max 2).
      act(() => {
        toast.danger("셋", { manual: true });
      });
      expect(stage.getByText("하나").closest(".podo-toast")?.getAttribute("data-leaving")).toBe(
        "true"
      );
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(stage.queryByText("하나")).toBeNull();

      // "둘" auto-dismisses after its own duration; manual "셋" survives.
      act(() => {
        vi.advanceTimersByTime(5300);
      });
      expect(stage.queryByText("둘")).toBeNull();
      expect(stage.getByText("셋")).toBeDefined();

      fireEvent.click(stage.getByRole("button", { name: "닫기" }));
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(stage.queryByText("셋")).toBeNull();
    } finally {
      act(() => {
        toast.dismiss();
        vi.advanceTimersByTime(300);
      });
      vi.useRealTimers();
    }
  });

  it("stacks newest-first and fans the stack out on hover", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Toaster max={3} />);
      const stage = within(container);
      const toaster = container.querySelector(".podo-toaster") as HTMLElement;

      act(() => {
        toast("하나", { manual: true });
        toast("둘", { manual: true });
        toast("셋", { manual: true });
      });

      // Rendered newest-first: 셋 is stack 0 (front), 하나 is stack 2 (back).
      const cards = [...toaster.querySelectorAll(".podo-toast")];
      expect(cards.map((c) => c.textContent)).toEqual(["셋", "둘", "하나"]);
      expect(stage.getByText("셋").closest(".podo-toast")?.getAttribute("data-stack")).toBe("0");
      expect(stage.getByText("하나").closest(".podo-toast")?.getAttribute("data-stack")).toBe("2");

      // Collapsed by default; hovering fans the stack out, leaving restores it.
      expect(toaster.getAttribute("data-expanded")).toBeNull();
      fireEvent.pointerEnter(toaster);
      expect(toaster.getAttribute("data-expanded")).toBe("true");
      fireEvent.pointerLeave(toaster);
      expect(toaster.getAttribute("data-expanded")).toBeNull();
    } finally {
      act(() => {
        toast.dismiss();
        vi.advanceTimersByTime(300);
      });
      vi.useRealTimers();
    }
  });

  it("pauses auto-dismiss while the pointer is on the stack", async () => {
    const { container } = render(<Toaster duration={40} />);
    const stage = within(container);
    const toaster = container.querySelector(".podo-toaster") as HTMLElement;

    act(() => {
      toast("머무는 토스트");
    });
    // Hovering pauses auto-dismiss: the effect clears the armed timer while
    // expanded, so the toast survives well past its 40ms duration.
    act(() => {
      fireEvent.pointerEnter(toaster);
    });
    expect(toaster.getAttribute("data-expanded")).toBe("true");
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(stage.getByText("머무는 토스트")).toBeDefined();

    // Leaving re-arms the timer, so it dismisses (40ms) then unmounts (180ms).
    act(() => {
      fireEvent.pointerLeave(toaster);
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(stage.queryByText("머무는 토스트")).toBeNull();
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

  it("shows the value without the box in the read-only state", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="읽기전용" readOnly defaultValue="고정 값" />);

    const control = screen.getByLabelText("읽기전용") as HTMLInputElement;
    expect(control.readOnly).toBe(true);
    expect(control.closest(".podo-input")?.getAttribute("data-state")).toBe("read-only");
    // The platform blocks edits on readOnly inputs.
    await user.type(control, "추가");
    expect(control.value).toBe("고정 값");
  });

  it("renders the icon spec contract: size variant and decorative accessibility", () => {
    const { container, rerender } = render(<Icon name="menu" />);
    const icon = container.querySelector("i")!;
    // Decorative by default (spec): hidden from AT, base size vocabulary.
    expect(icon.className).toBe("podo-icon podo-icon-menu");
    expect(icon.getAttribute("data-size")).toBe("md");
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.getAttribute("role")).toBeNull();

    rerender(<Icon name="menu" size="lg" />);
    expect(icon.getAttribute("data-size")).toBe("lg");

    // Non-decorative icons are exposed as role="img" named by the consumer's
    // aria-label, and must NOT carry aria-hidden.
    rerender(<Icon name="menu" decorative={false} aria-label="메뉴 열기" />);
    expect(screen.getByRole("img", { name: "메뉴 열기" })).toBe(icon);
    expect(icon.getAttribute("aria-hidden")).toBeNull();
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

describe("ported v1 components", () => {
  it("renders DatePicker input and opens the calendar dropdown", () => {
    const { container } = render(
      <DatePicker mode="instant" type="date" value={{}} onChange={() => {}} />
    );
    const input = container.querySelector(".podo-dp-inputPart");
    expect(input).not.toBeNull();
    fireEvent.click(input!);
    expect(document.querySelector(".podo-dp-dropdown")).not.toBeNull();
    expect(document.querySelector(".podo-dp-calendarGrid")).not.toBeNull();
  });

  it("renders Editor toolbar and content area", () => {
    const { container } = render(<Editor value="<p>hi</p>" onChange={() => {}} />);
    expect(container.querySelector(".podo-ed-editor")).not.toBeNull();
    expect(container.querySelector(".podo-ed-toolbar, .podo-ed-toolbarWrapper")).not.toBeNull();
    expect(container.querySelector(".podo-ed-editorContent")).not.toBeNull();
  });

  it("renders EditorView content with shared content classes", () => {
    const { container } = render(<EditorView value={'<p class="podo-ed-p1">본문</p>'} />);
    expect(container.querySelector(".podo-ed-editorView")).not.toBeNull();
    expect(container.querySelector("p.podo-ed-p1")).not.toBeNull();
  });
});
