import {
  parse,
  stringify,
  isTomText,
  isTomElement,
  isTomNested,
  TomRoot,
  TomElement,
  TomText,
} from "@/lib/tom/parser";

describe("TOM Parser", () => {
  describe("parse", () => {
    it("parses plain text", () => {
      const result = parse("hello world");
      expect(result).toEqual<TomRoot>({
        type: "root",
        children: [{ type: "text", value: "hello world" }],
      });
    });

    it("parses simple element", () => {
      const result = parse("[bld]bold text[/bld]");
      expect(result.children).toHaveLength(1);

      const element = result.children[0] as TomElement;
      expect(element.type).toBe("element");
      expect(element.name).toBe("bld");
      expect(element.children).toHaveLength(1);
      expect((element.children[0] as TomText).value).toBe("bold text");
    });

    it("parses element with attributes", () => {
      const result = parse("[clr red]colored text[/clr]");
      const element = result.children[0] as TomElement;

      expect(element.name).toBe("clr");
      expect(element.attributes).toHaveLength(1);
      expect((element.attributes[0] as TomText).value).toBe("red");
      expect((element.children[0] as TomText).value).toBe("colored text");
    });

    it("parses element with multiple attributes", () => {
      const result = parse("[dice 1 6]");
      const element = result.children[0] as TomElement;

      expect(element.name).toBe("dice");
      expect(element.attributes).toHaveLength(2);
      expect((element.attributes[0] as TomText).value).toBe("1");
      expect((element.attributes[1] as TomText).value).toBe("6");
    });

    it("parses self-closing tags", () => {
      const result = parse("[hr]some text");
      expect(result.children).toHaveLength(2);

      const hr = result.children[0] as TomElement;
      expect(hr.name).toBe("hr");
      expect(hr.children).toHaveLength(0);

      const text = result.children[1] as TomText;
      expect(text.value).toBe("some text");
    });

    it("parses youtube as self-closing", () => {
      const result = parse("[youtube abc123]after");
      expect(result.children).toHaveLength(2);

      const yt = result.children[0] as TomElement;
      expect(yt.name).toBe("youtube");
      expect(yt.attributes).toHaveLength(1);
      expect((yt.attributes[0] as TomText).value).toBe("abc123");

      expect((result.children[1] as TomText).value).toBe("after");
    });

    it("parses dice as self-closing", () => {
      const result = parse("[dice 1 20]");
      const element = result.children[0] as TomElement;

      expect(element.name).toBe("dice");
      expect(element.attributes).toHaveLength(2);
      expect(element.children).toHaveLength(0);
    });

    it("parses nested elements", () => {
      const result = parse("[bld][itl]bold italic[/itl][/bld]");
      const outer = result.children[0] as TomElement;

      expect(outer.name).toBe("bld");
      expect(outer.children).toHaveLength(1);

      const inner = outer.children[0] as TomElement;
      expect(inner.name).toBe("itl");
      expect((inner.children[0] as TomText).value).toBe("bold italic");
    });

    it("parses nested parentheses in attributes", () => {
      const result = parse("[calc (+ 1 2)][/calc]");
      const element = result.children[0] as TomElement;

      expect(element.name).toBe("calc");
      expect(element.attributes).toHaveLength(1);
      expect(isTomNested(element.attributes[0])).toBe(true);

      const nested = element.attributes[0];
      if (isTomNested(nested)) {
        expect(nested.children).toHaveLength(3);
        expect((nested.children[0] as TomText).value).toBe("+");
        expect((nested.children[1] as TomText).value).toBe("1");
        expect((nested.children[2] as TomText).value).toBe("2");
      }
    });

    it("parses deeply nested parentheses", () => {
      const result = parse("[calc (+ (- 5 2) 3)][/calc]");
      const element = result.children[0] as TomElement;
      const outer = element.attributes[0];

      expect(isTomNested(outer)).toBe(true);
      if (isTomNested(outer)) {
        expect(outer.children).toHaveLength(3);
        const innerNested = outer.children[1];
        expect(isTomNested(innerNested)).toBe(true);
      }
    });

    it("handles invalid tags as text", () => {
      const result = parse("[invalid]text");
      expect(result.children).toHaveLength(1);
      // Invalid tag is preserved with brackets
      expect((result.children[0] as TomText).value).toBe("[invalid]text");
    });

    it("handles unclosed brackets as text", () => {
      const result = parse("before [after");
      expect(result.children).toHaveLength(1);
      expect((result.children[0] as TomText).value).toBe("before [after");
    });

    it("handles legacy clr tags", () => {
      const result = parse("[clrred]text[/clrred]");
      const element = result.children[0] as TomElement;
      expect(element.name).toBe("clr");
    });

    it("handles mixed content", () => {
      const result = parse("before [bld]bold[/bld] after");
      expect(result.children).toHaveLength(3);
      expect((result.children[0] as TomText).value).toBe("before ");
      expect((result.children[1] as TomElement).name).toBe("bld");
      expect((result.children[2] as TomText).value).toBe(" after");
    });

    it("handles empty element", () => {
      const result = parse("[bld][/bld]");
      const element = result.children[0] as TomElement;
      expect(element.children).toHaveLength(0);
    });

    it("handles parentheses in children context as text", () => {
      const result = parse("[bld](text)[/bld]");
      const element = result.children[0] as TomElement;
      expect((element.children[0] as TomText).value).toBe("(text)");
    });

    it("handles spoiler tag", () => {
      const result = parse("[spo]spoiler content[/spo]");
      const element = result.children[0] as TomElement;
      expect(element.name).toBe("spo");
      expect((element.children[0] as TomText).value).toBe("spoiler content");
    });

    it("handles ruby tag with attributes", () => {
      const result = parse("[ruby ふりがな]漢字[/ruby]");
      const element = result.children[0] as TomElement;
      expect(element.name).toBe("ruby");
      expect((element.attributes[0] as TomText).value).toBe("ふりがな");
      expect((element.children[0] as TomText).value).toBe("漢字");
    });

    it("handles aa (ascii art) tag", () => {
      const result = parse("[aa]  art  [/aa]");
      const element = result.children[0] as TomElement;
      expect(element.name).toBe("aa");
      expect((element.children[0] as TomText).value).toBe("  art  ");
    });
  });

  describe("stringify", () => {
    it("stringifies plain text", () => {
      const root: TomRoot = {
        type: "root",
        children: [{ type: "text", value: "hello" }],
      };
      expect(stringify(root)).toBe("hello");
    });

    it("stringifies element without attributes", () => {
      const root: TomRoot = {
        type: "root",
        children: [
          {
            type: "element",
            name: "bld",
            attributes: [],
            children: [{ type: "text", value: "bold" }],
          },
        ],
      };
      expect(stringify(root)).toBe("[bld]bold[/bld]");
    });

    it("stringifies element with attributes", () => {
      const root: TomRoot = {
        type: "root",
        children: [
          {
            type: "element",
            name: "clr",
            attributes: [{ type: "text", value: "red" }],
            children: [{ type: "text", value: "text" }],
          },
        ],
      };
      expect(stringify(root)).toBe("[clr red]text[/clr]");
    });

    it("stringifies self-closing tags", () => {
      const root: TomRoot = {
        type: "root",
        children: [
          {
            type: "element",
            name: "hr",
            attributes: [],
            children: [],
          },
        ],
      };
      expect(stringify(root)).toBe("[hr]");
    });

    it("stringifies nested elements", () => {
      const root: TomRoot = {
        type: "root",
        children: [
          {
            type: "nested",
            children: [
              { type: "text", value: "+" },
              { type: "text", value: "1" },
              { type: "text", value: "2" },
            ],
          },
        ],
      };
      expect(stringify(root)).toBe("(+ 1 2)");
    });

    it("round-trips simple markup", () => {
      const input = "[bld]bold[/bld]";
      const parsed = parse(input);
      expect(stringify(parsed)).toBe(input);
    });

    it("round-trips complex markup", () => {
      const input = "[clr red][bld]bold red[/bld][/clr]";
      const parsed = parse(input);
      expect(stringify(parsed)).toBe(input);
    });
  });

  describe("type guards", () => {
    it("isTomText identifies text nodes", () => {
      expect(isTomText({ type: "text", value: "hello" })).toBe(true);
      expect(isTomText({ type: "element", name: "bld", attributes: [], children: [] })).toBe(false);
      expect(isTomText(null)).toBe(false);
      expect(isTomText(undefined)).toBe(false);
    });

    it("isTomElement identifies element nodes", () => {
      expect(isTomElement({ type: "element", name: "bld", attributes: [], children: [] })).toBe(
        true
      );
      expect(isTomElement({ type: "text", value: "hello" })).toBe(false);
    });

    it("isTomNested identifies nested nodes", () => {
      expect(isTomNested({ type: "nested", children: [] })).toBe(true);
      expect(isTomNested({ type: "text", value: "hello" })).toBe(false);
    });
  });
});
