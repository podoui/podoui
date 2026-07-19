/**
 * `podo import` — receive a podo-clone export from the Figma plugin (or read
 * it from a file) and write the converted specs into `.podo`.
 *
 * Receive path: a one-shot HTTP listener on 127.0.0.1 (ports 4141-4145, the
 * exact list the plugin manifest allows). The plugin UI POSTs the export to
 * /import; the payload is schema-validated before anything is written.
 */

import { createServer, type Server } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { stdout as nodeStdout } from "node:process";
import { createInterface } from "node:readline/promises";
import {
  parsePodoCloneDocument,
  validateComponentTokenBindings,
  collectTokenPaths,
  type PodoCloneDocument,
  type ValidationIssue,
} from "@podo/spec";
import { mergeTokenDocuments, validateTokenBuild, type TokenSource } from "@podo/tokens";
import { convertPodoClone, type ConvertedFile } from "./figma-convert.js";
import {
  findProjectRoot,
  loadBuildTokenSources,
  loadConfig,
  resolvePodoFilePath,
  type CliIO,
  type ParsedArgs,
} from "./index.js";

export const IMPORT_PORTS = [4141, 4142, 4143, 4144, 4145];
const MAX_BODY_BYTES = 256 * 1024 * 1024;

export interface ImportPlan {
  dryRun: boolean;
  source: { fileName: string; exportedAt: string };
  files: Array<{ path: string; action: "create" | "update" }>;
  warnings: string[];
  conflicts: ValidationIssue[];
}

export async function importProject(args: ParsedArgs, io: CliIO): Promise<ImportPlan> {
  const root = await findProjectRoot(io.cwd);
  await loadConfig(root); // fail fast with the standard "run podo init" message

  const { document, receivedVia } = await receiveDocument(args, io);
  const dryRun = Boolean(args.options["dry-run"]);
  const conversion = convertPodoClone(document);
  if (conversion.files.length === 0) {
    throw new Error("The received export produced no importable tokens, styles, or components.");
  }

  const files = await Promise.all(
    conversion.files.map(async (file) => ({
      path: file.path,
      action: (await exists(resolvePodoFilePath(root, file.path)))
        ? ("update" as const)
        : ("create" as const),
    }))
  );
  const conflicts = await detectConflicts(root, conversion.files);

  const plan: ImportPlan = {
    dryRun,
    source: document.source,
    files,
    warnings: conversion.warnings,
    conflicts,
  };

  logPlan(plan, io);
  const reportPath = stringOption(args, "report");
  if (reportPath) {
    const filePath = resolvePodoFilePath(root, reportPath);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(plan, null, 2)}\n`);
  }
  if (dryRun) {
    io.stdout.log(info("import", "Dry run only. Rerun without --dry-run to apply."));
    return plan;
  }
  if (conflicts.length > 0 && !args.options.force) {
    throw new Error(
      `Import has ${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} with existing .podo specs. Review the [podo:conflict] lines, fix the overlapping files, or rerun with --force.`
    );
  }
  if (!(await confirmApply(args, io, receivedVia))) {
    io.stdout.log(info("import", "Cancelled. No files were written."));
    return plan;
  }

  for (const file of conversion.files) {
    const filePath = resolvePodoFilePath(root, file.path);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(file.document, null, 2)}\n`);
  }
  io.stdout.log(
    info(
      "import",
      `Imported ${conversion.files.length} file${conversion.files.length === 1 ? "" : "s"} from "${document.source.fileName}". Run \`podo build --dry-run\` to review the build.`
    )
  );
  return plan;
}

// ---------------------------------------------------------------- receive

interface ReceivedDocument {
  document: PodoCloneDocument;
  receivedVia: "file" | "network";
}

async function receiveDocument(args: ParsedArgs, io: CliIO): Promise<ReceivedDocument> {
  if (args.options.file === true) {
    throw new Error("--file requires a path to a plugin export JSON.");
  }
  const filePath = stringOption(args, "file");
  if (filePath) {
    const raw = await readFile(resolve(io.cwd, filePath), "utf8");
    return { document: parseDocument(raw), receivedVia: "file" };
  }
  return { document: await receiveFromPlugin(args, io), receivedVia: "network" };
}

