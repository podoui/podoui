/** @jsxImportSource hono/jsx */

// Hono SSR 검증 앱(비공개·미배포) — 배포물과 같은 podo-ui/styles.css·아이콘 폰트(그리고
// T3부터 podo-ui/hono/client 정적 스크립트)를 외부 파일로만 싣고 CSP script-src 'self'로
// 돌려요. 계획 D10: docs Preview는 React라 Hono 검증이 아니에요.
import { readFile } from "node:fs/promises";
import { Hono } from "hono";
import type { Child } from "hono/jsx";
import { secureHeaders } from "hono/secure-headers";
import {
  Button,
  Chip,
  DatePicker,
  Editor,
  EditorView,
  Field,
  Input,
  Select,
  Switch,
  Table,
  Textarea,
  Toast,
  Toaster,
  Tooltip,
} from "@podoui/hono";

export const app = new Hono();

app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      // style 속성만 허용 — Toaster 스택처럼 컴포넌트가 CSS 변수를 style 속성으로 내요
      // (React와 같은 마크업). <style>·스크립트는 여전히 'self'만이에요(T5 F7).
      styleSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      formAction: ["'self'"],
    },
  })
);

// 정적 자산: 설치된 podo-ui 패키지의 배포 파일 그대로.
const podoUi = new URL("../node_modules/podo-ui/", import.meta.url);
const assetFiles: Record<string, URL> = {
  "styles.css": new URL("styles.css", podoUi),
  "client.js": new URL("dist/hono/client.js", podoUi),
};
const iconAssets = new URL("dist/icons-assets/", podoUi);
const contentTypes: Record<string, string> = {
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
};

// 샘플 동작 스크립트(외부 파일이라 CSP 'self' 그대로) — 함수 조건 configure·토스트 버튼.
const sampleScript = `(() => {
  const run = () => {
    window.podo.client.configure("cell-dp", { disable: [(date) => date.getDay() === 0] });
    document.getElementById("toast-btn")?.addEventListener("click", () => {
      window.podo.toast.success("저장됐어요");
    });
  };
  if (window.podo && window.podo.client) run();
  else document.addEventListener("podo:ready", run, { once: true });
})();
`;

app.get("/assets/sample.js", (c) =>
  c.body(sampleScript, 200, { "content-type": contentTypes.js! })
);

app.get("/assets/:file", async (c) => {
  const file = c.req.param("file");
  const extension = file.split(".").pop() ?? "";
  if (!/^[\w.-]+$/.test(file) || !contentTypes[extension]) {
    return c.notFound();
  }
  try {
    const body = await readFile(assetFiles[file] ?? new URL(file, iconAssets));
    return c.body(body, 200, { "content-type": contentTypes[extension] });
  } catch {
    return c.notFound();
  }
});

function Page({ title, children }: { title: string; children: Child }) {
  return (
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} · podo hono-ssr</title>
        <link rel="stylesheet" href="/assets/styles.css" />
        <link rel="stylesheet" href="/assets/PodoIcons.css" />
        <script defer src="/assets/client.js"></script>
      </head>
      <body>
        <main>
          <h1>{title}</h1>
          {children}
        </main>
      </body>
    </html>
  );
}

const pages: Array<[path: string, title: string]> = [
  ["/form", "폼 · 네이티브 속성"],
  ["/select-chip", "Select · Chip · Switch"],
  ["/datepicker", "DatePicker"],
  ["/overlays", "Toast · Tooltip · Table(중첩)"],
  ["/editor", "Editor · 이미지 업로드"],
  ["/long", "긴 페이지 · 스크롤 뒤 portal"],
  ["/editor-view", "EditorView"],
];

app.get("/", (c) =>
  c.html(
    <Page title="Hono SSR 샘플">
      <ul>
        {pages.map(([path, title]) => (
          <li>
            <a href={path}>{title}</a>
          </li>
        ))}
      </ul>
    </Page>
  )
);

