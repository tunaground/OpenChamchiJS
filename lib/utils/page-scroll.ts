// The page scrolls inside the content pane on desktop (so the pane's edges
// and the composer dock stay put) and the window on mobile. These helpers
// hide which one is active.

export const PAGE_SCROLL_ID = "page-scroll";

/** The scrolling pane element, or null when the window scrolls */
export function getPageScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(PAGE_SCROLL_ID);
  if (!el) return null;
  const overflow = getComputedStyle(el).overflowY;
  return overflow === "auto" || overflow === "scroll" ? el : null;
}

export function getPageScrollMetrics(): { top: number; viewport: number; total: number } {
  const el = getPageScroller();
  if (el) return { top: el.scrollTop, viewport: el.clientHeight, total: el.scrollHeight };
  return {
    top: window.scrollY,
    viewport: window.innerHeight,
    total: document.documentElement.scrollHeight,
  };
}

/** True when the view is within `threshold` px of the bottom */
export function isPageNearBottom(threshold = 100): boolean {
  const { top, viewport, total } = getPageScrollMetrics();
  return top + viewport >= total - threshold;
}

export function scrollPageTo(position: "top" | "bottom", behavior: ScrollBehavior = "smooth") {
  const el = getPageScroller();
  const target = el ?? window;
  const bottom = () => (el ? el.scrollHeight : document.documentElement.scrollHeight);
  target.scrollTo({ top: position === "top" ? 0 : bottom(), behavior });

  // Images loading on the way down can grow the page after the scroll began;
  // finish the trip once the smooth scroll has settled
  if (position === "bottom") {
    window.setTimeout(() => {
      if (!isPageNearBottom(2)) target.scrollTo({ top: bottom(), behavior: "instant" });
    }, 900);
  }
}

/** Listen to scrolling of whichever is active (both are watched, so resizing across the breakpoint is fine) */
export function onPageScroll(handler: () => void): () => void {
  const el = document.getElementById(PAGE_SCROLL_ID);
  window.addEventListener("scroll", handler, { passive: true });
  el?.addEventListener("scroll", handler, { passive: true });
  return () => {
    window.removeEventListener("scroll", handler);
    el?.removeEventListener("scroll", handler);
  };
}
