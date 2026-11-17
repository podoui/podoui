import { afterEach, describe, expect, it, vi } from "vitest";
import {
  datePickerDateText,
  datePickerHourLabel,
  datePickerHourOptions,
  getActivePresetLabel,
  isDatePickerHourDisabled,
  isDatePickerMinuteDisabled,
  isDatePickerNavDisabled,
} from "./index.js";

// React DatePicker와 Hono DatePicker SSR이 같이 쓰는 표시 규칙(T4 결정 D-10).
describe("DatePicker display rules", () => {
  const date = new Date(2026, 10, 17);

  it("formats the date input text and placeholder", () => {
    expect(datePickerDateText(date, undefined, undefined)).toBe("2026 - 11 - 17");
    expect(datePickerDateText(date, "y.m.d h:i", undefined)).toBe("2026.11.17");
    expect(datePickerDateText(undefined, "y.m.d", undefined)).toBe("YYYY.MM.DD");
    expect(datePickerDateText(undefined, undefined, "날짜 선택")).toBe("날짜 선택");
  });

  it("builds hour options and labels", () => {
    expect(datePickerHourOptions(6)).toEqual([0, 6, 12, 18]);
    expect(datePickerHourOptions(12)).toEqual([0, 12]);
    expect(datePickerHourLabel(0, "12")).toBe("오전 12시");
    expect(datePickerHourLabel(13, "12")).toBe("오후 1시");
    expect(datePickerHourLabel(9, "24")).toBe("9시");
  });

  it("disables hours and minutes outside same-day limits", () => {
    const minDate = { date, time: { hour: 9, minute: 30 } };
    expect(isDatePickerHourDisabled({ hour: 8, type: "datetime", date, minDate })).toBe(true);
    expect(isDatePickerHourDisabled({ hour: 9, type: "datetime", date, minDate })).toBe(false);
    expect(
      isDatePickerHourDisabled({ hour: 3, type: "hour", disabledHours: [3], date: undefined })
    ).toBe(true);
    expect(
      isDatePickerMinuteDisabled({ minute: 15, date, time: { hour: 9, minute: 0 }, minDate })
    ).toBe(true);
    expect(
      isDatePickerMinuteDisabled({ minute: 15, date: undefined, time: undefined, minDate })
    ).toBe(false);
  });

  it("blocks period navigation without a range or past the limits", () => {
    const range = { start: new Date(2026, 10, 10), end: new Date(2026, 10, 16) };
    expect(isDatePickerNavDisabled(null, 1, {})).toBe(true);
    expect(isDatePickerNavDisabled(range, -1, { minDate: new Date(2026, 10, 17) })).toBe(true);
    expect(isDatePickerNavDisabled(range, 1, { maxDate: new Date(2026, 10, 9) })).toBe(true);
    expect(isDatePickerNavDisabled(range, 1, {})).toBe(false);
  });

  it("labels a range matching a quick-select preset", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 17, 10, 0, 0));
    const yesterday = new Date(2026, 10, 16);
    expect(getActivePresetLabel({ date: yesterday, endDate: yesterday })).toBe("어제");
    expect(getActivePresetLabel({ date: new Date(2026, 10, 11), endDate: date })).toBe("최근 7일");
    expect(getActivePresetLabel({ date: yesterday })).toBeNull();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
