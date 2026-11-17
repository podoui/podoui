// 패리티 테스트용 마크업 정규화(계획 §3.6 A·B) — 속성 정렬, data-podo-* 제외, 공백 접기,
// id 토큰화(id와 id 참조 속성을 첫 등장 순서로 #1 #2 …). ARIA 값은 지우지 않아요.
const ID_REFS = [
  "for",
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-activedescendant",
  "aria-owns",
  "list",
  "form",
];

export function parseHtml(html: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content;
}

/** island 래퍼 안의 SSR 루트(래퍼 자체는 승인된 차이라 비교에서 빼요). */
export function islandRoot(html: string): Element {
  const wrapper = parseHtml(html).querySelector("[data-podo-island]");
  const root = wrapper?.firstElementChild;
  if (!wrapper || !root || wrapper.childElementCount !== 1) {
    throw new Error(`expected one island root in ${html}`);
  }
  return root;
}

export function canonical(node: Node): string {
  const ids = new Map<string, string>();
  const token = (value: string) => {
    if (!ids.has(value)) {
      ids.set(value, `#${ids.size + 1}`);
    }
    return ids.get(value)!;
  };
  // 첫 등장 순서 — id 정의와 참조를 문서 순서대로 한 번에 훑어요.
  const walk = (current: Node): string => {
    if (current.nodeType === 3) {
      return (current as Text).data.replace(/\s+/g, " ");
    }
    if (current.nodeType !== 1) {
      return current.nodeType === 11 ? children(current) : "";
    }
    const element = current as Element;
    const attributes = Array.from(element.attributes)
      .filter((attribute) => !attribute.name.startsWith("data-podo-"))
      // 옵션 선택은 SSR에선 selected 속성, 마운트 후엔 select.value(속성)라 상태로 비교해요.
      .filter((attribute) => !(element.localName === "option" && attribute.name === "selected"))
      .map((attribute) => {
        if (attribute.name === "class") {
          // 클래스는 토큰 집합으로 비교해요(React 템플릿 문자열의 빈 토큰·공백 차이 무시).
          return `class="${attribute.value.split(/\s+/).filter(Boolean).sort().join(" ")}"`;
        }
        if (attribute.name === "id") {
          return `id="${token(attribute.value)}"`;
        }
        if (ID_REFS.includes(attribute.name)) {
          return `${attribute.name}="${attribute.value
            .split(/\s+/)
            .filter(Boolean)
            .map(token)
            .join(" ")}"`;
        }
        return `${attribute.name}="${attribute.value}"`;
      })
      .concat(
        element.localName === "option"
          ? [`:selected="${String((element as HTMLOptionElement).selected)}"`]
          : []
      )
      .sort();
    return `<${element.localName}${attributes.map((a) => ` ${a}`).join("")}>${children(element)}</${element.localName}>`;
  };
  const children = (parent: Node) => Array.from(parent.childNodes).map(walk).join("");
  return walk(node);
}
