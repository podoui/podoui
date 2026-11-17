/** @jsxImportSource hono/jsx */

import type { Child } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import { serializeProps } from "@podoui/core";

/** island로 마운트되는 컴포넌트 이름 — 클라이언트 `components.ts` 등록 이름과 같아요. */
export type IslandName = "Select" | "Chip" | "Switch" | "DatePicker";

export interface IslandProps {
  name: IslandName;
  /** React 소스에 넘길 props(React prop 이름). 직렬화 못 하는 값은 빠지고 defer 표식이 붙어요. */
  props: Record<string, unknown>;
  /** configure 키 — 래퍼 `data-podo-id`(T1 결정 D-1). */
  id?: string | undefined;
  children: Child;
}

/**
 * island 래퍼(계획 §3.1): SSR 루트 하나를 `display: contents` span으로 감싸고
 * props JSON을 실어요. 클라이언트(`podo-ui/hono/client`)가 이 자리에 같은 React
 * 소스를 마운트해요. span은 `<td>`·`<label>` 안에서도 파서가 옮기지 않아요.
 */
export function Island({ name, props, id, children }: IslandProps): JSX.Element {
  const { json, deferred } = serializeProps(props);
  return (
    <span
      class="podo-island"
      data-podo-island={name}
      data-podo-props={json}
      data-podo-id={id}
      data-podo-defer={deferred.length > 0 ? "" : undefined}
    >
      {children}
    </span>
  );
}

let autoIdSequence = 0;

/**
 * SSR 자동 id — 같은 props의 컴포넌트가 한 문서에 여럿이어도 겹치지 않게 렌더
 * 순서로 올라가는 일련번호를 붙여요(hono useId와 같은 방식, 난수 없음). 서버
 * 프로세스 안에서 계속 올라가므로 요청마다 같은 마크업이 필요하면 id prop을 주세요.
 */
export function autoId(prefix: string): string {
  autoIdSequence += 1;
  return `${prefix}-${autoIdSequence.toString(36)}`;
}
