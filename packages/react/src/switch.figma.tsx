// Code Connect: Figma Toggle component set (566:12693) → @podo/react Switch.
// The Figma component is named "Toggle" and its docs page "Switch"; the code
// follows the docs name. state=on/off maps to the web-standard checked prop,
// the disable variant maps to disabled, and the text/label pair becomes the
// label prop (which also names the switch for accessibility).
import React from "react";
import figma from "@figma/code-connect";
import { Switch } from "./index.js";

figma.connect(
  Switch,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=566-12693",
  {
    props: {
      checked: figma.enum("state", { on: true, off: false }),
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
      disabled: figma.enum("disable", { true: true }),
      label: figma.boolean("text", {
        true: figma.string("label"),
        false: undefined,
      }),
    },
    example: ({ checked, size, disabled, label }) => (
      <Switch checked={checked} size={size} disabled={disabled} label={label} />
    ),
  }
);
