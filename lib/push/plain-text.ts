import { parse } from "@/lib/tom";
import type { TomNode } from "@/lib/tom/parser-core";

const MAX_LENGTH = 100;
const SPOILER = "▒▒▒";

export interface ExcerptLabels {
  image: string;
}

function nodeText(node: TomNode, labels: ExcerptLabels): string {
  if (node.type === "text") return node.value;
  if (node.type === "nested") return childrenText(node.children, labels);

  switch (node.name) {
    case "spo":
      return SPOILER;
    case "img":
      return ` ${labels.image} `;
    case "aa":
      return " (AA) ";
    case "youtube":
      return " (YouTube) ";
    case "hr":
      return " ";
    default:
      // dice keeps its rolled result; clr, bld, ruby, calc... keep their text
      return childrenText(node.children, labels);
  }
}

function childrenText(nodes: TomNode[], labels: ExcerptLabels): string {
  return nodes.map((node) => nodeText(node, labels)).join("");
}

/** Single-line, markup-free preview of a reply for a push notification body. */
export function toPushExcerpt(content: string, labels: ExcerptLabels): string {
  let text: string;
  try {
    text = childrenText(parse(content).children, labels);
  } catch {
    text = content;
  }
  const collapsed = text.replace(/\s+/g, " ").trim();
  const chars = Array.from(collapsed);
  return chars.length > MAX_LENGTH ? `${chars.slice(0, MAX_LENGTH).join("")}…` : collapsed;
}