function parseDocument(raw: string): PodoCloneDocument {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `The payload is not valid JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  try {
    return parsePodoCloneDocument(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`The payload failed podo-clone schema validation:\n${message.slice(0, 2000)}`);
  }
}

async function receiveFromPlugin(args: ParsedArgs, io: CliIO): Promise<PodoCloneDocument> {
  const portOption = stringOption(args, "port");
  const ports = portOption ? [parsePort(portOption)] : IMPORT_PORTS;
  const server = createServer();
  const port = await listenOnFirstAvailablePort(server, ports);

  io.stdout.log(
    info(
      "import",
      `Waiting for the Figma plugin on http://127.0.0.1:${port}/import — open the PODO plugin and press "프로젝트로 보내기"${port === IMPORT_PORTS[0] ? "" : ` (set the plugin port to ${port})`}. Press Ctrl+C to cancel.`
    )
  );

  try {
    return await new Promise<PodoCloneDocument>((resolvePayload, rejectPayload) => {
      server.on("request", (request, response) => {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "content-type");
        // Chrome Private Network Access preflight (https page → 127.0.0.1).
        response.setHeader("Access-Control-Allow-Private-Network", "true");

        // The Figma plugin UI iframe sends `Origin: null`; local tools (curl,
        // tests) send no Origin at all. Any other origin is a drive-by web
        // page — refuse it, and keep waiting for the real plugin request.
        const origin = request.headers.origin;
        if (origin !== undefined && origin !== "null") {
          io.stdout.log(
            info("import", `Rejected a request from disallowed origin "${origin}"; still waiting.`)
          );
          response.writeHead(403, { "content-type": "text/plain" }).end("Origin not allowed");
          return;
        }
        if (request.method === "OPTIONS") {
          response.writeHead(204).end();
          return;
        }
        if (request.method !== "POST" || request.url !== "/import") {
          response.writeHead(404, { "content-type": "text/plain" }).end("POST /import only");
          return;
        }

        const chunks: Buffer[] = [];
        let received = 0;
        let aborted = false;
        request.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > MAX_BODY_BYTES) {
            aborted = true;
            response.writeHead(413, { "content-type": "text/plain" }).end("Payload too large");
            request.destroy();
            return;
          }
          chunks.push(chunk);
        });
        request.on("end", () => {
          if (aborted) {
            return;
          }
          try {
            const document = parseDocument(Buffer.concat(chunks).toString("utf8"));
            response
              .writeHead(200, { "content-type": "application/json" })
              .end(JSON.stringify({ ok: true }));
            resolvePayload(document);
          } catch (error) {
            // Invalid payloads must not tear down the waiting session — report
            // to both sides and keep listening for the next attempt.
            const message = error instanceof Error ? error.message : String(error);
            response.writeHead(400, { "content-type": "text/plain; charset=utf-8" }).end(message);
            io.stdout.log(info("import", `Rejected an invalid payload; still waiting. ${message}`));
          }
        });
        request.on("error", () => {
          // Client vanished mid-request; keep waiting for the next attempt.
        });
      });
      server.on("error", (error) => rejectPayload(error));
    });
  } finally {
    server.close();
    server.closeAllConnections?.();
  }
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!IMPORT_PORTS.includes(port)) {
    throw new Error(
      `Port ${value} is outside the plugin's allowed range (${IMPORT_PORTS.join(", ")}).`
    );
  }
  return port;
}

async function listenOnFirstAvailablePort(server: Server, ports: number[]): Promise<number> {
  for (const port of ports) {
    const bound = await new Promise<boolean>((resolveBound, rejectBound) => {
      const onError = (error: NodeJS.ErrnoException): void => {
        server.removeListener("listening", onListening);
        if (error.code === "EADDRINUSE" || error.code === "EACCES") {
          resolveBound(false);
          return;
        }
        rejectBound(error);
      };
      const onListening = (): void => {
        server.removeListener("error", onError);
        resolveBound(true);
      };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port, "127.0.0.1");
    });
    if (bound) {
      return port;
    }
  }
  throw new Error(
    `Every import port (${ports.join(", ")}) is already in use. Close the process holding them or pass --port.`
  );
}

// ---------------------------------------------------------------- conflicts

async function detectConflicts(root: string, files: ConvertedFile[]): Promise<ValidationIssue[]> {
  const replaced = new Set(files.map((file) => resolvePodoFilePath(root, file.path)));
  const existing = (await loadBuildTokenSources(root)).filter(
    (source) => !replaced.has(resolve(root, source.filePath))
  );
  const imported: TokenSource[] = files
    .filter((file) => file.document.kind === "tokens")
    .map((file) => ({
      document: file.document as TokenSource["document"],
      filePath: file.path,
      tier: "project",
    }));
  const sources = [...existing, ...imported];
  const issues = validateTokenBuild(sources);

  const tokenPaths = collectTokenPaths(mergeTokenDocuments(sources).tokens);
  for (const file of files) {
    if (file.document.kind === "component") {
      issues.push(...validateComponentTokenBindings(file.document, tokenPaths));
    }
  }
  return issues;
}

// ------------------------------------------------------------------ output

function logPlan(plan: ImportPlan, io: CliIO): void {
  io.stdout.log(
    info(
      "import",
      `Received "${plan.source.fileName}" (exported ${plan.source.exportedAt.slice(0, 10)}): ${plan.files.length} file${plan.files.length === 1 ? "" : "s"} planned.`
    )
  );
  for (const file of plan.files) {
    io.stdout.log(`[podo:plan] ${file.action} ${file.path}`);
  }
  for (const warning of plan.warnings) {
    io.stdout.log(`[podo:warn] ${warning}`);
  }
  for (const conflict of plan.conflicts) {
    io.stderr.error(`[podo:conflict] ${conflict.code} ${conflict.path} - ${conflict.message}`);
  }
}

async function confirmApply(
  args: ParsedArgs,
  io: CliIO,
  receivedVia: "file" | "network"
): Promise<boolean> {
  // Network-received payloads are never applied unattended: any local process
  // could have POSTed a schema-valid document, so a human must review the
  // plan. `--yes` stays available for the reviewed-file path.
  if (args.options.yes) {
    if (receivedVia === "file") {
      return true;
    }
    io.stdout.log(
      info("import", "--yes is ignored for network-received payloads; confirm the plan below.")
    );
  }
  if (!io.stdin?.isTTY) {
    throw new Error(
      receivedVia === "file"
        ? "Not a terminal. Rerun with --yes to apply, or --dry-run to only review."
        : "Not a terminal. Network-received imports require interactive confirmation; save the export and use `podo import --file <path> --yes` for unattended runs."
    );
  }
  const rl = createInterface({ input: io.stdin, output: nodeStdout });
  try {
    const answer = await rl.question("Apply these changes to .podo? (yes/no): ");
    return ["y", "yes"].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
}

function info(scope: string, message: string): string {
  return `[podo:${scope}] ${message}`;
}

function stringOption(args: ParsedArgs, key: string): string | undefined {
  const value = args.options[key];
  return typeof value === "string" ? value : undefined;
}

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    });
}
