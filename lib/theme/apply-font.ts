import { resolveFont } from "./fonts";

/**
 * Switch the body font on a live page: point html[data-font] at it and load
 * its stylesheet unless a <link> for it is already there (from the pre-paint
 * script or an earlier switch).
 */
export function applyFont(key: string, doc: Document = document): void {
  const font = resolveFont(key);
  doc.documentElement.dataset.font = font.key;
  if (!font.stylesheet) return;
  if (doc.querySelector(`link[data-font-link="${font.key}"]`)) return;
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = font.stylesheet;
  link.dataset.fontLink = font.key;
  doc.head.appendChild(link);
}
