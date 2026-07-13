// Code Connect: Figma Button component set (287:443) → @podo/react Button.
// Translation rules live here on purpose (see figma-props-alignment.md):
// - theme/size variant values pass through 1:1
// - the "type" variant (text/prefix/suffix) becomes the prefix/suffix slots
// - "state" keeps only disabled; hover/pressed are platform interactions
import React from "react";
import figma from "@figma/code-connect";
import { Button, Icon } from "./index.js";

figma.connect(
  Button,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=287-443",
  {
    props: {
      label: figma.string("Label"),
      theme: figma.enum("theme", {
        "solid-primary": "solid-primary",
        "solid-assistive": "solid-assistive",
        "solid-white": "solid-white",
        "outline-primary": "outline-primary",
        "outline-assistive": "outline-assistive",
        "outline-white": "outline-white",
      }),
      size: figma.enum("size", { xs: "xs", sm: "sm", md: "md", lg: "lg" }),
      disabled: figma.enum("state", { disabled: true }),
      prefix: figma.enum("type", { prefix: <Icon name="menu" /> }),
      suffix: figma.enum("type", { suffix: <Icon name="menu" /> }),
    },
    example: ({ label, theme, size, disabled, prefix, suffix }) => (
      <Button theme={theme} size={size} disabled={disabled} prefix={prefix} suffix={suffix}>
        {label}
      </Button>
    ),
  }
);
