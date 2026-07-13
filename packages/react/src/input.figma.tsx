// Code Connect: Figma Input component set (302:607) → @podo/react Input.
// - prefix-icon/suffix-icon/suffix-text booleans become content slots
// - "state" keeps only danger→invalid and disabled; normal/hover/focused are
//   platform interactions and completed is simply a filled value
import React from "react";
import figma from "@figma/code-connect";
import { Icon, Input } from "./index.js";

figma.connect(
  Input,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=302-607",
  {
    props: {
      placeholder: figma.string("label"),
      size: figma.enum("size", { md: "md", lg: "lg" }),
      invalid: figma.enum("state", { danger: true }),
      readOnly: figma.enum("state", { "read-only": true }),
      disabled: figma.enum("state", { disabled: true }),
      prefix: figma.boolean("prefix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
      suffixIcon: figma.boolean("suffix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
      suffixText: figma.boolean("suffix-text", {
        true: "텍스트",
        false: undefined,
      }),
    },
    example: ({
      placeholder,
      size,
      invalid,
      readOnly,
      disabled,
      prefix,
      suffixIcon,
      suffixText,
    }) => (
      <Input
        placeholder={placeholder}
        size={size}
        invalid={invalid}
        readOnly={readOnly}
        disabled={disabled}
        prefix={prefix}
        suffixIcon={suffixIcon}
        suffixText={suffixText}
      />
    ),
  }
);
