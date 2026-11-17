/** @jsxImportSource hono/jsx */

// Hono SSR 검증 앱(비공개·미배포) — 배포물과 같은 podo-ui/styles.css·아이콘 폰트(그리고
// T3부터 podo-ui/hono/client 정적 스크립트)를 외부 파일로만 싣고 CSP script-src 'self'로
// 돌려요. 계획 D10: docs Preview는 React라 Hono 검증이 아니에요.
import { readFile } from "node:fs/promises";
import { Hono } from "hono";
import type { Child } from "hono/jsx";
import { secureHeaders } from "hono/secure-headers";
import { Button, EditorView, Field, Input, Textarea } from "@podoui/hono";

export const app = new Hono();

app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
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
};
const iconAssets = new URL("dist/icons-assets/", podoUi);
const contentTypes: Record<string, string> = {
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
};

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

app.get("/editor-view", (c) =>
  c.html(
    <Page title="EditorView">
      <EditorView value='<p class="podo-ed-p1">본문 <strong>굵게</strong></p>' />
    </Page>
  )
);
