// 클라이언트 테스트 공용 도구 — 배포와 같은 번들 설정(bundle-client.mjs)을 매 테스트 새
// jsdom 창에 설치해요(계획 §3.6 B: jsdom 에 SSR 삽입 → client.js 설치).
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { renderToString } from "hono/jsx/dom/server";
import type { JSX } from "hono/jsx/jsx-runtime";
import { JSDOM } from "jsdom";
import { beforeAll } from "vitest";

// jsdom 환경에선 import.meta.url이 http URL이라 레포 루트(테스트 cwd) 기준 경로를 써요.
const bundleScript = pathToFileURL(
  resolve(process.cwd(), "packages/hono/scripts/bundle-client.mjs")
).href;
let clientCode = "";

/**
 * describe 밖에서 한 번 — 파일 안 테스트가 같은 번들을 써요. esbuild는 jsdom 테스트
 * 환경의 전역(TextEncoder 등)에서 초기화되지 않아 별도 node 프로세스로 묶어요.
 */
export function useClientBundle(): void {
  beforeAll(() => {
    clientCode = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `const { bundleHonoClient } = await import(${JSON.stringify(bundleScript)}); process.stdout.write(await bundleHonoClient());`,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
  }, 60_000);
}

export const fruit = [
  { value: "apple", label: "사과" },
  { value: "pear", label: "배" },
  { value: "grape", label: "포도" },
];

export type Win = JSDOM["window"];

type Configure = (id: string, props: Record<string, unknown>) => void;

export const clientOf = (win: Win) =>
  (win as unknown as { podo: { client: { configure: Configure; mount: (root: Element) => void } } })
    .podo.client;

export function page(markup: JSX.Element | string): Win {
  const html = typeof markup === "string" ? markup : renderToString(markup);
  const dom = new JSDOM(`<!doctype html><html><body><form id="f">${html}</form></body></html>`, {
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  return dom.window;
}

export function install(win: Win): void {
  win.eval(clientCode);
}

export const tick = (win: Win, ms = 30) => new Promise((resolve) => win.setTimeout(resolve, ms));

export function collect(win: Win, name: string): Array<Record<string, unknown>> {
  const seen: Array<Record<string, unknown>> = [];
  win.document.addEventListener(name, (event) => {
    seen.push((event as CustomEvent<Record<string, unknown>>).detail);
  });
  return seen;
}

export const hidden = (win: Win, name: string) =>
  Array.from(
    win.document.querySelectorAll<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)
  ).map((input) => input.value);

export const key = (win: Win, target: Element, keyName: string) =>
  target.dispatchEvent(new win.KeyboardEvent("keydown", { key: keyName, bubbles: true }));

/**
 * jsdom 창(별도 JS 영역)의 시계를 고정해요 — React 쪽 vi.setSystemTime과 같은 「지금」을
 * 보게 해서 quickSelect 프리셋 같은 오늘 기준 계산이 양쪽에서 같아요.
 */
export function fixClock(win: Win, now: number): void {
  win.eval(`(() => {
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) { if (args.length === 0) { super(${now}); } else { super(...args); } }
      static now() { return ${now}; }
    }
    globalThis.Date = FixedDate;
  })();`);
}

/**
 * jsdom 창의 setTimeout·clearTimeout을 가짜 시계로 바꿔요(Node 쪽 vi 가짜 타이머는 창
 * 영역에 닿지 않아요). advance(ms)는 그 사이 만기된 콜백을 시각 순서대로 돌리고, 콜백마다
 * 진짜 시간을 한 프레임 흘려 렌더·effect가 끝나게 해요.
 */
export function fakeTimers(win: Win): { advance: (ms: number) => Promise<void> } {
  const realSetTimeout = win.setTimeout.bind(win);
  // useEffect는 requestAnimationFrame(진짜 시계)에서 돌아 한 프레임 넘게 기다려요.
  const flush = () => new Promise((resolve) => realSetTimeout(resolve, 20));
  let now = 0;
  let nextId = 1;
  const queue = new Map<number, { at: number; run: () => void }>();
  const target = win as unknown as {
    setTimeout: (callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => number;
    clearTimeout: (id?: number) => void;
  };
  target.setTimeout = (callback, ms = 0, ...args) => {
    const id = nextId++;
    queue.set(id, { at: now + Math.max(0, Number(ms) || 0), run: () => callback(...args) });
    return id;
  };
  target.clearTimeout = (id) => {
    if (id !== undefined) {
      queue.delete(id);
    }
  };
  return {
    async advance(ms) {
      const end = now + ms;
      await flush();
      for (;;) {
        const due = [...queue.entries()]
          .filter(([, timer]) => timer.at <= end)
          .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) {
          break;
        }
        queue.delete(due[0]);
        now = due[1].at;
        due[1].run();
        await flush();
      }
      now = end;
      await flush();
    },
  };
}
