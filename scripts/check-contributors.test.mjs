import { describe, expect, it } from "vitest";
import { assertContributorTable, parseContributorTable } from "./check-contributors.mjs";

const contributors = [
  { name: "전예진", roleEn: "Main Designer", email: "yenny.uxui@gmail.com" },
  { name: "권오수", roleEn: "Designer", email: "rnjsdhtn95@gmail.com" },
];

function table(rows) {
  return [
    "| 이름 | 역할 | 이메일 |",
    "| --- | --- | --- |",
    ...rows.map(
      ({ name, roleEn, email }) => `| ${name} | ${roleEn} | [${email}](mailto:${email}) |`
    ),
  ].join("\n");
}

describe("contributor metadata check", () => {
  it("parses and accepts exact ordered contributor tuples", () => {
    const markdown = table(contributors);

    expect(parseContributorTable(markdown)).toEqual(contributors);
    expect(() => assertContributorTable(markdown, contributors)).not.toThrow();
  });

  it("rejects rows whose contributor emails were swapped", () => {
    const swapped = [
      { ...contributors[0], email: contributors[1].email },
      { ...contributors[1], email: contributors[0].email },
    ];

    expect(() => assertContributorTable(table(swapped), contributors, "README.md")).toThrow(
      "README.md contributor rows do not exactly match"
    );
  });
});
