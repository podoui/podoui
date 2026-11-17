/** @jsxImportSource hono/jsx */

import type { JSX } from "hono/jsx/jsx-runtime";
import { raw } from "hono/html";
import { Island } from "./island.js";

/** React Editor `ToolbarItem`과 같은 값이에요. */
export type HonoEditorToolbarItem =
  | "undo-redo"
  | "paragraph"
  | "text-style"
  | "color"
  | "align"
  | "list"
  | "table"
  | "link"
  | "image"
  | "youtube"
  | "hr"
  | "format"
  | "code";

export interface HonoEditorProps {
  /** 초기 본문 HTML — island는 비제어로 마운트해요(R1). 계속 제어하려면 `configure(id, { value })`. */
  value?: string;
  /** 초기 본문 HTML(비제어). `value`가 있으면 그쪽이 우선해요. */
  defaultValue?: string;
  /** 폼 제출 이름 — 본문 HTML을 담은 숨은 textarea를 함께 렌더해요(JS 없이도 초기값 제출). */
  name?: string;
  width?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  resizable?: boolean;
  placeholder?: string;
  toolbar?: HonoEditorToolbarItem[];
  /** 편집 영역 접근성 이름(기본 "리치 텍스트 편집기"). */
  ariaLabel?: string;
  /**
   * Hono 전용 — 이미지를 `POST uploadUrl`(FormData `file`)로 올리고 응답 JSON `{ url }`을
   * 본문에 넣어요. `configure(id, { onImageUpload })`로 함수를 넘기면 그쪽이 우선해요.
   */
  uploadUrl?: string;
  /**
   * zod 스키마 등 — SSR이 싣지 못해 이 prop이 있으면 마운트가 `configure(id, { validator })`
   * 까지 미뤄져요.
   */
  validator?: unknown;
  /** 업로드 함수 — SSR이 싣지 못해 `configure(id, { onImageUpload })`까지 마운트가 미뤄져요. */
  onImageUpload?: unknown;
  /** configure 키(래퍼 data-podo-id) — React Editor는 id를 받지 않아요. */
  id?: string;
}

/**
 * 리치 텍스트 편집기 — SSR은 React Editor가 마운트된 직후와 같은 뼈대(루트·툴바 자리·
 * 편집 영역에 초기 HTML·숨은 textarea)를 내되 편집 영역은 마운트 전까지 읽기 전용이고, podo-ui/hono/client가 같은 React Editor를
 * 마운트해요. 변경은 `podo:change { content }`, 업로드 실패는 `podo:image-upload-error`.
 * 초기 HTML은 그대로 넣으므로 신뢰할 수 있는 HTML만 주세요(React Editor와 같아요).
 */
export function Editor({
  value,
  defaultValue,
  name,
  width = "100%",
  height = "400px",
  minHeight,
  maxHeight,
  resizable = false,
  placeholder = "내용을 입력하세요...",
  toolbar,
  ariaLabel = "리치 텍스트 편집기",
  uploadUrl,
  validator,
  onImageUpload,
  id,
}: HonoEditorProps): JSX.Element {
  const initial = value ?? defaultValue ?? "";
  const contents = height === "contents";
  const containerStyle = [
    `height:${contents ? "auto" : height || "300px"}`,
    minHeight || contents ? `min-height:${minHeight || "100px"}` : "",
    maxHeight ? `max-height:${maxHeight}` : "",
    "display:flex",
    "flex-direction:column",
    `resize:${resizable ? "vertical" : "none"}`,
    "overflow:auto",
  ]
    .filter(Boolean)
    .join(";");
  const contentStyle = contents
    ? "flex:0 0 auto;min-height:auto;overflow-y:visible"
    : "flex:1;min-height:0;overflow-y:auto";
  return (
    <Island
      name="Editor"
      id={id}
      props={{
        defaultValue: initial,
        name,
        width,
        height,
        minHeight,
        maxHeight,
        resizable,
        placeholder,
        toolbar,
        ariaLabel,
        uploadUrl,
        validator,
        onImageUpload,
      }}
    >
      <div class="podo-ed-editor " style={`width:${width};position:relative`}>
        <div class="podo-ed-toolbar" />
        <div
          class={`podo-ed-editorContainer ${resizable ? "podo-ed-resizable" : ""}`}
          style={containerStyle}
        >
          <div
            class="podo-ed-editorContent"
            // 마운트 전엔 편집할 수 없어요 — 마운트 전 입력은 제출값(textarea)·마운트
            // 초기값으로 이어지지 않아 유실되므로, React Editor가 붙을 때 편집 가능해져요(T6 F1).
            contenteditable={false}
            role="textbox"
            aria-multiline="true"
            aria-label={ariaLabel}
            style={contentStyle}
            data-placeholder={placeholder}
          >
            {raw(initial)}
          </div>
        </div>
        {name !== undefined ? (
          <textarea hidden name={name} readonly>
            {initial}
          </textarea>
        ) : null}
      </div>
    </Island>
  );
}
