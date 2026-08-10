import { legacyUtilitiesContract } from "@podoui/tokens";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview } from "../components/Preview.js";
import { SpecTable } from "../components/SpecTable.js";
import { UTILITY_PLATFORM_ROWS, utilityTabs } from "./utility-examples.js";

const BORDER_ROWS = Object.entries(legacyUtilitiesContract.border.widths);

export function BorderPage() {
  return (
    <>
      <PageHeader
        title="테두리 (Border)"
        intro="v1의 테두리 두께 클래스를 그대로 제공해요. 색상은 지정하지 않으므로 currentColor를 따르며, 필요한 경우 color 또는 border-color를 함께 설정하세요. 값과 CSS는 검증된 legacy-utilities JSON에서 생성됩니다."
      />

      <DocSection
        index={0}
        title="두께 클래스"
        description="border-0부터 border-4까지 요소의 네 방향에 solid 테두리를 적용해요. v1 문서에만 등장하고 실제 SCSS에는 없었던 border, border-top, border-none 클래스는 호환 API에 포함하지 않습니다."
      >
        <Card>
          <div className="utility-scale">
            {BORDER_ROWS.map(([name, value]) => (
              <div className={`utility-demo-box border-${name}`} key={name}>
                <code>.border-{name}</code>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </Card>
        <SpecTable
          columns={["Class", "CSS", "Value"]}
          rows={BORDER_ROWS.map(([name, value]) => [
            <code key="class">.border-{name}</code>,
            <code key="css">border: {value} solid</code>,
            value,
          ])}
        />
      </DocSection>

      <DocSection index={1} title="사용 예제">
        <Preview tabs={utilityTabs("border-2 r-4 utility-card", "Border utility")}>
          <div className="border-2 r-4 utility-card">Border utility</div>
        </Preview>
      </DocSection>

      <DocSection
        index={2}
        title="플랫폼 지원"
        description="웹 계열 프레임워크는 동일한 배포 CSS를 공유합니다. React Native에는 CSS 클래스 개념이 없으므로 토큰과 style prop을 사용하세요."
      >
        <SpecTable
          columns={["Platform", "Support", "Usage"]}
          rows={UTILITY_PLATFORM_ROWS.map((row) => [...row])}
        />
      </DocSection>
    </>
  );
}
