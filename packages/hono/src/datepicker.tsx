/** @jsxImportSource hono/jsx */

import type { JSX } from "hono/jsx/jsx-runtime";
import {
  calculateNavigationStep,
  datePickerDateText,
  datePickerHourLabel,
  datePickerHourOptions,
  datePickerStyles as styles,
  formatDatePickerFormValue,
  getActivePresetLabel,
  isDatePickerHourDisabled,
  isDatePickerMinuteDisabled,
  isDatePickerNavDisabled,
  shiftDateRange,
} from "@podoui/core";
import { Island } from "./island.js";

// 값 타입 — React DatePicker(packages/react/src/datepicker.tsx)와 같은 모양이에요.
export type HonoDatePickerMode = "instant" | "period";
export type HonoDatePickerType = "date" | "time" | "datetime" | "hour";
export interface HonoTimeValue {
  hour: number;
  minute: number;
}
export interface HonoDatePickerValue {
  date?: Date;
  time?: HonoTimeValue;
  endDate?: Date;
  endTime?: HonoTimeValue;
}
export interface HonoDateRange {
  from: Date;
  to: Date;
}
/** 함수 조건은 SSR이 싣지 못해요 — 같은 prop을 `configure(id, { disable })`로 넘겨요. */
export type HonoDateCondition = Date | HonoDateRange | ((date: Date) => boolean);
export interface HonoDateTimeLimit {
  date: Date;
  time?: HonoTimeValue;
}
export type HonoQuickSelectKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth";

export interface HonoDatePickerProps {
  /** configure 키(래퍼 data-podo-id) — React DatePicker에는 id prop이 없어요(T1 D-1). */
  id?: string;
  mode?: HonoDatePickerMode;
  type?: HonoDatePickerType;
  /** 초기값 — 클라이언트에선 비제어 초기값(React defaultValue)이 돼요. 제어는 configure로. */
  value?: HonoDatePickerValue;
  placeholder?: string;
  disabled?: boolean;
  showActions?: boolean;
  align?: "left" | "right";
  disable?: HonoDateCondition[];
  enable?: HonoDateCondition[];
  minDate?: Date | HonoDateTimeLimit;
  maxDate?: Date | HonoDateTimeLimit;
  minuteStep?: 1 | 5 | 10 | 15 | 20 | 30;
  hourFormat?: "24" | "12";
  disabledHours?: number[];
  hourStep?: 1 | 2 | 3 | 4 | 6 | 12;
  format?: string;
  initialCalendar?: {
    start?: "now" | "prevMonth" | "nextMonth" | Date;
    end?: "now" | "prevMonth" | "nextMonth" | Date;
  };
  yearRange?: { min?: number; max?: number };
  portal?: boolean;
  quickSelect?: boolean;
  hideNavArrow?: boolean;
  direction?: "down" | "up" | "auto";
  /** instant 폼 제출 이름(hidden). */
  name?: string;
  /** period 시작 값 폼 제출 이름(hidden). */
  fromName?: string;
  /** period 종료 값 폼 제출 이름(hidden). */
  toName?: string;
  class?: string;
}

type TimePart = "hour" | "minute" | "endHour" | "endMinute";

/**
 * DatePicker island — SSR은 React DatePicker의 닫힌 첫 렌더(입력 칸·hidden)와 같은
 * 마크업이고, 달력·시간 패널은 클라이언트가 같은 React 소스로 마운트해요.
 */
export function DatePicker(props: HonoDatePickerProps): JSX.Element {
  const { id, value, class: className, ...rest } = props;
  return (
    <Island name="DatePicker" id={id} props={{ ...rest, defaultValue: value, className }}>
      {closedMarkup(props)}
    </Island>
  );
}

