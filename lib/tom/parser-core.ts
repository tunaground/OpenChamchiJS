// TOM (Tunaground Object Markup) Parser Core
// Shared parsing logic used by both parser.ts and preparser.ts

export const TAGS = [
  "clr",
  "ruby",
  "dice",
  "spo",
  "sub",
  "youtube",
  "calc",
  "calcn",
  "aa",
  "hr",
  "bld",
  "itl",
] as const;

export type TagName = (typeof TAGS)[number];

// AST Node Types
export type TomText = {
  type: "text";
  value: string;
};

export type TomElement = {
  type: "element";
  name: TagName;
  attributes: TomNode[];
  children: TomNode[];
};

export type TomNested = {
  type: "nested";
  children: TomNode[];
};

export type TomRoot = {
  type: "root";
  children: TomNode[];
};

export type TomNode = TomElement | TomText | TomNested;

// Type Guards
export function isTomText(node: unknown): node is TomText {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as TomText).type === "text" &&
    typeof (node as TomText).value === "string"
  );
}

export function isTomElement(node: unknown): node is TomElement {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as TomElement).type === "element" &&
    typeof (node as TomElement).name === "string" &&
    Array.isArray((node as TomElement).attributes) &&
    Array.isArray((node as TomElement).children)
  );
}

export function isTomNested(node: unknown): node is TomNested {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as TomNested).type === "nested" &&
    Array.isArray((node as TomNested).children)
  );
}

export function isTomNode(node: unknown): node is TomNode {
  return isTomText(node) || isTomElement(node) || isTomNested(node);
}

export function isValidTag(name: string): name is TagName {
  return (TAGS as readonly string[]).includes(name);
}

// Parser configuration
export interface ParserConfig {
  selfClosingTags: readonly string[];
}

// Security limits to prevent DoS attacks
export const PARSER_LIMITS = {
  MAX_INPUT_LENGTH: 100000, // 100KB max input
  MAX_STACK_DEPTH: 50, // Max nesting depth
  MAX_TOKENS: 50000, // Max number of tokens
} as const;

export class ParserLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParserLimitError";
  }
}

// Tokenizer
type Token =
  | { type: "open_bracket" }
  | { type: "close_bracket" }
  | { type: "open_paren" }
  | { type: "close_paren" }
  | { type: "space" }
  | { type: "text"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    switch (char) {
      case "[":
        tokens.push({ type: "open_bracket" });
        i++;
        break;
      case "]":
        tokens.push({ type: "close_bracket" });
        i++;
        break;
      case "(":
        tokens.push({ type: "open_paren" });
        i++;
        break;
      case ")":
        tokens.push({ type: "close_paren" });
        i++;
        break;
      case " ":
        tokens.push({ type: "space" });
        i++;
        break;
      default: {
        let text = "";
        while (i < input.length && !"[]() ".includes(input[i])) {
          text += input[i];
          i++;
        }
        if (text) {
          tokens.push({ type: "text", value: text });
        }
        break;
      }
    }
  }

  return tokens;
}

// Parser State
type ParserContext = "children" | "attribute" | "nested";

type StackFrame = {
  context: ParserContext;
  tagName: string;
  nodes: TomNode[];
  isSelfClosing: boolean;
};

function normalizeTagName(name: string): string {
  // Legacy clr* support (e.g., clrred -> clr)
  if (/^clr[a-z0-9-]+$/.test(name)) {
    return "clr";
  }
  if (/^\/clr[a-z0-9-]+$/.test(name)) {
    return "/clr";
  }
  return name;
}

function appendText(nodes: TomNode[], text: string): void {
  const last = nodes[nodes.length - 1];
  if (isTomText(last)) {
    last.value += text;
  } else {
    nodes.push({ type: "text", value: text });
  }
}

