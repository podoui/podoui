// Code Connect: Figma Toast component set (459:1298) → @podoui/react Toast.
// - state passes through (normal/success/danger/info/warning)
// - the preffix-icon [sic] / suffix-text booleans become content slots
// - suffix-icon is the close X in the design, so it maps to onClose
// - the caption boolean/text pair becomes the caption prop
// The toaster layer (Toaster + toast()) is design-less plumbing with no
// Figma counterpart.
import React from "react";
import figma from "@figma/code-connect";
import { Icon, Toast } from "./index.js";

figma.connect(
  Toast,
  "https://www.figma.com/design/uaLVvCUnvoWj4oz6ZMXxwP/PODO-Design-System?node-id=459-1298",
  {
    props: {
      title: figma.string("Title"),
      state: figma.enum("state", {
        normal: "normal",
        success: "success",
        danger: "danger",
        info: "info",
        warning: "warning",
      }),
      prefix: figma.boolean("preffix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
      suffixText: figma.boolean("suffix-text", {
        true: "텍스트",
        false: undefined,
      }),
      onClose: figma.boolean("suffix-icon", {
        true: () => {},
        false: undefined,
      }),
      caption: figma.boolean("caption", {
        true: figma.string("caption text"),
        false: undefined,
      }),
    },
    example: ({ title, state, prefix, suffixText, onClose, caption }) => (
      <Toast
        state={state}
        prefix={prefix}
        suffixText={suffixText}
        caption={caption}
        onClose={onClose}
      >
        {title}
      </Toast>
    ),
  }
);
