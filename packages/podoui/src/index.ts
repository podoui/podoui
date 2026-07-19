#!/usr/bin/env node

/**
 * `npx podoui` — thin interactive wrapper over `@podoui/cli`.
 *
 * With arguments it is a pass-through (`podoui import --file x.json` ===
 * `podo import --file x.json`); with no arguments on a terminal it shows a
 * small menu so designers/developers can start the Figma import without
 * memorizing commands.
 */

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stdin as nodeStdin, stdout as nodeStdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { runCli } from "@podoui/cli";

interface MenuEntry {
  key: string;
  label: string;
  argv: string[];
}

export const MENU: MenuEntry[] = [
  { key: "1", label: "피그마에서 가져오기 (podo import)", argv: ["import"] },
  { key: "2", label: "프로젝트 초기화 (podo init)", argv: ["init"] },
  { key: "3", label: "빌드 (podo build)", argv: ["build"] },
  { key: "4", label: "검증 (podo validate)", argv: ["validate"] },
];

export async function runPodoui(argv = process.argv.slice(2)): Promise<number> {
  if (argv.length > 0) {
    return runCli(argv);
  }
  if (!nodeStdin.isTTY) {
    return runCli([]); // prints podo help
  }

  nodeStdout.write("PODO UI\n\n");
  for (const entry of MENU) {
    nodeStdout.write(`  ${entry.key}) ${entry.label}\n`);
  }
  nodeStdout.write("\n");

  const rl = createInterface({ input: nodeStdin, output: nodeStdout });
  try {
    const answer = (await rl.question(`선택 (1-${MENU.length}, Enter로 취소): `)).trim();
    const entry = MENU.find((item) => item.key === answer);
    if (!entry) {
      nodeStdout.write("취소했습니다.\n");
      return 0;
    }
    return runCli(entry.argv);
  } finally {
    rl.close();
  }
}

// npm installs bins as symlinks (node_modules/.bin/podoui → dist/index.js), so
// the main-module check must compare realpaths or `npx podoui` silently no-ops.
if (process.argv[1] && fileURLToPath(import.meta.url) === safeRealpath(process.argv[1])) {
  runPodoui().then((code) => {
    process.exitCode = code;
  });
}

function safeRealpath(path: string): string | undefined {
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
}