app.get("/form", (c) =>
  c.html(
    <Page title="폼 · 네이티브 속성">
      <form id="sample" method="get" action="/echo">
        <Field id="title" label="제목" countMax={40}>
          <Input name="title" placeholder="제목" />
        </Field>
        <Field id="day" label="날짜">
          <Input name="day" type="date" min="2026-01-01" max="2026-12-31" />
        </Field>
        <Field id="files" label="첨부">
          <Input name="files" type="file" accept="image/*" multiple />
        </Field>
        <Field id="memo" label="메모">
          <Textarea name="memo" rows={4} />
        </Field>
        <Button type="submit" name="action" value="save">
          저장
        </Button>
      </form>
      {/* 「링크 버튼」: form 밖의 버튼이 form/formaction으로 GET 이동 */}
      <Button
        type="submit"
        form="sample"
        formaction="/echo"
        formmethod="get"
        name="action"
        value="link"
        theme="outline-primary"
      >
        다른 동작으로 제출
      </Button>
    </Page>
  )
);

app.get("/echo", (c) => {
  const entries = [...new URL(c.req.url).searchParams.entries()];
  return c.html(
    <Page title="제출 에코">
      <dl id="echo">
        {entries.map(([name, value]) => (
          <>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </>
        ))}
      </dl>
      <a href="/form">다시</a>
    </Page>
  );
});

const fruit = [
  { value: "apple", label: "사과" },
  { value: "pear", label: "배" },
  { value: "grape", label: "포도" },
  { value: "peach", label: "복숭아" },
];

app.get("/select-chip", (c) =>
  c.html(
    <Page title="Select · Chip · Switch">
      <form method="get" action="/echo">
        <Field id="single" label="단일 선택">
          <Select name="single" options={fruit} value="pear" />
        </Field>
        <Field id="multi" label="다중 선택">
          <Select name="multi" multiple clearable options={fruit} values={["apple"]} />
        </Field>
        <Field id="search" label="검색">
          <Select name="search" searchable options={fruit} placeholder="과일 검색" />
        </Field>
        <p>
          <Chip id="chip-toggle">토글 칩</Chip> <Chip removable>제거형 칩</Chip>
        </p>
        <Switch id="notify" label="알림" />
        <Button type="submit">제출</Button>
      </form>
    </Page>
  )
);

app.get("/datepicker", (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const week = new Date(today);
  week.setDate(week.getDate() + 6);
  return c.html(
    <Page title="DatePicker">
      <form method="get" action="/echo">
        <Field id="day" label="날짜">
          <DatePicker name="day" value={{ date: today }} />
        </Field>
        <Field id="range" label="기간">
          <DatePicker
            mode="period"
            fromName="from"
            toName="to"
            quickSelect
            value={{ date: today, endDate: week }}
          />
        </Field>
        <Field id="at" label="일시">
          <DatePicker type="datetime" name="at" portal />
        </Field>
        <Field id="time" label="시간">
          <DatePicker
            type="time"
            mode="period"
            fromName="timeFrom"
            toName="timeTo"
            minuteStep={10}
          />
        </Field>
        <Field id="hour" label="시">
          <DatePicker type="hour" name="hour" hourFormat="12" />
        </Field>
        <Button type="submit">제출</Button>
      </form>
    </Page>
  );
});

