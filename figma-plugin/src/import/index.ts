/**
 * Import orchestration: validates the document, creates the _podo page,
 * then runs variables -> styles -> components and assembles the
 * ImportReport. Fonts are preloaded once, by buildComponents (its ensureFont
 * cache also feeds the per-node fallback path).
 */

import { FORMAT, FORMAT_VERSION } from '../schema';
import type { ImportReport, PodoExport } from '../schema';
import { importVariables } from './variables';
import { importStyles } from './styles';
import { buildComponents } from './nodes';

export type ProgressFn = (phase: string, done: number, total: number) => void;
export type WarnFn = (message: string) => void;

function validateDocument(doc: PodoExport): void {
  const raw = doc as unknown as Record<string, unknown> | null;
  if (!raw || typeof raw !== 'object' || raw.format !== FORMAT) {
    throw new Error(
      '가져오기 실패: podo-clone 형식의 파일이 아닙니다. Podo Cloner가 내보낸 .podo-export.json 파일을 선택하세요.'
    );
  }
  if (raw.version !== FORMAT_VERSION) {
    throw new Error(
      `가져오기 실패: 파일 버전(${String(raw.version)})이 플러그인이 지원하는 버전(${FORMAT_VERSION})과 다릅니다. ` +
        '같은 버전의 Podo Cloner로 다시 내보낸 파일을 사용하세요.'
    );
  }
  const styles = raw.styles as Record<string, unknown> | null | undefined;
  if (
    !Array.isArray(raw.variables) ||
    !Array.isArray(raw.pages) ||
    !Array.isArray(raw.fonts) ||
    !styles ||
    typeof styles !== 'object' ||
    !Array.isArray(styles.text) ||
    !Array.isArray(styles.effect) ||
    !Array.isArray(styles.paint) ||
    !Array.isArray(styles.grid) ||
    typeof raw.images !== 'object' ||
    raw.images === null ||
    Array.isArray(raw.images)
  ) {
    throw new Error(
      '가져오기 실패: 파일 내용이 올바르지 않습니다 (variables/styles/pages/fonts/images 필드 누락 또는 형식 오류).'
    );
  }
  // Deep-shape checks run BEFORE the _podo page is created so a malformed
  // file fails fast with an actionable message instead of a raw TypeError
  // after the document has already been mutated.
  for (const page of raw.pages as unknown[]) {
    const p = page as Record<string, unknown> | null;
    if (!p || typeof p !== 'object' || !Array.isArray(p.items)) {
      throw new Error('가져오기 실패: 파일 내용이 올바르지 않습니다 (pages 항목에 items 배열이 없습니다).');
    }
    for (const item of p.items as unknown[]) {
      const entry = item as Record<string, unknown> | null;
      if (
        !entry ||
        typeof entry !== 'object' ||
        typeof entry.x !== 'number' ||
        typeof entry.y !== 'number' ||
        !entry.node ||
        typeof entry.node !== 'object'
      ) {
        throw new Error('가져오기 실패: 파일 내용이 올바르지 않습니다 (pages items 항목 형식 오류).');
      }
    }
  }
}

export async function runImport(doc: PodoExport, onProgress: ProgressFn): Promise<ImportReport> {
  validateDocument(doc);

  const warnings: string[] = [];
  // Export-side warnings ride along into the final report.
  if (Array.isArray(doc.warnings)) {
    for (const w of doc.warnings) {
      warnings.push(`[내보내기] ${String(w)}`);
    }
  }
  const warn: WarnFn = (message) => {
    warnings.push(message);
  };

  onProgress('_podo 페이지 준비', 0, 1);
  let podoPage = figma.root.children.find((page) => page.name === '_podo');
  if (podoPage) {
    await podoPage.loadAsync();
    for (const child of [...podoPage.children]) {
      child.remove();
    }
    warn("기존 '_podo' 페이지 내용을 지우고 덮어썼습니다.");
  } else {
    podoPage = figma.createPage(); // Starter 플랜 3페이지 제한 초과 시 여기서 throw
    podoPage.name = '_podo';
  }
  await figma.setCurrentPageAsync(podoPage);

  // Overwrite semantics: 변수 컬렉션은 importVariables가 in-place로 갱신한다
  // (id 보존 — 수동 정렬·기존 바인딩 유지). 스타일은 이름이 겹치면 제거 후
  // 재생성한다 ("style 2" 중복 방지).
  const incomingStyles = new Set(
    [...doc.styles.text, ...doc.styles.effect, ...doc.styles.paint, ...doc.styles.grid].map(
      (s) => s.name
    )
  );
  const localStyles: BaseStyle[] = [
    ...(await figma.getLocalTextStylesAsync()),
    ...(await figma.getLocalEffectStylesAsync()),
    ...(await figma.getLocalPaintStylesAsync()),
    ...(await figma.getLocalGridStylesAsync()),
  ];
  let removedStyles = 0;
  for (const style of localStyles) {
    if (incomingStyles.has(style.name)) {
      style.remove();
      removedStyles++;
    }
  }
  if (removedStyles > 0) {
    warn(`같은 이름의 기존 스타일 ${removedStyles}개를 제거하고 다시 만들었습니다.`);
  }
  onProgress('_podo 페이지 준비', 1, 1);

  // Fonts are preloaded exactly once, inside buildComponents (ensureFont):
  // loadFontAsync failures are not cached by Figma, so a second preload here
  // would emit a duplicate, differently-worded warning per missing font.

  onProgress('변수 가져오기', 0, 1);
  const { varMap, collections: createdCollections } = await importVariables(doc.variables, warn);
  onProgress('변수 가져오기', 1, 1);

  onProgress('스타일 가져오기', 0, 1);
  const styleMap: Map<string, string> = await importStyles(doc.styles, varMap, warn);
  onProgress('스타일 가져오기', 1, 1);

  // buildComponents preloads fonts before its first progress post — label it.
  onProgress('폰트 로드', 0, 1);
  const componentCounts = await buildComponents(
    doc,
    varMap,
    styleMap,
    podoPage,
    (done, total) => onProgress('컴포넌트 생성', done, total),
    warn
  );
  // Actual created counts only (a skipped style/variable must not be
  // reported as imported) — mirrors how componentSets/components are counted.
  const report: ImportReport = {
    variableCollections: createdCollections,
    variables: varMap.size,
    styles: styleMap.size,
    componentSets: componentCounts.componentSets,
    components: componentCounts.components,
    warnings,
  };
  return report;
}
