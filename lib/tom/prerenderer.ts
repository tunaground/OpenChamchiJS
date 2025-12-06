// TOM Prerenderer - Processes AST before rendering
// Handles: dice rolling, calc/calcn evaluation

import { evaluate } from "mathjs";

import {
  TomRoot,
  TomNode,
  TomElement,
  TomText,
  TomNested,
  isTomElement,
  isTomText,
  isTomNested,
} from "./parser";

// Processed dice element with result
export type TomDiceResult = {
  type: "element";
  name: "dice";
  min: number;
  max: number;
  result: number;
  attributes: TomNode[];
  children: TomNode[];
};

// Processed calc/calcn element with result
export type TomCalcResult = {
  type: "element";
  name: "calc" | "calcn";
  expression: string;
  result: number;
  attributes: TomNode[];
  children: TomNode[];
};

export type PrerenderedNode = TomNode | TomDiceResult | TomCalcResult;

export type PrerenderedRoot = {
  type: "root";
  children: PrerenderedNode[];
};

export function isTomDiceResult(node: unknown): node is TomDiceResult {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as TomDiceResult).type === "element" &&
    (node as TomDiceResult).name === "dice" &&
    typeof (node as TomDiceResult).min === "number" &&
    typeof (node as TomDiceResult).max === "number" &&
    typeof (node as TomDiceResult).result === "number"
  );
}

export function isTomCalcResult(node: unknown): node is TomCalcResult {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as TomCalcResult).type === "element" &&
    ((node as TomCalcResult).name === "calc" || (node as TomCalcResult).name === "calcn") &&
    typeof (node as TomCalcResult).expression === "string" &&
    typeof (node as TomCalcResult).result === "number"
  );
}

// Random number generator (can be overridden for testing)
export type RandomFn = (min: number, max: number) => number;

