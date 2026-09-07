import { URL } from "node:url";
import process from "node:process";
import { readFile, writeFile, rm } from "node:fs/promises";
import { render, routes, pageMetadata, structuredData } from "../dist/server/prerender.js";

const slugs = new Set();
for (const route of routes) {
  if (
    typeof route.slug !== "string" ||
    !/^(?:[a-z][a-z0-9-]*)?$/.test(route.slug) ||
    ["404", "index"].includes(route.slug) ||
    slugs.has(route.slug) ||
    typeof route.title !== "string" ||
    !route.title.trim() ||
    typeof route.description !== "string" ||
    !route.description.trim() ||
    (route.slug !== "" && (typeof route.group !== "string" || !route.group.trim()))
  )
    throw new Error("Invalid or duplicate docs route");
  slugs.add(route.slug);
}
if (routes[0]?.slug !== "") throw new Error("Docs routes must start with the home page");

const output = new URL("../dist/", import.meta.url);
const template = await readFile(new URL("index.html", output), "utf8");
const rootPattern = /<div\s+id="root"\s*>\s*<\/div>/;
if ((template.match(/<\/head>/g) ?? []).length !== 1 || !rootPattern.test(template)) {
  throw new Error("Docs template must contain one head and an empty root element");
}
const measurementId = process.env.GOOGLE_ANALYTICS_ID ?? "";
const verification = process.env.GOOGLE_SITE_VERIFICATION ?? "";
if (measurementId && !/^G-[A-Z0-9]+$/.test(measurementId))
  throw new Error("Invalid GA4 measurement ID");
if (verification && !/^[A-Za-z0-9_-]+$/.test(verification))
  throw new Error("Invalid Search Console verification token");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const analytics = measurementId
  ? `<script>if(location.origin === 'https://podoui.com') {
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);} window.gtag=gtag;
gtag('js', new Date());
gtag('config', '${measurementId}', {send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=${measurementId}';document.head.append(script);
}</script>`
  : "";
for (const slug of [...routes.map((route) => route.slug), "404"]) {
  const page = pageMetadata(slug);
  const head = `<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<meta name="robots" content="${escape(page.robots)}">
<link rel="canonical" href="${escape(page.url)}">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${escape(page.url)}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escape(page.title)}">
<meta name="twitter:description" content="${escape(page.description)}">
${verification ? `<meta name="google-site-verification" content="${verification}">` : ""}
<script type="application/ld+json" id="page-schema">${JSON.stringify(structuredData(slug)).replaceAll("<", "\\u003c")}</script>
${analytics}`;
  const markup = render(slug);
  if (!markup.includes("<main") || !markup.includes("<h1"))
    throw new Error(`Missing static content: ${slug}`);
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+(?:name="description"|property="og:(?:title|description)")[^>]*>/g, "")
    .replace("</head>", `${head}</head>`)
    .replace(rootPattern, () => `<div id="root" data-page-slug="${slug}">${markup}</div>`);
  await writeFile(new URL(slug ? `${slug}.html` : "index.html", output), html);
}
const urls = routes.map(({ slug }) => `https://podoui.com/${slug}`);
await writeFile(
  new URL("sitemap.xml", output),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>\n`
);
await writeFile(
  new URL("robots.txt", output),
  "User-agent: *\nAllow: /\n\nSitemap: https://podoui.com/sitemap.xml\n"
);
await writeFile(
  new URL("llms.txt", output),
  `# Podo UI\n\n${routes[0].description}\n\n## Documentation\n${routes.map((route) => `- [${route.title}](https://podoui.com/${route.slug}): ${route.description}`).join("\n")}\n\n## Source\n- https://github.com/podoui/podoui\n`
);
await rm(new URL("server/", output), { recursive: true });
globalThis.console.log(
  `Prerendered ${routes.length} pages, 404, sitemap.xml, robots.txt and llms.txt. GA4: ${measurementId ? "configured" : "not configured"}; Search Console: ${verification ? "configured" : "not configured"}.`
);
