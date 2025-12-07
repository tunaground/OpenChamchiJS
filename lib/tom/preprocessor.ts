// TOM Preprocessor - Processes user input before saving to DB
// Handles: dice rolling (at write time)

import {
  TomRoot,
  TomNode,
  TomElement,
  TomText,
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

export type PreprocessedNode = TomNode | TomDiceResult;

export type PreprocessedRoot = {
  type: "root";
  children: PreprocessedNode[];
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

// Random number generator (can be overridden for testing)
export type RandomFn = (min: number, max: number) => number;

const defaultRandom: RandomFn = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Extract numeric value from a text node
function extractNumber(node: TomNode): number {
  if (isTomText(node)) {
    const num = parseFloat(node.value);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${node.value}`);
    }
    return num;
  }
  throw new Error("Expected text node for number");
}

// Process [dice min max] -> TomDiceResult (from preparser, self-closing)
function processDice(node: TomElement, random: RandomFn): TomDiceResult {
  // In preparser output, dice is self-closing with exactly 2 attributes
  if (node.attributes.length !== 2) {
    throw new Error(`dice requires exactly 2 attributes (min, max), got ${node.attributes.length}`);
  }

  const minNode = node.attributes[0];
  const maxNode = node.attributes[1];

  const min = extractNumber(minNode);
  const max = extractNumber(maxNode);

  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error("dice min/max must be integers");
  }

  if (min > max) {
    throw new Error(`dice min (${min}) cannot be greater than max (${max})`);
  }

  // Always roll - this is write time, never use existing result
  const result = random(min, max);

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
      // In preparser context, dice is self-closing
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

// Preprocess: Process dice at write time (before saving to DB)
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

// Stringify preprocessed result back to TOM string
// Output format: [dice min max]result[/dice]
export function stringify(root: PreprocessedRoot): string {
  function stringifyNode(node: PreprocessedNode): string {
    if (isTomText(node)) {
      return node.value;
    }

    if (isTomNested(node)) {
      return "(" + node.children.map((c) => stringifyNode(c as PreprocessedNode)).join(" ") + ")";
    }

    if (isTomDiceResult(node)) {
      // [dice min max] with result -> [dice min max]result[/dice]
      return `[dice ${node.min} ${node.max}]${node.result}[/dice]`;
    }

    if (isTomElement(node)) {
      const attrs = node.attributes.map((a) => stringifyNode(a as PreprocessedNode)).join(" ");
      const children = node.children.map((c) => stringifyNode(c as PreprocessedNode)).join("");

      // Note: dice is handled above as TomDiceResult
      // Other self-closing tags in preparser context
      const selfClosingTags = ["youtube", "hr"];
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