// Helper to convert nodes back to string (for unclosed tag recovery)
function stringifyNodesWithConfig(nodes: TomNode[], config: ParserConfig): string {
  let result = "";
  for (const node of nodes) {
    if (isTomText(node)) {
      result += node.value;
    } else if (isTomNested(node)) {
      result += "(" + stringifyNodesWithConfig(node.children, config) + ")";
    } else if (isTomElement(node)) {
      const attrs = stringifyNodesWithConfig(node.attributes, config);
      const children = stringifyNodesWithConfig(node.children, config);
      if (config.selfClosingTags.includes(node.name)) {
        result += attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
      } else {
        const opening = attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
        result += `${opening}${children}[/${node.name}]`;
      }
    }
  }
  return result;
}

// Core parse function with configurable self-closing tags
export function parseWithConfig(input: string, config: ParserConfig): TomRoot {
  // Security: Check input length
  if (input.length > PARSER_LIMITS.MAX_INPUT_LENGTH) {
    throw new ParserLimitError(
      `Input too long: ${input.length} chars (max: ${PARSER_LIMITS.MAX_INPUT_LENGTH})`
    );
  }

  const tokens = tokenize(input);

  // Security: Check token count
  if (tokens.length > PARSER_LIMITS.MAX_TOKENS) {
    throw new ParserLimitError(
      `Too many tokens: ${tokens.length} (max: ${PARSER_LIMITS.MAX_TOKENS})`
    );
  }

  const root: TomRoot = { type: "root", children: [] };

  const isSelfClosing = (name: string) => config.selfClosingTags.includes(name);

  const stack: StackFrame[] = [
    { context: "children", tagName: "root", nodes: root.children, isSelfClosing: false },
  ];

  let i = 0;
  let expectingTagName = false;
  let justClosedTag = false;

  function current(): StackFrame {
    return stack[stack.length - 1];
  }

  while (i < tokens.length) {
    const token = tokens[i];

    if (expectingTagName) {
      expectingTagName = false;

      if (token.type === "text") {
        const normalized = normalizeTagName(token.value);

        // Check for closing tag
        if (normalized.startsWith("/")) {
          const closingTagName = normalized.slice(1);
          if (current().tagName === closingTagName) {
            stack.pop();
            justClosedTag = true;
            i++;
            continue;
          }
        }

        // Check for valid opening tag
        if (isValidTag(normalized)) {
          const element: TomElement = {
            type: "element",
            name: normalized,
            attributes: [],
            children: [],
          };
          current().nodes.push(element);

          // Security: Check stack depth before pushing
          if (stack.length + 2 > PARSER_LIMITS.MAX_STACK_DEPTH) {
            throw new ParserLimitError(
              `Nesting too deep: ${stack.length} (max: ${PARSER_LIMITS.MAX_STACK_DEPTH})`
            );
          }

          // Push children frame first (will be used after attributes)
          stack.push({
            context: "children",
            tagName: normalized,
            nodes: element.children,
            isSelfClosing: isSelfClosing(normalized),
          });

          // Push attribute frame (will be popped when ] is encountered)
          stack.push({
            context: "attribute",
            tagName: normalized,
            nodes: element.attributes,
            isSelfClosing: isSelfClosing(normalized),
          });

          i++;
          continue;
        }

        // Not a valid tag, treat [ and tag name as text, consume next ] if present
        appendText(current().nodes, "[" + token.value);
        i++;
        // Consume the following ] if it exists
        if (i < tokens.length && tokens[i].type === "close_bracket") {
          appendText(current().nodes, "]");
          i++;
        }
        continue;
      }

      if (token.type === "open_bracket") {
        // Double bracket [[
        appendText(current().nodes, "[");
        expectingTagName = true;
        i++;
        continue;
      }

      // Other token after [, treat [ as text
      appendText(current().nodes, "[");
      continue;
    }

    switch (token.type) {
      case "open_bracket":
        expectingTagName = true;
        i++;
        break;

      case "close_bracket":
        if (justClosedTag) {
          justClosedTag = false;
          i++;
          break;
        }

        if (current().context === "attribute") {
          const attrFrame = stack.pop()!;
          // If self-closing, also pop the children frame
          if (attrFrame.isSelfClosing) {
            stack.pop();
          }
          i++;
          break;
        }

        // Stray ], treat as text
        appendText(current().nodes, "]");
        i++;
        break;

      case "open_paren":
        if (current().context === "attribute" || current().context === "nested") {
          // Security: Check stack depth before pushing
          if (stack.length + 1 > PARSER_LIMITS.MAX_STACK_DEPTH) {
            throw new ParserLimitError(
              `Nesting too deep: ${stack.length} (max: ${PARSER_LIMITS.MAX_STACK_DEPTH})`
            );
          }
          const nested: TomNested = { type: "nested", children: [] };
          current().nodes.push(nested);
          stack.push({
            context: "nested",
            tagName: "nested",
            nodes: nested.children,
            isSelfClosing: false,
          });
          i++;
          break;
        }

        // In children context, treat as text
        appendText(current().nodes, "(");
        i++;
        break;

      case "close_paren":
        if (current().context === "nested") {
          stack.pop();
          i++;
          break;
        }

        // Stray ), treat as text
        appendText(current().nodes, ")");
        i++;
        break;

      case "space":
        if (current().context === "attribute" || current().context === "nested") {
          // Skip spaces between attributes/nested items
          i++;
          break;
        }

        appendText(current().nodes, " ");
        i++;
        break;

      case "text":
        if (current().context === "attribute" || current().context === "nested") {
          // In attribute/nested context, each text token is separate
          current().nodes.push({ type: "text", value: token.value });
        } else {
          // In children context, merge consecutive text
          appendText(current().nodes, token.value);
        }
        i++;
        break;
    }
  }

  // Handle unclosed tags at the end of input
  if (expectingTagName) {
    // There was a trailing [ without a tag name
    appendText(current().nodes, "[");
  }

  // Unwind stack for unclosed tags
  // For children context: keep the element (implicit closing at end of input)
  // For attribute/nested context: convert back to text (incomplete tag)
  while (stack.length > 1) {
    const frame = stack.pop()!;
    const parentFrame = stack[stack.length - 1];

    if (frame.context === "nested") {
      // Unclosed nested: convert back to text with (
      const nestedText = "(" + stringifyNodesWithConfig(frame.nodes, config);
      // Remove the nested node from parent and append as text
      const lastNode = parentFrame.nodes[parentFrame.nodes.length - 1];
      if (isTomNested(lastNode)) {
        parentFrame.nodes.pop();
      }
      appendText(parentFrame.nodes, nestedText);
    } else if (frame.context === "attribute") {
      // Unclosed attribute means tag was not fully formed (no closing ])
      // Convert to text
      const childFrame = stack.pop()!; // pop the children frame too
      const elementParent = stack[stack.length - 1];

      // Find and remove the element from parent
      const lastElement = elementParent.nodes[elementParent.nodes.length - 1];
      if (isTomElement(lastElement) && lastElement.name === frame.tagName) {
        elementParent.nodes.pop();
        // Convert to text: [tagname attrs...
        let text = "[" + frame.tagName;
        const attrText = stringifyNodesWithConfig(frame.nodes, config);
        if (attrText) {
          text += " " + attrText;
        }
        appendText(elementParent.nodes, text);
      }
    } else if (frame.context === "children") {
      // Unclosed children context: tag was opened but not closed
      // This is valid - implicitly close at end of input (keep the element as-is)
      // Children are already in frame.nodes, element is in parent
      // No action needed - element remains valid
    }
  }

  return root;
}

// Stringify with config
export function stringifyWithConfig(root: TomRoot, config: ParserConfig): string {
  function stringifyNode(node: TomNode): string {
    if (node.type === "text") {
      return node.value;
    }

    if (node.type === "nested") {
      return "(" + node.children.map(stringifyNode).join(" ") + ")";
    }

    if (node.type === "element") {
      const attrs = node.attributes.map(stringifyNode).join(" ");
      const children = node.children.map(stringifyNode).join("");

      if (config.selfClosingTags.includes(node.name)) {
        return attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
      }

      const opening = attrs ? `[${node.name} ${attrs}]` : `[${node.name}]`;
      return `${opening}${children}[/${node.name}]`;
    }

    return "";
  }

  return root.children.map(stringifyNode).join("");
}
