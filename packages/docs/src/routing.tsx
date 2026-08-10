import type { AnchorHTMLAttributes, MouseEvent } from "react";

const ROUTE_HASH_PREFIX = "#/";

function slugFromLegacyHash(hash: string): string | undefined {
  if (!hash.startsWith(ROUTE_HASH_PREFIX)) {
    return undefined;
  }

  return hash.slice(ROUTE_HASH_PREFIX.length).replace(/^\/+|\/+$/g, "");
}

export function readCurrentSlug(location: Location = window.location): string {
  const legacySlug = slugFromLegacyHash(location.hash);
  if (legacySlug !== undefined) {
    return legacySlug;
  }

  return location.pathname.replace(/^\/+|\/+$/g, "");
}

export function migrateLegacyHashRoute(): boolean {
  const legacySlug = slugFromLegacyHash(window.location.hash);
  if (legacySlug === undefined) {
    return false;
  }

  const pathname = legacySlug ? `/${legacySlug}` : "/";
  window.history.replaceState(window.history.state, "", `${pathname}${window.location.search}`);
  return true;
}

export function scrollDocumentToTop(): void {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function navigateToPath(path: string): void {
  const destination = new URL(path, window.location.origin);
  const current = `${window.location.pathname}${window.location.search}`;
  const next = `${destination.pathname}${destination.search}`;

  if (current === next && window.location.hash === "") {
    scrollDocumentToTop();
    return;
  }

  window.history.pushState({}, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export interface DocsLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
}

export function DocsLink({ to, onClick, target, ...props }: DocsLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== "_self")
    ) {
      return;
    }

    event.preventDefault();
    navigateToPath(to);
  };

  return <a {...props} href={to} target={target} onClick={handleClick} />;
}
