/**
 * Hono island props 인코딩 — SSR이 `data-podo-props`에 싣고 클라이언트가
 * 되살려요. JSON으로 옮길 수 없는 값(함수·클래스 인스턴스·심볼 등, 또는 그것이
 * 섞인 배열·객체)은 그 prop을 통째로 빼고 `deferred`에 이름을 남겨요 — 소비자가
 * 클라이언트에서 `configure`로 같은 prop 이름에 전체 값을 넘겨요.
 *
 * Date는 오프셋 없는 로컬 벽시계 `{"$date":"YYYY-MM-DDTHH:mm:ss"}`로 옮겨요
 * (밀리초는 버려요). `$date` 키 하나만 가진 plain 객체는 Date로 되살아나요.
 */
export interface SerializedIslandProps {
  json: string;
  deferred: string[];
}

const NOT_SERIALIZABLE = Symbol("podo-not-serializable");

export function serializeProps(props: Record<string, unknown>): SerializedIslandProps {
  const encoded: Record<string, unknown> = {};
  const deferred: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) {
      continue;
    }
    const next = encodeValue(value);
    if (next === NOT_SERIALIZABLE) {
      deferred.push(key);
    } else {
      encoded[key] = next;
    }
  }
  return { json: JSON.stringify(encoded), deferred };
}

export function reviveProps(json: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(json, (_key, value: unknown) => {
    if (isPlainObject(value)) {
      const keys = Object.keys(value);
      const stamp = value.$date;
      if (keys.length === 1 && typeof stamp === "string") {
        return parseLocalDate(stamp);
      }
    }
    return value;
  });
  if (!isPlainObject(parsed)) {
    throw new TypeError("Island props must be a JSON object.");
  }
  return parsed;
}

function encodeValue(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NOT_SERIALIZABLE;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? NOT_SERIALIZABLE : { $date: formatLocalDate(value) };
  }
  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (const item of value) {
      const next = encodeValue(item);
      if (next === NOT_SERIALIZABLE) {
        return NOT_SERIALIZABLE;
      }
      items.push(next);
    }
    return items;
  }
  if (isPlainObject(value)) {
    const entries: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) {
        continue;
      }
      const next = encodeValue(item);
      if (next === NOT_SERIALIZABLE) {
        return NOT_SERIALIZABLE;
      }
      entries[key] = next;
    }
    return entries;
  }
  // function, symbol, bigint, class instance (e.g. a zod schema), etc.
  return NOT_SERIALIZABLE;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

function formatLocalDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function parseLocalDate(stamp: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(stamp);
  if (!match) {
    throw new TypeError(`Invalid $date value "${stamp}".`);
  }
  const [y, m, d, h, mi, s] = match.slice(1).map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  // 연·월·일을 한 번에 설정해 0–99년도 그대로 두고(생성자는 19xx로 읽어요),
  // 정규화로 값이 넘어갔으면(13월·25시·2월 30일 등) 받아들이지 않아요.
  const date = new Date(0);
  date.setFullYear(y, m - 1, d);
  date.setHours(h, mi, s, 0);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d ||
    date.getHours() !== h ||
    date.getMinutes() !== mi ||
    date.getSeconds() !== s
  ) {
    throw new TypeError(`Invalid $date value "${stamp}".`);
  }
  return date;
}
