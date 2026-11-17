// DatePicker 표시 규칙(순수 함수) — React DatePicker와 Hono DatePicker SSR이 같이 써요
// (T4 결정 D-10: 같은 코드 한 벌). React datepicker.tsx에서 옮겨 온 그대로예요.
import type { PodoDatePickerTime } from "./datepicker-styles.js";

/** DatePicker 값 (React DatePickerValue와 같은 모양). */
export interface PodoDatePickerValue {
  date?: Date;
  time?: PodoDatePickerTime;
  endDate?: Date;
  endTime?: PodoDatePickerTime;
}

/** 날짜+시간 제한 값 (React DateTimeLimit과 같은 모양). */
export interface PodoDateTimeLimit {
  date: Date;
  time?: PodoDatePickerTime;
}

/** Quick Select 프리셋 키 (React QuickSelectKey와 같은 어휘). */
export type PodoQuickSelectKey =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth";

/**
 * 커스텀 포맷으로 날짜/시간 포맷팅
 * y: 년(4자리), m: 월(2자리), d: 일(2자리), h: 시(2자리), i: 분(2자리)
 */
export const formatWithPattern = (
  date: Date | undefined,
  time: PodoDatePickerTime | undefined,
  pattern: string
): string => {
  if (!date && !time) return "";

  let result = pattern;

  if (date) {
    result = result.replace(/y/g, String(date.getFullYear()));
    result = result.replace(/m/g, String(date.getMonth() + 1).padStart(2, "0"));
    result = result.replace(/d/g, String(date.getDate()).padStart(2, "0"));
  }

  if (time) {
    result = result.replace(/h/g, String(time.hour).padStart(2, "0"));
    result = result.replace(/i/g, String(time.minute).padStart(2, "0"));
  }

  return result;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export type NavigationStep = { type: "days"; count: number } | { type: "month"; count: number };

export const getNavigationStepForPreset = (key: PodoQuickSelectKey): NavigationStep => {
  switch (key) {
    case "today":
    case "yesterday":
      return { type: "days", count: 1 };
    case "thisWeek":
    case "lastWeek":
    case "last7Days":
      return { type: "days", count: 7 };
    case "last30Days":
      return { type: "days", count: 30 };
    case "thisMonth":
    case "lastMonth":
      return { type: "month", count: 1 };
  }
};

export const calculateNavigationStep = (start: Date, end: Date): NavigationStep => {
  const diffMs =
    new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime() -
    new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  return { type: "days", count: Math.round(diffMs / 86_400_000) + 1 };
};

export const shiftDateRange = (start: Date, step: NavigationStep, direction: 1 | -1) => {
  if (step.type === "month") {
    const shiftedMonth = start.getMonth() + step.count * direction;
    const nextStart = new Date(start.getFullYear(), shiftedMonth, 1);
    return {
      start: nextStart,
      end: new Date(nextStart.getFullYear(), nextStart.getMonth() + 1, 0),
    };
  }

  const nextStart = new Date(start);
  nextStart.setDate(nextStart.getDate() + step.count * direction);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + step.count - 1);
  return { start: nextStart, end: nextEnd };
};

export interface QuickSelectPreset {
  key: PodoQuickSelectKey;
  label: string;
}

export const QUICK_SELECT_PRESETS: QuickSelectPreset[] = [
  { key: "today", label: "오늘" },
  { key: "yesterday", label: "어제" },
  { key: "thisWeek", label: "이번 주" },
  { key: "lastWeek", label: "지난 주" },
  { key: "last7Days", label: "최근 7일" },
  { key: "last30Days", label: "최근 30일" },
  { key: "thisMonth", label: "이번 달" },
  { key: "lastMonth", label: "지난 달" },
];

export const getPresetRange = (key: PodoQuickSelectKey): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { start: new Date(today), end: new Date(today) };
    case "yesterday": {
      const date = new Date(today);
      date.setDate(date.getDate() - 1);
      return { start: date, end: new Date(date) };
    }
    case "thisWeek": {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    }
    case "lastWeek": {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    }
    case "last7Days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: new Date(today) };
    }
    case "last30Days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: new Date(today) };
    }
    case "thisMonth":
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
    case "lastMonth":
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      };
  }
};

export const dayOnly = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const limitDate = (limit: Date | PodoDateTimeLimit): Date =>
  dayOnly(limit instanceof Date ? limit : limit.date);

export const clampPresetRange = (
  range: { start: Date; end: Date },
  minDate?: Date | PodoDateTimeLimit,
  maxDate?: Date | PodoDateTimeLimit
) => ({
  start: minDate && range.start < limitDate(minDate) ? limitDate(minDate) : range.start,
  end: maxDate && range.end > limitDate(maxDate) ? limitDate(maxDate) : range.end,
});

export const isPresetDisabled = (
  key: PodoQuickSelectKey,
  minDate?: Date | PodoDateTimeLimit,
  maxDate?: Date | PodoDateTimeLimit
): boolean => {
  const { start, end } = getPresetRange(key);
  return Boolean((minDate && end < limitDate(minDate)) || (maxDate && start > limitDate(maxDate)));
};

export const isPresetActive = (
  key: PodoQuickSelectKey,
  value: PodoDatePickerValue | undefined,
  minDate?: Date | PodoDateTimeLimit,
  maxDate?: Date | PodoDateTimeLimit
): boolean => {
  if (!value?.date || !value.endDate) return false;
  const { start, end } = clampPresetRange(getPresetRange(key), minDate, maxDate);
  return isSameDay(value.date, start) && isSameDay(value.endDate, end);
};

