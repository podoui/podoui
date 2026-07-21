// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DatePicker from "./datepicker.js";
import type { DatePickerValue } from "./datepicker.js";

// value prop은 identity가 안정적이어야 내부 임시 상태가 리셋되지 않는다.
const emptyValue: DatePickerValue = {};

describe("DatePicker", () => {
  // vitest globals가 꺼져 있어 RTL 자동 cleanup이 동작하지 않는다 — 명시적으로 정리
  afterEach(() => {
    cleanup();
  });

  it("commits both times via Apply in period time mode", () => {
    const onChange = vi.fn();
    render(<DatePicker mode="period" type="time" value={emptyValue} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("분 선택"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("종료 시 선택"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("종료 분 선택"), { target: { value: "45" } });

    // 시간 변경만으로는 커밋되지 않고, 적용 버튼이 노출되어야 한다
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      time: { hour: 10, minute: 30 },
      endTime: { hour: 12, minute: 45 },
    });
  });

  it("keeps the dropdown open with instant showActions and commits on Apply", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" showActions value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));
    expect(screen.getByRole("grid")).toBeTruthy();

    // 날짜를 골라도 자동으로 닫히거나 커밋되지 않는다
    fireEvent.click(screen.getByRole("gridcell", { name: "2026년 7월 15일" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid")).toBeTruthy();

    // 적용을 눌러야 커밋되고 닫힌다
    fireEvent.click(screen.getByRole("button", { name: "적용" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const committed = onChange.mock.calls[0]![0] as DatePickerValue;
    expect(committed.date?.getFullYear()).toBe(2026);
    expect(committed.date?.getMonth()).toBe(6);
    expect(committed.date?.getDate()).toBe(15);
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("still instant-commits a date pick without showActions", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = { date: new Date(2026, 7, 1) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2026 - 08 - 01" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "2026년 8월 15일" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const committed = onChange.mock.calls[0]![0] as DatePickerValue;
    expect(committed.date?.getDate()).toBe(15);
    // 선택 즉시 닫힌다
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("keeps the period date Apply flow working (2026-07-10 ~ 2026-07-20)", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="period"
        type="date"
        value={emptyValue}
        onChange={onChange}
        initialCalendar={{ start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) }}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "YYYY - MM - DD" })[0]!);
    const leftGrid = () => screen.getAllByRole("grid")[0]!;
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 10일" }));
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 20일" }));
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "적용" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const committed = onChange.mock.calls[0]![0] as DatePickerValue;
    expect(committed.date?.getDate()).toBe(10);
    expect(committed.endDate?.getDate()).toBe(20);
    expect(screen.queryAllByRole("grid")).toHaveLength(0);
  });

  it("renders the placeholder prop when provided", () => {
    render(
      <DatePicker
        mode="instant"
        type="date"
        placeholder="날짜 선택"
        value={emptyValue}
        onChange={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "날짜 선택" })).toBeTruthy();
  });

  it("falls back to the format template placeholder without the prop", () => {
    render(<DatePicker mode="instant" type="date" value={emptyValue} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "YYYY - MM - DD" })).toBeTruthy();
  });

  it("commits the cleared value through onChange on reset", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = {
      date: new Date(2026, 6, 10),
      endDate: new Date(2026, 6, 20),
    };
    render(<DatePicker mode="period" type="date" value={value} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));

    // controlled 소비자가 실제로 비워지도록 빈 값이 커밋된다
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({});
    expect(screen.queryAllByRole("grid")).toHaveLength(0);
  });

  it("closes the dropdown on Escape and returns focus to the trigger", () => {
    render(
      <DatePicker
        mode="instant"
        type="date"
        placeholder="날짜 선택"
        value={emptyValue}
        onChange={() => {}}
      />
    );

    const trigger = screen.getByRole("button", { name: "날짜 선택" });
    fireEvent.click(trigger);
    expect(screen.getByRole("grid")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("grid")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("exposes accessible names on the month navigation buttons", () => {
    render(<DatePicker mode="instant" type="date" value={emptyValue} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "YYYY - MM - DD" }));

    expect(screen.getByRole("button", { name: "이전 달" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "다음 달" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "년도 선택" })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "월 선택" })).toBeTruthy();
  });

  it("carries minute rounding into the next hour instead of emitting :60", () => {
    // minDate 10:59 + minuteStep 30: 올림하면 10:60이 아니라 11:00이어야 한다
    const onChange = vi.fn();
    const day = new Date(2026, 6, 10);
    const value: DatePickerValue = { date: day, time: { hour: 12, minute: 0 } };
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        value={value}
        onChange={onChange}
        minuteStep={30}
        minDate={{ date: day, time: { hour: 10, minute: 59 } }}
      />
    );

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "10" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as DatePickerValue).time).toEqual({ hour: 11, minute: 0 });
  });

  it("clamps the 23:59 carry boundary to exactly the min time (23:59)", () => {
    // 자리올림 클램프(23:30)는 minDate(23:59)보다 이전이라 유효하지 않다.
    // min 이상인 스텝 정렬 시간(24:00)이 하루 안에 없으므로 정확히 min을 사용한다 —
    // 커밋된 시간이 minDate/maxDate 창을 벗어나지 않는 것이 문서화된 결정
    const onChange = vi.fn();
    const day = new Date(2026, 6, 10);
    const value: DatePickerValue = { date: day, time: { hour: 12, minute: 0 } };
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        value={value}
        onChange={onChange}
        minuteStep={30}
        minDate={{ date: day, time: { hour: 23, minute: 59 } }}
      />
    );

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "23" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as DatePickerValue).time).toEqual({ hour: 23, minute: 59 });
  });

  it("clamps a step-carried time back into the minDate window (23:45 min)", () => {
    // 회귀: 자리올림 클램프가 만든 23:30은 minDate 23:45보다 이전이다.
    // min 이상인 스텝 정렬 시간(24:00)이 하루 안에 없으므로 정확히 min(23:45)을 커밋한다
    const onChange = vi.fn();
    const day = new Date(2026, 6, 10);
    const value: DatePickerValue = { date: day, time: { hour: 12, minute: 0 } };
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        value={value}
        onChange={onChange}
        minuteStep={30}
        minDate={{ date: day, time: { hour: 23, minute: 45 } }}
      />
    );

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "23" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as DatePickerValue).time).toEqual({ hour: 23, minute: 45 });
  });

  it("renders a non-step-aligned committed minute as the selected option", () => {
    // 경계 클램프가 커밋할 수 있는 정확한 min 시간(23:59, step 30)은 내림(23:30)
    // 표시가 아니라 그대로 선택된 상태로 보여야 한다 — 23:30 옵션은 min보다
    // 이전이라 비활성이므로 내림 표시는 UI가 렌더할 수 없는 값이 된다
    const day = new Date(2026, 6, 10);
    const value: DatePickerValue = { date: day, time: { hour: 23, minute: 59 } };
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        value={value}
        onChange={() => {}}
        minuteStep={30}
        minDate={{ date: day, time: { hour: 23, minute: 59 } }}
      />
    );

    const minuteSelect = screen.getByLabelText("분 선택") as HTMLSelectElement;
    expect(minuteSelect.value).toBe("59");
    const committed = within(minuteSelect).getByRole("option", { name: "59" }) as HTMLOptionElement;
    expect(committed.selected).toBe(true);
    expect(committed.disabled).toBe(false);
    // 스텝 정렬 옵션은 그대로 유지되고, 비정렬 추가 옵션은 현재 값 하나뿐이다
    expect([...minuteSelect.options].map((o) => o.value)).toEqual(["0", "30", "59"]);
  });

  it("cancels a pending-actions dropdown on outside click without committing", () => {
    const onChange = vi.fn();
    render(<DatePicker mode="period" type="time" value={emptyValue} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "10" } });
    // pending 변경으로 액션 드롭다운이 열려 있다
    expect(screen.getByRole("button", { name: "적용" })).toBeTruthy();

    fireEvent.mouseDown(document.body);

    // 바깥 클릭 = 취소: 드롭다운이 닫히고 임시 변경은 커밋 없이 버려진다
    expect(screen.queryByRole("button", { name: "적용" })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect((screen.getByLabelText("시 선택") as HTMLSelectElement).value).toBe("0");
  });

  it("still closes a non-pending dropdown on outside click", () => {
    const onChange = vi.fn();
    render(<DatePicker mode="instant" type="date" value={emptyValue} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "YYYY - MM - DD" }));
    expect(screen.getByRole("grid")).toBeTruthy();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("grid")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders truly disabled triggers that cannot open the dropdown", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" disabled value={value} onChange={() => {}} />);

    const trigger = screen.getByRole("button", { name: "2026 - 07 - 10" });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    expect(trigger.getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(trigger);
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("assigns a roving tabindex with exactly one focusable day cell", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    const cells = screen.getAllByRole("gridcell");
    const tabbable = cells.filter((cell) => cell.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    // 선택된 날짜가 roving 셀이 된다
    expect(tabbable[0]!.getAttribute("aria-label")).toBe("2026년 7월 10일");
  });

  it("moves focus to the next day with ArrowRight", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2026년 7월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "ArrowRight" });

    const next = screen.getByRole("gridcell", { name: "2026년 7월 11일" });
    expect(document.activeElement).toBe(next);
    expect(next.getAttribute("tabindex")).toBe("0");
    expect(cell.getAttribute("tabindex")).toBe("-1");
  });

  it("moves focus a week down with ArrowDown", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2026년 7월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "ArrowDown" });

    expect(document.activeElement).toBe(screen.getByRole("gridcell", { name: "2026년 7월 17일" }));
  });

  it("navigates to the adjacent month when an arrow crosses the month boundary", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 31) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 31" }));

    const cell = screen.getByRole("gridcell", { name: "2026년 7월 31일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "ArrowRight" });

    // 달력이 8월로 이동하고 포커스도 8월 1일 셀로 따라간다
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("2026년 8월");
    const target = screen.getByRole("gridcell", { name: "2026년 8월 1일" });
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute("tabindex")).toBe("0");
  });

  it("jumps to the week edges with Home and End", () => {
    // 2026-07-10은 금요일: Home → 7/5(일), End → 7/11(토)
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2026년 7월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "Home" });
    expect(document.activeElement).toBe(screen.getByRole("gridcell", { name: "2026년 7월 5일" }));

    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(document.activeElement).toBe(screen.getByRole("gridcell", { name: "2026년 7월 11일" }));
  });

  it("selects the focused day with Enter", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2026년 7월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "ArrowRight" });
    fireEvent.keyDown(screen.getByRole("gridcell", { name: "2026년 7월 11일" }), {
      key: "Enter",
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const committed = onChange.mock.calls[0]![0] as DatePickerValue;
    expect(committed.date?.getFullYear()).toBe(2026);
    expect(committed.date?.getMonth()).toBe(6);
    expect(committed.date?.getDate()).toBe(11);
    // showActions가 없는 instant 모드는 선택 즉시 닫힌다
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("labels each day cell with the full year-month-day inside grid semantics", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(<DatePicker mode="instant" type="date" value={value} onChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    const grid = screen.getByRole("grid");
    expect(grid.getAttribute("aria-label")).toBe("2026년 7월");
    expect(within(grid).getAllByRole("row").length).toBeGreaterThan(1);
    expect(within(grid).getAllByRole("columnheader")).toHaveLength(7);

    const day = screen.getByRole("gridcell", { name: "2026년 7월 15일" });
    expect(day.tagName).toBe("BUTTON");
    expect(day.textContent).toBe("15");

    // 선택된 날짜는 aria-selected로 표시된다
    const selected = screen.getByRole("gridcell", { name: "2026년 7월 10일" });
    expect(selected.getAttribute("aria-selected")).toBe("true");
  });

  it("closes an open dropdown with cancel semantics when disabled flips true", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    const { rerender } = render(
      <DatePicker mode="instant" type="date" showActions value={value} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "2026년 7월 15일" }));
    // 커밋되지 않은 임시 변경(15일)이 트리거에 표시된 상태
    expect(screen.getByRole("button", { name: "2026 - 07 - 15" })).toBeTruthy();

    rerender(
      <DatePicker
        mode="instant"
        type="date"
        showActions
        disabled
        value={value}
        onChange={onChange}
      />
    );

    // 취소 의미론: 달력/액션이 닫히고 임시 변경은 커밋 없이 원래 값으로 되돌아간다
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.queryByRole("button", { name: "적용" })).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    const trigger = screen.getByRole("button", { name: "2026 - 07 - 10" });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);

    // disabled 상태에서는 다시 열 수도 없다
    fireEvent.click(trigger);
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("skips a disabled selected day when assigning the roving tabindex", () => {
    // 2020년 1월: 오늘(테스트 실행 시점)이 표시 월에 없어 결정적이다
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        disable={[new Date(2020, 0, 1), new Date(2020, 0, 10)]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    const cells = screen.getAllByRole("gridcell");
    const tabbable = cells.filter((cell) => cell.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    // 선택된 1/10과 1/1은 비활성 — 해당 월의 첫 활성 날짜(1/2)가 roving 셀이 된다
    expect(tabbable[0]!.getAttribute("aria-label")).toBe("2020년 1월 2일");
    const selectedCell = screen.getByRole("gridcell", { name: "2020년 1월 10일" });
    expect((selectedCell as HTMLButtonElement).disabled).toBe(true);
    expect(selectedCell.getAttribute("tabindex")).toBe("-1");
  });

  it("skips a disabled day when navigating with ArrowRight", () => {
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        disable={[new Date(2020, 0, 11)]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2020년 1월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "ArrowRight" });

    // 1/11은 비활성 — 같은 방향의 다음 활성 날짜인 1/12로 건너뛴다
    const target = screen.getByRole("gridcell", { name: "2020년 1월 12일" });
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("gridcell", { name: "2020년 1월 11일" }).getAttribute("tabindex")).toBe(
      "-1"
    );
  });

  it("assigns no tab stop when every day of the month is disabled", () => {
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        disable={[() => true]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    // 월 전체가 비활성이면 어떤 셀도 tabIndex=0을 갖지 않는다 (문서화된 결정) —
    // 비활성 셀은 포커스가 불가능하므로 잘못된 탭 정지를 만들지 않는다
    const tabbable = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(0);
  });

  it("keeps both times, swapped, when a datetime period is picked in reverse", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = {
      time: { hour: 10, minute: 0 },
      endTime: { hour: 18, minute: 30 },
    };
    render(
      <DatePicker
        mode="period"
        type="datetime"
        value={value}
        onChange={onChange}
        initialCalendar={{ start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) }}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "YYYY - MM - DD" })[0]!);
    const leftGrid = () => screen.getAllByRole("grid")[0]!;
    // 늦은 날짜(7/20)를 먼저, 이른 날짜(7/10)를 나중에 선택 → 범위 자동 정렬(스왑)
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 20일" }));
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 10일" }));
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const committed = onChange.mock.calls[0]![0] as DatePickerValue;
    expect(committed.date?.getDate()).toBe(10);
    expect(committed.endDate?.getDate()).toBe(20);
    // 날짜와 함께 시간도 스왑된다: 기존 시작 time은 endTime이 되고,
    // 대기 중이던 endTime은 새 시작일의 time이 된다 (endTime이 버려지지 않는다)
    expect(committed.time).toEqual({ hour: 18, minute: 30 });
    expect(committed.endTime).toEqual({ hour: 10, minute: 0 });
  });

  it("disables every day outside the enable allowlist", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={onChange}
        enable={[new Date(2020, 0, 10), new Date(2020, 0, 15)]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    // 허용 목록에 없는 날짜는 비활성 — 클릭해도 선택되지 않는다
    const blocked = screen.getByRole("gridcell", { name: "2020년 1월 12일" });
    expect((blocked as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(blocked);
    expect(onChange).not.toHaveBeenCalled();

    // 허용 목록의 날짜는 정상 선택된다
    const allowed = screen.getByRole("gridcell", { name: "2020년 1월 15일" });
    expect((allowed as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(allowed);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as DatePickerValue).date?.getDate()).toBe(15);
  });

  it("routes enable through arrow navigation and the roving tabindex", () => {
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        enable={[new Date(2020, 0, 10), new Date(2020, 0, 15)]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    // roving 셀은 허용된 선택 날짜 하나뿐이다
    const tabbable = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]!.getAttribute("aria-label")).toBe("2020년 1월 10일");

    // ArrowRight는 허용 목록에 없는 1/11~1/14를 건너뛰고 1/15에 멈춘다
    const cell = screen.getByRole("gridcell", { name: "2020년 1월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "ArrowRight" });
    const target = screen.getByRole("gridcell", { name: "2020년 1월 15일" });
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute("tabindex")).toBe("0");

    // 마지막 허용 날짜에서 더 나아가면 활성 날짜가 없으므로 이동하지 않는다(경계 정지)
    fireEvent.keyDown(target, { key: "ArrowRight" });
    expect(document.activeElement).toBe(target);
  });

  it("lets a period range span non-enabled days between enabled endpoints", () => {
    // v1 의미론: enable/disable은 끝점(클릭 가능한 날짜)만 제한하고,
    // 완성된 기간이 중간의 비활성 날짜를 가로지르는 것은 허용한다
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="period"
        type="date"
        value={emptyValue}
        onChange={onChange}
        enable={[new Date(2026, 6, 10), new Date(2026, 6, 20)]}
        initialCalendar={{ start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) }}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "YYYY - MM - DD" })[0]!);
    const leftGrid = () => screen.getAllByRole("grid")[0]!;
    // 중간 날짜(7/15)는 비활성이지만
    expect(
      (within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 15일" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    // 허용된 끝점 두 개로 기간을 완성해 커밋할 수 있다
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 10일" }));
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 20일" }));
    fireEvent.click(screen.getByRole("button", { name: "적용" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const committed = onChange.mock.calls[0]![0] as DatePickerValue;
    expect(committed.date?.getDate()).toBe(10);
    expect(committed.endDate?.getDate()).toBe(20);
  });

  it("blocks selection and arrow movement past maxDate", () => {
    const onChange = vi.fn();
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={onChange}
        maxDate={new Date(2026, 6, 20)}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));

    // maxDate 이후의 날짜는 비활성 — 클릭/Enter 어느 경로로도 선택되지 않는다
    const blocked = screen.getByRole("gridcell", { name: "2026년 7월 25일" });
    expect((blocked as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(blocked);
    fireEvent.keyDown(blocked, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();

    // 경계 날짜에서 앞으로는 활성 날짜가 없으므로 포커스가 이동하지 않는다
    const edge = screen.getByRole("gridcell", { name: "2026년 7월 20일" });
    edge.focus();
    fireEvent.keyDown(edge, { key: "ArrowRight" });
    expect(document.activeElement).toBe(edge);
  });

  it("disables hour and minute options beyond the maxDate time window", () => {
    const day = new Date(2026, 6, 10);
    const value: DatePickerValue = { date: day, time: { hour: 12, minute: 0 } };
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        value={value}
        onChange={() => {}}
        maxDate={{ date: day, time: { hour: 12, minute: 30 } }}
      />
    );

    const hourSelect = screen.getByLabelText("시 선택") as HTMLSelectElement;
    const hourOf = (name: string) =>
      within(hourSelect).getByRole("option", { name }) as HTMLOptionElement;
    expect(hourOf("12").disabled).toBe(false);
    expect(hourOf("13").disabled).toBe(true);
    expect(hourOf("23").disabled).toBe(true);

    // 현재 시(12시)가 max 시와 같으므로 max 분(30) 이후의 분도 비활성
    const minuteSelect = screen.getByLabelText("분 선택") as HTMLSelectElement;
    const minuteOf = (name: string) =>
      within(minuteSelect).getByRole("option", { name }) as HTMLOptionElement;
    expect(minuteOf("30").disabled).toBe(false);
    expect(minuteOf("31").disabled).toBe(true);
    expect(minuteOf("59").disabled).toBe(true);
  });

  it("commits exactly the max time when no step-aligned slot fits the window", () => {
    // min 00:35 / max 00:40, step 30: 올림 자리올림(01:00)은 max 초과, 내림 정렬(00:30)은
    // min 미만 — 스텝 정렬 시간이 창 안에 없으므로 정확히 max(00:40)를 커밋한다
    const onChange = vi.fn();
    const day = new Date(2026, 6, 10);
    const value: DatePickerValue = { date: day, time: { hour: 12, minute: 0 } };
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        value={value}
        onChange={onChange}
        minuteStep={30}
        minDate={{ date: day, time: { hour: 0, minute: 35 } }}
        maxDate={{ date: day, time: { hour: 0, minute: 40 } }}
      />
    );

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "0" } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as DatePickerValue).time).toEqual({ hour: 0, minute: 40 });
  });

  it("keeps month navigation open past maxDate while its days disable", () => {
    // v1 의미론: minDate/maxDate는 날짜 셀만 제한하고 월 이동은 막지 않는다.
    // 다만 최대 년도 너머로 이동해도 년도 select가 빈 표시가 되면 안 된다
    const value: DatePickerValue = { date: new Date(2026, 11, 1) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        maxDate={new Date(2026, 11, 15)}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2026 - 12 - 01" }));

    const nextBtn = screen.getByRole("button", { name: "다음 달" });
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(nextBtn);

    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("2027년 1월");
    expect(
      (screen.getByRole("gridcell", { name: "2027년 1월 15일" }) as HTMLButtonElement).disabled
    ).toBe(true);
    // 표시 년도(2027)는 옵션 범위(…~2026) 밖이지만 select는 그 년도를 렌더해야 한다
    const yearSelect = screen.getByRole("combobox", { name: "년도 선택" }) as HTMLSelectElement;
    expect(yearSelect.value).toBe("2027");
  });

  it("keeps only the minDate..maxDate window selectable when narrower than a month", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 12) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        minDate={new Date(2026, 6, 10)}
        maxDate={new Date(2026, 6, 15)}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 12" }));

    const dayCell = (day: number) =>
      screen.getByRole("gridcell", { name: `2026년 7월 ${day}일` }) as HTMLButtonElement;
    expect(dayCell(9).disabled).toBe(true);
    expect(dayCell(10).disabled).toBe(false);
    expect(dayCell(15).disabled).toBe(false);
    expect(dayCell(16).disabled).toBe(true);

    // roving 셀은 창 안의 선택된 날짜다
    const tabbable = screen
      .getAllByRole("gridcell")
      .filter((cell) => cell.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]!.getAttribute("aria-label")).toBe("2026년 7월 12일");
  });

  it("renders a controlled year outside yearRange as the selected year option", () => {
    const value: DatePickerValue = { date: new Date(1990, 5, 15) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        yearRange={{ min: 2000, max: 2030 }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "1990 - 06 - 15" }));

    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("1990년 6월");
    // 범위 밖의 표시 년도(1990)는 빈 표시가 아니라 추가(선택된) 옵션으로 렌더된다
    const yearSelect = screen.getByRole("combobox", { name: "년도 선택" }) as HTMLSelectElement;
    expect(yearSelect.value).toBe("1990");
    const names = [...yearSelect.options].map((o) => o.textContent);
    expect(names[0]).toBe("1990년");
    // 경계 포함(off-by-one 없음): 2000년과 2030년이 모두 존재, 2000~2030 = 31개 + 표시 년도 1개
    expect(names[1]).toBe("2000년");
    expect(names[names.length - 1]).toBe("2030년");
    expect(yearSelect.options).toHaveLength(32);
  });

  it("formats the committed value and the placeholder with a custom format", () => {
    const value: DatePickerValue = { date: new Date(2026, 6, 10) };
    const { rerender } = render(
      <DatePicker mode="instant" type="date" value={value} onChange={() => {}} format="y.m.d" />
    );
    expect(screen.getByRole("button", { name: "2026.07.10" })).toBeTruthy();

    // 값이 비면 포맷 템플릿이 플레이스홀더가 된다
    rerender(
      <DatePicker
        mode="instant"
        type="date"
        value={emptyValue}
        onChange={() => {}}
        format="y.m.d"
      />
    );
    expect(screen.getByRole("button", { name: "YYYY.MM.DD" })).toBeTruthy();
  });

  it("strips time tokens from trigger text but formats them in the period summary", () => {
    const value: DatePickerValue = {
      date: new Date(2026, 6, 10),
      time: { hour: 9, minute: 5 },
      endDate: new Date(2026, 6, 20),
      endTime: { hour: 18, minute: 30 },
    };
    render(
      <DatePicker
        mode="period"
        type="datetime"
        value={value}
        onChange={() => {}}
        format="y-m-d h:i"
      />
    );

    // 트리거의 날짜 버튼은 시간 토큰이 제거된 날짜만 표시한다 (시/분은 별도 select)
    expect(screen.getByRole("button", { name: "2026-07-10" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026-07-20" })).toBeTruthy();

    // 기간 요약 텍스트는 시간 토큰까지 포맷한다 (0채움 포함)
    fireEvent.click(screen.getByRole("button", { name: "2026-07-10" }));
    expect(screen.getByText("2026-07-10 09:05 ~ 2026-07-20 18:30")).toBeTruthy();
  });

  it("lands Home on the nearest enabled day inward when the week start is disabled", () => {
    // 2020-01-10은 금요일, 주 시작(1/5 일요일)이 비활성 — Home은 이전 주로
    // 벗어나지 않고 주 안쪽에서 가장 가까운 활성 날짜(1/6 월요일)에 멈춘다
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        disable={[new Date(2020, 0, 5)]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2020년 1월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "Home" });

    expect(document.activeElement).toBe(screen.getByRole("gridcell", { name: "2020년 1월 6일" }));
  });

  it("keeps End inside the week when the week end is disabled", () => {
    // 주 끝(1/11 토요일)이 비활성 — End는 다음 주(1/12)로 벗어나지 않고
    // 주 안쪽에서 가장 가까운 활성 날짜(현재 위치 1/10)에 멈춘다
    const value: DatePickerValue = { date: new Date(2020, 0, 10) };
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={value}
        onChange={() => {}}
        disable={[new Date(2020, 0, 11)]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "2020 - 01 - 10" }));

    const cell = screen.getByRole("gridcell", { name: "2020년 1월 10일" });
    cell.focus();
    fireEvent.keyDown(cell, { key: "End" });

    expect(document.activeElement).toBe(cell);
  });

  it("clamps a period calendar year change to the paired calendar boundary", () => {
    // 왼쪽 달력(2026년 2월)에서 년도만 2027로 바꾸면 2027년 2월이 되어
    // 오른쪽 달력(2027년 1월)을 넘어선다 — 경계 월(2027년 1월)로 클램프해야 한다
    render(
      <DatePicker
        mode="period"
        type="date"
        value={emptyValue}
        onChange={() => {}}
        initialCalendar={{ start: new Date(2026, 1, 1), end: new Date(2027, 0, 1) }}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "YYYY - MM - DD" })[0]!);
    expect(screen.getAllByRole("grid")[0]!.getAttribute("aria-label")).toBe("2026년 2월");

    const leftYearSelect = screen.getAllByRole("combobox", { name: "년도 선택" })[0]!;
    fireEvent.change(leftYearSelect, { target: { value: "2027" } });

    expect(screen.getAllByRole("grid")[0]!.getAttribute("aria-label")).toBe("2027년 1월");
  });

  it("applies align and className to the rendered markup", () => {
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={emptyValue}
        onChange={() => {}}
        align="right"
        className="my-datepicker"
      />
    );

    const root = document.querySelector(".podo-dp-datepicker")!;
    expect(root.classList.contains("my-datepicker")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "YYYY - MM - DD" }));
    const dropdown = document.querySelector(".podo-dp-dropdown")!;
    expect(dropdown.classList.contains("podo-dp-right")).toBe(true);
  });

  it("commits immediately in period mode when showActions is false", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="period"
        type="date"
        showActions={false}
        value={emptyValue}
        onChange={onChange}
        initialCalendar={{ start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) }}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "YYYY - MM - DD" })[0]!);
    const leftGrid = () => screen.getAllByRole("grid")[0]!;
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 10일" }));
    // 시작일 선택 즉시 커밋되고 드롭다운은 종료일 선택을 위해 유지된다
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("grid").length).toBeGreaterThan(0);

    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 20일" }));
    // 기간 완성 즉시 커밋되고 닫힌다 (적용 버튼 없음)
    expect(onChange).toHaveBeenCalledTimes(2);
    const committed = onChange.mock.calls[1]![0] as DatePickerValue;
    expect(committed.date?.getDate()).toBe(10);
    expect(committed.endDate?.getDate()).toBe(20);
    expect(screen.queryAllByRole("grid")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "적용" })).toBeNull();
  });

  it("resolves the nextMonth initialCalendar keyword", () => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    render(
      <DatePicker
        mode="instant"
        type="date"
        value={emptyValue}
        onChange={() => {}}
        initialCalendar={{ start: "nextMonth" }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "YYYY - MM - DD" }));
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe(
      `${next.getFullYear()}년 ${next.getMonth() + 1}월`
    );
  });

  it("commits an instant time selection immediately", () => {
    const onChange = vi.fn();
    render(<DatePicker mode="instant" type="time" value={emptyValue} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "10" } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ time: { hour: 10, minute: 0 } });
  });

  it("commits and displays an uncontrolled instant date pick (no value prop)", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="instant"
        type="date"
        onChange={onChange}
        initialCalendar={{ start: new Date(2026, 6, 1) }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "YYYY - MM - DD" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "2026년 7월 15일" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    // uncontrolled: 선택 즉시 닫히고, 선택한 날짜가 빈 표시가 아니라 트리거에 남아야 한다
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getByRole("button", { name: "2026 - 07 - 15" })).toBeTruthy();
  });

  it("displays uncontrolled instant time changes through the internal committed value", () => {
    const onChange = vi.fn();
    render(<DatePicker mode="instant" type="time" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("분 선택"), { target: { value: "30" } });

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith({ time: { hour: 10, minute: 30 } });
    // 커밋된 시간이 select 표시에도 반영되어야 한다 (value prop 없이)
    expect((screen.getByLabelText("시 선택") as HTMLSelectElement).value).toBe("10");
    expect((screen.getByLabelText("분 선택") as HTMLSelectElement).value).toBe("30");
  });

  it("merges uncontrolled datetime commits across date and time parts", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="instant"
        type="datetime"
        onChange={onChange}
        initialCalendar={{ start: new Date(2026, 6, 1) }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "YYYY - MM - DD" }));
    fireEvent.click(screen.getByRole("gridcell", { name: "2026년 7월 15일" }));
    fireEvent.change(screen.getByLabelText("시 선택"), { target: { value: "9" } });

    expect(onChange).toHaveBeenCalledTimes(2);
    const committed = onChange.mock.calls[1]![0] as DatePickerValue;
    expect(committed.date?.getDate()).toBe(15);
    expect(committed.time).toEqual({ hour: 9, minute: 0 });
    expect(screen.getByRole("button", { name: "2026 - 07 - 15" })).toBeTruthy();
    expect((screen.getByLabelText("시 선택") as HTMLSelectElement).value).toBe("9");
  });

  it("keeps the uncontrolled committed period after cancelling a reopened dropdown", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="period"
        type="date"
        onChange={onChange}
        initialCalendar={{ start: new Date(2026, 6, 1), end: new Date(2026, 7, 1) }}
      />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "YYYY - MM - DD" })[0]!);
    const leftGrid = () => screen.getAllByRole("grid")[0]!;
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 10일" }));
    fireEvent.click(within(leftGrid()).getByRole("gridcell", { name: "2026년 7월 20일" }));
    fireEvent.click(screen.getByRole("button", { name: "적용" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "2026 - 07 - 10" })).toBeTruthy();

    // 다시 열고 Escape(취소) — 임시 변경만 버려지고 커밋된 값은 유지되어야 한다
    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "2026 - 07 - 10" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2026 - 07 - 20" })).toBeTruthy();
  });

  it("seeds the uncontrolled value from defaultValue and lets the value prop win", () => {
    const { rerender } = render(
      <DatePicker mode="instant" type="date" defaultValue={{ date: new Date(2026, 6, 10) }} />
    );
    expect(screen.getByRole("button", { name: "2026 - 07 - 10" })).toBeTruthy();

    // value prop이 주어지면 defaultValue/내부 상태보다 항상 이긴다 (controlled)
    rerender(
      <DatePicker
        mode="instant"
        type="date"
        defaultValue={{ date: new Date(2026, 6, 10) }}
        value={{ date: new Date(2026, 10, 5) }}
      />
    );
    expect(screen.getByRole("button", { name: "2026 - 11 - 05" })).toBeTruthy();
  });

  it("clears the uncontrolled committed value on reset", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        mode="period"
        type="date"
        onChange={onChange}
        defaultValue={{ date: new Date(2026, 6, 10), endDate: new Date(2026, 6, 20) }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "2026 - 07 - 10" }));
    fireEvent.click(screen.getByRole("button", { name: "초기화" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({});
    expect(screen.getAllByRole("button", { name: "YYYY - MM - DD" })).toHaveLength(2);
  });

  it("re-anchors the visible month when a controlled update moves to another month", () => {
    const onChange = vi.fn();
    const first: DatePickerValue = { date: new Date(2026, 6, 10) };
    const second: DatePickerValue = { date: new Date(2026, 10, 5) };
    const { rerender } = render(
      <DatePicker mode="instant" type="date" value={first} onChange={onChange} />
    );

    // 외부(controlled)에서 다른 달의 값으로 갱신
    rerender(<DatePicker mode="instant" type="date" value={second} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2026 - 11 - 05" }));
    // 달력이 이전 달(7월)이 아니라 새 값의 달(11월)로 열린다
    expect(screen.getByRole("grid").getAttribute("aria-label")).toBe("2026년 11월");
    expect(
      screen.getByRole("gridcell", { name: "2026년 11월 5일" }).getAttribute("aria-selected")
    ).toBe("true");
  });
});
