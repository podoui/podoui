import { useState } from "react";
import { Button, Icon, Toast, Toaster, toast, type ToasterPosition } from "@podo/react";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const INTRO =
  "토스트는 사용자의 동작 결과나 시스템 상태를 화면 한쪽에 잠깐 띄웠다 사라지는 짧은 알림으로, 저장 완료나 " +
  "오류처럼 흐름을 방해하지 않으면서 즉시 결과를 알려야 할 때 사용해요.";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React",
    code:
      `{/* 앱 루트에 한 번 */}\n<Toaster />\n\n` +
      `{/* 어디서든 호출 — 기본 normal 상태, top-center, 3초 뒤 자동 소멸 */}\n` +
      `toast("저장됐어요");\n` +
      `toast.success("전송됐어요"); // 상태 단축 호출\n` +
      `toast.danger("저장에 실패했어요", { manual: true }); // X를 눌러야 닫혀요`,
  },
  {
    target: "web",
    label: "Web",
    code:
      `<!-- 카드 컴포넌트. 큐/자동 소멸은 React 전용이라 직접 배치해요 -->\n` +
      `<podo-toast state="success" closable>저장됐어요</podo-toast>\n` +
      `<!-- closable X 클릭 시 podo-close 이벤트 -->`,
  },
  {
    target: "hono",
    label: "Hono",
    code:
      `import { Toast } from "@podo/hono";\n\n` +
      `<Toast state="success" closable>저장됐어요</Toast>`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `import { Toast } from "@podo/native";\n\n` +
      `{/* 앱의 오버레이 안에 배치해요 */}\n` +
      `<Toast state="success" onClose={hide}>저장됐어요</Toast>`,
  },
];

const POSITIONS: ToasterPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

