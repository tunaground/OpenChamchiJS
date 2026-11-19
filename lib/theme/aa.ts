// Text metrics of AA (ASCII art) blocks, shared by the renderer, the composers
// and the archive. AA is drawn with a fixed line height; mobile shrinks the
// font, and its line height is derived from the desktop one so that the ratio
// between the two (and so the shape of the art) is the same on every screen.

/** Desktop font size (the response body's size) */
export const AA_FONT_SIZE = "1.5rem";
/** Desktop line height */
export const AA_LINE_HEIGHT = "1.6rem";
/** Font size below the mobile breakpoint */
export const AA_MOBILE_FONT_SIZE = "1.2rem";

const rem = (value: string) => parseFloat(value);

/** The mobile line height that keeps a desktop line height's ratio to the font */
export function aaMobileLineHeight(desktopLineHeight: string): string {
  const scaled = (rem(desktopLineHeight) * rem(AA_MOBILE_FONT_SIZE)) / rem(AA_FONT_SIZE);
  return `${Number(scaled.toFixed(4))}rem`;
}

export const AA_MOBILE_LINE_HEIGHT = aaMobileLineHeight(AA_LINE_HEIGHT);