const defaultRandom: RandomFn = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// S-expression calculator for [calc]
function calculate(operator: string, operands: number[]): number {
  if (operands.length === 0) {
    throw new Error("No operands provided");
  }

  switch (operator) {
    case "+":
      return operands.reduce((a, b) => a + b, 0);
    case "-":
      if (operands.length === 1) return -operands[0];
      return operands.slice(1).reduce((a, b) => a - b, operands[0]);
    case "*":
      return operands.reduce((a, b) => a * b, 1);
    case "/":
      if (operands.length === 1) return 1 / operands[0];
      return operands.slice(1).reduce((a, b) => a / b, operands[0]);
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

// Extract numeric value from a node (for calc operations)
function extractNumber(node: TomNode, random: RandomFn): number {
  if (isTomText(node)) {
    const num = parseFloat(node.value);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${node.value}`);
    }
    return num;
  }

  if (isTomElement(node)) {
    if (node.name === "dice") {
      const result = processDice(node, random);
      return result.result;
    }
    if (node.name === "calc") {
      const result = processCalc(node, random);
      return result.result;
    }
    if (node.name === "calcn") {
      const result = processCalcn(node, random);
      return result.result;
    }
  }

  if (isTomNested(node)) {
    // Nested expression in calc context - treat as calc
    return evaluateNestedAsCalc(node, random);
  }

  throw new Error("Cannot extract number from node");
}

// Evaluate a nested node as a calc expression
function evaluateNestedAsCalc(node: TomNested, random: RandomFn): number {
  const children = node.children.filter((c) => !isTomText(c) || c.value.trim() !== "");

  if (children.length === 0) {
    throw new Error("Empty nested expression");
  }

  const first = children[0];
  if (!isTomText(first)) {
    throw new Error("First element of nested expression must be operator");
  }

  const operator = first.value;
  const operands = children.slice(1).map((c) => extractNumber(c, random));

  return calculate(operator, operands);
}

// Process [dice min max] or [dice min max result] -> TomDiceResult
function processDice(node: TomElement, random: RandomFn): TomDiceResult {
  if (node.attributes.length < 2 || node.attributes.length > 3) {
    throw new Error(`dice requires 2-3 attributes, got ${node.attributes.length}`);
  }

  const minNode = node.attributes[0];
  const maxNode = node.attributes[1];
  const resultNode = node.attributes[2];

  const min = extractNumber(minNode, random);
  const max = extractNumber(maxNode, random);

  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("dice min/max must be integers");
  }

  if (min > max) {
    throw new Error(`dice min (${min}) cannot be greater than max (${max})`);
  }

  // If result is already provided (prerendered), use it; otherwise roll
  let result: number;
  if (resultNode) {
    result = extractNumber(resultNode, random);
  } else {
    result = random(min, max);
  }

  return {
    type: "element",
    name: "dice",
    min,
    max,
    result,
    attributes: node.attributes,
    children: node.children,
  };
}

// Process [calc (op a b ...)] -> TomCalcResult
function processCalc(node: TomElement, random: RandomFn): TomCalcResult {
  if (node.attributes.length !== 1 || !isTomNested(node.attributes[0])) {
    throw new Error("calc requires exactly one nested expression");
  }

  const nested = node.attributes[0];
  const result = evaluateNestedAsCalc(nested, random);

  // Build expression string for display
  const expression = stringifyNested(nested);

  return {
    type: "element",
    name: "calc",
    expression,
    result,
    attributes: node.attributes,
    children: node.children,
  };
}

// Process [calcn expr] -> TomCalcResult (infix notation)
function processCalcn(node: TomElement, random: RandomFn): TomCalcResult {
  // Collect all attributes into expression string
  const exprParts: string[] = [];

  function collectExpr(nodes: TomNode[]): void {
    for (const n of nodes) {
      if (isTomText(n)) {
        exprParts.push(n.value);
      } else if (isTomNested(n)) {
        exprParts.push("(");
        collectExpr(n.children);
        exprParts.push(")");
      } else if (isTomElement(n)) {
        // Nested dice/calc in calcn
        const num = extractNumber(n, random);
        exprParts.push(String(num));
      }
    }
  }

  collectExpr(node.attributes);
  const expression = exprParts.join("");

  // Evaluate using mathjs
  const evaluated = evaluate(expression);
  const result = typeof evaluated === "number" ? evaluated : NaN;

  return {
    type: "element",
    name: "calcn",
    expression,
    result,
    attributes: node.attributes,
    children: node.children,
  };
}

// Helper to stringify nested for expression display
function stringifyNested(node: TomNested): string {
  const parts: string[] = [];
  for (const child of node.children) {
    if (isTomText(child)) {
      parts.push(child.value);
    } else if (isTomNested(child)) {
      parts.push("(" + stringifyNested(child) + ")");
    } else if (isTomElement(child)) {
      parts.push(`[${child.name}]`);
    }
  }
  return parts.join(" ");
}

// Convert element back to text for fallback
function elementToText(node: TomElement): TomText {
  function nodeToString(n: TomNode): string {
    if (isTomText(n)) {
      return n.value;
    }
    if (isTomNested(n)) {
      return "(" + n.children.map(nodeToString).join(" ") + ")";
    }
    if (isTomElement(n)) {
      const attrs = n.attributes.map(nodeToString).join(" ");
      const children = n.children.map(nodeToString).join("");
      const opening = attrs ? `[${n.name} ${attrs}]` : `[${n.name}]`;
      if (n.children.length === 0 && ["dice", "hr", "youtube"].includes(n.name)) {
        return opening;
      }
      return `${opening}${children}[/${n.name}]`;
    }
    return "";
  }

  return {
    type: "text",
    value: nodeToString(node),
  };
}

// Preprocessed result type (only dice is processed at write time)
export type PreprocessedNode = TomNode | TomDiceResult;

export type PreprocessedRoot = {
  type: "root";
  children: PreprocessedNode[];
};

// Preprocess: Only processes dice at write time (before saving to DB)
export function preprocess(root: TomRoot, random: RandomFn = defaultRandom): PreprocessedRoot {
  function processNode(node: TomNode): PreprocessedNode {
    if (isTomText(node)) {
      return node;
    }

    if (isTomNested(node)) {
      return {
        type: "nested",
        children: node.children.map(processNode),
      };
    }

    if (isTomElement(node)) {
      // Only process dice at write time
      if (node.name === "dice") {
        try {
          return processDice(node, random);
        } catch {
          return elementToText(node);
        }
      }

      // All other elements: process children recursively but don't evaluate
      return {
        type: "element",
        name: node.name,
        attributes: node.attributes.map(processNode),
        children: node.children.map(processNode),
      };
    }

    return node;
  }

  return {
    type: "root",
    children: root.children.map(processNode),
  };
}

// Stringify preprocessed result back to TOM string (only dice results embedded)
export function stringifyPreprocessed(root: PreprocessedRoot): string {
  function stringifyNode(node: PreprocessedNode): string {
    if (isTomText(node)) {
      return node.value;
    }

    if (isTomNested(node)) {
      return "(" + node.children.map((c) => stringifyNode(c as PreprocessedNode)).join(" ") + ")";
    }

    if (isTomDiceResult(node)) {
      // [dice min max] with result -> [dice min max result]
      return `[dice ${node.min} ${node.max} ${node.result}]`;
    }

    if (isTomElement(node)) {
      const attrs = node.attributes.map((a) => stringifyNode(a as PreprocessedNode)).join(" ");
      const children = node.children.map((c) => stringifyNode(c as PreprocessedNode)).join("");

      const selfClosingTags = ["youtube", "hr", "dice"];
      if (selfClosingTags.includes(node.name)) {
        return attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
      }

      const opening = attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
      return `${opening}${children}[/${node.name}]`;
    }

    return "";
  }

  return root.children.map(stringifyNode).join("");
}

// Main prerender function
export function prerender(root: TomRoot, random: RandomFn = defaultRandom): PrerenderedRoot {
  function processNode(node: TomNode): PrerenderedNode {
    if (isTomText(node)) {
      return node;
    }

    if (isTomNested(node)) {
      return {
        type: "nested",
        children: node.children.map(processNode),
      };
    }

    if (isTomElement(node)) {
      // Process special elements with error fallback
      if (node.name === "dice") {
        try {
          return processDice(node, random);
        } catch {
          return elementToText(node);
        }
      }

      if (node.name === "calc") {
        try {
          return processCalc(node, random);
        } catch {
          return elementToText(node);
        }
      }

      if (node.name === "calcn") {
        try {
          return processCalcn(node, random);
        } catch {
          return elementToText(node);
        }
      }

      // Regular element - process children recursively
      return {
        type: "element",
        name: node.name,
        attributes: node.attributes.map(processNode),
        children: node.children.map(processNode),
      };
    }

    return node;
  }

  return {
    type: "root",
    children: root.children.map(processNode),
  };
}
