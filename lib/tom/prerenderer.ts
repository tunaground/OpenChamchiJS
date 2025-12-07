// TOM Prerenderer - Processes AST before rendering (read-time)
// Handles: dice result extraction, calc/calcn evaluation

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
  expression: string; // Display expression (e.g., "(3+4+[1~10]5)")
  originalExpression: string; // Original expression for copy (e.g., "(3+4+[dice 1 10])")
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

// Process [dice min max]result[/dice] -> TomDiceResult (from parser, non-self-closing)
function processDice(node: TomElement, random: RandomFn): TomDiceResult {
  // In parser output (DB data), dice has exactly 2 attributes and result in children
  if (node.attributes.length !== 2) {
    throw new Error(`dice requires exactly 2 attributes (min, max), got ${node.attributes.length}`);
  }

  const minNode = node.attributes[0];
  const maxNode = node.attributes[1];

  const min = extractNumber(minNode, random);
  const max = extractNumber(maxNode, random);

  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("dice min/max must be integers");
  }

  if (min > max) {
    throw new Error(`dice min (${min}) cannot be greater than max (${max})`);
  }

  // Read result from children (DB stores [dice min max]result[/dice])
  let result: number;
  if (node.children.length > 0 && isTomText(node.children[0])) {
    const resultText = node.children[0].value.trim();
    const parsedResult = parseInt(resultText, 10);
    if (!isNaN(parsedResult)) {
      result = parsedResult;
    } else {
      // Fallback to random if result is not a valid number
      result = random(min, max);
    }
  } else {
    // Fallback to random if no children
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
  // Build original expression for copy (preserves dice format)
  const originalExpression = stringifyNestedOriginal(nested);

  return {
    type: "element",
    name: "calc",
    expression,
    originalExpression,
    result,
    attributes: node.attributes,
    children: node.children,
  };
}

// Process [calcn expr] -> TomCalcResult (infix notation)
function processCalcn(node: TomElement, random: RandomFn): TomCalcResult {
  // Collect expression parts for display, evaluation, and original
  const displayParts: string[] = []; // For display (shows dice as [min~max]result)
  const evalParts: string[] = []; // For mathjs evaluation (numbers only)
  const originalParts: string[] = []; // For copy (original format with [dice min max])

  function collectExpr(nodes: TomNode[]): void {
    for (const n of nodes) {
      if (isTomText(n)) {
        displayParts.push(n.value);
        evalParts.push(n.value);
        originalParts.push(n.value);
      } else if (isTomNested(n)) {
        displayParts.push("(");
        evalParts.push("(");
        originalParts.push("(");
        collectExpr(n.children);
        displayParts.push(")");
        evalParts.push(")");
        originalParts.push(")");
      } else if (isTomElement(n)) {
        if (n.name === "dice") {
          // dice: show as [min~max]result in display, number in eval, [dice min max] in original
          const diceResult = processDice(n, random);
          displayParts.push(`[${diceResult.min}~${diceResult.max}]${diceResult.result}`);
          evalParts.push(String(diceResult.result));
          originalParts.push(`[dice ${diceResult.min} ${diceResult.max}]`);
        } else {
          // Other nested calc/calcn
          const num = extractNumber(n, random);
          displayParts.push(String(num));
          evalParts.push(String(num));
          originalParts.push(String(num));
        }
      }
    }
  }

  collectExpr(node.attributes);
  const expression = displayParts.join("");
  const evalExpression = evalParts.join("");
  const originalExpression = originalParts.join("");

  // Evaluate using mathjs
  const evaluated = evaluate(evalExpression);
  const result = typeof evaluated === "number" ? evaluated : NaN;

  return {
    type: "element",
    name: "calcn",
    expression,
    originalExpression,
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

// Helper to stringify nested for original format (preserves dice format)
function stringifyNestedOriginal(node: TomNested): string {
  const parts: string[] = [];
  for (const child of node.children) {
    if (isTomText(child)) {
      parts.push(child.value);
    } else if (isTomNested(child)) {
      parts.push("(" + stringifyNestedOriginal(child) + ")");
    } else if (isTomElement(child)) {
      if (child.name === "dice" && child.attributes.length === 2) {
        // Preserve dice format: [dice min max]
        const minAttr = child.attributes[0];
        const maxAttr = child.attributes[1];
        if (isTomText(minAttr) && isTomText(maxAttr)) {
          parts.push(`[dice ${minAttr.value} ${maxAttr.value}]`);
        } else {
          parts.push(`[${child.name}]`);
        }
      } else {
        parts.push(`[${child.name}]`);
      }
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

// Main prerender function (read-time)
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
