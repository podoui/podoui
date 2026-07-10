import { BaseMarker } from "../components/BaseMarker.js";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { COLOR_SECTIONS, type ColorScale, type Swatch } from "../data/colors.js";

const TEXT_DARK = "#18181b";
const TEXT_WHITE = "#ffffff";

function Cell({ swatch, alphaOver }: { swatch: Swatch; alphaOver?: string | undefined }) {
  if (alphaOver && swatch.percent != null) {
    const pct = swatch.percent / 100;
    const base = alphaOver === "#000000" ? "0,0,0" : "255,255,255";
    const dark = alphaOver !== "#000000" || pct < 0.5;
    return (
      <div
        className="color-cell color-cell--alpha"
        style={{ background: `rgba(${base},${pct})`, color: dark ? TEXT_DARK : TEXT_WHITE }}
      >
        <span className="color-cell__scale">{swatch.scale}</span>
        <span className="color-cell__hex">{swatch.percent}%</span>
      </div>
    );
  }
  return (
    <div
      className="color-cell"
      style={{ background: swatch.hex, color: swatch.darkText ? TEXT_DARK : TEXT_WHITE }}
    >
      <span className="color-cell__scale">{swatch.scale}</span>
      <span className="color-cell__hex">{swatch.hex}</span>
    </div>
  );
}

function FullBar({ swatch }: { swatch: Swatch }) {
  return (
    <div
      className="color-cell color-cell--full"
      style={{ background: swatch.hex, color: swatch.darkText ? TEXT_DARK : TEXT_WHITE }}
    >
      <span className="color-cell__scale">{swatch.scale}</span>
      <span className="color-cell__hex">{swatch.hex}</span>
    </div>
  );
}

function ScaleContent({ scale }: { scale: ColorScale }) {
  // Scale 0 / 100 render as full-width standalone bars (gray); 5–90 in one row.
  const full = scale.swatches.filter((s) => s.scale === 0 || s.scale === 100);
  const row = scale.swatches.filter((s) => s.scale !== 0 && s.scale !== 100);
  const top = full.find((s) => s.scale === 0);
  const bottom = full.find((s) => s.scale === 100);
  const baseIndex = scale.base != null ? row.findIndex((s) => s.scale === scale.base) : -1;
  const baseLeft = baseIndex >= 0 ? ((baseIndex + 0.5) / row.length) * 100 : 0;

  return (
    <>
      {(scale.tag || scale.description) && (
        <div className="color-head">
          {scale.tag ? <span className="color-tag">{scale.tag}</span> : null}
          {scale.description ? <p className="color-desc">{scale.description}</p> : null}
        </div>
      )}
      {top ? <FullBar swatch={top} /> : null}
      <div className="base-host">
        <div className="color-scale__bar">
          {row.map((s) => (
            <Cell key={s.scale} swatch={s} alphaOver={scale.alphaOver} />
          ))}
        </div>
        {baseIndex >= 0 ? (
          <div className="base-track">
            <div className="base-anchor" style={{ left: `${baseLeft}%` }}>
              <BaseMarker />
            </div>
          </div>
        ) : null}
      </div>
      {bottom ? <FullBar swatch={bottom} /> : null}
    </>
  );
}

const INTRO =
  "색상은 정보의 의미를 드러내고 화면의 분위기와 인상을 결정하는 핵심 시각 요소로 색상은 사용자의 " +
  "시선을 자연스럽게 유도하고, 요소의 중요도와 성격을 구분해 직관적인 상호작용을 가능하게 하며, 잘 " +
  "설계된 색상 체계는 브랜드나 기관의 이미지와 일관된 인상을 유지하면서, 화면 전반의 정보 구조와 위계를 " +
  "명확하게 보여주는 역할을 해요.";

export function ColorPage() {
  return (
    <>
      <PageHeader title="색상 (Color)" intro={INTRO} />

      {COLOR_SECTIONS.map((section, index) => {
        const plain = section.title.startsWith("베이스");
        return (
          <DocSection
            key={section.title}
            index={index}
            title={section.title}
            description={section.description}
          >
            {plain ? (
              <Card plain>
                {section.scales.map((scale, i) => (
                  <div className="color-row" key={`${scale.name}-${i}`}>
                    <ScaleContent scale={scale} />
                  </div>
                ))}
              </Card>
            ) : (
              section.scales.map((scale, i) => (
                <Card key={`${scale.name}-${i}`}>
                  <ScaleContent scale={scale} />
                </Card>
              ))
            )}
          </DocSection>
        );
      })}
    </>
  );
}
