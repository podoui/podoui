import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const communityRoot = join(pluginRoot, "community");
const metadata = JSON.parse(
  await readFile(join(communityRoot, "assets.json"), "utf8"),
);

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const failures = [];

for (const asset of metadata.assets) {
  const filePath = join(communityRoot, asset.file);
  let bytes;

  try {
    bytes = await readFile(filePath);
  } catch (error) {
    failures.push(`${asset.file}: 파일을 읽을 수 없습니다 (${error.message})`);
    continue;
  }

  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
    failures.push(`${asset.file}: 올바른 PNG 파일이 아닙니다`);
    continue;
  }

  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  if (width !== asset.width || height !== asset.height) {
    failures.push(
      `${asset.file}: ${width}×${height}, 예상 ${asset.width}×${asset.height}`,
    );
  }

  if (sha256 !== asset.sha256) {
    failures.push(`${asset.file}: SHA-256이 assets.json과 다릅니다`);
  }
}

for (const consumer of metadata.consumers ?? []) {
  try {
    const source = await readFile(join(communityRoot, consumer.source));
    const consumed = await readFile(join(communityRoot, consumer.file));
    if (!source.equals(consumed)) {
      failures.push(
        `${consumer.file}: ${consumer.source}와 바이트가 일치하지 않습니다`,
      );
    }
  } catch (error) {
    failures.push(`${consumer.file}: 소비 자산을 읽을 수 없습니다 (${error.message})`);
  }
}

if (failures.length > 0) {
  console.error("Figma Community 배포 자산 검증 실패:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `Figma Community 배포 자산 ${metadata.assets.length}개와 소비 자산 ${(metadata.consumers ?? []).length}개가 원본 규격 및 체크섬과 일치합니다.`,
  );
}
