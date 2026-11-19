import {
  DEFAULT_FONT,
  FONTS,
  fontBootScript,
  fontVariablesCss,
  resolveFont,
} from "@/lib/theme/fonts";

/** Run the pre-paint script against stand-ins for localStorage and document */
function runScript(getItem: () => string | null) {
  const written: string[] = [];
  const document = {
    documentElement: { dataset: {} as Record<string, string> },
    write: (html: string) => written.push(html),
  };
  new Function("localStorage", "document", fontBootScript())({ getItem }, document);
  return { font: document.documentElement.dataset.font, written };
}

const run = (stored: string | null) => runScript(() => stored);
const runWithThrowingStorage = () =>
  runScript(() => {
    throw new Error("SecurityError");
  });

describe("FONTS", () => {
  it("has 9 options with unique keys, default first", () => {
    expect(FONTS).toHaveLength(9);
    expect(new Set(FONTS.map((f) => f.key)).size).toBe(9);
    expect(FONTS[0].key).toBe(DEFAULT_FONT);
  });

  it("defaults to Pretendard", () => {
    expect(DEFAULT_FONT).toBe("pretendard");
    expect(resolveFont(DEFAULT_FONT).stack).toBe(
      '"Pretendard Variable", Pretendard, system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif'
    );
  });

  it("still offers IBM Plex Sans KR, the default before", () => {
    expect(resolveFont("plex").stack).toBe(
      '"IBM Plex Sans KR", system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif'
    );
  });

  it("loads no stylesheet for system or d2coding", () => {
    expect(resolveFont("system").stylesheet).toBeNull();
    expect(resolveFont("d2coding").stylesheet).toBeNull();
  });
});

describe("resolveFont", () => {
  it.each([undefined, null, 3, "", "comic-sans"])(
    "falls back to the default for %p",
    (key) => {
      expect(resolveFont(key).key).toBe("pretendard");
    }
  );

  it("returns the option for a known key", () => {
    expect(resolveFont("gowun-batang").name).toBe("고운바탕");
  });
});

describe("fontVariablesCss", () => {
  it("declares the default on :root and one rule per font", () => {
    const css = fontVariablesCss();
    expect(css).toContain(":root{--font-sans:" + resolveFont("pretendard").stack);
    for (const f of FONTS) {
      expect(css).toContain(`html[data-font="${f.key}"]{--font-sans:${f.stack}`);
    }
  });
});

describe("fontBootScript", () => {
  it("applies the saved font and writes only its stylesheet", () => {
    const r = run(JSON.stringify({ state: { font: "noto-serif" }, version: 0 }));
    expect(r.font).toBe("noto-serif");
    expect(r.written).toHaveLength(1);
    expect(r.written[0]).toContain("family=Noto+Serif+KR");
    expect(r.written[0]).toContain('data-font-link="noto-serif"');
  });

  it("keeps a saved choice of the old default", () => {
    const r = run(JSON.stringify({ state: { font: "plex" }, version: 0 }));
    expect(r.font).toBe("plex");
    expect(r.written[0]).toContain("family=IBM+Plex+Sans+KR");
  });

  it("writes no stylesheet for system", () => {
    const r = run(JSON.stringify({ state: { font: "system" } }));
    expect(r.font).toBe("system");
    expect(r.written).toHaveLength(0);
  });

  it.each([null, "not json", JSON.stringify({ state: { font: "comic-sans" } })])(
    "uses the default with its stylesheet when storage holds %p",
    (stored) => {
      const r = run(stored);
      expect(r.font).toBe("pretendard");
      expect(r.written).toHaveLength(1);
      expect(r.written[0]).toContain("pretendardvariable-dynamic-subset");
    }
  );

  it("uses the default with its stylesheet when localStorage throws", () => {
    const r = runWithThrowingStorage();
    expect(r.font).toBe("pretendard");
    expect(r.written[0]).toContain("pretendardvariable-dynamic-subset");
  });

  it("is not tripped by a key that is an Object.prototype member", () => {
    const r = run(JSON.stringify({ state: { font: "constructor" } }));
    expect(r.font).toBe("pretendard");
    expect(r.written).toHaveLength(1);
  });
});
