import { parse } from "@/lib/tom/parser";
import { preparse } from "@/lib/tom/preparser";
import {
  preprocess,
  stringify,
} from "@/lib/tom/preprocessor";
import {
  prerender,
  isTomDiceResult,
  isTomCalcResult,
  TomDiceResult,
  TomCalcResult,
  PrerenderedNode,
} from "@/lib/tom/prerenderer";

// Fixed random for deterministic tests
const fixedRandom = (min: number, _max: number) => min;

// Helper: simulate full write-then-read flow
function writeAndRead(input: string, random = fixedRandom) {
  // Write flow: preparse → preprocess → stringify
  const preparsed = preparse(input);
  const preprocessed = preprocess(preparsed, random);
  const dbContent = stringify(preprocessed);
  // Read flow: parse → prerender
  const parsed = parse(dbContent);
  return prerender(parsed, random);
}

describe("TOM Prerenderer", () => {
  describe("dice", () => {
    it("processes dice with fixed random (full flow)", () => {
      // Use full flow: user input → DB → render
      const result = writeAndRead("[dice 1 6]");

      expect(result.children).toHaveLength(1);
      const dice = result.children[0] as TomDiceResult;

      expect(isTomDiceResult(dice)).toBe(true);
      expect(dice.min).toBe(1);
      expect(dice.max).toBe(6);
      expect(dice.result).toBe(1); // fixedRandom returns min
    });

    it("processes dice with max random (full flow)", () => {
      const maxRandom = (min: number, max: number) => max;
      const result = writeAndRead("[dice 1 20]", maxRandom);

      const dice = result.children[0] as TomDiceResult;
      expect(dice.result).toBe(20);
    });

    it("processes dice with large range (full flow)", () => {
      const result = writeAndRead("[dice 1 100]");

      const dice = result.children[0] as TomDiceResult;
      expect(dice.min).toBe(1);
      expect(dice.max).toBe(100);
    });

    it("reads stored dice result from DB format", () => {
      // Test reading DB format directly: [dice min max]result[/dice]
      const ast = parse("[dice 1 6]3[/dice]");
      const result = prerender(ast, fixedRandom);

      const dice = result.children[0] as TomDiceResult;
      expect(dice.result).toBe(3); // Should read from children, not random
    });

    it("falls back to text on invalid dice attributes", () => {
      // Invalid input (only 1 attribute) - test via full flow
      const result = writeAndRead("[dice 1]");

      expect(result.children).toHaveLength(1);
      expect((result.children[0] as any).type).toBe("text");
    });

    it("falls back to text when min > max", () => {
      const result = writeAndRead("[dice 10 5]");

      expect(result.children).toHaveLength(1);
      expect((result.children[0] as any).type).toBe("text");
    });
  });

  describe("calc (S-expression)", () => {
    it("evaluates addition", () => {
      const ast = parse("[calc (+ 1 2 3)][/calc]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(isTomCalcResult(calc)).toBe(true);
      expect(calc.result).toBe(6);
    });

    it("evaluates subtraction", () => {
      const ast = parse("[calc (- 10 3 2)][/calc]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(5); // 10 - 3 - 2
    });

    it("evaluates multiplication", () => {
      const ast = parse("[calc (* 2 3 4)][/calc]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(24);
    });

    it("evaluates division", () => {
      const ast = parse("[calc (/ 100 2 5)][/calc]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(10); // 100 / 2 / 5
    });

    it("evaluates nested expressions", () => {
      const ast = parse("[calc (+ (* 2 3) 4)][/calc]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(10); // (2 * 3) + 4
    });

    it("includes expression string", () => {
      const ast = parse("[calc (+ 1 2)][/calc]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.expression).toContain("+");
    });

    it("evaluates with nested dice (full flow)", () => {
      // Use full flow for calc with nested dice
      const result = writeAndRead("[calc (+ [dice 1 6] 10)][/calc]");

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(11); // 1 (from fixedRandom) + 10
    });
  });

  describe("calcn (infix notation)", () => {
    it("evaluates simple addition", () => {
      const ast = parse("[calcn 1+2][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(isTomCalcResult(calc)).toBe(true);
      expect(calc.result).toBe(3);
    });

    it("evaluates with operator precedence", () => {
      const ast = parse("[calcn 2+3*4][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(14); // 2 + (3 * 4)
    });

    it("evaluates with parentheses", () => {
      const ast = parse("[calcn (2+3)*4][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(20);
    });

    it("evaluates division", () => {
      const ast = parse("[calcn 10/2][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(5);
    });

    it("evaluates modulo", () => {
      const ast = parse("[calcn 10%3][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(1);
    });

    it("handles negative numbers", () => {
      const ast = parse("[calcn -5+10][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(5);
    });

    it("handles decimal numbers", () => {
      const ast = parse("[calcn 1.5+2.5][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(4);
    });

    it("evaluates complex expression", () => {
      const ast = parse("[calcn (10+5)*2-8/4][/calcn]");
      const result = prerender(ast, fixedRandom);

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(28); // (10+5)*2 - 8/4 = 30 - 2 = 28
    });

    it("shows dice range in expression (full flow)", () => {
      // [calcn (3+4+[dice 1 10])][/calcn] should show "(3+4+[1~10]1)" with result 8
      const result = writeAndRead("[calcn (3+4+[dice 1 10])][/calcn]");

      const calc = result.children[0] as TomCalcResult;
      expect(isTomCalcResult(calc)).toBe(true);
      expect(calc.result).toBe(8); // 3 + 4 + 1 (fixedRandom returns min)
      expect(calc.expression).toBe("(3+4+[1~10]1)");
    });

    it("shows multiple dice in expression (full flow)", () => {
      const result = writeAndRead("[calcn [dice 1 6]+[dice 1 6]][/calcn]");

      const calc = result.children[0] as TomCalcResult;
      expect(calc.result).toBe(2); // 1 + 1 (fixedRandom returns min for both)
      expect(calc.expression).toBe("[1~6]1+[1~6]1");
    });
  });

  describe("mixed content", () => {
    it("preserves non-calc elements", () => {
      const ast = parse("[bld]text[/bld]");
      const result = prerender(ast, fixedRandom);

      expect(result.children).toHaveLength(1);
      const elem = result.children[0] as PrerenderedNode;
      expect((elem as any).type).toBe("element");
      expect((elem as any).name).toBe("bld");
    });

    it("processes dice inside other elements (full flow)", () => {
      const result = writeAndRead("[bld][dice 1 6][/bld]");

      const bld = result.children[0] as any;
      expect(bld.name).toBe("bld");

      const dice = bld.children[0];
      expect(isTomDiceResult(dice)).toBe(true);
      expect(dice.result).toBe(1);
    });

    it("handles text alongside dice (full flow)", () => {
      const result = writeAndRead("Roll: [dice 1 20]");

      expect(result.children).toHaveLength(2);
      expect((result.children[0] as any).value).toBe("Roll: ");

      const dice = result.children[1] as TomDiceResult;
      expect(dice.result).toBe(1);
    });

    it("handles text after dice (full flow)", () => {
      const result = writeAndRead("[dice 1 3]text");

      expect(result.children).toHaveLength(2);

      const dice = result.children[0] as TomDiceResult;
      expect(isTomDiceResult(dice)).toBe(true);
      expect(dice.result).toBe(1);

      expect((result.children[1] as any).value).toBe("text");
    });
  });

  describe("type guards", () => {
    it("isTomDiceResult correctly identifies dice results", () => {
      const result = writeAndRead("[dice 1 6]");

      expect(isTomDiceResult(result.children[0])).toBe(true);
      expect(isTomDiceResult({ type: "text", value: "hello" })).toBe(false);
      expect(isTomDiceResult(null)).toBe(false);
    });

    it("isTomCalcResult correctly identifies calc results", () => {
      const ast = parse("[calc (+ 1 2)][/calc]");
      const result = prerender(ast, fixedRandom);

      expect(isTomCalcResult(result.children[0])).toBe(true);
      expect(isTomCalcResult({ type: "text", value: "hello" })).toBe(false);
    });
  });

  describe("error handling", () => {
    it("falls back to text on invalid calc syntax", () => {
      const ast = parse("[calc invalid][/calc]");
      const result = prerender(ast, fixedRandom);

      expect(result.children).toHaveLength(1);
      expect((result.children[0] as any).type).toBe("text");
      expect((result.children[0] as any).value).toContain("[calc");
    });

    it("falls back to text on unsupported operator", () => {
      const ast = parse("[calc (^ 2 3)][/calc]");
      const result = prerender(ast, fixedRandom);

      expect(result.children).toHaveLength(1);
      expect((result.children[0] as any).type).toBe("text");
      expect((result.children[0] as any).value).toContain("[calc");
    });

    it("falls back to text on nested invalid dice in calcn (full flow)", () => {
      const result = writeAndRead("[calcn (1+[dice 1])][/calcn]");

      expect(result.children).toHaveLength(1);
      expect((result.children[0] as any).type).toBe("text");
      expect((result.children[0] as any).value).toContain("[calcn");
    });
  });
});
