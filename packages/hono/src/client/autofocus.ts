/**
 * React `autoFocus` 대응(T7 실브라우저에서 발견) — React는 autoFocus 요소를 마운트할 때
 * focus()를 부르지만 hono/jsx/dom은 `autofocus` 속성만 달아요(브라우저는 문서 로드 때만
 * 그 속성을 따라요). 그래서 마운트된 island 안에 새로 붙은 `[autofocus]` 요소를 찾아
 * 포커스해요 — 검색형 Select 입력, Editor 팝업 입력 등. island 밖 DOM은 건드리지 않아요.
 *
 * 우선순위(T7 리뷰 F1·F2): 최초 마운트에서 브리지가 복구한 사용자 포커스가 먼저예요 —
 * 그때 있던 `[autofocus]`는 처리한 것으로 표시해 빼앗지 않아요. 한 번 처리한 요소는
 * DOM에서 옮겨져 다시 붙어도 포커스하지 않아요(새로 렌더된 요소만 대상).
 */
const handled = new WeakSet<Element>();

/** 이 범위의 현재 `[autofocus]` 요소를 처리한 것으로 표시해요(포커스 복구 뒤 호출). */
export function skipAutofocus(root: ParentNode): void {
  for (const element of Array.from(root.querySelectorAll("[autofocus]"))) {
    handled.add(element);
  }
}

export function installAutofocus(doc: Document): void {
  const view = doc.defaultView;
  if (!view?.MutationObserver) {
    return;
  }
  const observer = new view.MutationObserver((records) => {
    let target: HTMLElement | undefined;
    for (const record of records) {
      for (const added of Array.from(record.addedNodes)) {
        if (added.nodeType !== 1) {
          continue;
        }
        const element = added as Element;
        const candidates = [
          ...(element.matches("[autofocus]") ? [element] : []),
          ...Array.from(element.querySelectorAll("[autofocus]")),
        ];
        for (const candidate of candidates) {
          if (handled.has(candidate)) {
            continue;
          }
          handled.add(candidate);
          if (candidate instanceof view.HTMLElement && candidate.closest("[data-podo-mounted]")) {
            target = candidate;
          }
        }
      }
    }
    if (target && target.isConnected && doc.activeElement !== target) {
      target.focus();
    }
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true });
}
