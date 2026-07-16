import * as esbuild from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const watch = process.argv.includes('--watch');

mkdirSync('dist', { recursive: true });

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2019',
  format: 'iife',
  logLevel: 'info',
};

// snapshot.json (원본 파일에서 내보낸 podo-export JSON)이 있으면 UI에 내장한다.
// JSON 문자열 안의 "</" 는 "<\/" 로 이스케이프해야 script 태그가 조기 종료되지 않는다
// (JSON에서 "<"와 "/"는 문자열 안에만 나타나므로 전역 치환이 안전하다).
const copyUi = () => {
  let html = readFileSync('src/ui.html', 'utf8');
  if (existsSync('snapshot.json')) {
    const marker = '<!-- __PODO_SNAPSHOT__';
    if (!html.includes(marker)) {
      throw new Error('src/ui.html에 __PODO_SNAPSHOT__ 마커가 없습니다 — 스냅샷을 내장할 수 없습니다.');
    }
    const json = readFileSync('snapshot.json', 'utf8').replace(/<\//g, '<\\/');
    // 마커 위치(메인 스크립트보다 앞)에 삽입해야 파싱 시점 감지가 동작한다.
    html = html.replace(
      marker,
      `<script id="podo-snapshot" type="application/json">${json}</script>\n  ${marker}`
    );
    console.log(`  snapshot.json embedded (${(json.length / 1048576).toFixed(1)}MB)`);
  }
  writeFileSync('dist/ui.html', html);
};

if (watch) {
  const ctx = await esbuild.context(options);
  copyUi();
  await ctx.watch();
} else {
  await esbuild.build(options);
  copyUi();
}
