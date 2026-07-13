// Code Connect: Figma Textarea component set (380:3867) → @podo/react Textarea.
// - "state" keeps danger→invalid, disabled, and read-only→readOnly;
//   normal/hover/focused are platform interactions and completed is simply a
//   filled value
// - the resize boolean passes through as the resize prop
import React from "react";
import figma from "@figma/code-connect";
import { Textarea } from "./index.js";

figma.connect(
  Textarea,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=380-3867",
  {
    props: {
      placeholder: figma.string("label"),
      resize: figma.boolean("resize"),
      readOnly: figma.enum("state", { "read-only": true }),
      invalid: figma.enum("state", { danger: true }),
      disabled: figma.enum("state", { disabled: true }),
    },
    example: ({ placeholder, resize, readOnly, invalid, disabled }) => (
      <Textarea
        placeholder={placeholder}
        resize={resize}
        readOnly={readOnly}
        invalid={invalid}
        disabled={disabled}
      />
    ),
  }
);
