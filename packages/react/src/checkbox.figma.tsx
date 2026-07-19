// Code Connect: Figma Checkbox component set (328:18039) → @podoui/react Checkbox.
// state=checked/unchecked maps to the web-standard checked prop and
// state=indeterminate to the indeterminate prop (announced as mixed). The
// disabled/bold variants map to the same-named booleans, size passes through
// (it only scales the label — the box is a fixed 18px), and the text/label
// pair becomes the label prop.
import React from "react";
import figma from "@figma/code-connect";
import { Checkbox } from "./index.js";

figma.connect(
  Checkbox,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=328-18039",
  {
    props: {
      checked: figma.enum("state", { checked: true, unchecked: false }),
      indeterminate: figma.enum("state", { indeterminate: true }),
      size: figma.enum("size", { md: "md", lg: "lg" }),
      bold: figma.enum("bold", { true: true }),
      disabled: figma.enum("disabled", { true: true }),
      label: figma.boolean("text", {
        true: figma.string("label"),
        false: undefined,
      }),
    },
    example: ({ checked, indeterminate, size, bold, disabled, label }) => (
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        size={size}
        bold={bold}
        disabled={disabled}
        label={label}
      />
    ),
  }
);
