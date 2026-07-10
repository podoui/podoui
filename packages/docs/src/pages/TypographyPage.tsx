import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { SpecTable } from "../components/SpecTable.js";
import { TYPE_SECTIONS, TYPO_INTRO, type TypeStyle } from "../data/typography.js";

function Sample({ style }: { style: TypeStyle }) {
  // Preview renders each style at its real pc size so the hierarchy reads (Figma).
  return (
    <p
      className="type-sample"
      style={{ fontSize: `${style.pc}px`, fontWeight: style.weight, lineHeight: 1.3 }}
    >
      {style.name}
    </p>
  );
}

export function TypographyPage() {
  return (
    <>
      <PageHeader title="타이포그래피 (Typography)" intro={TYPO_INTRO} />

      {TYPE_SECTIONS.map((section, index) => (
        <DocSection
          key={section.title}
          index={index}
          title={section.title}
          description={section.description}
        >
          <Card>
            {section.styles.map((style) => (
              <Sample key={style.name} style={style} />
            ))}
          </Card>
          <SpecTable
            columns={[
              "Style",
              "Size(pc)",
              "Size(tablet)",
              "Size(mobile)",
              "Font weight",
              "Line height",
            ]}
            rows={section.styles.map((s) => [
              s.name.replace(/^(Display|Heading|Body)-/, ""),
              `${s.pc}px`,
              `${s.tablet}px`,
              `${s.mobile}px`,
              s.weightLabel,
              s.lineHeight,
            ])}
          />
        </DocSection>
      ))}
    </>
  );
}
