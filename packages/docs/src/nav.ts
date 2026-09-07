import routes from "./data/routes.json" with { type: "json" };
import type { ComponentType } from "react";
import { BadgePage } from "./pages/BadgePage.js";
import { BorderPage } from "./pages/BorderPage.js";
import { ButtonPage } from "./pages/ButtonPage.js";
import { CheckboxPage } from "./pages/CheckboxPage.js";
import { ChipPage } from "./pages/ChipPage.js";
import { ColorPage } from "./pages/ColorPage.js";
import { DatepickerPage } from "./pages/DatepickerPage.js";
import { DisplayPage } from "./pages/DisplayPage.js";
import { EditorPage } from "./pages/EditorPage.js";
import { ElevationPage } from "./pages/ElevationPage.js";
import { FieldPage } from "./pages/FieldPage.js";
import { GridPage } from "./pages/GridPage.js";
import { IconPage } from "./pages/IconPage.js";
import { InputPage } from "./pages/InputPage.js";
import { RadioPage } from "./pages/RadioPage.js";
import { RadiusPage } from "./pages/RadiusPage.js";
import { SelectPage } from "./pages/SelectPage.js";
import { McpPage } from "./pages/McpPage.js";
import { SetupPage } from "./pages/SetupPage.js";
import { SpacingPage } from "./pages/SpacingPage.js";
import { SwitchPage } from "./pages/SwitchPage.js";
import { TablePage } from "./pages/TablePage.js";
import { TextareaPage } from "./pages/TextareaPage.js";
import { ToastPage } from "./pages/ToastPage.js";
import { TooltipPage } from "./pages/TooltipPage.js";
import { TypographyPage } from "./pages/TypographyPage.js";

export interface NavItem {
  /** URL slug, used as the clean document route (e.g. /button). */
  slug: string;
  title: string;
  group: string;
  page: ComponentType;
}

/**
 * Route metadata lives in data/routes.json.
 * Register each documented page here and add its metadata to that JSON file.
 */
const pages: Record<string, ComponentType> = {
  setup: SetupPage,
  mcp: McpPage,
  color: ColorPage,
  typography: TypographyPage,
  spacing: SpacingPage,
  grid: GridPage,
  icon: IconPage,
  border: BorderPage,
  radius: RadiusPage,
  elevation: ElevationPage,
  display: DisplayPage,
  badge: BadgePage,
  button: ButtonPage,
  checkbox: CheckboxPage,
  chip: ChipPage,
  datepicker: DatepickerPage,
  editor: EditorPage,
  field: FieldPage,
  input: InputPage,
  radio: RadioPage,
  select: SelectPage,
  switch: SwitchPage,
  table: TablePage,
  textarea: TextareaPage,
  toast: ToastPage,
  tooltip: TooltipPage,
};

for (const slug of Object.keys(pages)) {
  if (!routes.some((route) => route.slug === slug))
    throw new Error(`Missing route metadata: ${slug}`);
}

export const NAV: NavItem[] = routes
  .filter((route) => route.slug !== "")
  .map((route) => {
    const page = pages[route.slug];
    if (!page) throw new Error(`Missing docs page: ${route.slug}`);
    if (!route.group?.trim()) throw new Error(`Missing docs group: ${route.slug}`);
    return {
      slug: route.slug,
      title: route.title.replace(/ \| Podo UI$/, ""),
      group: route.group,
      page,
    };
  });

export function findBySlug(slug: string): NavItem | undefined {
  return NAV.find((item) => item.slug === slug);
}