export function ToastPage() {
  const [position, setPosition] = useState<ToasterPosition>("top-center");

  return (
    <>
      {/* 이 페이지의 라이브 데모가 공유하는 단일 토스터. */}
      <Toaster position={position} />
      <PageHeader title="토스트 (Toast)" intro={INTRO} />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <div className="stage-col">
            <Button size="sm" theme="outline-primary" onPress={() => toast("저장됐어요")}>
              토스트 띄우기 (3초 뒤 사라져요)
            </Button>
            <Button
              size="sm"
              theme="outline-assistive"
              onPress={() => toast.danger("저장에 실패했어요", { manual: true })}
            >
              수동 닫기 토스트 (X를 눌러야 닫혀요)
            </Button>
          </div>
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="상태 (state)"
        description="토스트는 상황의 성격에 따라 다섯 가지 상태로 색과 톤을 나눠 전달해요. normal은 강조가 필요 없는 기본 안내에, success는 저장·전송처럼 작업이 정상 처리됐을 때, danger는 오류나 실패로 즉시 확인이 필요할 때 사용해요. info는 참고하면 좋은 부가 정보를 알릴 때, warning은 위험까지는 아니지만 사용자의 주의가 필요할 때 사용해요. 상태마다 색을 의미와 일관되게 맞춰, 메시지를 읽기 전에도 성격을 직관적으로 파악할 수 있게 해요."
      >
        <Card stage>
          <div className="stage-col">
            <Toast onClose={() => {}}>토스트 메시지 타이틀 영역</Toast>
            <Toast state="success" onClose={() => {}}>
              토스트 메시지 타이틀 영역
            </Toast>
            <Toast state="danger" onClose={() => {}}>
              토스트 메시지 타이틀 영역
            </Toast>
            <Toast state="info" onClose={() => {}}>
              토스트 메시지 타이틀 영역
            </Toast>
            <Toast state="warning" onClose={() => {}}>
              토스트 메시지 타이틀 영역
            </Toast>
          </div>
        </Card>
        <PropertyTags values={["normal", "success", "danger", "info", "warning"]} />
      </DocSection>

      <DocSection
        index={2}
        title="응용 (composition)"
        description="메시지에 맥락과 동작을 더하기 위해 prefix-icon, suffix-text, suffix-icon, caption을 조합해 구성해요. prefix-icon은 상태 아이콘을 활용해 메시지 성격을 직관적으로 알리고, suffix-text와 suffix-icon은 실행 취소나 닫기 같은 후속 동작을 뒤에 배치해요. caption은 타이틀에서 다 전달하지 못한 추가적인 정보를 전달해요."
      >
        <Card stage>
          <div className="stage-col">
            <Toast prefix={<Icon name="menu" />}>토스트 메시지 타이틀 영역</Toast>
            <Toast suffixText="실행 취소" onClose={() => {}}>
              토스트 메시지 타이틀 영역
            </Toast>
            <Toast caption="토스트 메시지 캡션 영역">토스트 메시지 타이틀 영역</Toast>
          </div>
        </Card>
        <PropertyTags values={["prefix-icon", "suffix-text", "suffix-icon", "caption"]} />
      </DocSection>

      <DocSection
        index={3}
        title="토스터 (toaster)"
        description="토스트를 화면에 쌓고 자동으로 정리하는 행동 레이어예요. 앱 루트에 Toaster를 한 번 두면 어디서든 toast()로 띄울 수 있어요. 기본값은 상단 중앙(top-center), 3초 자동 소멸, 최대 3개이며 위치는 여섯 모서리 중 선택할 수 있어요. 여러 개가 뜨면 최신 토스트가 앞에 원래 크기로 보이고 이전 것들은 살짝 작아지며 겹쳐 쌓여요. 스택에 마우스를 올리거나 포커스하면 모두 원래 크기로 펼쳐져요. 넘치면 오래된 것부터 정리되고, manual 토스트는 X를 눌러야 닫혀요. 아래 '3개 연속' 버튼으로 쌓임을, 스택에 호버해서 펼침을 확인해 보세요. 이 동작 규칙은 시안에 없어 기본값으로 구현돼 있어요."
      >
        <Card stage>
          <div className="stage-col">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {POSITIONS.map((pos) => (
                <Button
                  key={pos}
                  size="xs"
                  theme={pos === position ? "solid-primary" : "outline-assistive"}
                  onPress={() => {
                    setPosition(pos);
                    toast.info(`${pos} 위치에 표시돼요`);
                  }}
                >
                  {pos}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              theme="outline-assistive"
              onPress={() => {
                toast("첫 번째", { manual: true });
                toast.success("두 번째", { manual: true });
                toast.warning("세 번째 — 스택에 호버해 펼쳐 보세요", { manual: true });
              }}
            >
              3개 연속 (쌓임 → 호버하면 펼쳐져요)
            </Button>
          </div>
        </Card>
        <PropertyTags values={["top-center (기본)", "3000ms", "max 3", "manual", "쌓임/펼침"]} />
      </DocSection>

      <DocSection
        index={4}
        title="속성 (props)"
        description="@podo/react의 Toast(카드)와 Toaster·toast()(행동 레이어)가 받는 속성이에요. 카드는 danger일 때 role=alert, 나머지는 role=status로 안내되고 포커스를 뺏지 않아요. 시안의 suffix-icon 기본값은 닫기 X라 코드에서는 onClose로 표현돼요."
      >
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <span className="prop-name">
                <code>state</code>
              </span>,
              <span className="prop-type">
                <code>"normal" | "success" | "danger" | "info" | "warning"</code>
              </span>,
              <code>"normal"</code>,
              "상황의 성격에 따른 색·톤 (시안 state)",
            ],
            [
              <span className="prop-name">
                <code>children</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "— (필수)",
              "타이틀 (16px SemiBold)",
            ],
            [
              <span className="prop-name">
                <code>caption</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "타이틀 아래 추가 정보 (14px)",
            ],
            [
              <span className="prop-name">
                <code>prefix</code> / <code>suffixText</code> / <code>suffixIcon</code>
              </span>,
              <span className="prop-type">
                <code>ReactNode</code>
              </span>,
              "—",
              "상태 아이콘 / 실행 취소 같은 후속 동작 텍스트 / 커스텀 후속 아이콘",
            ],
            [
              <span className="prop-name">
                <code>onClose</code>
              </span>,
              <span className="prop-type">
                <code>() =&gt; void</code>
              </span>,
              "—",
              "닫기 X를 렌더하고 누르면 호출돼요 (시안 suffix-icon 기본값)",
            ],
            [
              <span className="prop-name">
                <code>Toaster position</code>
              </span>,
              <span className="prop-type">
                <code>"top-left" | ... | "bottom-right"</code>
              </span>,
              <code>"top-center"</code>,
              "스택이 붙는 화면 모서리 (6곳)",
            ],
            [
              <span className="prop-name">
                <code>Toaster duration</code> / <code>max</code>
              </span>,
              <span className="prop-type">
                <code>number</code>
              </span>,
              <code>3000 / 3</code>,
              "자동 소멸 시간(ms)과 동시 표시 최대 개수. 넘치면 오래된 것부터 정리돼요",
            ],
            [
              <span className="prop-name">
                <code>toast(title, options)</code>
              </span>,
              <span className="prop-type">
                <code>{"{ state, caption, duration, manual }"}</code>
              </span>,
              "—",
              "호출 API. state별 단축(toast.success 등), manual: true면 X로만 닫혀요, toast.dismiss(id)로 코드에서 제거",
            ],
          ]}
        />
      </DocSection>
    </>
  );
}
