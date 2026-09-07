import routes from "./data/routes.json" with { type: "json" };

export const SITE_URL = "https://podoui.com";
export { routes };

export function pageMetadata(slug: string) {
  const route = routes.find((item) => item.slug === slug);
  return {
    title: route?.title ?? "페이지를 찾을 수 없습니다 | Podo UI",
    description:
      route?.description ?? "요청하신 문서가 없습니다. Podo UI 홈에서 문서를 찾아보세요.",
    url: `${SITE_URL}/${slug}`,
    robots: route ? "index,follow,max-image-preview:large" : "noindex,follow",
  };
}

export function structuredData(slug: string) {
  const page = pageMetadata(slug);
  return {
    "@context": "https://schema.org",
    "@type": slug ? "TechArticle" : "WebSite",
    "@id": page.url,
    url: page.url,
    name: page.title,
    headline: page.title,
    description: page.description,
    inLanguage: "ko",
    ...(slug ? { isPartOf: { "@type": "WebSite", url: SITE_URL, name: "Podo UI" } } : {}),
  };
}

function cleanReferrer(): string {
  try {
    const referrer = new URL(document.referrer);
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return "";
  }
}

let lastTrackedPath: string | undefined;

export function updatePageMetadata(slug: string): void {
  const page = pageMetadata(slug);
  document.title = page.title;
  const meta = (key: string, value: string, property = false) => {
    const attribute = property ? "property" : "name";
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.append(element);
    }
    element.content = value;
  };
  meta("description", page.description);
  meta("robots", page.robots);
  meta("og:title", page.title, true);
  meta("og:description", page.description, true);
  meta("og:url", page.url, true);
  meta("twitter:title", page.title);
  meta("twitter:description", page.description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = page.url;
  let schema = document.getElementById("page-schema");
  if (!schema) {
    schema = document.createElement("script");
    schema.id = "page-schema";
    schema.setAttribute("type", "application/ld+json");
    document.head.append(schema);
  }
  schema.textContent = JSON.stringify(structuredData(slug));
  const analytics = window as Window & { gtag?: (...args: unknown[]) => void };
  if (analytics.gtag && window.location.origin === SITE_URL && lastTrackedPath !== slug) {
    // Only canonical URLs are collected: no user-entered queries or hash fragments.
    analytics.gtag("event", "page_view", {
      page_title: page.title,
      page_location: page.url,
      page_referrer:
        lastTrackedPath === undefined ? cleanReferrer() : `${SITE_URL}/${lastTrackedPath}`,
    });
    lastTrackedPath = slug;
  }
}
