/**
 * @jest-environment jsdom
 */
import React from "react";
import { render as rtlRender } from "@testing-library/react";
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
      const { container } = renderTom("[dice 1 6]");
      // Result should be 5 (from fixed random)
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
});
