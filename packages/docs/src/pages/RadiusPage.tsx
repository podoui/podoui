import { legacyUtilitiesContract } from "@podoui/tokens";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview } from "../components/Preview.js";
import { SpecTable } from "../components/SpecTable.js";
import { utilityTabs } from "./utility-examples.js";

const RADIUS_ROWS = Object.entries(legacyUtilitiesContract.radius.values);

export function RadiusPage() {
  return (
    <>
      <PageHeader
        title="모서리 반경 (Radius)"
        intro="v1의 r-0부터 r-6, r-full까지 전체 반경 스케일을 유지해요. 카드, 입력 필드, 배지처럼 반복되는 형태에 같은 반경을 적용할 때 사용합니다."
      />

      <DocSection
        index={0}
        title="전체 반경"
        description="숫자가 커질수록 모서리가 부드러워지고, r-full은 원형 또는 pill 형태를 만듭니다."
      >
        <Card>
          <div className="utility-scale">
            {RADIUS_ROWS.map(([name, value]) => (
              <div className={`utility-demo-box utility-demo-box--filled r-${name}`} key={name}>
                <code>.r-{name}</code>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <SpecTable
          columns={["Class", "CSS", "Value"]}
          rows={RADIUS_ROWS.map(([name, value]) => [
            <code key="class">.r-{name}</code>,
            <code key="css">border-radius: {value}</code>,
            value,
          ])}
        />
      </DocSection>

      <DocSection index={1} title="사용 예제">
        <Preview tabs={utilityTabs("r-full utility-pill", "Radius utility")}>
          <div className="r-full utility-pill">Radius utility</div>
        </Preview>
      </DocSection>
    </>
  );
}
