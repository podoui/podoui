/**
 * Hono Editor `uploadUrl` 어댑터(계획 D9) — React Editor `onImageUpload(file)` 자리에 들어가요.
 * `POST uploadUrl`(FormData `file`) → 응답 JSON `{ url }` → 본문에 넣을 이미지 URL.
 * 실패(HTTP 오류·`url` 없음·허용하지 않는 URL·네트워크)는 reject — React Editor가 그 이미지를 넣지 않고
 * `onImageUploadError`(= `podo:image-upload-error`)로 알려요. 재시도는 하지 않아요.
 */
export async function uploadImage(uploadUrl: string, file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(uploadUrl, { method: "POST", body });
  if (!response.ok) {
    throw new Error(`Image upload failed: HTTP ${response.status}`);
  }
  const data: unknown = await response.json();
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || !isAllowedImageUrl(url)) {
    throw new Error(
      "Image upload response must be JSON { url } with an http(s), relative, or image data URL."
    );
  }
  return url;
}

/**
 * 본문에 넣을 업로드 결과 URL 정책(T6 F3) — http(s)(CDN 포함)·상대 경로(같은 출처)·
 * `data:image/*`(저장소 없는 에코, React Editor 기본 처리와 같은 형태)만 받아요.
 * `javascript:` 등 다른 스킴은 업로드 실패로 처리해 넣지 않아요.
 */
export function isAllowedImageUrl(url: string): boolean {
  // URL 파서처럼 탭·줄바꿈을 지우고 앞뒤 제어문자·공백을 잘라 판정해요("java\tscript:" 우회 방지).
  const trimmed = stripUrlNoise(url);
  if (trimmed === "") {
    return false;
  }
  if (/^data:image\/[\w.+-]+[;,]/i.test(trimmed)) {
    return true;
  }
  // 스킴이 없으면 상대 경로(같은 출처, `//host`는 페이지 스킴을 따라요).
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(trimmed)?.[1]?.toLowerCase();
  return scheme === undefined || scheme === "http" || scheme === "https";
}

/** URL 파서가 무시하는 탭·줄바꿈과 앞뒤 C0 제어문자·공백을 뺀 값이에요. */
function stripUrlNoise(url: string): string {
  let text = url.replace(/[\t\n\r]/g, "");
  let start = 0;
  let end = text.length;
  while (start < end && text.charCodeAt(start) <= 0x20) {
    start += 1;
  }
  while (end > start && text.charCodeAt(end - 1) <= 0x20) {
    end -= 1;
  }
  text = text.slice(start, end);
  return text;
}
