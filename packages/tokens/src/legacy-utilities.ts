import { parseLegacyUtilitiesDocument } from "@podoui/spec";
import legacyUtilitiesJson from "./legacy-utilities.json" with { type: "json" };

export const legacyUtilitiesContract = parseLegacyUtilitiesDocument(legacyUtilitiesJson);

const entries = <T>(value: Record<string, T>): Array<[string, T]> => Object.entries(value);

export function emitLegacyUtilitiesCss(): string {
  const { border, radius, shadow, visibility } = legacyUtilitiesContract;
  const lines: string[] = ["/* podo-legacy-utilities:start */"];

  for (const [name, width] of entries(border.widths)) {
    lines.push(`.border-${name} {`, `  border: ${width} ${border.style};`, "}");
  }
  for (const [name, value] of entries(radius.values)) {
    lines.push(`.r-${name} {`, `  border-radius: ${value};`, "}");
  }
  for (const [name, value] of entries(shadow.values)) {
    lines.push(`.shadow-${name} {`, `  box-shadow: ${value};`, "}");
  }

  lines.push(...elevationVariableBlock(":root", "light"));
  lines.push(...elevationVariableBlock('[data-color-scheme="light"]', "light"));
  lines.push(...elevationVariableBlock('[data-color-mode="light"]', "light"));
  lines.push(...elevationVariableBlock('[data-color-scheme="dark"]', "dark"));
  lines.push(...elevationVariableBlock('[data-color-mode="dark"]', "dark"));
  lines.push(
    ".bg-elevation {",
    "  background-color: var(--podo-legacy-bg-elevation);",
    "}",
    ".bg-elevation-1 {",
    "  background-color: var(--podo-legacy-bg-elevation-1);",
    "}",
    ".bg-elevation-2 {",
    "  background-color: var(--podo-legacy-bg-elevation-2);",
    "  box-shadow: var(--podo-legacy-shadow-1);",
    "}"
  );
  lines.push(
    ".bg-elevation-3 {",
    "  background-color: var(--podo-legacy-bg-elevation-3);",
    "  box-shadow: var(--podo-legacy-shadow-2);",
    "}"
  );
  lines.push(
    '[data-color-scheme="dark"] .bg-elevation-2,',
    '[data-color-scheme="dark"] .bg-elevation-3,',
    '[data-color-mode="dark"] .bg-elevation-2,',
    '[data-color-mode="dark"] .bg-elevation-3 {',
    "  box-shadow: none;",
    "}"
  );

  lines.push(".hide {", "  display: none !important;", "}");
  lines.push(
    `@media screen and (min-width: ${visibility.breakpoints.pc.minWidth}) {`,
    "  .hide-pc {",
    "    display: none !important;",
    "  }",
    "}"
  );
  lines.push(
    `@media screen and (min-width: ${visibility.breakpoints.tablet.minWidth}) and (max-width: ${visibility.breakpoints.tablet.maxWidth}) {`,
    "  .hide-tb {",
    "    display: none !important;",
    "  }",
    "}"
  );
  lines.push(
    `@media screen and (max-width: ${visibility.breakpoints.mobile.maxWidth}) {`,
    "  .hide-mo {",
    "    display: none !important;",
    "  }",
    "}"
  );

  lines.push("@media (prefers-color-scheme: dark) {");
  lines.push(
    ...elevationVariableBlock(
      ':root:not([data-color-scheme="light"]):not([data-color-mode="light"])',
      "dark",
      "  "
    )
  );
  lines.push(
    '  :root:not([data-color-scheme="light"]):not([data-color-mode="light"]) .bg-elevation-2,',
    '  :root:not([data-color-scheme="light"]):not([data-color-mode="light"]) .bg-elevation-3 {',
    "    box-shadow: none;",
    "  }"
  );
  lines.push("}", "/* podo-legacy-utilities:end */");

  return `${lines.join("\n")}\n`;
}

export function emitLegacyUtilitiesScss(): string {
  const { border, elevation, radius, shadow, visibility } = legacyUtilitiesContract;
  return `@use 'sass:map';

$border: (${mapEntries(border.widths)});
$radius: (${mapEntries(radius.values)});
$shadow: (${mapEntries(shadow.values)});

@function border($key) { @return map.get($border, $key); }
@function r($key) { @return map.get($radius, $key); }
@function shadow($key) { @return map.get($shadow, $key); }

@each $key, $value in $border { .border-#{$key} { border: $value ${border.style}; } }
@each $key, $value in $radius { .r-#{$key} { border-radius: $value; } }
@each $key, $value in $shadow { .shadow-#{$key} { box-shadow: $value; } }

:root, [data-color-scheme='light'], [data-color-mode='light'] {
${scssElevationVariables("light")}
}
[data-color-scheme='dark'], [data-color-mode='dark'] {
${scssElevationVariables("dark")}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-color-scheme='light']):not([data-color-mode='light']) {
${scssElevationVariables("dark", "    ")}
    .bg-elevation-2, .bg-elevation-3 { box-shadow: none; }
  }
}
.bg-elevation { background-color: var(--podo-legacy-bg-elevation); }
.bg-elevation-1 { background-color: var(--podo-legacy-bg-elevation-1); }
.bg-elevation-2 { background-color: var(--podo-legacy-bg-elevation-2); box-shadow: shadow(1); }
.bg-elevation-3 { background-color: var(--podo-legacy-bg-elevation-3); box-shadow: shadow(2); }
[data-color-scheme='dark'], [data-color-mode='dark'] {
  .bg-elevation-2, .bg-elevation-3 { box-shadow: none; }
}

.hide { display: none !important; }
@media screen and (min-width: ${visibility.breakpoints.pc.minWidth}) { .hide-pc { display: none !important; } }
@media screen and (min-width: ${visibility.breakpoints.tablet.minWidth}) and (max-width: ${visibility.breakpoints.tablet.maxWidth}) { .hide-tb { display: none !important; } }
@media screen and (max-width: ${visibility.breakpoints.mobile.maxWidth}) { .hide-mo { display: none !important; } }
`;

  function scssElevationVariables(mode: "light" | "dark", indent = "  "): string {
    return entries(elevation.values)
      .map(
        ([name, value]) =>
          `${indent}--podo-legacy-bg-elevation${name === "base" ? "" : `-${name}`}: ${value[mode]};`
      )
      .join("\n");
  }
}

function elevationVariableBlock(selector: string, mode: "light" | "dark", indent = ""): string[] {
  const { elevation, shadow } = legacyUtilitiesContract;
  const declarations = entries(elevation.values).map(([name, value]) => {
    const suffix = name === "base" ? "" : `-${name}`;
    return `${indent}  --podo-legacy-bg-elevation${suffix}: ${value[mode]};`;
  });
  declarations.push(`${indent}  --podo-legacy-shadow-1: ${shadow.values["1"]};`);
  declarations.push(`${indent}  --podo-legacy-shadow-2: ${shadow.values["2"]};`);
  return [`${indent}${selector} {`, ...declarations, `${indent}}`];
}

function mapEntries(value: Record<string, string>): string {
  return entries(value)
    .map(([name, item]) => `${name}: ${item}`)
    .join(", ");
}
