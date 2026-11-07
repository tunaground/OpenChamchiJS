export type ImageDropNotice = "multiple" | "notImage" | "tooLarge";

export interface ImageDropResult<T> {
  /** The image to attach, if any */
  file: T | null;
  /** What to tell the user, if anything */
  notice: ImageDropNotice | null;
}

/**
 * Picks the image to attach from dropped files: the first image, if it fits
 * within maxSize. Anything that is not an image is skipped without a word
 * unless nothing else was dropped.
 */
export function pickDroppedImage<T extends { type: string; size: number }>(
  files: readonly T[],
  maxSize: number
): ImageDropResult<T> {
  const images = files.filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) {
    return { file: null, notice: files.length > 0 ? "notImage" : null };
  }
  const first = images[0];
  if (first.size > maxSize) {
    return { file: null, notice: "tooLarge" };
  }
  return { file: first, notice: images.length > 1 ? "multiple" : null };
}

/** Whether a drag carries files (and not just text or a link) */
export function dragHasFiles(dataTransfer: DataTransfer | null): boolean {
  return !!dataTransfer && Array.from(dataTransfer.types).includes("Files");
}
