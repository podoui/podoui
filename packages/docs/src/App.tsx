import { updatePageMetadata } from "./seo.js";
import { useEffect, useState } from "react";
import { PodoThemeProvider } from "@podoui/react";
import { NAV, findBySlug } from "./nav.js";
import logoUrl from "./assets/logo.svg";
import { HomePage } from "./pages/HomePage.js";
import {
  DocsLink,
  migrateLegacyHashRoute,
  readCurrentSlug,
  scrollDocumentToTop,
} from "./routing.js";

// GNB top-level nav (Figma 516:3871).
const TOP_NAV: { label: string; href?: string }[] = [
  { label: "Doc", href: "/setup" },
  { label: "Foundation", href: "/color" },
  { label: "Component", href: "/button" },
  { label: "Utilities", href: "/border" },
  // v1(SCSS 기반) 문서 — 외부 링크는 새 탭으로 연다.
  { label: "v1 Docs", href: "https://v1.podoui.com" },
];

/** Groups nav items by their `group` field, preserving first-seen order. */
function groupedNav(): { name: string; items: typeof NAV }[] {
  const groups: { name: string; items: typeof NAV }[] = [];
  for (const item of NAV) {
    let group = groups.find((g) => g.name === item.group);
    if (!group) {
      group = { name: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }
  return groups;
}

export function App({ initialSlug }: { initialSlug?: string } = {}) {
  const [slug, setSlug] = useState(() => initialSlug ?? readCurrentSlug());
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    migrateLegacyHashRoute();
    setSlug(readCurrentSlug());
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onLocationChange = () => setSlug(readCurrentSlug());
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", onLocationChange);
    };
  }, []);

  useEffect(() => {
    scrollDocumentToTop();
    if (slug === readCurrentSlug()) updatePageMetadata(slug);
  }, [slug]);

  const isHome = slug === "";
  const active = findBySlug(slug) ?? NAV[0]!;
  const Page = active.page;

  return (
    <PodoThemeProvider theme="landing" colorScheme={colorScheme} applyToDocument>
      <header className="gnb">
        <div className="gnb__inner">
          <DocsLink className="gnb__brand" to="/">
            <img src={logoUrl} alt="PODO.UI" className="gnb__logo" />
          </DocsLink>
          <div className="gnb__right">
            <nav className="gnb__nav" aria-label="Sections">
              {TOP_NAV.map((item) =>
                item.href ? (
                  item.href.startsWith("http") ? (
                    <a
                      key={item.label}
                      className="gnb__nav-link"
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <DocsLink
                      key={item.label}
                      className="gnb__nav-link"
                      to={item.href}
                      aria-current={
                        (item.label === "Doc" && !isHome && active.group === "Guide") ||
                        (item.label === "Foundation" && !isHome && active.group === "Foundation") ||
                        (item.label === "Utilities" && !isHome && active.group === "Utilities") ||
                        (item.label === "Component" && !isHome && active.group === "Components")
                          ? "page"
                          : undefined
                      }
                    >
                      {item.label}
                    </DocsLink>
                  )
                ) : (
                  <span key={item.label} className="gnb__nav-link gnb__nav-link--disabled">
                    {item.label}
                  </span>
                )
              )}
            </nav>
            <div className="gnb__icons">
              <button className="gnb__icon-btn" type="button" aria-label="Search">
                <SearchIcon />
              </button>
              <button
                className="gnb__icon-btn"
                type="button"
                aria-label={colorScheme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
                aria-pressed={colorScheme === "dark"}
                onClick={() =>
                  setColorScheme((current) => (current === "light" ? "dark" : "light"))
                }
              >
                <SunIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {!isHome && !findBySlug(slug) ? (
        <main>
          <h1>페이지를 찾을 수 없습니다</h1>
          <DocsLink to="/">홈으로 돌아가기</DocsLink>
        </main>
      ) : isHome ? (
        <main className="home-main">
          <HomePage />
        </main>
      ) : (
        <div className="site-layout">
          <nav className="site-sidebar" aria-label="Components">
            {groupedNav().map((group) => (
              <div key={group.name}>
                <p className="site-sidebar__group-title">{group.name}</p>
                <ul className="site-sidebar__list">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <DocsLink
                        className="site-sidebar__link"
                        to={`/${item.slug}`}
                        aria-current={item.slug === active.slug ? "page" : undefined}
                      >
                        {item.title}
                      </DocsLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <main className="site-content">
            <Page />
          </main>
        </div>
      )}
    </PodoThemeProvider>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
