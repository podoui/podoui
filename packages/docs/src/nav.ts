import type { ComponentType } from "react";
import { BadgePage } from "./pages/BadgePage.js";
import { ButtonPage } from "./pages/ButtonPage.js";
import { CheckboxPage } from "./pages/CheckboxPage.js";
import { ChipPage } from "./pages/ChipPage.js";
import { ColorPage } from "./pages/ColorPage.js";
import { DatepickerPage } from "./pages/DatepickerPage.js";
import { EditorPage } from "./pages/EditorPage.js";
import { FieldPage } from "./pages/FieldPage.js";
import { GridPage } from "./pages/GridPage.js";
import { IconPage } from "./pages/IconPage.js";
import { InputPage } from "./pages/InputPage.js";
import { RadioPage } from "./pages/RadioPage.js";
import { SelectPage } from "./pages/SelectPage.js";
import { SetupPage } from "./pages/SetupPage.js";
import { SpacingPage } from "./pages/SpacingPage.js";
import { SwitchPage } from "./pages/SwitchPage.js";
import { TablePage } from "./pages/TablePage.js";
import { TextareaPage } from "./pages/TextareaPage.js";
import { ToastPage } from "./pages/ToastPage.js";
import { TooltipPage } from "./pages/TooltipPage.js";
import { TypographyPage } from "./pages/TypographyPage.js";

export interface NavItem {
  /** URL slug, used as the hash route (e.g. #/button). */
  slug: string;
  title: string;
  group: string;
  page: ComponentType;
}

/**
 * The site's single source of truth for routing + sidebar.
 * Add a component to the docs by adding one entry here.
 */
export const NAV: NavItem[] = [
  { slug: "setup", title: "설치와 토큰 적용", group: "Guide", page: SetupPage },
  { slug: "color", title: "Color", group: "Foundation", page: ColorPage },
  { slug: "typography", title: "Typography", group: "Foundation", page: TypographyPage },
  { slug: "spacing", title: "Spacing", group: "Foundation", page: SpacingPage },
  { slug: "grid", title: "Grid", group: "Foundation", page: GridPage },
  { slug: "icon", title: "Icon", group: "Foundation", page: IconPage },
  { slug: "badge", title: "Badge", group: "Components", page: BadgePage },
  { slug: "button", title: "Button", group: "Components", page: ButtonPage },
  { slug: "checkbox", title: "Checkbox", group: "Components", page: CheckboxPage },
  { slug: "chip", title: "Chip", group: "Components", page: ChipPage },
  { slug: "datepicker", title: "DatePicker", group: "Components", page: DatepickerPage },
  { slug: "editor", title: "Editor", group: "Components", page: EditorPage },
  { slug: "field", title: "Field", group: "Components", page: FieldPage },
  { slug: "input", title: "Input", group: "Components", page: InputPage },
  { slug: "radio", title: "Radio", group: "Components", page: RadioPage },
  { slug: "select", title: "Select", group: "Components", page: SelectPage },
  { slug: "switch", title: "Switch", group: "Components", page: SwitchPage },
  { slug: "table", title: "Table", group: "Components", page: TablePage },
  { slug: "textarea", title: "Textarea", group: "Components", page: TextareaPage },
  { slug: "toast", title: "Toast", group: "Components", page: ToastPage },
  { slug: "tooltip", title: "Tooltip", group: "Components", page: TooltipPage },
];

export function findBySlug(slug: string): NavItem | undefined {
  return NAV.find((item) => item.slug === slug);
}
