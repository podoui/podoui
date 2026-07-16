/**
 * Export orchestration: loads all pages, runs the variable / style / node
 * serializers and assembles the final PodoExport document.
 */

import { FORMAT, FORMAT_VERSION } from '../schema';
import type { CollectionData, FontData, PageComponentsData, PodoExport, StylesData } from '../schema';
import { exportVariables } from './variables';
import { exportStyles } from './styles';
import { serializeReferencedComponents, serializeTopLevel } from './nodes';

/**
 * Pages whose components are exported as-is. Components on other pages are
 * embedded only when actually referenced (see serializeReferencedComponents).
 * Adjust when the source file's page names change.
 */
const EXPORT_PAGE_NAMES: readonly string[] = ['Component'];

export type ProgressFn = (phase: string, done: number, total: number) => void;
export type WarnFn = (message: string) => void;

/**
 * Shared context threaded through the node serializer. Everything the
 * serializer discovers as a side effect (fonts, image bytes, warnings) is
 * accumulated here and assembled into the PodoExport at the end.
 */
export interface ExportCtx {
  /** Dedupe key `${family}::${style}` -> FontData (fills PodoExport.fonts). */
  fonts: Map<string, FontData>;
  /** imageHash -> base64 bytes (fills PodoExport.images). */
  images: Record<string, string>;
  /** Shared warning sink (fills PodoExport.warnings). */
  warnings: string[];
  /** Capability gaps call this instead of throwing. */
  warn: WarnFn;
  /**
   * The node serializer awaits this after each serialized top-level item;
   * it drives progress messages and yields to the event loop every ~20 items
   * so the UI stays responsive with 800+ components.
   */
  tick: () => Promise<void>;
  /** Referenced components (instance mains / swap targets) — see nodes.ts. */
  referencedMains: Map<string, ComponentNode | ComponentSetNode>;
  /** ids of components already serialized as page items (incl. variant members). */
  exportedComponentIds: Set<string>;
}

export function fontKey(font: FontData): string {
  return `${font.family}::${font.style}`;
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Counts top-level COMPONENT / COMPONENT_SET nodes on a page (variant members
 * inside a set excluded). Used only for progress totals — the authoritative
 * top-level filter lives in serializeTopLevel.
 */
function countTopLevel(page: PageNode): number {
  const found = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
  let count = 0;
  for (const node of found) {
    if (node.type === 'COMPONENT' && node.parent !== null && node.parent.type === 'COMPONENT_SET') {
      continue;
    }
    count++;
  }
  return count;
}

export async function buildExport(onProgress: ProgressFn): Promise<PodoExport> {
  // Invisible instance children (visible:false overrides) must stay
  // accessible to the serializer — see API-NOTES spec correction 12.
  figma.skipInvisibleInstanceChildren = false;

  onProgress('페이지 로드', 0, 1);
  await figma.loadAllPagesAsync();
  onProgress('페이지 로드', 1, 1);

  const warnings: string[] = [];
  const warn: WarnFn = (message) => {
    warnings.push(message);
  };

  onProgress('변수 내보내기', 0, 1);
  const variables: CollectionData[] = await exportVariables(warn);
  onProgress('변수 내보내기', 1, 1);
  await yieldToUi();

  onProgress('스타일 내보내기', 0, 1);
  const styles: StylesData = await exportStyles(warn);
  onProgress('스타일 내보내기', 1, 1);
  await yieldToUi();

  const fonts = new Map<string, FontData>();
  // Text-style fonts must be loadable on import even if no text node uses
  // them directly (import sets TextStyle.fontName).
  for (const textStyle of styles.text) {
    if (textStyle.fontName) {
      fonts.set(fontKey(textStyle.fontName), {
        family: textStyle.fontName.family,
        style: textStyle.fontName.style,
      });
    }
  }

  let exportPages = figma.root.children.filter((page) => EXPORT_PAGE_NAMES.includes(page.name));
  if (exportPages.length === 0) {
    warn(
      `내보내기 대상 페이지(${EXPORT_PAGE_NAMES.join(', ')})를 찾지 못해 모든 페이지를 내보냅니다.`
    );
    exportPages = [...figma.root.children];
  }
  const pagePlans = exportPages.map((page) => ({ page, count: countTopLevel(page) }));
  const total = pagePlans.reduce((sum, plan) => sum + plan.count, 0);
  let done = 0;

  const postComponents = (): void => {
    onProgress('컴포넌트 직렬화', Math.min(done, total), total);
  };

  const ctx: ExportCtx = {
    fonts,
    images: {},
    warnings,
    warn,
    referencedMains: new Map(),
    exportedComponentIds: new Set(),
    tick: async () => {
      done++;
      if (done % 20 === 0 || done >= total) {
        postComponents();
        await yieldToUi();
      }
    },
  };

  postComponents();

  const pages: PageComponentsData[] = [];
  let expectedDone = 0;
  for (const plan of pagePlans) {
    if (plan.count === 0) {
      continue; // skip pages with zero components
    }
    const pageData: PageComponentsData = await serializeTopLevel(plan.page, ctx);
    if (pageData.items.length > 0) {
      pages.push(pageData);
    }
    // Keep the counter honest even if the serializer skipped items
    // (guarded components inside another top-level subtree).
    expectedDone += plan.count;
    if (done < expectedDone) {
      done = expectedDone;
    }
    postComponents();
    await yieldToUi();
  }

  // Embed referenced-but-not-exported components (external libraries, and
  // local components on pages outside EXPORT_PAGE_NAMES) as a synthetic page
  // so the clone is fully self-contained. The drain can discover more, so the
  // progress total is a lower bound.
  const externalTotal = Array.from(ctx.referencedMains.keys()).filter(
    (id) => !ctx.exportedComponentIds.has(id)
  ).length;
  if (externalTotal > 0) {
    onProgress('참조 컴포넌트 직렬화', 0, externalTotal);
    let externalDone = 0;
    const externalPage = await serializeReferencedComponents({
      ...ctx,
      tick: async () => {
        externalDone++;
        if (externalDone % 10 === 0 || externalDone >= externalTotal) {
          onProgress('참조 컴포넌트 직렬화', externalDone, Math.max(externalDone, externalTotal));
          await yieldToUi();
        }
      },
    });
    if (externalPage) {
      pages.push(externalPage);
    }
  }

  onProgress('문서 조립', 0, 1);
  const fontList = Array.from(fonts.values()).sort(
    (a, b) => a.family.localeCompare(b.family) || a.style.localeCompare(b.style)
  );

  const doc: PodoExport = {
    format: FORMAT,
    version: FORMAT_VERSION,
    source: { fileName: figma.root.name, exportedAt: new Date().toISOString() },
    fonts: fontList,
    variables,
    styles,
    pages,
    images: ctx.images,
    warnings,
  };
  onProgress('문서 조립', 1, 1);
  return doc;
}
