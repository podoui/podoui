import type { ComponentType } from "react";
import { ButtonPage } from "./pages/ButtonPage.js";
import { ColorPage } from "./pages/ColorPage.js";
import { FieldPage } from "./pages/FieldPage.js";
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
  { slug: "color", title: "Color", group: "Foundation", page: ColorPage },
  { slug: "typography", title: "Typography", group: "Foundation", page: TypographyPage },
  { slug: "button", title: "Button", group: "Components", page: ButtonPage },
  { slug: "field", title: "Field", group: "Components", page: FieldPage },
];

export function findBySlug(slug: string): NavItem | undefined {
  return NAV.find((item) => item.slug === slug);
}
