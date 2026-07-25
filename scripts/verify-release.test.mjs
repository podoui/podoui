import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { listPackageDirectories } from "./verify-release.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true }))
  );
});

describe("listPackageDirectories", () => {
  it("ignores metadata files and returns only package directories", async () => {
    const directory = await mkdtemp(join(tmpdir(), "podo-release-"));
    temporaryDirectories.push(directory);
    await Promise.all([
      mkdir(join(directory, "react")),
      mkdir(join(directory, "native")),
      writeFile(join(directory, ".DS_Store"), "metadata"),
      writeFile(join(directory, "README.md"), "not a package"),
    ]);

    await expect(listPackageDirectories(directory)).resolves.toEqual(["native", "react"]);
  });
});