export const getActivePresetLabel = (
  value: PodoDatePickerValue | undefined,
  minDate?: Date | PodoDateTimeLimit,
  maxDate?: Date | PodoDateTimeLimit
): string | null =>
  QUICK_SELECT_PRESETS.find((preset) => isPresetActive(preset.key, value, minDate, maxDate))
    ?.label ?? null;

/** PodoDateTimeLimit 타입 가드 */
export const isDateTimeLimit = (value: Date | PodoDateTimeLimit): value is PodoDateTimeLimit => {
  return typeof value === "object" && "date" in value && !(value instanceof Date);
};

/** DateTimeLimit에서 Date와 PodoDatePickerTime 추출 */
export const extractDateTimeLimit = (
  limit: Date | PodoDateTimeLimit
): { date: Date; time?: PodoDatePickerTime | undefined } => {
  if (isDateTimeLimit(limit)) {
    return { date: limit.date, time: limit.time };
  }
  return { date: limit };
};

// ---- 입력 칸 표시 규칙(React DatePicker 컴포넌트 안에서 옮겨 온 것) ----

const pad2 = (value: number) => String(value).padStart(2, "0");

/** format에서 시간 부분을 뺀 날짜 전용 포맷. */
export const datePickerDateOnlyFormat = (format: string | undefined): string | undefined => {
  if (!format) return undefined;
  // 시간 관련 부분 제거 (h, i 및 그 주변 문자들)
  return format
    .replace(/\s*h[:\s]*i[분]?/g, "")
    .replace(/\s*h시\s*i분/g, "")
    .trim();
};

/** 날짜 입력 칸 글자 — 값이 없으면 placeholder(또는 포맷 템플릿). */
export const datePickerDateText = (
  date: Date | undefined,
  format: string | undefined,
  placeholder: string | undefined
): string => {
  const dateFormat = datePickerDateOnlyFormat(format);
  if (!date) {
    return (
      placeholder ??
      (dateFormat
        ? dateFormat.replace(/y/g, "YYYY").replace(/m/g, "MM").replace(/d/g, "DD")
        : "YYYY - MM - DD")
    );
  }
  return dateFormat
    ? formatWithPattern(date, undefined, dateFormat)
    : `${date.getFullYear()} - ${pad2(date.getMonth() + 1)} - ${pad2(date.getDate())}`;
};

/** hour 타입의 시 라벨(24시간제 「9시」, 12시간제 「오전 9시」). */
export const datePickerHourLabel = (hour: number, hourFormat: "24" | "12"): string => {
  if (hourFormat === "24") return `${hour}시`;
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}시`;
};

/** hour 타입의 시 옵션(hourStep 간격, 23시를 넘지 않음). */
export const datePickerHourOptions = (hourStep: number): number[] =>
  Array.from({ length: Math.ceil(24 / hourStep) }, (_, index) =>
    Math.min(index * hourStep, 23)
  ).filter((hour, index, hours) => index === 0 || hour !== hours[index - 1]);

export interface DatePickerLimits {
  minDate?: Date | PodoDateTimeLimit | undefined;
  maxDate?: Date | PodoDateTimeLimit | undefined;
}

/** 시 옵션 비활성 — hour 타입 disabledHours, 같은 날 min/max 시간. */
export const isDatePickerHourDisabled = ({
  hour,
  type,
  disabledHours,
  date,
  minDate,
  maxDate,
}: DatePickerLimits & {
  hour: number;
  type: string;
  disabledHours?: number[] | undefined;
  date: Date | undefined;
}): boolean => {
  if (type === "hour" && disabledHours?.includes(hour)) return true;
  if (!date) return false;
  const minLimit = minDate ? extractDateTimeLimit(minDate) : null;
  const maxLimit = maxDate ? extractDateTimeLimit(maxDate) : null;
  if (minLimit?.time && isSameDay(date, minLimit.date) && hour < minLimit.time.hour) {
    return true;
  }
  if (maxLimit?.time && isSameDay(date, maxLimit.date) && hour > maxLimit.time.hour) {
    return true;
  }
  return false;
};

/** 분 옵션 비활성 — 같은 날·같은 시의 min/max 분. */
export const isDatePickerMinuteDisabled = ({
  minute,
  date,
  time,
  minDate,
  maxDate,
}: DatePickerLimits & {
  minute: number;
  date: Date | undefined;
  time: PodoDatePickerTime | undefined;
}): boolean => {
  if (!date || !time) return false;
  const minLimit = minDate ? extractDateTimeLimit(minDate) : null;
  const maxLimit = maxDate ? extractDateTimeLimit(maxDate) : null;
  if (
    minLimit?.time &&
    isSameDay(date, minLimit.date) &&
    time.hour === minLimit.time.hour &&
    minute < minLimit.time.minute
  ) {
    return true;
  }
  if (
    maxLimit?.time &&
    isSameDay(date, maxLimit.date) &&
    time.hour === maxLimit.time.hour &&
    minute > maxLimit.time.minute
  ) {
    return true;
  }
  return false;
};

/** 이전/다음 기간 이동이 막히는지 — 이동할 범위가 없거나 min/max 밖이면 막혀요. */
export const isDatePickerNavDisabled = (
  range: { start: Date; end: Date } | null,
  direction: 1 | -1,
  { minDate, maxDate }: DatePickerLimits
): boolean => {
  if (!range) return true;
  if (direction < 0 && minDate) return range.end < limitDate(minDate);
  if (direction > 0 && maxDate) return range.start > limitDate(maxDate);
  return false;
};
