import { useEffect, useState } from "react";
import { NAV, findBySlug } from "./nav.js";
import logoUrl from "./assets/logo.svg";

// GNB top-level nav (Figma 516:3871). Doc has no content yet; Foundation and
// Component link to their first pages.
const TOP_NAV: { label: string; href?: string }[] = [
  { label: "Doc" },
  { label: "Foundation", href: "#/color" },
  { label: "Component", href: "#/button" },
];

function currentSlug(): string {
  return window.location.hash.replace(/^#\/?/, "") || NAV[0]!.slug;
}

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

export function App() {
  const [slug, setSlug] = useState(currentSlug);

  useEffect(() => {
    const onHash = () => setSlug(currentSlug());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const active = findBySlug(slug) ?? NAV[0]!;
  const Page = active.page;

  return (
    <>
      <header className="gnb">
        <div className="gnb__inner">
          <a className="gnb__brand" href="#/">
            <img src={logoUrl} alt="PODO.UI" className="gnb__logo" />
          </a>
          <div className="gnb__right">
            <nav className="gnb__nav" aria-label="Sections">
              {TOP_NAV.map((item) =>
                item.href ? (
                  <a key={item.label} className="gnb__nav-link" href={item.href}>
                    {item.label}
                  </a>
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
              <button className="gnb__icon-btn" type="button" aria-label="Toggle theme">
                <SunIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="site-layout">
        <nav className="site-sidebar" aria-label="Components">
          {groupedNav().map((group) => (
            <div key={group.name}>
              <p className="site-sidebar__group-title">{group.name}</p>
              <ul className="site-sidebar__list">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <a
                      className="site-sidebar__link"
                      href={`#/${item.slug}`}
                      aria-current={item.slug === active.slug ? "page" : undefined}
                    >
                      {item.title}
                    </a>
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
    </>
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
