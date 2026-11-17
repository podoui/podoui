import { describe, expect, it } from "vitest";
import { formatDatePickerFormValue, reviveProps, serializeProps } from "./index.js";

describe("island props serialization", () => {
  it("round-trips JSON values and local wall-clock Dates, including nested ones", () => {
    const start = new Date(2026, 10, 17, 9, 5, 7);
    const end = new Date(2026, 10, 20);
    const props = {
      mode: "period",
      count: 3,
      open: false,
      empty: null,
      skipped: undefined,
      options: [{ value: "a", label: "A" }],
      defaultValue: { date: start, endDate: end, time: { hour: 9, minute: 5 } },
      disable: [start, { from: start, to: end }],
    };

    const { json, deferred } = serializeProps(props);
    expect(deferred).toEqual([]);
    expect(json).toContain('{"$date":"2026-11-17T09:05:07"}');
    expect(json).not.toContain("skipped");

    const revived = reviveProps(json);
    expect(revived).toEqual({
      mode: "period",
      count: 3,
      open: false,
      empty: null,
      options: [{ value: "a", label: "A" }],
      defaultValue: { date: start, endDate: end, time: { hour: 9, minute: 5 } },
      disable: [start, { from: start, to: end }],
    });
    expect((revived.defaultValue as { date: Date }).date).toBeInstanceOf(Date);
  });

  it("drops functions, class instances, and mixed composites whole and reports them as deferred", () => {
    class Schema {}
    const { json, deferred } = serializeProps({
      label: "ok",
      onChange: () => undefined,
      validator: new Schema(),
      disable: [new Date(2026, 0, 1), (date: Date) => date.getDay() === 0],
      nested: { fn: () => 1 },
      ratio: Number.NaN,
    });
    expect(deferred).toEqual(["onChange", "validator", "disable", "nested", "ratio"]);
    expect(JSON.parse(json)).toEqual({ label: "ok" });
  });

  it("rejects malformed payloads instead of guessing", () => {
    expect(() => reviveProps("not json")).toThrow();
    expect(() => reviveProps("[1]")).toThrow(TypeError);
    expect(() => reviveProps('{"d":{"$date":"2026-11-17"}}')).toThrow(TypeError);
    // 형식은 맞지만 달력에 없는 값은 다음 날짜로 넘기지 않고 거부해요.
    expect(() => reviveProps('{"d":{"$date":"2026-13-40T25:00:00"}}')).toThrow(TypeError);
    expect(() => reviveProps('{"d":{"$date":"2026-02-30T00:00:00"}}')).toThrow(TypeError);
  });

  it("keeps 0–99 years literal, including leap days", () => {
    const early = new Date(2026, 0, 1);
    early.setFullYear(42);
    const revived = reviveProps(serializeProps({ d: early }).json);
    expect((revived.d as Date).getFullYear()).toBe(42);

    const leap = reviveProps('{"d":{"$date":"0000-02-29T08:30:00"}}').d as Date;
    expect([leap.getFullYear(), leap.getMonth(), leap.getDate(), leap.getHours()]).toEqual([
      0, 1, 29, 8,
    ]);
    expect(serializeProps({ d: leap }).json).toBe('{"d":{"$date":"0000-02-29T08:30:00"}}');
  });
});

describe("formatDatePickerFormValue", () => {
  const date = new Date(2026, 1, 3);
  const time = { hour: 7, minute: 30 };

  it("formats each DatePicker type for native form submission", () => {
    expect(formatDatePickerFormValue("date", date, time)).toBe("2026-02-03");
    expect(formatDatePickerFormValue("time", date, time)).toBe("07:30");
    expect(formatDatePickerFormValue("datetime", date, time)).toBe("2026-02-03T07:30");
    expect(formatDatePickerFormValue("hour", date, time)).toBe("07");
  });

  it("pads the year to four digits", () => {
    const early = new Date(2026, 1, 3);
    early.setFullYear(42);
    expect(formatDatePickerFormValue("date", early, undefined)).toBe("0042-02-03");
    expect(formatDatePickerFormValue("datetime", early, time)).toBe("0042-02-03T07:30");
  });

  it("submits an empty string for empty or incomplete values", () => {
    expect(formatDatePickerFormValue("date", undefined, undefined)).toBe("");
    expect(formatDatePickerFormValue("datetime", date, undefined)).toBe("");
    expect(formatDatePickerFormValue("hour", undefined, undefined)).toBe("");
  });
});
