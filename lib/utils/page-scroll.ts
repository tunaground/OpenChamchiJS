// The window scrolls on every screen size (the toolbar sticks to its top).
// These helpers keep page scrolling in one place.

export function getPageScrollMetrics(): { top: number; viewport: number; total: number } {
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
  const bottom = () => document.documentElement.scrollHeight;
  window.scrollTo({ top: position === "top" ? 0 : bottom(), behavior });

  // Images loading on the way down can grow the page after the scroll began;
  // finish the trip once the smooth scroll has settled
  if (position === "bottom") {
    window.setTimeout(() => {
      if (!isPageNearBottom(2)) window.scrollTo({ top: bottom(), behavior: "instant" });
    }, 900);
  }
}

export function onPageScroll(handler: () => void): () => void {
  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}
