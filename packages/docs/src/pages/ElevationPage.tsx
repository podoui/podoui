import { legacyUtilitiesContract } from "@podoui/tokens";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview } from "../components/Preview.js";
import { SpecTable } from "../components/SpecTable.js";
import { utilityTabs } from "./utility-examples.js";

const SHADOW_ROWS = Object.entries(legacyUtilitiesContract.shadow.values);
const ELEVATION_ROWS = Object.entries(legacyUtilitiesContract.elevation.values);

export function ElevationPage() {
  return (
    <>
      <PageHeader
        title="배경과 입체감 (Elevation)"
        intro="v1의 5단계 shadow와 4단계 bg-elevation 클래스를 이식했어요. bg-elevation은 PodoThemeProvider의 data-color-scheme과 v1의 data-color-mode를 모두 인식하며, 속성이 없으면 시스템 다크 모드를 따릅니다."
      />

      <DocSection
        index={0}
        title="그림자"
        description="shadow-1부터 shadow-5까지 순서대로 더 넓고 진한 그림자를 적용합니다."
      >
        <Card>
          <div className="utility-scale">
            {SHADOW_ROWS.map(([name]) => (
              <div
                className={`utility-demo-box utility-demo-box--surface shadow-${name}`}
                key={name}
              >
                <code>.shadow-{name}</code>
              </div>
            ))}
          </div>
        </Card>
        <SpecTable
          columns={["Class", "box-shadow"]}
          rows={SHADOW_ROWS.map(([name, value]) => [
            <code key="class">.shadow-{name}</code>,
            <code key="value">{value}</code>,
          ])}
        />
      </DocSection>

      <DocSection
        index={1}
        title="배경 단계"
        description="base는 bg-elevation, 나머지는 bg-elevation-{n}을 사용해요. v1 동작과 같이 2·3단계 그림자는 다크 모드에서 제거됩니다."
      >
        <Card>
          <div className="utility-scale">
            {ELEVATION_ROWS.map(([name, value]) => {
              const className = name === "base" ? "bg-elevation" : `bg-elevation-${name}`;
              return (
                <div className={`utility-demo-box ${className}`} key={name}>
                  <code>.{className}</code>
                  <span>
                    {value.light} / {value.dark}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
        <SpecTable
          columns={["Class", "Light", "Dark", "Shadow"]}
          rows={ELEVATION_ROWS.map(([name, value]) => [
            <code key="class">.{name === "base" ? "bg-elevation" : `bg-elevation-${name}`}</code>,
            value.light,
            value.dark,
            name === "2" ? "shadow-1 (light)" : name === "3" ? "shadow-2 (light)" : "none",
          ])}
        />
      </DocSection>

      <DocSection index={2} title="사용 예제">
        <Preview tabs={utilityTabs("bg-elevation-2 r-5 utility-card", "Elevated card")}>
          <div className="bg-elevation-2 r-5 utility-card">Elevated card</div>
        </Preview>
      </DocSection>
    </>
  );
}