app.get("/overlays", (c) =>
  c.html(
    <Page title="Toast · Tooltip · Table(중첩)">
      <script defer src="/assets/sample.js"></script>
      <Toaster position="top-right" />
      <Toast state="info" closable>
        닫을 수 있는 서버 flash 토스트
      </Toast>
      <Toast state="success" duration={4000}>
        4초 뒤 사라지는 토스트
      </Toast>
      <p>
        <Button id="toast-btn" type="button">
          토스트 띄우기
        </Button>{" "}
        <Tooltip label="도움말이에요" position="top">
          <Button type="button" theme="outline-primary">
            도움말
          </Button>
        </Tooltip>
      </p>
      <form method="get" action="/echo">
        <Table checkbox id="orders" defaultSelected={[0]}>
          {[
            <thead>
              <tr>
                <th>상품</th>
                <th>태그</th>
                <th>배송일</th>
              </tr>
            </thead>,
            <tbody>
              <tr>
                <td>사과</td>
                <td>
                  <Chip id="tag-apple" removable>
                    과일
                  </Chip>{" "}
                  <Tooltip label="셀 안 툴팁">
                    <button type="button">?</button>
                  </Tooltip>
                </td>
                <td>
                  <DatePicker
                    id="cell-dp"
                    name="ship"
                    portal
                    disable={[(date: Date) => date.getDay() === 0]}
                  />
                </td>
              </tr>
              <tr>
                <td>배</td>
                <td>
                  <Chip>과일</Chip>
                </td>
                <td>-</td>
              </tr>
              <tr>
                <td>메모</td>
                <td colspan={2}>
                  <Editor id="cell-ed" name="memo" height="contents" toolbar={["text-style"]} />
                </td>
              </tr>
              <tr data-disabled="true">
                <td>포도(품절)</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>,
          ]}
        </Table>
        <Button type="submit">제출</Button>
      </form>
    </Page>
  )
);

// 업로드 에코 — Editor uploadUrl 계약(FormData "file" → JSON { url }). 저장소 없이 data URL로
// 돌려줘요(CSP img-src data:). 검사는 본문을 다 파싱한 뒤의 파일 크기(2MB)와 클라이언트가
// 선언한 MIME(image/*)뿐이에요 — 요청 크기 제한·실제 이미지 판별은 하지 않는 검증용 샘플이에요.
// 운영에서는 파싱 전 요청 크기 제한(예: hono/body-limit)과 내용 검사를 두세요.
const UPLOAD_LIMIT = 2 * 1024 * 1024;

app.post("/upload", async (c) => {
  const file = (await c.req.parseBody()).file;
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > UPLOAD_LIMIT) {
    return c.json({ error: "image up to 2MB" }, 400);
  }
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return c.json({ url: `data:${file.type};base64,${base64}` });
});

app.get("/editor", (c) =>
  c.html(
    <Page title="Editor · 이미지 업로드">
      <form method="get" action="/echo">
        <Editor
          id="body"
          name="body"
          value='<p class="podo-ed-p1">본문을 고치고 <strong>굵게</strong>도 해 보세요.</p>'
          height="320px"
          uploadUrl="/upload"
        />
        <Button type="submit">제출</Button>
      </form>
    </Page>
  )
);

// 스크롤이 필요한 긴 페이지 — portal island(Select·DatePicker·Tooltip)가 스크롤 뒤에도
// 트리거 옆에 붙는지 확인해요(계획 §D10 샘플).
app.get("/long", (c) =>
  c.html(
    <Page title="긴 페이지 · 스크롤 뒤 portal">
      <p>아래로 스크롤하세요.</p>
      <div style="height:1600px" aria-hidden="true" />
      <form method="get" action="/echo">
        <Field id="long-select" label="스크롤 뒤 Select">
          <Select name="fruit" options={fruit} placeholder="과일 선택" />
        </Field>
        <Field id="long-day" label="스크롤 뒤 DatePicker">
          <DatePicker name="day" portal />
        </Field>
        <p>
          <Tooltip label="스크롤 뒤 툴팁" position="top">
            <Button type="button" theme="outline-primary">
              도움말
            </Button>
          </Tooltip>
        </p>
        <Button type="submit">제출</Button>
      </form>
      <div style="height:1200px" aria-hidden="true" />
    </Page>
  )
);

app.get("/editor-view", (c) =>
  c.html(
    <Page title="EditorView">
      <EditorView value='<p class="podo-ed-p1">본문 <strong>굵게</strong></p>' />
    </Page>
  )
);
