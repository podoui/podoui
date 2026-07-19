// Code Connect: Figma Table component set (474:1795) → @podoui/react Table.
// The thead/tbody slots are native table markup in code; row interaction
// states (hover/pressed) are platform CSS and disabled rows use data-disabled.
import React from "react";
import figma from "@figma/code-connect";
import { Table } from "./index.js";

figma.connect(
  Table,
  "https://www.figma.com/design/Rznr8B3vMPyh3uKLoTbsz4/PODO-Design-System?node-id=474-1795",
  {
    props: {
      type: figma.enum("type", { grid: "grid", horizon: "horizon" }),
    },
    example: ({ type }) => (
      <Table type={type}>
        <thead>
          <tr>
            <th>테이블명</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>내용</td>
          </tr>
        </tbody>
      </Table>
    ),
  }
);
