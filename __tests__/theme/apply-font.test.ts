import { applyFont } from "@/lib/theme/apply-font";

interface FakeLink {
  rel: string;
  href: string;
  dataset: Record<string, string>;
}

/** The few Document members applyFont touches */
function fakeDocument() {
  const appended: FakeLink[] = [];
  const doc = {
    documentElement: { dataset: {} as Record<string, string> },
    querySelector: (selector: string) =>
      appended.find((link) => selector === `link[data-font-link="${link.dataset.fontLink}"]`) ?? null,
    createElement: (): FakeLink => ({ rel: "", href: "", dataset: {} }),
    head: { appendChild: (link: FakeLink) => appended.push(link) },
  };
  return { doc: doc as unknown as Document, dataset: doc.documentElement.dataset, appended };
}

describe("applyFont", () => {
  it("sets data-font and appends the stylesheet once", () => {
    const { doc, dataset, appended } = fakeDocument();
    applyFont("noto-sans", doc);
    applyFont("noto-sans", doc);
    expect(dataset.font).toBe("noto-sans");
    expect(appended).toHaveLength(1);
    expect(appended[0].rel).toBe("stylesheet");
    expect(appended[0].href).toContain("family=Noto+Sans+KR");
    expect(appended[0].dataset.fontLink).toBe("noto-sans");
  });

  it("keeps earlier stylesheets when switching fonts", () => {
    const { doc, dataset, appended } = fakeDocument();
    applyFont("noto-sans", doc);
    applyFont("gowun-batang", doc);
    applyFont("noto-sans", doc);
    expect(dataset.font).toBe("noto-sans");
    expect(appended.map((link) => link.dataset.fontLink)).toEqual(["noto-sans", "gowun-batang"]);
  });

  it("appends nothing for system", () => {
    const { doc, dataset, appended } = fakeDocument();
    applyFont("system", doc);
    expect(dataset.font).toBe("system");
    expect(appended).toHaveLength(0);
  });

  it("falls back to the default for an unknown key", () => {
    const { doc, dataset, appended } = fakeDocument();
    applyFont("comic-sans", doc);
    expect(dataset.font).toBe("plex");
    expect(appended[0].href).toContain("family=IBM+Plex+Sans+KR");
  });
});
