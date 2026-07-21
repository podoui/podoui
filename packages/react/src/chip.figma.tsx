// Code Connect: Figma Chip component set (328:14276) → @podoui/react Chip.
// The size vocabulary matches the set (md 14px base / lg 16px), and the
// selection states map to the selected boolean — the pressed variants are
// platform interactions (:active) and never become props.
import React from "react";
import figma from "@figma/code-connect";
import { Chip, Icon } from "./index.js";

figma.connect(
  Chip,
  "https://www.figma.com/design/uaLVvCUnvoWj4oz6ZMXxwP/PODO-Design-System?node-id=328-14276",
  {
    props: {
      theme: figma.enum("theme", {
        solid: "solid",
        "outline-strong": "outline-strong",
        "outline-weak": "outline-weak",
      }),
      size: figma.enum("size", { md: "md", lg: "lg" }),
      selected: figma.enum("state", { selected: true, unselected: false }),
      disabled: figma.enum("state", { disabled: true }),
      prefix: figma.boolean("prefix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
      suffix: figma.boolean("suffix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
    },
    example: ({ theme, size, selected, disabled, prefix, suffix }) => (
      <Chip
        theme={theme}
        size={size}
        selected={selected}
        disabled={disabled}
        prefix={prefix}
        suffix={suffix}
      >
        Label
      </Chip>
    ),
  }
);
