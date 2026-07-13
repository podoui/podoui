// Code Connect: Figma Tooltip component set (388:2125) → @podo/react Tooltip.
// theme/position/ordinal pass through and the label text becomes the label
// prop. The trigger child, hover behavior, and portal are code-side concerns
// with no Figma counterpart — the example shows a representative trigger.
import React from "react";
import figma from "@figma/code-connect";
import { Button, Tooltip } from "./index.js";

figma.connect(
  Tooltip,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=388-2125",
  {
    props: {
      label: figma.string("label"),
      theme: figma.enum("theme", { default: "default", reverse: "reverse" }),
      position: figma.enum("position", {
        right: "right",
        left: "left",
        bottom: "bottom",
        top: "top",
      }),
      ordinal: figma.enum("ordinal", { first: "first", second: "second", third: "third" }),
    },
    example: ({ label, theme, position, ordinal }) => (
      <Tooltip label={label} theme={theme} position={position} ordinal={ordinal}>
        <Button size="sm">대상 요소</Button>
      </Tooltip>
    ),
  }
);
