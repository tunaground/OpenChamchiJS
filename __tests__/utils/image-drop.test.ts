import { dragHasFiles, pickDroppedImage } from "@/lib/utils/image-drop";

const file = (type: string, size = 100) => ({ type, size });
const MAX = 1000;

describe("pickDroppedImage", () => {
  it("attaches a single image", () => {
    const png = file("image/png");
    expect(pickDroppedImage([png], MAX)).toEqual({ file: png, notice: null });
  });

  it("attaches the first of several images and says only one is taken", () => {
    const a = file("image/png");
    const b = file("image/jpeg");
    expect(pickDroppedImage([a, b], MAX)).toEqual({ file: a, notice: "multiple" });
  });

  it("takes the image out of a mix without a notice", () => {
    const pdf = file("application/pdf");
    const png = file("image/png");
    expect(pickDroppedImage([pdf, png], MAX)).toEqual({ file: png, notice: null });
  });

  it("refuses files that are not images", () => {
    expect(pickDroppedImage([file("application/pdf"), file("")], MAX)).toEqual({
      file: null,
      notice: "notImage",
    });
  });

  it("refuses an image over the size limit", () => {
    expect(pickDroppedImage([file("image/png", MAX + 1)], MAX)).toEqual({
      file: null,
      notice: "tooLarge",
    });
  });

  it("accepts an image exactly at the size limit", () => {
    const png = file("image/png", MAX);
    expect(pickDroppedImage([png], MAX)).toEqual({ file: png, notice: null });
  });

  it("does nothing when no files came through", () => {
    expect(pickDroppedImage([], MAX)).toEqual({ file: null, notice: null });
  });
});

describe("dragHasFiles", () => {
  const dt = (types: string[]) => ({ types }) as unknown as DataTransfer;

  it("is true for a file drag", () => {
    expect(dragHasFiles(dt(["Files"]))).toBe(true);
  });

  it("is false for text or links", () => {
    expect(dragHasFiles(dt(["text/plain", "text/uri-list"]))).toBe(false);
  });

  it("is false without a dataTransfer", () => {
    expect(dragHasFiles(null)).toBe(false);
  });
});
