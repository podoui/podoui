// Code Connect: Figma Field component (334:1049) → @podoui/react Field.
// - boolean toggles (sub-label, footer, suffix-icon)가 대응 camelCase
//   프롭/슬롯이 된다 — 원본 파일은 helper-text/character-count 대신 footer
//   불리언 하나로 하단 행(도움말+글자수)을 켠다
// - the Slot swap is the control slot: any input/button/combobox goes inside
import React from "react";
import figma from "@figma/code-connect";
import { Field, Icon, Input } from "./index.js";

figma.connect(
  Field,
  "https://www.figma.com/design/uaLVvCUnvoWj4oz6ZMXxwP/PODO-Design-System?node-id=334-1049",
  {
    props: {
      label: figma.string("label"),
      required: figma.boolean("requirement"),
      subLabel: figma.boolean("sub-label", {
        true: figma.string("sub"),
        false: undefined,
      }),
      suffixIcon: figma.boolean("suffix-icon", {
        true: <Icon name="menu" />,
        false: undefined,
      }),
      helperText: figma.boolean("footer", {
        true: "도움말 텍스트",
        false: undefined,
      }),
      countMax: figma.boolean("footer", {
        true: 500,
        false: undefined,
      }),
    },
    example: ({ label, required, subLabel, suffixIcon, helperText, countMax }) => (
      <Field
        label={label}
        required={required}
        subLabel={subLabel}
        suffixIcon={suffixIcon}
        helperText={helperText}
        countMax={countMax}
      >
        <Input placeholder="내용을 입력해 주세요" />
      </Field>
    ),
  }
);
