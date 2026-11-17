// Generated from the v1 datepicker CSS module — class-name map for the ported global CSS.
// React DatePicker와 Hono DatePicker SSR이 같은 클래스 이름을 쓰도록 core에 둬요.
export const datePickerStyles: Record<string, string> = {
  actionButton: "podo-dp-actionButton",
  actionButtons: "podo-dp-actionButtons",
  active: "podo-dp-active",
  apply: "podo-dp-apply",
  bottomActions: "podo-dp-bottomActions",
  calendar: "podo-dp-calendar",
  calendarCell: "podo-dp-calendarCell",
  calendarGrid: "podo-dp-calendarGrid",
  calendarNav: "podo-dp-calendarNav",
  calendarRow: "podo-dp-calendarRow",
  calendarWrapper: "podo-dp-calendarWrapper",
  combinedDropdown: "podo-dp-combinedDropdown",
  current: "podo-dp-current",
  datepicker: "podo-dp-datepicker",
  disabled: "podo-dp-disabled",
  dropdown: "podo-dp-dropdown",
  dropdownBody: "podo-dp-dropdownBody",
  dropdownUp: "podo-dp-dropdownUp",
  header: "podo-dp-header",
  hourSection: "podo-dp-hourSection",
  hourSelect: "podo-dp-hourSelect",
  inRange: "podo-dp-inRange",
  input: "podo-dp-input",
  inputContent: "podo-dp-inputContent",
  inputIcon: "podo-dp-inputIcon",
  inputPart: "podo-dp-inputPart",
  navArrow: "podo-dp-navArrow",
  navArrowLeft: "podo-dp-navArrowLeft",
  navArrowRight: "podo-dp-navArrowRight",
  navButton: "podo-dp-navButton",
  navButtonPlaceholder: "podo-dp-navButtonPlaceholder",
  navSelect: "podo-dp-navSelect",
  navSelectWrapper: "podo-dp-navSelectWrapper",
  navTitle: "podo-dp-navTitle",
  navTitleButton: "podo-dp-navTitleButton",
  other: "podo-dp-other",
  periodCalendar: "podo-dp-periodCalendar",
  periodCalendarBody: "podo-dp-periodCalendarBody",
  periodCalendarColumn: "podo-dp-periodCalendarColumn",
  periodCalendarLeft: "podo-dp-periodCalendarLeft",
  periodCalendarNav: "podo-dp-periodCalendarNav",
  periodCalendarNavSection: "podo-dp-periodCalendarNavSection",
  periodCalendarRight: "podo-dp-periodCalendarRight",
  periodCalendarWrapper: "podo-dp-periodCalendarWrapper",
  periodCalendars: "podo-dp-periodCalendars",
  periodText: "podo-dp-periodText",
  placeholder: "podo-dp-placeholder",
  portalDropdown: "podo-dp-portalDropdown",
  presetLabel: "podo-dp-presetLabel",
  quickSelectItem: "podo-dp-quickSelectItem",
  quickSelectPanel: "podo-dp-quickSelectPanel",
  rangeEnd: "podo-dp-rangeEnd",
  rangeStart: "podo-dp-rangeStart",
  reset: "podo-dp-reset",
  right: "podo-dp-right",
  selected: "podo-dp-selected",
  separator: "podo-dp-separator",
  timeColumn: "podo-dp-timeColumn",
  timeColumns: "podo-dp-timeColumns",
  timeController: "podo-dp-timeController",
  timeControllerButton: "podo-dp-timeControllerButton",
  timeDropdown: "podo-dp-timeDropdown",
  timeDisplay: "podo-dp-timeDisplay",
  timeDisplayItem: "podo-dp-timeDisplayItem",
  timeDisplaySeparator: "podo-dp-timeDisplaySeparator",
  timeItem: "podo-dp-timeItem",
  timeLabel: "podo-dp-timeLabel",
  timeNativeSelect: "podo-dp-timeNativeSelect",
  timeSection: "podo-dp-timeSection",
  timeSelect: "podo-dp-timeSelect",
  timeSelector: "podo-dp-timeSelector",
  timeSeparator: "podo-dp-timeSeparator",
  timeTrigger: "podo-dp-timeTrigger",
  timeWrapper: "podo-dp-timeWrapper",
  today: "podo-dp-today",
  withNav: "podo-dp-withNav",
  yearMonthCell: "podo-dp-yearMonthCell",
  yearMonthGrid: "podo-dp-yearMonthGrid",
};

/** DatePicker 값 타입 (React `DatePickerType`과 같은 어휘). */
export type PodoDatePickerType = "date" | "time" | "datetime" | "hour";

export interface PodoDatePickerTime {
  hour: number;
  minute: number;
}

/**
 * 폼 제출용 hidden 값 — date `YYYY-MM-DD`, time `HH:mm`, datetime
 * `YYYY-MM-DDTHH:mm`(날짜·시간이 모두 있을 때만), hour `HH`. 값이 비었거나
 * 불완전하면 빈 문자열(네이티브 date/time 입력과 같은 제출 규약).
 */
export function formatDatePickerFormValue(
  type: PodoDatePickerType,
  date: Date | undefined,
  time: PodoDatePickerTime | undefined
): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = date
    ? `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : "";
  const clock = time ? `${pad(time.hour)}:${pad(time.minute)}` : "";
  switch (type) {
    case "date":
      return day;
    case "time":
      return clock;
    case "hour":
      return time ? pad(time.hour) : "";
    case "datetime":
      return day && clock ? `${day}T${clock}` : "";
  }
}

/**
 * formatDatePickerFormValue의 역함수 — 폼 hidden 값을 DatePicker 값 조각으로 읽어요
 * (Hono 클라이언트가 마운트 직전 상태를 읽을 때). 빈 문자열은 빈 값(`{}`), 형식이
 * 틀렸거나 달력·시계에 없는 값(2월 31일, 24시, 60분…)은 `undefined`로 돌려줘요 —
 * 다른 날짜로 정규화해 받아들이지 않아요.
 */
export function parseDatePickerFormValue(
  type: PodoDatePickerType,
  text: string
): { date?: Date; time?: PodoDatePickerTime } | undefined {
  if (text === "") {
    return {};
  }
  const patterns: Record<PodoDatePickerType, RegExp> = {
    date: /^(\d{4})-(\d{2})-(\d{2})$/,
    time: /^()()()(\d{2}):(\d{2})$/,
    datetime: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
    hour: /^()()()(\d{2})()$/,
  };
  const match = patterns[type].exec(text);
  if (!match) {
    return undefined;
  }
  const [year, month, day, hour, minute] = match
    .slice(1)
    .map((part) => (part === undefined || part === "" ? undefined : Number(part)));
  const result: { date?: Date; time?: PodoDatePickerTime } = {};
  if (year !== undefined && month !== undefined && day !== undefined) {
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return undefined;
    }
    result.date = date;
  }
  if (hour !== undefined) {
    const minutes = minute ?? 0;
    if (hour > 23 || minutes > 59) {
      return undefined;
    }
    result.time = { hour, minute: minutes };
  }
  return result;
}
