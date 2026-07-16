/**
 * Plugin entry point: shows the UI, routes UiToMain messages to the export /
 * import pipelines and forwards progress + errors back to the UI.
 */

import { buildExport } from './export/index';
import { runImport } from './import/index';
import type { MainToUi, PodoExport, UiToMain } from './schema';

figma.showUI(__html__, { width: 360, height: 480 });

let busy = false;

function post(msg: MainToUi): void {
  figma.ui.postMessage(msg);
}

/** error.message plus the head of the stack, for actionable error reports. */
function describeError(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message || String(err);
    const stack = typeof err.stack === 'string' ? err.stack : '';
    const head = stack.split('\n').slice(0, 4).join('\n').trim();
    if (head && head.indexOf(message) === -1) {
      return `${message}\n${head}`;
    }
    return head || message;
  }
  return String(err);
}

/** figma.root.name may contain characters that are illegal in file names. */
function suggestedFileName(): string {
  const base = figma.root.name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'podo-export';
  return `${base}.podo-export.json`;
}

async function handleExport(): Promise<void> {
  const doc = await buildExport((phase, done, total) => {
    post({ type: 'progress', phase, done, total });
  });
  // The whole document goes out as ONE string in ONE postMessage (no chunking);
  // the UI builds the download Blob directly from it.
  post({ type: 'export-done', payload: JSON.stringify(doc), fileName: suggestedFileName() });
}

async function handleImport(payload: string): Promise<void> {
  let doc: PodoExport;
  try {
    doc = JSON.parse(payload) as PodoExport;
  } catch {
    throw new Error(
      '가져오기 실패: 선택한 파일을 JSON으로 해석할 수 없습니다. Podo Cloner가 내보낸 .podo-export.json 파일인지 확인하세요.'
    );
  }
  const report = await runImport(doc, (phase, done, total) => {
    post({ type: 'progress', phase, done, total });
  });
  post({ type: 'import-done', report });
}

figma.ui.onmessage = async (raw: unknown) => {
  const msg = raw as UiToMain;
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return;
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
    return;
  }

  if (msg.type !== 'export' && msg.type !== 'import') {
    return;
  }

  if (busy) {
    post({ type: 'error', message: '이미 다른 작업이 실행 중입니다. 완료된 뒤 다시 시도하세요.' });
    return;
  }

  busy = true;
  try {
    if (msg.type === 'export') {
      await handleExport();
    } else {
      await handleImport(msg.payload);
    }
  } catch (err) {
    post({ type: 'error', message: describeError(err) });
  } finally {
    busy = false;
  }
};
