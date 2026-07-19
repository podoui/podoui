// Code Connect: Figma Badge-count component set (474:3218) → @podoui/react Badge.
// The set's `state` boolean is derivable from the theme (system-state themes
// are state=true, color-label themes state=false), so only theme + dot map.
import React from "react";
import figma from "@figma/code-connect";
import { Badge } from "./index.js";

figma.connect(
  Badge,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=474-3218",
  {
    props: {
      theme: figma.enum("theme", {
        natural: "natural",
        danger: "danger",
        success: "success",
        warning: "warning",
        info: "info",
        gray: "gray",
        red: "red",
        green: "green",
        yellow: "yellow",
        blue: "blue",
        purple: "purple",
        orange: "orange",
      }),
      dot: figma.boolean("dot"),
    },
    example: ({ theme, dot }) => (
      <Badge theme={theme} dot={dot}>
        99
      </Badge>
    ),
  }
);
