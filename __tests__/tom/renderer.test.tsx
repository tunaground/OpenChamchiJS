/**
 * @jest-environment jsdom
 */
import React from "react";
import { render as rtlRender, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ThemeProvider } from "styled-components";

import { parse } from "@/lib/tom/parser";
import { prerender } from "@/lib/tom/prerenderer";
import { render, RenderContext } from "@/lib/tom/renderer";
import { lightTheme } from "@/lib/theme/themes";

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock FontAwesome
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="fa-icon" />,
}));

const mockT = ((key: string) => key) as unknown as RenderContext["t"];

const defaultCtx: RenderContext = {
  boardId: "test",
  threadId: 1,
  setAnchorInfo: jest.fn(),
  t: mockT,
  onCopy: jest.fn(),
};

function renderTom(input: string, ctx: RenderContext = defaultCtx) {
  const ast = parse(input);
  const prerendered = prerender(ast, () => 5); // Fixed dice result
  const nodes = render(prerendered, ctx);

  return rtlRender(
    <ThemeProvider theme={lightTheme}>
      <div>{nodes}</div>
    </ThemeProvider>
  );
}

function rerenderTom(
  view: ReturnType<typeof rtlRender>,
  input: string,
  ctx: RenderContext = defaultCtx
) {
  const prerendered = prerender(parse(input), () => 5);
  view.rerender(
    <ThemeProvider theme={lightTheme}>
      <div>{render(prerendered, ctx)}</div>
    </ThemeProvider>
  );
}

