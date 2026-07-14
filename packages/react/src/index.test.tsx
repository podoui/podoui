// @vitest-environment jsdom

import React from "react";
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
  usePodoTheme,
} from "./index.js";

describe("@podo/react", () => {
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

  it("opens the select, picks a single value, and closes", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    const { container } = render(
      <Select
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

  it("adds and auto-selects a new option through the add row", async () => {
    const user = userEvent.setup();
    const addedOptions: string[] = [];
    let latest: string[] = [];
    const { container } = render(
      <Select
        multiple
        addable
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
    expect(q.getByRole("option", { name: "멜론" })).toBeDefined();
  });

  it("closes the select on outside click and blocks it while disabled", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Select placeholder="바깥 과일" options={[{ value: "a", label: "사과" }]} />
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
