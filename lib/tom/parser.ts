// TOM (Tunaground Object Markup) Parser
// Used for parsing DB data (read-time)
// dice is NOT self-closing because DB stores [dice 1 3]result[/dice]

import { parseWithConfig, stringifyWithConfig } from "./parser-core";

// Re-export types from parser-core
export {
  TAGS,
  type TagName,
  type TomText,
  type TomElement,
  type TomNested,
  type TomRoot,
  type TomNode,
  isTomText,
  isTomElement,
  isTomNested,
  isTomNode,
  isValidTag,
} from "./parser-core";

// In parser (read-time), dice is NOT self-closing
export const SELF_CLOSING_TAGS = ["youtube", "hr"] as const;

export type SelfClosingTagName = (typeof SELF_CLOSING_TAGS)[number];

export function isSelfClosingTag(name: string): name is SelfClosingTagName {
  return (SELF_CLOSING_TAGS as readonly string[]).includes(name);
}

const PARSER_CONFIG = {
  selfClosingTags: SELF_CLOSING_TAGS,
};

export function parse(input: string) {
  return parseWithConfig(input, PARSER_CONFIG);
}

export function stringify(root: ReturnType<typeof parse>) {
  return stringifyWithConfig(root, PARSER_CONFIG);
}