describe("TOM Renderer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("text rendering", () => {
    it("renders plain text", () => {
      const { container } = renderTom("hello world");
      expect(container.textContent).toBe("hello world");
    });

    it("renders text with newlines as br", () => {
      const { container } = renderTom("line1\nline2");
      expect(container.querySelectorAll("br")).toHaveLength(1);
    });
  });

  describe("formatting tags", () => {
    it("renders bold text", () => {
      const { container } = renderTom("[bld]bold[/bld]");
      expect(container.textContent).toContain("bold");
    });

    it("renders italic text", () => {
      const { container } = renderTom("[itl]italic[/itl]");
      expect(container.textContent).toContain("italic");
    });

    it("renders colored text", () => {
      const { container } = renderTom("[clr red]colored[/clr]");
      expect(container.textContent).toContain("colored");
    });

    it("renders colored text with shadow", () => {
      const { container } = renderTom("[clr red blue]shadow[/clr]");
      expect(container.textContent).toContain("shadow");
    });
  });

  describe("special tags", () => {
    it("renders spoiler", () => {
      const { container } = renderTom("[spo]secret[/spo]");
      expect(container.textContent).toContain("secret");
    });

    it("renders subscript", () => {
      const { container } = renderTom("[sub]subscript[/sub]");
      const sub = container.querySelector("sub");
      expect(sub).not.toBeNull();
    });

    it("renders horizontal rule", () => {
      const { container } = renderTom("[hr]");
      const hr = container.querySelector("hr");
      expect(hr).not.toBeNull();
    });

    it("renders ruby annotation", () => {
      const { container } = renderTom("[ruby ふりがな]漢字[/ruby]");
      const ruby = container.querySelector("ruby");
      expect(ruby).not.toBeNull();
      const rt = container.querySelector("rt");
      expect(rt).not.toBeNull();
    });

    it("renders ascii art container", () => {
      const { container } = renderTom("[aa]art[/aa]");
      expect(container.textContent).toContain("art");
    });
  });

  describe("youtube", () => {
    it("renders youtube iframe", () => {
      const { container } = renderTom("[youtube https://youtube.com/watch?v=abc123def45]");
      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toBe("https://www.youtube.com/embed/abc123def45");
    });
  });

  describe("dice", () => {
    it("renders dice result", () => {
      // Use DB format: [dice min max]result[/dice]
      const { container } = renderTom("[dice 1 6]5[/dice]");
      expect(container.textContent).toContain("5");
      // ::before content is CSS, not in textContent - check $exp prop via HTML
      const calcSpan = container.querySelector("span");
      expect(calcSpan).not.toBeNull();
    });
  });

  describe("calc", () => {
    it("renders calc result", () => {
      const { container } = renderTom("[calc (+ 1 2 3)][/calc]");
      expect(container.textContent).toContain("6");
    });

    it("renders calcn result", () => {
      const { container } = renderTom("[calcn 2+3*4][/calcn]");
      expect(container.textContent).toContain("14");
    });
  });

  describe("anchors", () => {
    it("renders anchor links", () => {
      const setAnchorInfo = jest.fn();
      const ctx = { ...defaultCtx, setAnchorInfo };

      const { container } = renderTom("check >>5", ctx);
      expect(container.textContent).toContain(">>5");
    });

    it("renders cross-thread anchor", () => {
      const { container } = renderTom("see >123>5");
      const link = container.querySelector("a");
      expect(link).not.toBeNull();
    });
  });

  describe("nested elements", () => {
    it("renders nested formatting", () => {
      const { container } = renderTom("[bld][itl]bold italic[/itl][/bld]");
      expect(container.textContent).toContain("bold italic");
    });
  });

  describe("error handling", () => {
    it("falls back to flattened text for invalid elements", () => {
      const { container } = renderTom("[clr]no color specified[/clr]");
      // Should contain the text even if formatting fails
      expect(container.textContent).toContain("clr");
    });
  });

  describe("img", () => {
    it("renders img element with src", () => {
      const { container } = renderTom("[img https://example.com/a.png]");
      const img = container.querySelector("img");
      expect(img).not.toBeNull();
      expect(img?.getAttribute("src")).toBe("https://example.com/a.png");
    });

    it("wraps img in a link to the original", () => {
      const { container } = renderTom("[img https://example.com/a.png]");
      const link = container.querySelector("a");
      expect(link?.getAttribute("href")).toBe("https://example.com/a.png");
      expect(link?.getAttribute("target")).toBe("_blank");
      expect(link?.querySelector("img")).not.toBeNull();
    });

    it("shrink-wraps the link to the image so empty space is not clickable", () => {
      const { container } = renderTom("[img https://example.com/a.png]");
      const link = container.querySelector("a");
      expect(link).toHaveStyle({ display: "inline-block" });
    });

    it("renders figures inline so consecutive images sit side by side", () => {
      const { container } = renderTom(
        "[img https://example.com/a.png][img https://example.com/b.png]"
      );
      const figures = container.querySelectorAll("figure");
      expect(figures).toHaveLength(2);
      figures.forEach((figure) => {
        expect(figure).toHaveStyle({ display: "inline-block" });
      });
    });

    it("renders caption as figcaption and img alt", () => {
      const { container } = renderTom("[img https://example.com/a.png my caption]");
      const figcaption = container.querySelector("figcaption");
      expect(figcaption?.textContent).toBe("my caption");
      expect(container.querySelector("img")?.getAttribute("alt")).toBe("my caption");
    });

    it("uses url as alt when caption is absent", () => {
      const { container } = renderTom("[img https://example.com/a.png]");
      expect(container.querySelector("figcaption")).toBeNull();
      expect(container.querySelector("img")?.getAttribute("alt")).toBe(
        "https://example.com/a.png"
      );
    });

    it("resolves dice result inside nested url (DB format)", () => {
      const { container } = renderTom(
        "[img (https://test.com/img/selection_ [dice 1 3]2[/dice] .png)]"
      );
      const img = container.querySelector("img");
      expect(img?.getAttribute("src")).toBe("https://test.com/img/selection_2.png");
    });

    it("falls back to text for non-http url", () => {
      const { container } = renderTom("[img javascript:alert(1)]");
      expect(container.querySelector("img")).toBeNull();
      expect(container.textContent).toContain("[img");
    });

    it("falls back to video when image fails to load", () => {
      const { container } = renderTom("[img https://example.com/clip.mp4 움짤]");
      fireEvent.error(container.querySelector("img")!);

      const video = container.querySelector("video");
      expect(video).not.toBeNull();
      expect(video?.getAttribute("src")).toBe("https://example.com/clip.mp4");
      expect(video?.hasAttribute("autoplay")).toBe(true);
      expect(video?.hasAttribute("loop")).toBe(true);
      expect(video?.hasAttribute("playsinline")).toBe(true);
      expect((video as HTMLVideoElement).muted).toBe(true);
      expect(video?.getAttribute("aria-label")).toBe("움짤");
      expect(video?.closest("a")?.getAttribute("href")).toBe(
        "https://example.com/clip.mp4"
      );
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("figcaption")?.textContent).toBe("움짤");
    });

    it("replaces broken media with url link after img and video both fail", () => {
      const { container } = renderTom("[img https://example.com/gone.png my caption]");
      fireEvent.error(container.querySelector("img")!);
      fireEvent.error(container.querySelector("video")!);

      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("video")).toBeNull();
      const link = container.querySelector("a");
      expect(link?.getAttribute("href")).toBe("https://example.com/gone.png");
      expect(link?.textContent).toContain("⚠️");
      expect(link?.textContent).toContain("https://example.com/gone.png");
      expect(container.querySelector("figcaption")?.textContent).toBe("my caption");
    });

    it("retries as img when url changes after falling back to video", () => {
      const good = "[img (https://a.com/x_ [dice 0 1]0[/dice] .jpg)]";
      const bad = "[img (https://a.com/x_ [dice 0 1]1[/dice] .jpg)]";

      const view = renderTom(bad);
      fireEvent.error(view.container.querySelector("img")!);
      expect(view.container.querySelector("video")).not.toBeNull();

      rerenderTom(view, good);
      expect(view.container.querySelector("video")).toBeNull();
      expect(view.container.querySelector("img")?.getAttribute("src")).toBe(
        "https://a.com/x_0.jpg"
      );
    });

    it("shows new url after rerender even when previous url failed", () => {
      // Regression: preview rerolls dice per keystroke at the same tree position;
      // a failed url must not stick once the url becomes valid again
      const good = "[img (https://a.com/x_ [dice 0 1]0[/dice] .jpg)]";
      const bad = "[img (https://a.com/x_ [dice 0 1]1[/dice] .jpg)]";

      const view = renderTom(good);
      expect(view.container.querySelector("img")?.getAttribute("src")).toBe(
        "https://a.com/x_0.jpg"
      );

      rerenderTom(view, bad);
      fireEvent.error(view.container.querySelector("img")!);

      rerenderTom(view, good);
      expect(view.container.querySelector("img")?.getAttribute("src")).toBe(
        "https://a.com/x_0.jpg"
      );
    });
  });
});
