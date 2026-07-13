// Code Connect: Figma Toggle component set (338:2464) → @podo/react Switch.
// The Figma component is named "Toggle" and its docs page "Switch"; the code
// follows the docs name. state=on/off maps to the web-standard checked prop,
// and the disable variant maps to disabled.
import React from "react";
import figma from "@figma/code-connect";
import { Switch } from "./index.js";

figma.connect(
  Switch,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=338-2464",
  {
    props: {
      checked: figma.enum("state", { on: true, off: false }),
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
      disabled: figma.enum("disable", { true: true }),
    },
    example: ({ checked, size, disabled }) => (
      <Switch checked={checked} size={size} disabled={disabled} aria-label="설정" />
    ),
  }
);
