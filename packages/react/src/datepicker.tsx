"use client";

import { useState, useRef, useEffect } from "react";
import { styles } from "./datepicker-styles.js";

// Types
export type DatePickerMode = "instant" | "period";
export type DatePickerType = "date" | "time" | "datetime";

/** 시간 값 (시, 분) */
export interface TimeValue {
  hour: number;
  minute: number;
}

export interface DatePickerValue {
  /** 시작 날짜 (년, 월, 일) */
  date?: Date;
  /** 시작 시간 (시, 분) */
  time?: TimeValue;
  /** 종료 날짜 (년, 월, 일) - period 모드에서 사용 */
  endDate?: Date;
  /** 종료 시간 (시, 분) - period 모드에서 사용 */
  endTime?: TimeValue;
}

/** 날짜 범위 정의 */
export interface DateRange {
  from: Date;
  to: Date;
}

/** 날짜 비활성화/활성화 조건 타입 */
export type DateCondition = Date | DateRange | ((date: Date) => boolean);

/** 날짜+시간 제한 값 (날짜만 또는 날짜+시간) */
export interface DateTimeLimit {
  date: Date;
  time?: TimeValue;
}

/** 분 단위 선택 옵션 */
export type MinuteStep = 1 | 5 | 10 | 15 | 20 | 30;

/** 년도 선택 범위 */
export interface YearRange {
  /** 최소 년도 */
  min?: number;
  /** 최대 년도 */
  max?: number;
}

/** 초기 달력 표시 월 설정 */
export type CalendarInitial = "now" | "prevMonth" | "nextMonth" | Date;

export interface InitialCalendar {
  /** 시작 달력 초기 월 (period 모드의 왼쪽 달력) */
  start?: CalendarInitial;
  /** 종료 달력 초기 월 (period 모드의 오른쪽 달력) */
  end?: CalendarInitial;
}

export interface DatePickerProps {
  /** 선택 모드: instant(단일) | period(기간) */
  mode?: DatePickerMode;
  /** 값 타입: date | time | datetime */
  type?: DatePickerType;
  /** 선택된 값 (controlled — 주어지면 내부 상태보다 항상 우선) */
  value?: DatePickerValue;
  /** 초기 값 (uncontrolled — value prop이 없을 때만 사용) */
  defaultValue?: DatePickerValue;
  /** 값 변경 콜백 */
  onChange?: (value: DatePickerValue) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 하단 버튼 표시 (mode가 period일 때 기본 true) */
  showActions?: boolean;
  /** 드롭다운 정렬 */
  align?: "left" | "right";
  /** 클래스명 */
  className?: string;
  /** 선택 불가능한 날짜 조건 (특정 날짜, 범위, 함수) */
  disable?: DateCondition[];
  /** 선택 가능한 날짜 조건 (지정된 날짜만 활성화) */
  enable?: DateCondition[];
  /** 선택 가능한 최소 날짜 (Date 또는 { date, time }) */
  minDate?: Date | DateTimeLimit;
  /** 선택 가능한 최대 날짜 (Date 또는 { date, time }) */
  maxDate?: Date | DateTimeLimit;
  /** 분 단위 선택 간격 (1, 5, 10, 15, 20, 30) 기본값: 1 */
  minuteStep?: MinuteStep;
  /**
   * 날짜/시간 표시 포맷
   * y: 년, m: 월, d: 일, h: 시, i: 분
   * 예시: "y-m-d", "y.m.d h:i", "y년 m월 d일 h시 i분"
   */
  format?: string;
  /**
   * 기간 선택 모드에서 초기 달력 표시 월 설정
   * start: 왼쪽 달력, end: 오른쪽 달력
   * 값: 'now' | 'prevMonth' | 'nextMonth' | Date
   */
  initialCalendar?: InitialCalendar;
  /**
   * 년도 선택 범위 설정
   * minDate/maxDate보다 우선 적용됨
   * 예시: { min: 2020, max: 2030 }
   */
  yearRange?: YearRange;
}

// Helper functions

/** CalendarInitial 값을 Date로 변환 */
const resolveCalendarInitial = (initial: CalendarInitial | undefined, fallback: Date): Date => {
  if (!initial) return fallback;
  if (initial instanceof Date) return initial;

  const now = new Date();
  switch (initial) {
    case "now":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "prevMonth":
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    case "nextMonth":
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    default:
      return fallback;
  }
};

/**
 * 커스텀 포맷으로 날짜/시간 포맷팅
 * y: 년(4자리), m: 월(2자리), d: 일(2자리), h: 시(2자리), i: 분(2자리)
 */
const formatWithPattern = (
  date: Date | undefined,
  time: TimeValue | undefined,
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

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year} - ${month} - ${day}`;
};

const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours} : ${minutes}`;
};

