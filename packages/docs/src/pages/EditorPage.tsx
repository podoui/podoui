import { useState } from "react";
import { Editor, EditorView } from "@podoui/react";
import { Card } from "../components/Card.js";
import { DocSection } from "../components/DocSection.js";
import { PageHeader } from "../components/PageHeader.js";
import { Preview, type CodeTab } from "../components/Preview.js";
import { PropertyTags } from "../components/PropertyTags.js";
import { SpecTable } from "../components/SpecTable.js";

const USAGE_TABS: CodeTab[] = [
  {
    target: "react",
    label: "React / Next.js",
    code:
      `"use client";\n\n` +
      `import { useState } from "react";\n` +
      `import { Editor } from "podo-ui/react";\n` +
      `import "podo-ui/styles.css";\n\n` +
      `export default function Page() {\n` +
      `  const [html, setHtml] = useState("<p>내용</p>");\n` +
      `  return <Editor value={html} onChange={setHtml} height="320px" />;\n` +
      `}`,
  },
  {
    target: "native",
    label: "React Native",
    code:
      `import { useState } from "react";\n` +
      `import { Editor, EditorView } from "podo-ui/native";\n\n` +
      `export function Screen() {\n` +
      `  const [html, setHtml] = useState("<p>내용</p>");\n` +
      `  return (<>\n` +
      `    <Editor value={html} onChange={setHtml} height={320} />\n` +
      `    <EditorView value={html} />\n` +
      `  </>);\n` +
      `}`,
  },
];

export function EditorPage() {
  const [value, setValue] = useState(
    "<h3>에디터 예제</h3><p>텍스트를 선택한 뒤 툴바와 각 팝업을 사용해 보세요.</p>"
  );

  return (
    <>
      <PageHeader
        title="에디터 (Editor)"
        intro="원본 Figma의 920×52 툴바 구성을 바탕으로 v1.2.1의 문단·서식·색상·표·링크·이미지·YouTube·HTML 편집 기능을 제공하는 React 리치 텍스트 에디터예요."
      />

      <DocSection index={0} title="Usage">
        <Preview tabs={USAGE_TABS}>
          <Editor value={value} onChange={setValue} height="320px" />
        </Preview>
      </DocSection>

      <DocSection
        index={1}
        title="툴바와 편집 기능"
        description="toolbar prop을 생략하면 v1의 13개 그룹이 모두 표시돼요. 필요한 그룹만 원하는 순서로 전달할 수도 있어요."
      >
        <SpecTable
          columns={["그룹", "기능"]}
          rows={[
            ["undo-redo", "실행 취소, 다시 실행, Ctrl/Cmd+Z·Y"],
            ["paragraph", "제목 1~3, 본문 크기/굵기"],
            ["text-style / color", "굵게, 기울임, 밑줄, 취소선, 글자색, 배경색"],
            ["align / list", "좌·중앙·우·양쪽 정렬, 순서/비순서 목록"],
            ["table", "1~10행·열 삽입, 행·열 추가/삭제, 병합, 셀 정렬·배경"],
            ["link", "링크 삽입, 새 창/현재 창, 클릭 후 수정·삭제"],
            ["image", "파일/URL/붙여넣기/드롭, 크기·정렬·대체 텍스트, 수정·삭제"],
            ["youtube", "URL 삽입, 크기·정렬, 클릭 후 수정·삭제"],
            ["hr / format / code", "구분선, 서식 지우기, HTML 소스 편집"],
          ]}
        />
        <PropertyTags
          values={[
            "undo-redo",
            "paragraph",
            "text-style",
            "color",
            "align",
            "list",
            "table",
            "link",
            "image",
            "youtube",
            "hr",
            "format",
            "code",
          ]}
        />
      </DocSection>

      <DocSection index={2} title="보기 전용 HTML">
        <Card stage>
          <EditorView value={value} />
        </Card>
      </DocSection>

      <DocSection
        index={3}
        title="모바일과 팝업"
        description="600px 이하에서는 툴바가 여러 줄로 흐르고 터치 영역이 40px로 커져요. 링크·표·이미지·YouTube·편집 팝업과 표 컨텍스트 메뉴는 뷰포트 안으로 제한돼요."
      >
        <SpecTable
          columns={["팝업", "PC", "모바일"]}
          rows={[
            ["문단·정렬·색상", "툴바 기준 배치", "줄바꿈된 툴바 기준 배치"],
            ["링크·표", "고정 최소 폭", "화면 폭에 맞춰 축소"],
            ["이미지·YouTube", "360px, 세로 스크롤", "화면 폭 제한, 입력 행 재배치"],
            ["링크·미디어 편집", "선택 요소 아래", "뷰포트 크기 제한과 내부 스크롤"],
            ["표 컨텍스트 메뉴", "포인터 위치", "화면 네 방향 경계 안으로 보정"],
          ]}
        />
      </DocSection>

      <DocSection
        index={4}
        title="지원 범위"
        description="React Native는 react-native-webview의 contenteditable 문서로 실제 WYSIWYG 편집을 제공해요. 13개 툴바 그룹, URL·네이티브 picker 기반 이미지, 링크·YouTube, 표 삽입과 행·열 편집, HTML 모드와 EditorView를 지원합니다. Provider의 webViewComponent 또는 createNativeComponents의 WebView host를 설정하세요. Hono 호스트에서는 React client island의 Editor를 사용해요."
      >
        <SpecTable
          columns={["React", "Next.js", "Hono", "React Native"]}
          rows={[
            ["전체 지원", "전체 지원 (use client)", "React island에서 지원", "Native UI 지원"],
          ]}
        />
      </DocSection>

      <DocSection index={5} title="주요 속성 (props)">
        <SpecTable
          variant="props"
          columns={["Prop", "Type", "Default", "설명"]}
          rows={[
            [
              <code>value / onChange</code>,
              <code>string / (html) =&gt; void</code>,
              "—",
              "제어형 HTML 값",
            ],
            [
              <code>width / height</code>,
              <code>string</code>,
              <code>100% / 400px</code>,
              "에디터 크기",
            ],
            [<code>minHeight / maxHeight</code>, <code>string</code>, "—", "편집 영역 높이 제한"],
            [<code>resizable</code>, <code>boolean</code>, <code>false</code>, "세로 크기 조절"],
            [<code>toolbar</code>, <code>ToolbarItem[]</code>, "전체", "표시할 그룹과 순서"],
            [<code>validator</code>, <code>ZodType</code>, "—", "HTML 값 검증과 성공/오류 표시"],
            [
              <code>placeholder</code>,
              <code>string</code>,
              "내용을 입력하세요…",
              "빈 편집 영역 안내",
            ],
            [<code>ariaLabel</code>, <code>string</code>, "리치 텍스트 편집기", "접근성 이름"],
          ]}
        />
      </DocSection>
    </>
  );
}
