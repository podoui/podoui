import { legacyUtilitiesContract } from "@podoui/tokens";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview } from "../components/Preview.js";
import { SpecTable } from "../components/SpecTable.js";
import { utilityTabs } from "./utility-examples.js";

const { breakpoints } = legacyUtilitiesContract.visibility;

export function DisplayPage() {
  return (
    <>
      <PageHeader
        title="표시와 가시성 (Display)"
        intro="v1의 hide, hide-pc, hide-tb, hide-mo를 유지해 화면 구간별로 요소를 숨길 수 있어요. 숨김 규칙은 레이아웃 그리드와 같은 1280px·768px 경계를 사용합니다."
      />

      <DocSection
        index={0}
        title="가시성 클래스"
        description="hide는 모든 화면에서 숨기고, 접미사가 있는 클래스는 해당 화면 구간에서만 display: none !important를 적용합니다. 접근성 트리에서도 제거되므로 시각적으로만 감출 콘텐츠에는 사용하지 마세요."
      >
        <SpecTable
          columns={["Class", "Hidden range", "Rule"]}
          rows={[
            [<code key="hide">.hide</code>, "모든 화면", "display: none !important"],
            [<code key="pc">.hide-pc</code>, `${breakpoints.pc.minWidth} 이상`, "PC에서 숨김"],
            [
              <code key="tb">.hide-tb</code>,
              `${breakpoints.tablet.minWidth}–${breakpoints.tablet.maxWidth}`,
              "Tablet에서 숨김",
            ],
            [
              <code key="mo">.hide-mo</code>,
              `${breakpoints.mobile.maxWidth} 이하`,
              "Mobile에서 숨김",
            ],
          ]}
        />
      </DocSection>

      <DocSection
        index={1}
        title="현재 화면 예제"
        description="아래 세 항목 중 현재 화면 구간에 해당하는 하나만 숨겨집니다. 브라우저 폭을 바꾸어 규칙을 확인할 수 있어요."
      >
        <Card>
          <div className="utility-visibility-demo">
            <span className="hide-pc">PC에서만 숨겨짐</span>
            <span className="hide-tb">Tablet에서만 숨겨짐</span>
            <span className="hide-mo">Mobile에서만 숨겨짐</span>
          </div>
        </Card>
      </DocSection>

      <DocSection index={2} title="사용 예제">
        <Preview tabs={utilityTabs("hide-mo utility-card", "Desktop navigation")}>
          <div className="hide-mo utility-card">Desktop navigation</div>
        </Preview>
      </DocSection>
    </>
  );
}