const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/** 달력 날짜 셀의 접근성 이름 (년-월-일 전체 포함) */
const formatDayAriaLabel = (date: Date): string =>
  `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isInRange = (date: Date, start: Date, end: Date): boolean => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d >= s && d <= e;
};

const isInRangeExclusive = (date: Date, start: Date, end: Date): boolean => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return d > s && d < e;
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/** DateRange 타입 가드 */
const isDateRange = (condition: DateCondition): condition is DateRange => {
  return typeof condition === "object" && "from" in condition && "to" in condition;
};

/** 날짜가 조건에 해당하는지 확인 */
const matchesCondition = (date: Date, condition: DateCondition): boolean => {
  if (typeof condition === "function") {
    return condition(date);
  }
  if (isDateRange(condition)) {
    return isInRange(date, condition.from, condition.to);
  }
  // Date 타입
  return isSameDay(date, condition);
};

/** 날짜가 비활성화되어야 하는지 확인 */
const isDateDisabled = (
  date: Date,
  disable?: DateCondition[],
  enable?: DateCondition[]
): boolean => {
  // enable이 지정된 경우: 지정된 조건에 맞지 않으면 비활성화
  if (enable && enable.length > 0) {
    const isEnabled = enable.some((condition) => matchesCondition(date, condition));
    return !isEnabled;
  }

  // disable이 지정된 경우: 지정된 조건에 맞으면 비활성화
  if (disable && disable.length > 0) {
    return disable.some((condition) => matchesCondition(date, condition));
  }

  return false;
};

/** DateTimeLimit 타입 가드 */
const isDateTimeLimit = (value: Date | DateTimeLimit): value is DateTimeLimit => {
  return typeof value === "object" && "date" in value && !(value instanceof Date);
};

/** DateTimeLimit에서 Date와 TimeValue 추출 */
const extractDateTimeLimit = (limit: Date | DateTimeLimit): { date: Date; time?: TimeValue } => {
  if (isDateTimeLimit(limit)) {
    return { date: limit.date, time: limit.time };
  }
  return { date: limit };
};

/**
 * 분을 minuteStep 단위로 올림하되, 결과가 60분이 되면 다음 시간으로 자리올림한다.
 * 예: 10:59, step 30 → 11:00 (기존에는 10:60이라는 잘못된 값이 나왔다)
 *
 * 경계 결정: 23시에서 자리올림이 필요한 경우(예: 23:59, step 30)는 시간 전용 값이라
 * 날짜 문맥이 없어 다음 날 00:00으로 넘길 수 없다. 이때는 23시의 가장 큰 유효 스텝
 * (step 30이면 23:30)으로 내림 클램프한다. 이 내림이 minDate/maxDate 시간 창을
 * 벗어날 수 있으므로, 커밋 사이트에서는 clampTimeToLimits로 최종 보정한다.
 */
const ceilTimeToStep = (hour: number, minute: number, step: number): TimeValue => {
  const rounded = Math.ceil(minute / step) * step;
  if (rounded < 60) {
    return { hour, minute: rounded };
  }
  if (hour >= 23) {
    // 23:59 경계 — 하루를 넘길 수 없으므로 23시의 가장 큰 유효 스텝으로 클램프
    return { hour: 23, minute: Math.floor(59 / step) * step };
  }
  return { hour: hour + 1, minute: 0 };
};

/** 날짜가 minDate보다 이전인지 확인 (날짜만 비교) */
const isBeforeMinDate = (date: Date, minDate?: Date | DateTimeLimit): boolean => {
  if (!minDate) return false;
  const { date: minDateValue } = extractDateTimeLimit(minDate);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const m = new Date(minDateValue.getFullYear(), minDateValue.getMonth(), minDateValue.getDate());
  return d < m;
};

/** 날짜가 maxDate보다 이후인지 확인 (날짜만 비교) */
const isAfterMaxDate = (date: Date, maxDate?: Date | DateTimeLimit): boolean => {
  if (!maxDate) return false;
  const { date: maxDateValue } = extractDateTimeLimit(maxDate);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const m = new Date(maxDateValue.getFullYear(), maxDateValue.getMonth(), maxDateValue.getDate());
  return d > m;
};

/** 날짜+시간이 minDate보다 이전인지 확인 */
const isBeforeMinDateTime = (
  date: Date,
  time: TimeValue | undefined,
  minDate?: Date | DateTimeLimit
): boolean => {
  if (!minDate) return false;
  const { date: minDateValue, time: minTime } = extractDateTimeLimit(minDate);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const m = new Date(minDateValue.getFullYear(), minDateValue.getMonth(), minDateValue.getDate());

  if (d < m) return true;
  if (d > m) return false;

  // 같은 날짜: 시간 비교
  if (minTime && time) {
    if (time.hour < minTime.hour) return true;
    if (time.hour === minTime.hour && time.minute < minTime.minute) return true;
  }
  return false;
};

/** 날짜+시간이 maxDate보다 이후인지 확인 */
const isAfterMaxDateTime = (
  date: Date,
  time: TimeValue | undefined,
  maxDate?: Date | DateTimeLimit
): boolean => {
  if (!maxDate) return false;
  const { date: maxDateValue, time: maxTime } = extractDateTimeLimit(maxDate);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const m = new Date(maxDateValue.getFullYear(), maxDateValue.getMonth(), maxDateValue.getDate());

  if (d > m) return true;
  if (d < m) return false;

  // 같은 날짜: 시간 비교
  if (maxTime && time) {
    if (time.hour > maxTime.hour) return true;
    if (time.hour === maxTime.hour && time.minute > maxTime.minute) return true;
  }
  return false;
};

/**
 * 스텝 보정된 시간을 minDate/maxDate의 시간 창 안으로 클램프한다.
 * ceilTimeToStep의 자리올림(예: 23:59 경계의 내림 클램프)은 스텝 정렬을 지키느라
 * min/max 창을 벗어난 시간을 만들 수 있다 — 커밋 직전에 이 함수로 보정한다.
 *
 * - 후보가 min보다 이르면: min 이상인 가장 작은 스텝 정렬 시간으로 올림.
 *   그 정렬 시간이 유효 창(max 이하, 하루 안)에 없으면 정확히 min을 사용한다.
 * - 후보가 max보다 늦으면: max 이하인 가장 큰 스텝 정렬 시간으로 내림.
 *   그 정렬 시간이 min보다 이르면 정확히 max를 사용한다.
 */
const clampTimeToLimits = (
  date: Date,
  time: TimeValue,
  minDate: Date | DateTimeLimit | undefined,
  maxDate: Date | DateTimeLimit | undefined,
  step: number
): TimeValue => {
  const minLimit = minDate ? extractDateTimeLimit(minDate) : null;
  const maxLimit = maxDate ? extractDateTimeLimit(maxDate) : null;
  const minTime = minLimit?.time && isSameDay(date, minLimit.date) ? minLimit.time : undefined;
  const maxTime = maxLimit?.time && isSameDay(date, maxLimit.date) ? maxLimit.time : undefined;
  if (!minTime && !maxTime) return time;

  const toMinutes = (t: TimeValue): number => t.hour * 60 + t.minute;
  const fromMinutes = (m: number): TimeValue => ({ hour: Math.floor(m / 60), minute: m % 60 });

  let result = time;

  if (minTime && isBeforeMinDateTime(date, result, minDate)) {
    const aligned = Math.ceil(toMinutes(minTime) / step) * step;
    const fitsWindow = aligned < 24 * 60 && (!maxTime || aligned <= toMinutes(maxTime));
    result = fitsWindow ? fromMinutes(aligned) : { ...minTime };
  }

  if (maxTime && isAfterMaxDateTime(date, result, maxDate)) {
    const aligned = Math.floor(toMinutes(maxTime) / step) * step;
    const fitsWindow = !minTime || aligned >= toMinutes(minTime);
    result = fitsWindow ? fromMinutes(aligned) : { ...maxTime };
  }

  return result;
};

// Calendar Component
interface CalendarProps {
  value?: Date;
  endValue?: Date;
  mode: DatePickerMode;
  onSelect: (date: Date) => void;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
  /** 네비게이션 버튼 표시 여부 (기본: true) */
  showPrevNav?: boolean;
  showNextNav?: boolean;
  /** 이동 가능한 최소 년/월 (이 값보다 이전으로 이동 불가) */
  minViewDate?: Date;
  /** 이동 가능한 최대 년/월 (이 값보다 이후로 이동 불가) */
  maxViewDate?: Date;
  /** 선택 불가능한 날짜 조건 */
  disable?: DateCondition[];
  /** 선택 가능한 날짜 조건 */
  enable?: DateCondition[];
  /** 선택 가능한 최소 날짜 */
  minDate?: Date | DateTimeLimit;
  /** 선택 가능한 최대 날짜 */
  maxDate?: Date | DateTimeLimit;
  /** 년도 선택 범위 */
  yearRange?: YearRange;
}

const Calendar: React.FC<CalendarProps> = ({
  value,
  endValue,
  mode,
  onSelect,
  viewDate,
  onViewDateChange,
  showPrevNav = true,
  showNextNav = true,
  minViewDate,
  maxViewDate,
  disable,
  enable,
  minDate,
  maxDate,
  yearRange,
}) => {
  const today = new Date();

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const gridRef = useRef<HTMLDivElement>(null);
  // 방향키로 이동한 포커스 대상 날짜 (roving tabindex 패턴)
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);

  // 날짜 비활성화 확인 (disable/enable + minDate/maxDate)
  const checkDateDisabled = (date: Date): boolean => {
    if (isDateDisabled(date, disable, enable)) return true;
    if (isBeforeMinDate(date, minDate)) return true;
    if (isAfterMaxDate(date, maxDate)) return true;
    return false;
  };

  // Roving tabindex: 현재 표시 월에서 포커스 가능한(비활성이 아닌) 날짜 셀 하나만
  // tabIndex=0을 갖는다. 비활성 셀은 native disabled라 포커스할 수 없으므로
  // roving 후보에서 제외해야 그리드가 탭 순서에서 사라지지 않는다.
  // 우선순위: 방향키로 이동한 날짜 > 선택된 날짜 > 오늘 > 해당 월의 첫 활성 날짜
  // (각 후보는 활성일 때만 채택). 월 전체가 비활성이면 어떤 셀도 tabIndex=0을
  // 갖지 않는다 — 잘못된(포커스 불가) 탭 정지를 만들지 않기 위한 문서화된 결정.
  const isInViewMonth = (d: Date): boolean => d.getFullYear() === year && d.getMonth() === month;
  const isDayEnabled = (day: number): boolean => !checkDateDisabled(new Date(year, month, day));
  let rovingDay: number | null = null;
  if (focusedDate && isInViewMonth(focusedDate) && isDayEnabled(focusedDate.getDate())) {
    rovingDay = focusedDate.getDate();
  } else if (value && isInViewMonth(value) && isDayEnabled(value.getDate())) {
    rovingDay = value.getDate();
  } else if (isInViewMonth(today) && isDayEnabled(today.getDate())) {
    rovingDay = today.getDate();
  } else {
    const totalDays = getDaysInMonth(year, month);
    for (let day = 1; day <= totalDays; day++) {
      if (isDayEnabled(day)) {
        rovingDay = day;
        break;
      }
    }
  }

  // 방향키 이동 후 포커스가 roving 셀을 따라가도록 한다 (월 이동 포함)
  useEffect(() => {
    if (!focusedDate) return;
    if (focusedDate.getFullYear() !== year || focusedDate.getMonth() !== month) return;
    const cell = gridRef.current?.querySelector<HTMLButtonElement>(
      `button[data-day="${focusedDate.getDate()}"]`
    );
    cell?.focus();
  }, [focusedDate, year, month]);

  /**
   * start부터 step 방향(±1일)으로 하루씩 이동하며 첫 활성 날짜를 찾는다.
   * 활성 날짜가 없으면 null — 호출부는 이동하지 않는다(경계 정지).
   * disable 조건이 임의 함수일 수 있어 무한 탐색을 막기 위해 366일까지만 살핀다.
   */
  const findEnabledDay = (start: Date, step: 1 | -1): Date | null => {
    const candidate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    for (let i = 0; i < 366; i++) {
      if (!checkDateDisabled(candidate)) {
        return candidate;
      }
      candidate.setDate(candidate.getDate() + step);
    }
    return null;
  };

  const handleDayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let target: Date | null = null;
    let direction: 1 | -1 = 1;
    switch (event.key) {
      case "ArrowLeft":
        target = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
        direction = -1;
        break;
      case "ArrowRight":
        target = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
        direction = 1;
        break;
      case "ArrowUp":
        target = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7);
        direction = -1;
        break;
      case "ArrowDown":
        target = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
        direction = 1;
        break;
      case "Home":
        // 주(일요일 시작)의 첫 날로 이동 — 첫 날이 비활성이면 이전 주로 벗어나지
        // 않고 주 안쪽(+1 방향)에서 가장 가까운 활성 날짜에 멈춘다
        target = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
        direction = 1;
        break;
      case "End":
        // 주의 마지막 날(토요일)로 이동 — 마지막 날이 비활성이면 다음 주로 벗어나지
        // 않고 주 안쪽(-1 방향)에서 가장 가까운 활성 날짜에 멈춘다
        target = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + (6 - date.getDay())
        );
        direction = -1;
        break;
      case "Enter":
      case " ":
        // 브라우저의 Enter/Space→click 합성과 중복 선택되지 않도록 직접 처리한다
        event.preventDefault();
        if (!checkDateDisabled(date)) onSelect(date);
        return;
      default:
        return;
    }

    event.preventDefault();
    // 비활성 날짜는 이동 방향으로 건너뛴다. ±7 이동(주 단위)도 목표 지점부터
    // 같은 방향으로 가장 가까운 활성 날짜로 떨어진다. Home/End는 주 경계가
    // 비활성이면 주 안쪽으로 되짚어 멈춘다(포커스된 날짜가 활성이므로 항상
    // 존재). 방향에 활성 날짜가 없으면 이동하지 않는다(경계 정지) —
    // 포커스가 disabled 셀로 가서 사라지는 일을 막는다.
    const enabledTarget = findEnabledDay(target, direction);
    if (!enabledTarget) return;
    setFocusedDate(enabledTarget);
    // 월 경계를 넘으면 달력 표시 월도 함께 이동한다 — 실제로 활성 날짜를 찾은
    // 경우에만 이동하므로, 대상 방향에 활성 날짜가 없으면 월도 바뀌지 않는다.
    if (!isInViewMonth(enabledTarget)) {
      onViewDateChange(new Date(enabledTarget.getFullYear(), enabledTarget.getMonth(), 1));
    }
  };

  // 년도 범위 계산 (우선순위: yearRange > minDate/maxDate > 기본값 ±100년)
  const currentYear = today.getFullYear();
  const calculateYearBounds = () => {
    let minYearBound = currentYear - 100;
    let maxYearBound = currentYear + 100;

    // minDate/maxDate에서 년도 추출
    if (minDate) {
      const { date } = extractDateTimeLimit(minDate);
      minYearBound = Math.max(minYearBound, date.getFullYear());
    }
    if (maxDate) {
      const { date } = extractDateTimeLimit(maxDate);
      maxYearBound = Math.min(maxYearBound, date.getFullYear());
    }

    // yearRange가 있으면 우선 적용
    if (yearRange?.min !== undefined) minYearBound = yearRange.min;
    if (yearRange?.max !== undefined) maxYearBound = yearRange.max;

    return { minYearBound, maxYearBound };
  };

  const { minYearBound, maxYearBound } = calculateYearBounds();
  const yearOptions = Array.from(
    { length: Math.max(0, maxYearBound - minYearBound + 1) },
    (_, i) => minYearBound + i
  );

  // 월 옵션: 1~12월
  const monthOptions = Array.from({ length: 12 }, (_, i) => i);

  // minViewDate/maxViewDate 기반 제한 계산
  const minYear = minViewDate?.getFullYear();
  const minMonth = minViewDate?.getMonth();
  const maxYear = maxViewDate?.getFullYear();
  const maxMonth = maxViewDate?.getMonth();

  // 이전 월 버튼 비활성화 여부
  const isPrevDisabled = minViewDate
    ? year < minYear! || (year === minYear && month <= minMonth!)
    : false;

  // 다음 월 버튼 비활성화 여부
  const isNextDisabled = maxViewDate
    ? year > maxYear! || (year === maxYear && month >= maxMonth!)
    : false;

  // 년도 옵션 필터링 (선택 가능한 년도만)
  const filteredYearOptions = yearOptions.filter((y) => {
    if (minYear !== undefined && y < minYear) return false;
    if (maxYear !== undefined && y > maxYear) return false;
    return true;
  });

  // 표시 중인 년도가 옵션 범위 밖일 수 있다 — yearRange 밖의 controlled 값,
  // 최대/최소 년도 너머로 월 이동한 경우 등. select가 빈 표시가 되지 않도록
  // 표시 년도를 추가(선택된) 옵션으로 렌더한다. 이 옵션은 현재 표시 년도일
  // 때만 존재해 일반 선택 흐름에는 나타나지 않는다 (분 select와 동일한 결정).
  const optionYears = filteredYearOptions.includes(year)
    ? filteredYearOptions
    : [...filteredYearOptions, year].sort((a, b) => a - b);

  // 월 옵션 필터링 (현재 선택된 년도에서 선택 가능한 월만)
  const filteredMonthOptions = monthOptions.filter((m) => {
    if (minYear !== undefined && minMonth !== undefined) {
      if (year === minYear && m < minMonth) return false;
    }
    if (maxYear !== undefined && maxMonth !== undefined) {
      if (year === maxYear && m > maxMonth) return false;
    }
    return true;
  });

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    onViewDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (isNextDisabled) return;
    onViewDateChange(new Date(year, month + 1, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // 년도만 바꾼 결과(월 유지)가 minViewDate/maxViewDate 범위를 벗어나면 경계
    // 월로 클램프한다 — 기간 달력에서 왼쪽이 오른쪽보다 이후 월로 뛰는 것(및
    // 표시 월이 월 옵션에 없어 select가 빈 표시가 되는 것)을 막는다.
    let next = new Date(parseInt(e.target.value), month, 1);
    if (minViewDate) {
      const min = new Date(minViewDate.getFullYear(), minViewDate.getMonth(), 1);
      if (next < min) next = min;
    }
    if (maxViewDate) {
      const max = new Date(maxViewDate.getFullYear(), maxViewDate.getMonth(), 1);
      if (next > max) next = max;
    }
    onViewDateChange(next);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onViewDateChange(new Date(year, parseInt(e.target.value), 1));
  };

  const renderDaysView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const prevMonthDays = getDaysInMonth(year, month - 1);

    const days: React.ReactNode[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, day);
      const isDisabled = checkDateDisabled(prevDate);
      days.push(
        <button
          key={`prev-${day}`}
          type="button"
          role="gridcell"
          aria-label={formatDayAriaLabel(prevDate)}
          aria-selected={false}
          className={`${styles.calendarCell} ${styles.other} ${isDisabled ? styles.disabled : ""}`}
          onClick={() => !isDisabled && onSelect(prevDate)}
          onKeyDown={(e) => handleDayKeyDown(e, prevDate)}
          tabIndex={-1}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = isSameDay(date, today);
      const isSelected = value && isSameDay(date, value);
      const isRangeStart = mode === "period" && value && isSameDay(date, value);
      const isRangeEnd = mode === "period" && endValue && isSameDay(date, endValue);
      const isInRangeDay =
        mode === "period" && value && endValue && isInRangeExclusive(date, value, endValue);
      const isDisabled = checkDateDisabled(date);

      let cellClass = styles.calendarCell;
      if (isDisabled) cellClass += ` ${styles.disabled}`;
      if (isToday && !isSelected && !isRangeStart && !isRangeEnd) cellClass += ` ${styles.today}`;
      if (mode === "instant" && isSelected) cellClass += ` ${styles.selected}`;
      if (isRangeStart) cellClass += ` ${styles.rangeStart}`;
      if (isRangeEnd) cellClass += ` ${styles.rangeEnd}`;
      if (isInRangeDay) cellClass += ` ${styles.inRange}`;

      const isSelectedCell = Boolean(
        (mode === "instant" && isSelected) || isRangeStart || isRangeEnd
      );

      days.push(
        <button
          key={day}
          type="button"
          role="gridcell"
          aria-label={formatDayAriaLabel(date)}
          aria-selected={isSelectedCell}
          className={cellClass}
          onClick={() => !isDisabled && onSelect(date)}
          onKeyDown={(e) => handleDayKeyDown(e, date)}
          data-day={day}
          tabIndex={day === rovingDay ? 0 : -1}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingDays = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      const isDisabled = checkDateDisabled(nextDate);
      days.push(
        <button
          key={`next-${day}`}
          type="button"
          role="gridcell"
          aria-label={formatDayAriaLabel(nextDate)}
          aria-selected={false}
          className={`${styles.calendarCell} ${styles.other} ${isDisabled ? styles.disabled : ""}`}
          onClick={() => !isDisabled && onSelect(nextDate)}
          onKeyDown={(e) => handleDayKeyDown(e, nextDate)}
          tabIndex={-1}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    // Group into rows
    const rows: React.ReactNode[] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(
        <div key={i} className={styles.calendarRow} role="row">
          {days.slice(i, i + 7)}
        </div>
      );
    }

    return (
      <>
        <div className={styles.calendarRow} role="row">
          {weekDays.map((day) => (
            <div
              key={day}
              role="columnheader"
              className={`${styles.calendarCell} ${styles.header}`}
            >
              {day}
            </div>
          ))}
        </div>
        {rows}
      </>
    );
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarNav}>
        {showPrevNav ? (
          <button
            type="button"
            className={styles.navButton}
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            aria-label="이전 달"
          >
            <i className="podo-icon podo-icon-chevron-left" aria-hidden="true" />
          </button>
        ) : (
          <div className={styles.navButtonPlaceholder} />
        )}
        <div className={styles.navTitle}>
          <div className={styles.navSelectWrapper}>
            <select
              className={styles.navSelect}
              value={year}
              onChange={handleYearChange}
              aria-label="년도 선택"
            >
              {optionYears.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
          <div className={styles.navSelectWrapper}>
            <select
              className={styles.navSelect}
              value={month}
              onChange={handleMonthChange}
              aria-label="월 선택"
            >
              {filteredMonthOptions.map((m) => (
                <option key={m} value={m}>
                  {m + 1}월
                </option>
              ))}
            </select>
          </div>
        </div>
        {showNextNav ? (
          <button
            type="button"
            className={styles.navButton}
            onClick={handleNextMonth}
            disabled={isNextDisabled}
            aria-label="다음 달"
          >
            <i className="podo-icon podo-icon-chevron-right" aria-hidden="true" />
          </button>
        ) : (
          <div className={styles.navButtonPlaceholder} />
        )}
      </div>
      <div
        ref={gridRef}
        className={styles.calendarGrid}
        role="grid"
        aria-label={`${year}년 ${month + 1}월`}
      >
        {renderDaysView()}
      </div>
    </div>
  );
};

// Period Calendar Component (두 개의 달력을 나란히 표시)
interface PeriodCalendarProps {
  value?: Date;
  endValue?: Date;
  onSelect: (date: Date) => void;
  viewDate: Date;
  endViewDate: Date;
  onViewDateChange: (date: Date) => void;
  onEndViewDateChange: (date: Date) => void;
  /** 선택 불가능한 날짜 조건 */
  disable?: DateCondition[];
  /** 선택 가능한 날짜 조건 */
  enable?: DateCondition[];
  /** 선택 가능한 최소 날짜 */
  minDate?: Date | DateTimeLimit;
  /** 선택 가능한 최대 날짜 */
  maxDate?: Date | DateTimeLimit;
  /** 년도 선택 범위 */
  yearRange?: YearRange;
}

const PeriodCalendar: React.FC<PeriodCalendarProps> = ({
  value,
  endValue,
  onSelect,
  viewDate,
  endViewDate,
  onViewDateChange,
  onEndViewDateChange,
  disable,
  enable,
  minDate,
  maxDate,
  yearRange,
}) => {
  // 왼쪽 달력: 오른쪽 달력(endViewDate)보다 이후로 이동 불가
  // 오른쪽 달력: 왼쪽 달력(viewDate)보다 이전으로 이동 불가
  return (
    <div className={styles.periodCalendars}>
      <div className={styles.periodCalendarLeft}>
        <Calendar
          value={value}
          endValue={endValue}
          mode="period"
          onSelect={onSelect}
          viewDate={viewDate}
          onViewDateChange={onViewDateChange}
          showPrevNav={true}
          showNextNav={true}
          maxViewDate={endViewDate}
          disable={disable}
          enable={enable}
          minDate={minDate}
          maxDate={maxDate}
          yearRange={yearRange}
        />
      </div>
      <div className={styles.periodCalendarRight}>
        <Calendar
          value={value}
          endValue={endValue}
          mode="period"
          onSelect={onSelect}
          viewDate={endViewDate}
          onViewDateChange={onEndViewDateChange}
          showPrevNav={true}
          showNextNav={true}
          minViewDate={viewDate}
          disable={disable}
          enable={enable}
          minDate={minDate}
          maxDate={maxDate}
          yearRange={yearRange}
        />
      </div>
    </div>
  );
};

// Selecting part types
type SelectingPart = "date" | "hour" | "minute" | "endDate" | "endHour" | "endMinute" | null;

// Main DatePicker Component
const DatePicker: React.FC<DatePickerProps> = ({
  mode = "instant",
  type = "date",
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  showActions,
  align = "left",
  className,
  disable,
  enable,
  minDate,
  maxDate,
  minuteStep = 1,
  format,
  initialCalendar,
  yearRange,
}) => {
  const [selectingPart, setSelectingPart] = useState<SelectingPart>(null);
  // Uncontrolled fallback — value prop이 있으면 controlled (Select의
  // defaultValue 패턴과 동일). 커밋된 선택이 여기 쌓여 value 없이도 렌더된다.
  const [internalValue, setInternalValue] = useState<DatePickerValue>(defaultValue ?? {});
  // 렌더와 취소(리셋) 기준이 되는 커밋된 값 — value prop이 항상 이긴다.
  const committedValue = value !== undefined ? value : internalValue;
  const [tempValue, setTempValue] = useState<DatePickerValue>(committedValue);
  // showActions 사용 시 아직 커밋(적용)되지 않은 임시 변경이 있는지 여부.
  // 달력이 닫혀 있어도(시간 전용 패널 등) 적용/초기화 버튼을 노출하기 위해 사용한다.
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // 초기 달력 표시 월 계산
  const [viewDate, setViewDate] = useState(() => {
    if (committedValue.date) return committedValue.date;
    if (initialCalendar?.start) {
      return resolveCalendarInitial(initialCalendar.start, new Date());
    }
    return new Date();
  });

  const [endViewDate, setEndViewDate] = useState(() => {
    const endDate = committedValue.endDate;
    if (endDate) {
      return new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);
    }
    if (initialCalendar?.end) {
      return resolveCalendarInitial(initialCalendar.end, new Date());
    }
    // 기본값: 현재 달의 다음 달
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const shouldShowActions = showActions ?? mode === "period";
  // 날짜 선택 시에만 달력 드롭다운 표시 (시/분은 native select 사용)
  const isCalendarOpen = selectingPart === "date" || selectingPart === "endDate";
  // 적용/초기화 버튼: 달력이 열려 있거나, 커밋되지 않은 임시 변경이 있을 때 표시
  // (시간 전용 패널은 달력을 열지 않으므로 pending 변경만으로도 노출되어야 함)
  const isActionsVisible = shouldShowActions && (isCalendarOpen || hasPendingChanges);
  // disabled는 렌더 단계에서도 드롭다운을 항상 거부한다 — 열린 채 disabled로
  // 바뀌어도 정리 effect가 돌기 전 한 프레임조차 상호작용 UI가 남지 않는다.
  const isDropdownOpen = !disabled && (isCalendarOpen || isActionsVisible);

  // 바깥 클릭으로 닫기 — Escape와 동일한 취소 의미론.
  // 커밋되지 않은 임시 변경을 버려 pending 상태를 정리해야 액션 버튼이 노출된
  // 드롭다운(hasPendingChanges)도 닫힌다. pending이 없는 일반 케이스에서는
  // tempValue가 이미 value와 같으므로 기존과 동일하게 "그냥 닫기"로 동작한다.
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setTempValue(committedValue);
        setHasPendingChanges(false);
        setSelectingPart(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, committedValue]);

  // Escape로 닫기: 커밋되지 않은 임시 변경을 버리고(취소) 트리거 입력으로 포커스 복귀
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTempValue(committedValue);
      setHasPendingChanges(false);
      setSelectingPart(null);
      const trigger = inputRef.current?.querySelector<HTMLElement>("button, select");
      trigger?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDropdownOpen, committedValue]);

  // Sync temp value with the committed value (controlled prop 또는 내부 커밋)
  useEffect(() => {
    setTempValue(committedValue);
    setHasPendingChanges(false);

    // 커밋된 값이 다른 달로 바뀌면 달력 표시 월도 함께 이동한다 —
    // 외부 갱신된 값이 이전 달 화면 뒤에 갇혀 보이지 않는 문제를 막는다.
    // 같은 달이면 기존 표시 월 객체를 유지해 불필요한 리렌더를 피한다.
    const startDate = committedValue.date;
    if (startDate) {
      setViewDate((prev) =>
        prev.getFullYear() === startDate.getFullYear() && prev.getMonth() === startDate.getMonth()
          ? prev
          : new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      );
    }
    const endDate = committedValue.endDate;
    if (endDate) {
      // 종료 달력: 시작일과 같은 달이면 초기화 규칙과 동일하게 다음 달을 보여주고,
      // 다른 달이면 종료일의 달을 직접 보여줘 종료일이 실제로 보이게 한다.
      const sameMonthAsStart =
        !!startDate &&
        endDate.getFullYear() === startDate.getFullYear() &&
        endDate.getMonth() === startDate.getMonth();
      const target = sameMonthAsStart
        ? new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1)
        : new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      setEndViewDate((prev) =>
        prev.getFullYear() === target.getFullYear() && prev.getMonth() === target.getMonth()
          ? prev
          : target
      );
    }
  }, [committedValue]);

  // 열린 채 disabled로 바뀌면 취소 의미론으로 닫는다 (Select와 동일한 패턴):
  // 커밋되지 않은 임시 변경을 버리고 pending 상태를 정리해, 나중에 다시
  // 활성화될 때 드롭다운이 저절로 되살아나지 않게 한다.
  useEffect(() => {
    if (disabled && (selectingPart !== null || hasPendingChanges)) {
      setTempValue(committedValue);
      setHasPendingChanges(false);
      setSelectingPart(null);
    }
  }, [disabled, selectingPart, hasPendingChanges, committedValue]);

  const formatPeriodText = () => {
    if (!tempValue.date) return "";

    // format prop이 있으면 사용
    if (format) {
      const startText = formatWithPattern(tempValue.date, tempValue.time, format);
      if (tempValue.endDate) {
        const endText = formatWithPattern(tempValue.endDate, tempValue.endTime, format);
        return `${startText} ~ ${endText}`;
      }
      return startText;
    }

    // 기본 포맷 (한국어)
    const formatKoreanDateTime = (date: Date, time?: TimeValue) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${year}년 ${month}월 ${day}일`;
      if (type === "datetime" && time) {
        const hours = String(time.hour).padStart(2, "0");
        const minutes = String(time.minute).padStart(2, "0");
        return `${dateStr} ${hours}:${minutes}`;
      }
      return dateStr;
    };
    const startText = formatKoreanDateTime(tempValue.date, tempValue.time);
    if (tempValue.endDate) {
      const endText = formatKoreanDateTime(tempValue.endDate, tempValue.endTime);
      return `${startText} ~ ${endText}`;
    }
    return startText;
  };

  // 날짜 선택 시 시간을 minDate/maxDate 범위 내로 자동 보정
  const adjustTimeForDate = (date: Date, time: TimeValue | undefined): TimeValue | undefined => {
    if (!time) return time;

    const minLimit = minDate ? extractDateTimeLimit(minDate) : null;
    const maxLimit = maxDate ? extractDateTimeLimit(maxDate) : null;

    let adjustedHour = time.hour;
    let adjustedMinute = time.minute;

    // minDate와 같은 날짜인 경우
    if (minLimit?.time && isSameDay(date, minLimit.date)) {
      if (
        adjustedHour < minLimit.time.hour ||
        (adjustedHour === minLimit.time.hour && adjustedMinute < minLimit.time.minute)
      ) {
        // minuteStep에 맞춰 올림 (60분 오버플로는 다음 시간으로 자리올림)
        const carried = ceilTimeToStep(minLimit.time.hour, minLimit.time.minute, minuteStep);
        adjustedHour = carried.hour;
        adjustedMinute = carried.minute;
      }
    }

    // maxDate와 같은 날짜인 경우
    if (maxLimit?.time && isSameDay(date, maxLimit.date)) {
      if (adjustedHour > maxLimit.time.hour) {
        adjustedHour = maxLimit.time.hour;
        // minuteStep에 맞춰 내림
        adjustedMinute = Math.floor(maxLimit.time.minute / minuteStep) * minuteStep;
      } else if (adjustedHour === maxLimit.time.hour && adjustedMinute > maxLimit.time.minute) {
        // minuteStep에 맞춰 내림
        adjustedMinute = Math.floor(maxLimit.time.minute / minuteStep) * minuteStep;
      }
    }

    // 스텝 보정(자리올림/내림) 결과가 min/max 시간 창을 벗어났으면 창 안으로 클램프한다
    const clamped = clampTimeToLimits(
      date,
      { hour: adjustedHour, minute: adjustedMinute },
      minDate,
      maxDate,
      minuteStep
    );

    if (clamped.hour !== time.hour || clamped.minute !== time.minute) {
      return clamped;
    }
    return time;
  };

  // 커밋 헬퍼 — 모든 커밋 경로(즉시 날짜 선택, 시/분 변경, 적용, 초기화)가 이
  // 함수를 거친다. uncontrolled(value prop 없음)에서는 내부 커밋 값을 갱신해
  // 선택이 화면에 남고, controlled에서는 value prop이 항상 이기므로 내부
  // 상태를 건드리지 않는다. onChange는 두 모드에서 동일하게 불린다.
  const commitValue = (next: DatePickerValue) => {
    if (value === undefined) {
      setInternalValue(next);
    }
    onChange?.(next);
  };

  const handleDateSelect = (date: Date) => {
    // disabled 상태에서는 어떤 경로로도 값이 바뀌면 안 된다 (방어적 가드)
    if (disabled) return;
    // 날짜만 저장 (시간은 별도 time/endTime으로 관리)
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // instant 모드: 단일 날짜 선택
    if (mode === "instant") {
      const adjustedTime = adjustTimeForDate(newDate, tempValue.time);
      const newValue = { ...tempValue, date: newDate, time: adjustedTime };
      setTempValue(newValue);
      if (shouldShowActions) {
        // 적용 버튼으로 커밋해야 하므로 드롭다운을 유지한다
        setHasPendingChanges(true);
        return;
      }
      // 액션 버튼이 없으면 선택 즉시 커밋 후 닫기
      commitValue(newValue);
      setSelectingPart(null);
      return;
    }

    // period 모드: 기간 선택 로직
    // 시작일/종료일이 같을 수 있음
    // 시작일이 종료일보다 이후일 수 없음 (자동 정렬)
    // 종료일이 시작일보다 이전일 수 없음 (자동 정렬)
    // 하나만 선택해도 드롭다운 유지 (적용 버튼으로 닫음)

    const existingStartDate = tempValue.date;
    const existingEndDate = tempValue.endDate;

    let nextValue: DatePickerValue;
    let rangeCompleted = false;

    if (!existingStartDate) {
      // 첫 번째 날짜 선택: 시작일 설정 (드롭다운 유지 - 종료일 선택 대기)
      const adjustedTime = adjustTimeForDate(newDate, tempValue.time);
      nextValue = { ...tempValue, date: newDate, time: adjustedTime };
    } else if (!existingEndDate) {
      // 두 번째 날짜 선택: 시작일/종료일 자동 정렬
      const dateOnly = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      const startDateOnly = new Date(
        existingStartDate.getFullYear(),
        existingStartDate.getMonth(),
        existingStartDate.getDate()
      );

      if (dateOnly < startDateOnly) {
        // 선택한 날짜가 시작일보다 이전 → 스왑 (선택한 날짜가 시작일, 기존 시작일이 종료일)
        // 날짜와 함께 시작/종료 시간도 스왑하고 각 날짜에 맞춰 범위 보정한다:
        // 기존 시작일에 붙어 있던 time은 종료 시간이 되고, 대기 중이던 endTime은
        // 새 시작일의 시간이 된다 (endTime을 버리지 않는다).
        const adjustedStartTime = adjustTimeForDate(newDate, tempValue.endTime);
        const adjustedEndTime = adjustTimeForDate(existingStartDate, tempValue.time);
        nextValue = {
          date: newDate,
          time: adjustedStartTime,
          endDate: existingStartDate,
          endTime: adjustedEndTime,
        };
      } else {
        // 선택한 날짜가 시작일 이후/같음 → 종료일로 설정
        const adjustedEndTime = adjustTimeForDate(newDate, tempValue.endTime);
        nextValue = { ...tempValue, endDate: newDate, endTime: adjustedEndTime };
      }
      rangeCompleted = true;
    } else {
      // 이미 둘 다 선택된 경우 → 새로운 시작일로 리셋
      const adjustedTime = adjustTimeForDate(newDate, tempValue.time);
      nextValue = { date: newDate, time: adjustedTime, endDate: undefined, endTime: undefined };
    }

    setTempValue(nextValue);
    if (shouldShowActions) {
      // 드롭다운 유지 - 적용 버튼으로 커밋/닫음
      setHasPendingChanges(true);
      return;
    }
    // 액션 버튼이 없으면 선택 즉시 커밋하고, 기간이 완성되면 닫는다
    commitValue(nextValue);
    if (rangeCompleted) {
      setSelectingPart(null);
    }
  };

  const handleReset = () => {
    // disabled 상태에서는 어떤 경로로도 값이 바뀌면 안 된다 (방어적 가드)
    if (disabled) return;
    // 초기화는 비워진 값을 실제로 커밋해야 controlled 소비자도 함께 비워진다
    const clearedValue: DatePickerValue = {};
    setTempValue(clearedValue);
    setHasPendingChanges(false);
    setSelectingPart(null);
    commitValue(clearedValue);
  };

  const handleApply = () => {
    // disabled 상태에서는 어떤 경로로도 값이 바뀌면 안 된다 (방어적 가드)
    if (disabled) return;
    commitValue(tempValue);
    setHasPendingChanges(false);
    setSelectingPart(null);
  };

  const handlePartClick = (part: SelectingPart) => {
    if (disabled) return;
    setSelectingPart(selectingPart === part ? null : part);
  };

  const displayValue = shouldShowActions ? tempValue : committedValue;
  const hasStartValue = !!displayValue?.date;
  const hasEndValue = !!displayValue?.endDate;

  // 날짜만 표시하는 포맷 (시간 제외)
  const getDateOnlyFormat = (): string | undefined => {
    if (!format) return undefined;
    // 시간 관련 부분 제거 (h, i 및 그 주변 문자들)
    return format
      .replace(/\s*h[:\s]*i[분]?/g, "")
      .replace(/\s*h시\s*i분/g, "")
      .trim();
  };

  // Helper to render date button
  const renderDateButton = (
    date: Date | undefined,
    isActive: boolean,
    onClick: () => void,
    isPlaceholder: boolean
  ) => {
    const dateFormat = getDateOnlyFormat();

    if (isPlaceholder || !date) {
      // placeholder prop이 있으면 우선 사용, 없으면 포맷 템플릿으로 표시
      const placeholderText =
        placeholder ??
        (dateFormat
          ? dateFormat.replace(/y/g, "YYYY").replace(/m/g, "MM").replace(/d/g, "DD")
          : "YYYY - MM - DD");

      return (
        <button
          type="button"
          className={`${styles.inputPart} ${isActive ? styles.active : ""} ${styles.placeholder}`}
          onClick={onClick}
          disabled={disabled}
          aria-disabled={disabled}
        >
          {placeholderText}
        </button>
      );
    }

    // format prop이 있으면 사용 (날짜만)
    const displayText = dateFormat
      ? formatWithPattern(date, undefined, dateFormat)
      : `${date.getFullYear()} - ${String(date.getMonth() + 1).padStart(2, "0")} - ${String(date.getDate()).padStart(2, "0")}`;

    return (
      <button
        type="button"
        className={`${styles.inputPart} ${isActive ? styles.active : ""}`}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
      >
        {displayText}
      </button>
    );
  };

  // Helper to render hour select
  const renderHourSelect = (
    time: TimeValue | undefined,
    part: SelectingPart,
    isPlaceholder: boolean
  ) => {
    const hour = time?.hour ?? 0;
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isEnd = part === "endHour";
    const currentDate = isEnd ? tempValue.endDate : tempValue.date;

    // minDate/maxDate 시간 제한 계산
    const minLimit = minDate ? extractDateTimeLimit(minDate) : null;
    const maxLimit = maxDate ? extractDateTimeLimit(maxDate) : null;

    const isHourDisabled = (h: number): boolean => {
      if (!currentDate) return false;

      // minDate와 같은 날짜인 경우
      if (minLimit?.time && isSameDay(currentDate, minLimit.date)) {
        if (h < minLimit.time.hour) return true;
      }
      // maxDate와 같은 날짜인 경우
      if (maxLimit?.time && isSameDay(currentDate, maxLimit.date)) {
        if (h > maxLimit.time.hour) return true;
      }
      return false;
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedHour = parseInt(e.target.value, 10);
      const currentTime = isEnd ? tempValue.endTime : tempValue.time;
      let newHour = selectedHour;
      let newMinute = currentTime?.minute ?? 0;

      // 시간 변경 시 분이 범위를 벗어나면 자동 보정
      if (currentDate) {
        // minDate와 같은 날짜이고 선택한 시간이 minLimit 시간과 같은 경우
        if (
          minLimit?.time &&
          isSameDay(currentDate, minLimit.date) &&
          selectedHour === minLimit.time.hour
        ) {
          if (newMinute < minLimit.time.minute) {
            // minuteStep에 맞춰 올림 (60분 오버플로는 다음 시간으로 자리올림)
            const carried = ceilTimeToStep(selectedHour, minLimit.time.minute, minuteStep);
            newHour = carried.hour;
            newMinute = carried.minute;
          }
        }
        // maxDate와 같은 날짜이고 (자리올림 반영 후) 시간이 maxLimit 시간과 같은 경우
        if (
          maxLimit?.time &&
          isSameDay(currentDate, maxLimit.date) &&
          newHour === maxLimit.time.hour
        ) {
          if (newMinute > maxLimit.time.minute) {
            // minuteStep에 맞춰 내림
            newMinute = Math.floor(maxLimit.time.minute / minuteStep) * minuteStep;
          }
        }
      }

      // minuteStep에 맞지 않는 분 값 보정
      if (newMinute % minuteStep !== 0) {
        newMinute = Math.floor(newMinute / minuteStep) * minuteStep;
      }

      // 스텝 보정 결과가 min/max 시간 창을 벗어났으면 창 안으로 클램프한다
      const newTime: TimeValue = currentDate
        ? clampTimeToLimits(
            currentDate,
            { hour: newHour, minute: newMinute },
            minDate,
            maxDate,
            minuteStep
          )
        : { hour: newHour, minute: newMinute };

      const newValue = isEnd ? { ...tempValue, endTime: newTime } : { ...tempValue, time: newTime };
      setTempValue(newValue);
      if (shouldShowActions) {
        // 적용 버튼으로 커밋 — 시간 패널에서도 액션 영역이 노출되도록 표시
        setHasPendingChanges(true);
      } else {
        commitValue(newValue);
      }
    };

    return (
      <select
        className={`${styles.timeSelect} ${isPlaceholder ? styles.placeholder : ""}`}
        value={hour}
        onChange={handleChange}
        disabled={disabled}
        aria-label={isEnd ? "종료 시 선택" : "시 선택"}
      >
        {hours.map((h) => (
          <option key={h} value={h} disabled={isHourDisabled(h)}>
            {String(h).padStart(2, "0")}
          </option>
        ))}
      </select>
    );
  };

  // Helper to render minute select
  const renderMinuteSelect = (
    time: TimeValue | undefined,
    part: SelectingPart,
    isPlaceholder: boolean
  ) => {
    const minute = time?.minute ?? 0;
    // minuteStep에 따라 분 옵션 생성 (0, step, step*2, ...)
    const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
    const isEnd = part === "endMinute";
    const currentDate = isEnd ? tempValue.endDate : tempValue.date;
    const currentTime = isEnd ? tempValue.endTime : tempValue.time;

    // minDate/maxDate 시간 제한 계산
    const minLimit = minDate ? extractDateTimeLimit(minDate) : null;
    const maxLimit = maxDate ? extractDateTimeLimit(maxDate) : null;

    const isMinuteDisabled = (m: number): boolean => {
      if (!currentDate || !currentTime) return false;

      // minDate와 같은 날짜이고 같은 시간인 경우
      if (
        minLimit?.time &&
        isSameDay(currentDate, minLimit.date) &&
        currentTime.hour === minLimit.time.hour
      ) {
        if (m < minLimit.time.minute) return true;
      }
      // maxDate와 같은 날짜이고 같은 시간인 경우
      if (
        maxLimit?.time &&
        isSameDay(currentDate, maxLimit.date) &&
        currentTime.hour === maxLimit.time.hour
      ) {
        if (m > maxLimit.time.minute) return true;
      }
      return false;
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      let selectedMinute = parseInt(e.target.value, 10);
      const selectedHour = currentTime?.hour ?? 0;
      let newHour = selectedHour;

      // 분 선택 시 범위 자동 보정
      if (currentDate) {
        // minDate와 같은 날짜이고 같은 시간인 경우
        if (
          minLimit?.time &&
          isSameDay(currentDate, minLimit.date) &&
          selectedHour === minLimit.time.hour
        ) {
          if (selectedMinute < minLimit.time.minute) {
            // minuteStep에 맞춰 올림 (60분 오버플로는 다음 시간으로 자리올림)
            const carried = ceilTimeToStep(selectedHour, minLimit.time.minute, minuteStep);
            newHour = carried.hour;
            selectedMinute = carried.minute;
          }
        }
        // maxDate와 같은 날짜이고 (자리올림 반영 후) 같은 시간인 경우
        if (
          maxLimit?.time &&
          isSameDay(currentDate, maxLimit.date) &&
          newHour === maxLimit.time.hour
        ) {
          if (selectedMinute > maxLimit.time.minute) {
            // minuteStep에 맞춰 내림
            selectedMinute = Math.floor(maxLimit.time.minute / minuteStep) * minuteStep;
          }
        }
      }

      // 스텝 보정 결과가 min/max 시간 창을 벗어났으면 창 안으로 클램프한다
      const newTime: TimeValue = currentDate
        ? clampTimeToLimits(
            currentDate,
            { hour: newHour, minute: selectedMinute },
            minDate,
            maxDate,
            minuteStep
          )
        : { hour: newHour, minute: selectedMinute };

      const newValue = isEnd ? { ...tempValue, endTime: newTime } : { ...tempValue, time: newTime };
      setTempValue(newValue);
      if (shouldShowActions) {
        // 적용 버튼으로 커밋 — 시간 패널에서도 액션 영역이 노출되도록 표시
        setHasPendingChanges(true);
      } else {
        commitValue(newValue);
      }
    };

    // 커밋된 값이 minuteStep에 정렬돼 있지 않을 수 있다 — clampTimeToLimits가
    // 정확한 경계 시간(예: step 30에서 23:59)을 반환하는 문서화된 경로가 있다.
    // 내림 표시(23:30)는 커밋 값과 어긋나고 그 옵션이 비활성일 수도 있으므로,
    // 비정렬 분은 추가(선택된) 옵션으로 렌더해 표시가 커밋 값과 일치하게 한다.
    // 이 옵션은 현재 값일 때만 존재해 일반 선택 흐름에는 나타나지 않는다.
    const optionMinutes = minutes.includes(minute)
      ? minutes
      : [...minutes, minute].sort((a, b) => a - b);

    return (
      <select
        className={`${styles.timeSelect} ${isPlaceholder ? styles.placeholder : ""}`}
        value={minute}
        onChange={handleChange}
        disabled={disabled}
        aria-label={isEnd ? "종료 분 선택" : "분 선택"}
      >
        {optionMinutes.map((m) => (
          <option key={m} value={m} disabled={isMinuteDisabled(m)}>
            {String(m).padStart(2, "0")}
          </option>
        ))}
      </select>
    );
  };

  // Render input content with clickable parts
  const renderInputContent = () => {
    const hasStartTime = displayValue?.time !== undefined;
    const hasEndTime = displayValue?.endTime !== undefined;

    if (type === "date") {
      if (mode === "period") {
        return (
          <div className={styles.inputContent}>
            {renderDateButton(
              displayValue?.date,
              selectingPart === "date",
              () => handlePartClick("date"),
              !hasStartValue
            )}
            <span className={styles.separator}>~</span>
            {renderDateButton(
              displayValue?.endDate,
              selectingPart === "endDate",
              () => handlePartClick("endDate"),
              !hasEndValue
            )}
          </div>
        );
      }
      return (
        <div className={styles.inputContent}>
          {renderDateButton(
            displayValue?.date,
            selectingPart === "date",
            () => handlePartClick("date"),
            !hasStartValue
          )}
        </div>
      );
    }

    if (type === "time") {
      if (mode === "period") {
        return (
          <div className={styles.inputContent}>
            <div className={styles.timeSection}>
              {renderHourSelect(displayValue?.time, "hour", !hasStartTime)}
              <span className={styles.timeSeparator}>:</span>
              {renderMinuteSelect(displayValue?.time, "minute", !hasStartTime)}
            </div>
            <span className={styles.separator}>~</span>
            <div className={styles.timeSection}>
              {renderHourSelect(displayValue?.endTime, "endHour", !hasEndTime)}
              <span className={styles.timeSeparator}>:</span>
              {renderMinuteSelect(displayValue?.endTime, "endMinute", !hasEndTime)}
            </div>
          </div>
        );
      }
      return (
        <div className={styles.inputContent}>
          <div className={styles.timeSection}>
            {renderHourSelect(displayValue?.time, "hour", !hasStartTime)}
            <span className={styles.timeSeparator}>:</span>
            {renderMinuteSelect(displayValue?.time, "minute", !hasStartTime)}
          </div>
        </div>
      );
    }

    // datetime
    if (mode === "period") {
      return (
        <div className={styles.inputContent}>
          {renderDateButton(
            displayValue?.date,
            selectingPart === "date",
            () => handlePartClick("date"),
            !hasStartValue
          )}
          <div className={styles.timeSection}>
            {renderHourSelect(displayValue?.time, "hour", !hasStartTime)}
            <span className={styles.timeSeparator}>:</span>
            {renderMinuteSelect(displayValue?.time, "minute", !hasStartTime)}
          </div>
          <span className={styles.separator}>~</span>
          {renderDateButton(
            displayValue?.endDate,
            selectingPart === "endDate",
            () => handlePartClick("endDate"),
            !hasEndValue
          )}
          <div className={styles.timeSection}>
            {renderHourSelect(displayValue?.endTime, "endHour", !hasEndTime)}
            <span className={styles.timeSeparator}>:</span>
            {renderMinuteSelect(displayValue?.endTime, "endMinute", !hasEndTime)}
          </div>
        </div>
      );
    }
    return (
      <div className={styles.inputContent}>
        {renderDateButton(
          displayValue?.date,
          selectingPart === "date",
          () => handlePartClick("date"),
          !hasStartValue
        )}
        <div className={styles.timeSection}>
          {renderHourSelect(displayValue?.time, "hour", !hasStartTime)}
          <span className={styles.timeSeparator}>:</span>
          {renderMinuteSelect(displayValue?.time, "minute", !hasStartTime)}
        </div>
      </div>
    );
  };

  // Render dropdown content based on selecting part
  const renderDropdownContent = () => {
    // 날짜 선택만 드롭다운으로 표시 (시/분은 native select 사용)
    if (selectingPart === "date" || selectingPart === "endDate") {
      // period 모드: 두 개의 달력을 나란히 표시
      if (mode === "period") {
        return (
          <PeriodCalendar
            value={tempValue.date}
            endValue={tempValue.endDate}
            onSelect={handleDateSelect}
            viewDate={viewDate}
            endViewDate={endViewDate}
            onViewDateChange={setViewDate}
            onEndViewDateChange={setEndViewDate}
            disable={disable}
            enable={enable}
            minDate={minDate}
            maxDate={maxDate}
            yearRange={yearRange}
          />
        );
      }
      // instant 모드: 단일 달력
      return (
        <Calendar
          value={tempValue.date}
          endValue={tempValue.endDate}
          mode={mode}
          onSelect={handleDateSelect}
          viewDate={viewDate}
          onViewDateChange={setViewDate}
          disable={disable}
          enable={enable}
          minDate={minDate}
          maxDate={maxDate}
          yearRange={yearRange}
        />
      );
    }

    return null;
  };

  // 아이콘 결정 (time 타입은 icon-time, 나머지는 icon-calendar)
  const inputIcon = type === "time" ? "podo-icon podo-icon-time" : "podo-icon podo-icon-calendar";

  return (
    <div ref={containerRef} className={`${styles.datepicker} ${className || ""}`}>
      <div
        ref={inputRef}
        className={`${styles.input} ${isCalendarOpen ? styles.active : ""} ${disabled ? styles.disabled : ""}`}
      >
        {renderInputContent()}
        <i className={`${styles.inputIcon} ${inputIcon}`} aria-hidden="true" />
      </div>

      {isDropdownOpen && (
        <div className={`${styles.dropdown} ${align === "right" ? styles.right : ""}`}>
          {renderDropdownContent()}

          {isActionsVisible && (
            <div className={styles.bottomActions}>
              <span className={styles.periodText}>
                {mode === "period" && tempValue.date ? formatPeriodText() : ""}
              </span>
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.reset}`}
                  onClick={handleReset}
                >
                  <i className="podo-icon podo-icon-refresh" aria-hidden="true" />
                  초기화
                </button>
                <button
                  type="button"
                  className={`${styles.actionButton} ${styles.apply}`}
                  onClick={handleApply}
                >
                  적용
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;
