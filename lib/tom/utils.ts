// TOM Utilities
// Helper functions for TOM manipulation

import {
  parse,
  TomRoot,
  TomNode,
  isTomElement,
  isTomText,
  isTomNested,
} from "./parser";

// Self-closing tags for original format (same as preparser)
const ORIGINAL_SELF_CLOSING_TAGS = ["youtube", "hr", "dice"];

/**
 * Convert a TomNode to remove dice results (children)
 * This restores dice elements to their original user-input form
 */
function convertNode(node: TomNode): TomNode {
  if (isTomText(node)) {
    return node;
  }

  if (isTomNested(node)) {
    return {
      type: "nested",
      children: node.children.map(convertNode),
    };
  }

  if (isTomElement(node)) {
    if (node.name === "dice") {
      // dice: remove children (result), keep only attributes (min, max)
      return {
        type: "element",
        name: "dice",
        attributes: node.attributes,
        children: [],
      };
    }

    // Other elements: recursively process attributes and children
    return {
      type: "element",
      name: node.name,
      attributes: node.attributes.map(convertNode),
      children: node.children.map(convertNode),
    };
  }

  return node;
}

/**
 * Stringify a TomNode back to TOM string
 * Handles dice as self-closing (original format)
 */
function stringifyNode(node: TomNode): string {
  if (isTomText(node)) {
    return node.value;
  }

  if (isTomNested(node)) {
    return "(" + node.children.map(stringifyNode).join(" ") + ")";
  }

  if (isTomElement(node)) {
    const attrs = node.attributes.map(stringifyNode).join(" ");
    const children = node.children.map(stringifyNode).join("");

    // Self-closing tags (including dice in original format)
    if (ORIGINAL_SELF_CLOSING_TAGS.includes(node.name)) {
      return attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
    }

    // Regular tags with closing tag
    const opening = attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
    return `${opening}${children}[/${node.name}]`;
  }

  return "";
}

/**
 * Convert DB content to original user-input format
 *
 * Example:
 * - Input (DB): "[dice 1 6]3[/dice]"
 * - Output: "[dice 1 6]"
 *
 * This is useful for showing users the original TOM markup
 * before preprocessing (e.g., before dice was rolled)
 */
export function toOriginalFormat(content: string): string {
  try {
    const ast = parse(content);
    const converted: TomRoot = {
      type: "root",
      children: ast.children.map(convertNode),
    };
    return converted.children.map(stringifyNode).join("");
  } catch {
    // If parsing fails, return original content
    return content;
  }
}