function closedMarkup({
  mode = "instant",
  type = "date",
  value = {},
  placeholder,
  disabled = false,
  minDate,
  maxDate,
  minuteStep = 1,
  hourFormat = "24",
  disabledHours,
  hourStep = 1,
  format,
  quickSelect = false,
  hideNavArrow = false,
  name,
  fromName,
  toName,
  class: className,
}: HonoDatePickerProps): JSX.Element {
  const showNavigation = quickSelect && mode === "period" && !hideNavArrow;
  const presetLabel = showNavigation ? getActivePresetLabel(value, minDate, maxDate) : null;
  const icon =
    type === "time" || type === "hour"
      ? "podo-icon podo-icon-time"
      : "podo-icon podo-icon-calendar";

  const dateButton = (date: Date | undefined) => {
    const text = datePickerDateText(date, format, placeholder);
    return (
      <button
        type="button"
        class={joinClass(styles.inputPart, !date && styles.placeholder)}
        disabled={disabled}
        aria-disabled={disabled ? "true" : "false"}
      >
        {text}
      </button>
    );
  };

  const hourSelect = (time: HonoTimeValue | undefined, part: "hour" | "endHour") => {
    const hourOnly = type === "hour";
    const hour = time?.hour ?? 0;
    const hours = hourOnly
      ? datePickerHourOptions(hourStep)
      : Array.from({ length: 24 }, (_, index) => index);
    const shown = hours.includes(hour)
      ? hour
      : hours.reduce(
          (closest, option) =>
            Math.abs(option - hour) < Math.abs(closest - hour) ? option : closest,
          hours[0] ?? 0
        );
    const isEnd = part === "endHour";
    const label = (option: number) =>
      hourOnly ? datePickerHourLabel(option, hourFormat) : pad(option);
    return (
      <>
        <select
          class={styles.timeNativeSelect}
          disabled={disabled}
          tabindex={-1}
          aria-label={
            hourOnly ? (isEnd ? "종료 시간 선택" : "시간 선택") : isEnd ? "종료 시 선택" : "시 선택"
          }
        >
          {hours.map((option) => (
            <option
              value={String(option)}
              disabled={hourDisabled(option, part)}
              selected={option === shown}
            >
              {label(option)}
            </option>
          ))}
        </select>
        <button
          type="button"
          class={joinClass(
            styles.timeTrigger,
            hourOnly && styles.hourSelect,
            !time && styles.placeholder
          )}
          disabled={disabled}
          aria-label={isEnd ? "종료 시 선택 열기" : "시 선택 열기"}
          aria-expanded="false"
        >
          {label(shown)}
        </button>
      </>
    );
  };

  const minuteSelect = (time: HonoTimeValue | undefined, part: "minute" | "endMinute") => {
    const minute = time?.minute ?? 0;
    const minutes = Array.from(
      { length: Math.ceil(60 / minuteStep) },
      (_, index) => index * minuteStep
    );
    const options = minutes.includes(minute) ? minutes : [...minutes, minute].sort((a, b) => a - b);
    const isEnd = part === "endMinute";
    return (
      <>
        <select
          class={styles.timeNativeSelect}
          disabled={disabled}
          tabindex={-1}
          aria-label={isEnd ? "종료 분 선택" : "분 선택"}
        >
          {options.map((option) => (
            <option
              value={String(option)}
              disabled={minuteDisabled(option, part)}
              selected={option === minute}
            >
              {pad(option)}
            </option>
          ))}
        </select>
        <button
          type="button"
          class={joinClass(styles.timeTrigger, !time && styles.placeholder)}
          disabled={disabled}
          aria-label={isEnd ? "종료 분 선택 열기" : "분 선택 열기"}
          aria-expanded="false"
        >
          {pad(minute)}
        </button>
      </>
    );
  };

  // React와 같은 core 규칙 — 닫힌 첫 렌더라 초기값 기준이에요.
  const partDate = (part: TimePart) =>
    part === "endHour" || part === "endMinute" ? value.endDate : value.date;
  const partTime = (part: TimePart) =>
    part === "endHour" || part === "endMinute" ? value.endTime : value.time;
  const hourDisabled = (hour: number, part: TimePart) =>
    isDatePickerHourDisabled({ hour, type, disabledHours, date: partDate(part), minDate, maxDate });
  const minuteDisabled = (minute: number, part: TimePart) =>
    isDatePickerMinuteDisabled({
      minute,
      date: partDate(part),
      time: partTime(part),
      minDate,
      maxDate,
    });

  const timeSection = (time: HonoTimeValue | undefined, end: boolean) =>
    type === "hour" ? (
      <div class={joinClass(styles.timeSection, styles.hourSection)}>
        {hourSelect(time, end ? "endHour" : "hour")}
      </div>
    ) : (
      <div class={styles.timeSection}>
        {hourSelect(time, end ? "endHour" : "hour")}
        <span class={styles.timeSeparator}>:</span>
        {minuteSelect(time, end ? "endMinute" : "minute")}
      </div>
    );

  const side = (end: boolean) => {
    const date = end ? value.endDate : value.date;
    const time = end ? value.endTime : value.time;
    if (type === "date") return dateButton(date);
    if (type === "datetime")
      return (
        <>
          {dateButton(date)}
          {timeSection(time, end)}
        </>
      );
    return timeSection(time, end);
  };

  const navArrow = (direction: 1 | -1) => (
    <button
      type="button"
      class={joinClass(styles.navArrow, direction < 0 ? styles.navArrowLeft : styles.navArrowRight)}
      disabled={
        disabled ||
        isDatePickerNavDisabled(
          // 첫 렌더의 이동 기준 = 시작일, 간격 = 현재 범위(React getShiftedRange).
          value.date && value.endDate
            ? shiftDateRange(
                value.date,
                calculateNavigationStep(value.date, value.endDate),
                direction
              )
            : null,
          direction,
          { minDate, maxDate }
        )
      }
      aria-label={direction < 0 ? "이전 기간" : "다음 기간"}
    >
      <i
        class={`podo-icon podo-icon-chevron-${direction < 0 ? "left" : "right"}`}
        aria-hidden="true"
      />
    </button>
  );

  return (
    <div class={joinClass(styles.datepicker, className)}>
      <div
        class={joinClass(
          styles.input,
          showNavigation && styles.withNav,
          disabled && styles.disabled
        )}
      >
        {showNavigation ? navArrow(-1) : null}
        {showNavigation && presetLabel ? (
          <span class={styles.presetLabel}>{presetLabel}:</span>
        ) : null}
        <div class={styles.inputContent}>
          {side(false)}
          {mode === "period" ? (
            <>
              <span class={styles.separator}>~</span>
              {side(true)}
            </>
          ) : null}
        </div>
        {showNavigation ? null : <i class={joinClass(styles.inputIcon, icon)} aria-hidden="true" />}
        {showNavigation ? navArrow(1) : null}
      </div>
      {mode === "instant" && name !== undefined ? (
        <input
          type="hidden"
          name={name}
          value={formatDatePickerFormValue(type, value.date, value.time)}
        />
      ) : null}
      {mode === "period" && fromName !== undefined ? (
        <input
          type="hidden"
          name={fromName}
          value={formatDatePickerFormValue(type, value.date, value.time)}
        />
      ) : null}
      {mode === "period" && toName !== undefined ? (
        <input
          type="hidden"
          name={toName}
          value={formatDatePickerFormValue(type, value.endDate, value.endTime)}
        />
      ) : null}
    </div>
  );
}

const pad = (value: number) => String(value).padStart(2, "0");

function joinClass(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
