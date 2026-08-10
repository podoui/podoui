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

const IMAGE_UPLOAD_TABS: CodeTab[] = [
  {
    target: "react-upload",
    label: "React",
    code: `import { useState } from "react";
import { Editor, type EditorImageUploadHandler } from "podo-ui/react";

const uploadImage: EditorImageUploadHandler = async (file) => {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch("/api/images", { method: "POST", body });
  if (!response.ok) throw new Error("이미지 업로드 실패");
  return (await response.json()) as { src: string; alt?: string };
};

export function ArticleEditor() {
  const [html, setHtml] = useState("");
  return <Editor value={html} onChange={setHtml} onImageUpload={uploadImage} />;
}`,
  },
  {
    target: "next-upload",
    label: "Next.js",
    code: `// app/api/images/route.ts
export async function POST(request: Request) {
  const file = (await request.formData()).get("image");
  if (!(file instanceof File)) return Response.json({ error: "invalid" }, { status: 400 });
  const src = await storage.upload(file); // S3, R2, Cloudinary 등
  return Response.json({ src });
}

// app/editor/EditorClient.tsx
"use client";
import { useState } from "react";
import { Editor } from "podo-ui/react";

export function EditorClient() {
  const [html, setHtml] = useState("");
  return <Editor value={html} onChange={setHtml} onImageUpload={async (file) => {
    const body = new FormData(); body.append("image", file);
    const response = await fetch("/api/images", { method: "POST", body });
    if (!response.ok) throw new Error("이미지 업로드 실패");
    return response.json();
  }} />;
}`,
  },
  {
    target: "hono-csr-upload",
    label: "Hono CSR",
    code: `// src/server.ts
app.post("/api/images", async (c) => {
  const file = (await c.req.parseBody()).image;
  if (!(file instanceof File)) return c.json({ error: "invalid" }, 400);
  const src = await storage.upload(file); // R2, S3 등
  return c.json({ src });
});

// src/editor-island.tsx
import { createRoot } from "react-dom/client";
import { Editor } from "podo-ui/react";

const uploadImage = async (file: File) => {
  const body = new FormData(); body.append("image", file);
  const response = await fetch("/api/images", { method: "POST", body });
  if (!response.ok) throw new Error("이미지 업로드 실패");
  return response.json() as Promise<{ src: string }>;
};

createRoot(document.getElementById("podo-root")!).render(
  <Editor value="" onChange={console.log} onImageUpload={uploadImage} />
);`,
  },
  {
    target: "native-upload",
    label: "React Native",
    code: `import { useState } from "react";
import { launchImageLibrary } from "react-native-image-picker";
import { Editor } from "podo-ui/native";

export function EditorScreen() {
  const [html, setHtml] = useState("");
  return <Editor
    value={html}
    onChange={setHtml}
    onImagePick={async () => {
      const picked = await launchImageLibrary({ mediaType: "photo" });
      const asset = picked.assets?.[0];
      return asset?.uri ? { uri: asset.uri, alt: asset.fileName } : undefined;
    }}
    onImageUpload={async (asset) => {
      const body = new FormData();
      body.append("image", { uri: asset.uri, name: "image.jpg", type: "image/jpeg" } as never);
      const response = await fetch("https://api.example.com/images", { method: "POST", body });
      if (!response.ok) throw new Error("이미지 업로드 실패");
      return (await response.json()) as { uri: string; alt?: string };
    }}
  />;
}`,
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
            ["image", "파일/URL/붙여넣기/드롭, 외부 업로드, 크기·정렬·대체 텍스트, 수정·삭제"],
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

      <DocSection
        index={2}
        title="외부 이미지 업로드 처리"
        description="onImageUpload을 지정하면 파일 선택·클립보드 붙여넣기·드롭이 모두 같은 비동기 콜백을 거쳐요. 업로드가 끝난 공개 URL만 HTML에 들어가며, 콜백을 생략하면 하위 호환을 위해 data URL을 사용합니다. Hono SSR은 상호작용 에디터를 직접 렌더하지 않으므로 업로드 API와 React client island를 조합하세요."
      >
        <Preview tabs={IMAGE_UPLOAD_TABS}>
          <div className="stage-col">
            <strong>파일 처리 흐름</strong>
            <span>선택 · 붙여넣기 · 드롭 → onImageUpload → CDN/스토리지 URL 삽입</span>
          </div>
        </Preview>
      </DocSection>

      <DocSection index={3} title="보기 전용 HTML">
        <Card stage>
          <EditorView value={value} />
        </Card>
      </DocSection>

      <DocSection
        index={4}
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
        index={5}
        title="지원 범위"
        description="React Native는 react-native-webview의 contenteditable 문서로 실제 WYSIWYG 편집을 제공해요. 네이티브 picker 결과도 onImageUpload에서 외부 저장소 URL로 바꾼 뒤 삽입할 수 있습니다. Provider의 webViewComponent 또는 createNativeComponents의 WebView host를 설정하세요. Hono에서는 서버 업로드 endpoint와 React client island의 Editor를 함께 사용하며, 상호작용이 없는 SSR만으로는 Editor를 제공하지 않아요."
      >
        <SpecTable
          columns={["React", "Next.js", "Hono", "React Native"]}
          rows={[
            ["전체 지원", "전체 지원 (use client)", "React island에서 지원", "Native UI 지원"],
          ]}
        />
      </DocSection>

      <DocSection index={6} title="주요 속성 (props)">
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
              <code>onImageUpload</code>,
              <code>(file) =&gt; Promise&lt;string | &#123; src, alt? &#125;&gt;</code>,
              "data URL",
              "선택·붙여넣기·드롭 이미지 외부 처리",
            ],
            [
              <code>onImageUploadError</code>,
              <code>(error, file) =&gt; void</code>,
              "—",
              "외부 이미지 처리 실패 알림",
            ],
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
