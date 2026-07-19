// Code Connect: Figma Radio component set (379:3350) → @podoui/react Radio.
// The checked/disabled/bold variants map to the same-named booleans, size
// passes through (it only scales the label — the circle is a fixed 18px), and
// the text/label pair becomes the label prop. Group membership (name) is a
// code-side concern with no Figma counterpart.
import React from "react";
import figma from "@figma/code-connect";
import { Radio } from "./index.js";

figma.connect(
  Radio,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=379-3350",
  {
    props: {
      checked: figma.enum("checked", { true: true, false: false }),
      size: figma.enum("size", { md: "md", lg: "lg" }),
      bold: figma.enum("bold", { true: true }),
      disabled: figma.enum("disabled", { true: true }),
      label: figma.boolean("text", {
        true: figma.string("label"),
        false: undefined,
      }),
    },
    example: ({ checked, size, bold, disabled, label }) => (
      <Radio defaultChecked={checked} size={size} bold={bold} disabled={disabled} label={label} />
    ),
  }
);
