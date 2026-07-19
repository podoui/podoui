// Code Connect: Figma Select component set (318:2237) → @podoui/react Select.
// The set's theme vocabulary (text/slot) translates to the multiple prop —
// slot is the chip-listing multi-select look. hover/focused are interactions
// (:hover / open menu) and never become props; completed derives from having
// a value.
import React from "react";
import figma from "@figma/code-connect";
import { Icon, Select } from "./index.js";

figma.connect(
  Select,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=318-2237",
  {
    props: {
      size: figma.enum("size", { md: "md", lg: "lg" }),
      multiple: figma.enum("theme", { text: false, slot: true }),
      invalid: figma.enum("state", { danger: true }),
      disabled: figma.enum("state", { disabled: true }),
      readOnly: figma.enum("state", { "read-only": true }),
      prefix: figma.boolean("prefix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
    },
    example: ({ size, multiple, invalid, disabled, readOnly, prefix }) => (
      <Select
        size={size}
        multiple={multiple}
        invalid={invalid}
        disabled={disabled}
        readOnly={readOnly}
        prefix={prefix}
        placeholder="플레이스 홀더"
        options={[
          { value: "strawberry", label: "딸기" },
          { value: "banana", label: "바나나" },
        ]}
      />
    ),
  }
);
