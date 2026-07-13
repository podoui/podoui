// Code Connect: Figma Chip component set (328:14276) → @podo/react Chip.
// The size vocabulary now matches the set: md 13px (base) / lg 16px.
import React from "react";
import figma from "@figma/code-connect";
import { Chip, Icon } from "./index.js";

figma.connect(
  Chip,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=328-14276",
  {
    props: {
      theme: figma.enum("theme", {
        solid: "solid",
        "outline-strong": "outline-strong",
        "outline-weak": "outline-weak",
      }),
      size: figma.enum("size", { md: "md", lg: "lg" }),
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
    example: ({ theme, size, disabled, prefix, suffix }) => (
      <Chip theme={theme} size={size} disabled={disabled} prefix={prefix} suffix={suffix}>
        Label
      </Chip>
    ),
  }
);
