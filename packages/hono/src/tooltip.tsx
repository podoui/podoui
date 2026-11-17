/** @jsxImportSource hono/jsx */

import { cloneElement, isValidElement, type Child } from "hono/jsx";
import type { JSX } from "hono/jsx/jsx-runtime";
import { joinIds } from "@podoui/core";
import { Island, autoId } from "./island.js";

export interface HonoTooltipProps {
  /** 말풍선 내용 (Figma label). 글자면 JSON, 마크업이면 템플릿 슬롯으로 클라이언트에 가요. */
  label: Child;
  /**
   * children이 없을 때(정적 말풍선만): 말풍선 요소의 id — 소비자가 트리거에
   * `aria-describedby={id}`를 달아요. children이 있으면 island configure 키예요.
   */
  id?: string;
  /** 대상 기준 표시 방향 — 화살표가 대상을 가리켜요 (Figma position). */
  position?: "right" | "left" | "bottom" | "top";
  /** 화살표가 말풍선의 시작/가운데/끝 어디에 붙는지 (Figma ordinal). */
  ordinal?: "first" | "second" | "third";
  /** 밝은 배경(default) 또는 어두운 배경(reverse) (Figma theme). */
  theme?: "default" | "reverse";
  /** children이 있을 때: 말풍선을 document.body로 포탈(기본 true, React와 같음). */
  portal?: boolean;
  /** children이 있을 때: 항상 열린 제어 값(React open). 생략하면 hover/focus가 열고 닫아요. */
  open?: boolean;
  /**
   * 트리거 요소 하나 — 있으면 island가 돼요. podo-ui/hono/client가 같은 React Tooltip으로
   * hover/focus 열기·aria-describedby·포탈 배치를 붙여요.
   */
  children?: Child;
  class?: string;
}

export function Tooltip(props: HonoTooltipProps): JSX.Element {
  const { children } = props;
  const trigger = Array.isArray(children) ? children.find(isValidElement) : children;
  return isValidElement(trigger) ? island(props, trigger) : bubble(props, props.id);
}

/** 정적 말풍선 — children 없는 기존 사용(마크업 그대로). */
function bubble(
  {
    label,
    position = "right",
    ordinal = "first",
    theme = "default",
    class: className,
  }: Pick<HonoTooltipProps, "label" | "position" | "ordinal" | "theme" | "class">,
  id: string | undefined,
  extra: Record<string, string> = {}
): JSX.Element {
  return (
    <div
      id={id}
      class={className ? `podo-tooltip ${className}` : "podo-tooltip"}
      role="tooltip"
      data-theme={theme}
      data-position={position}
      data-ordinal={ordinal}
      {...extra}
    >
      {/* 화살표 모양(Figma 4×16 포인터)은 CSS clip-path가 data-position별로 그려요. */}
      <span class="podo-tooltip__arrow" />
      <span class="podo-tooltip__bubble">{label}</span>
    </div>
  );
}

/**
 * island — React Tooltip 첫 렌더(트리거 + 열려 있으면 인라인 말풍선)와 같은 마크업.
 * SSR이 만든 말풍선·aria-describedby 토큰은 생성 표식이라 클라이언트가 옮기지 않아요.
 */
function island(props: HonoTooltipProps, trigger: unknown): JSX.Element {
  const { id, label, position, ordinal, theme, portal = true, open } = props;
  const text = typeof label === "string" || typeof label === "number";
  const bubbleId = open ? autoId("podo-tooltip") : undefined;
  const describedBy = (trigger as { props: Record<string, unknown> }).props["aria-describedby"];
  return (
    <Island
      name="Tooltip"
      id={id}
      slot="children"
      props={{ label: text ? label : undefined, position, ordinal, theme, portal, open }}
    >
      {bubbleId
        ? cloneElement(trigger as JSX.Element, {
            "aria-describedby": joinIds(
              typeof describedBy === "string" ? describedBy : undefined,
              bubbleId
            ),
          })
        : (trigger as JSX.Element)}
      {bubbleId
        ? bubble(
            {
              label,
              position: props.position ?? "right",
              ordinal: props.ordinal ?? "first",
              theme: props.theme ?? "default",
            },
            bubbleId,
            {
              ...(portal ? { style: "position:fixed;top:-9999px;left:-9999px" } : {}),
              "data-podo-generated": "",
            }
          )
        : null}
      {text ? null : <template data-podo-slot="label">{label}</template>}
    </Island>
  );
}
