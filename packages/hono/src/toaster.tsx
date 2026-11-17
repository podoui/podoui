/** @jsxImportSource hono/jsx */

import type { JSX } from "hono/jsx/jsx-runtime";
import { Island } from "./island.js";

export type HonoToasterPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface HonoToasterProps {
  /** Screen edge the stack anchors to. */
  position?: HonoToasterPosition;
  /** Auto-dismiss delay (ms) for toasts without their own duration. */
  duration?: number;
  /** Most toasts shown at once; the oldest is dismissed when it overflows. */
  max?: number;
  /** configure 키(래퍼 data-podo-id). */
  id?: string;
}

/**
 * 토스트 스택 — SSR은 React Toaster의 빈 스택과 같고, podo-ui/hono/client가 같은
 * React Toaster를 마운트해요. 토스트는 `window.podo.toast(title, options)`(React toast와
 * 같은 함수·스토어: normal/success/danger/info/warning·dismiss)로 띄워요.
 */
export function Toaster({
  position = "top-center",
  duration,
  max,
  id,
}: HonoToasterProps): JSX.Element {
  return (
    <Island name="Toaster" id={id} props={{ position, duration, max }}>
      <div class="podo-toaster" data-position={position} style="--podo-toast-count:0" />
    </Island>
  );
}
