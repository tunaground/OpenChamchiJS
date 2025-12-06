"use client";

import { ReactNode } from "react";
import styled from "styled-components";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { decode } from "entities";
import { useTranslations } from "next-intl";

import {
  TomNode,
  TomElement,
  isTomText,
  isTomElement,
} from "./parser";
import {
  PrerenderedNode,
  PrerenderedRoot,
  isTomDiceResult,
  isTomCalcResult,
  TomDiceResult,
  TomCalcResult,
} from "./prerenderer";

// Styled Components
const ColorSpan = styled.span<{ $color?: string; $textShadow?: string }>`
  color: ${(props) => props.$color};
  text-shadow: ${(props) => props.$textShadow && `0 0 6px ${props.$textShadow}`};
`;

const Spoiler = styled.span`
  color: rgba(0, 0, 0, 0);

  ::selection {
    color: white;
    background-color: black;
  }
`;

const Sub = styled.sub`
  vertical-align: text-bottom;
  font-size: 1rem;
`;

const Calc = styled.span<{ $exp: string }>`
  font-family: "Google Sans Code", monospace;
  font-weight: bold;
  cursor: pointer;

  &::before {
    content: ${(props) => `"${props.$exp} "`};
    color: ${(props) => props.theme.calcExpColor};
    vertical-align: text-top;
    font-size: 1.2rem;
  }
`;

const AA = styled.div.attrs({
  className: "no-swipe",
})`
  display: block;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  font-family: "Saitamaar", sans-serif;
  color: black;
  width: 100%;
  background: rgba(255, 255, 255);
  line-height: 1.8rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    font-size: 1.2rem;
    line-height: 1.4rem;
  }
`;

const Bold = styled.span`
  font-weight: bold;
`;

const Italic = styled.span`
  font-style: italic;
`;

const AnchorA = styled.a`
  color: ${(props) => props.theme.anchorALinkColor};
  cursor: pointer;
`;

const YoutubeWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 640px;
  aspect-ratio: 16 / 9;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
`;

// Helper: Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Types
export interface AnchorInfo {
  boardId: string;
  threadId: number;
  start: number;
  end?: number;
}

export interface RenderContext {
  boardId: string;
  threadId: number;
  setAnchorInfo: (a: AnchorInfo) => void;
  t: ReturnType<typeof useTranslations<never>>;
  // TODO: Add toast notification for clipboard copy
  onCopy?: (text: string) => void;
}

// Helper: Convert text with anchors to ReactNodes
function applyAnchor(
  text: string,
  ctx: RenderContext
): (string | ReactNode)[] {
  const regex = /([a-z]*)>([0-9]*)>([0-9]*)(?:-([0-9]+))?/g;
  const lines = text.split(/\r?\n/);
  const result: (string | ReactNode)[] = [];

  lines.forEach((line, lineIdx) => {
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const [fullMatch, p1, p2, p3, p4] = match;
      result.push(decode(line.slice(lastIndex, match.index)));

      if (p2 === "" && p3 === "") {
        result.push(fullMatch);
      } else {
        const anchorBoardId = p1 || ctx.boardId;
        const anchorThreadId = parseInt(p2) || ctx.threadId;
        const anchorStart = parseInt(p3);
        const anchorEnd = parseInt(p4);

        const href = isNaN(anchorStart)
          ? `/trace/${anchorBoardId}/${anchorThreadId}/recent`
          : isNaN(anchorEnd)
            ? `/trace/${anchorBoardId}/${anchorThreadId}/${anchorStart}/${anchorStart}`
            : `/trace/${anchorBoardId}/${anchorThreadId}/${anchorStart}/${anchorEnd}`;

        if (isNaN(anchorStart)) {
          result.push(
            <span key={`${lineIdx}-${match.index}`}>
              <AnchorA href={href} target="_blank">
                {fullMatch}
              </AnchorA>
            </span>
          );
        } else {
          result.push(
            <span key={`${lineIdx}-${match.index}`}>
              <AnchorA
                onClick={() => {
                  ctx.setAnchorInfo({
                    boardId: anchorBoardId,
                    threadId: anchorThreadId,
                    start: anchorStart,
                    end: isNaN(anchorEnd) ? undefined : anchorEnd,
                  });
                }}
              >
                {fullMatch}
              </AnchorA>
              <Link prefetch={false} href={href} target="_blank">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </Link>
            </span>
          );
        }
      }

      lastIndex = regex.lastIndex;
    }

    result.push(decode(line.slice(lastIndex)));

    if (lineIdx < lines.length - 1) {
      result.push(<br key={`br-${lineIdx}`} />);
    }

    regex.lastIndex = 0;
  });

  return result;
}

// Helper: Flatten node back to TOM string for fallback
function flattenNode(node: PrerenderedNode): string {
  if (isTomText(node)) {
    return node.value;
  }

  if (node.type === "nested") {
    return "(" + node.children.map(flattenNode).join(" ") + ")";
  }

  if (isTomDiceResult(node)) {
    return `[dice ${node.min} ${node.max}]`;
  }

  if (isTomCalcResult(node)) {
    return `[${node.name} ${node.expression}][/${node.name}]`;
  }

  if (isTomElement(node)) {
    const elem = node as TomElement;
    const attrs = elem.attributes.map((a) => flattenNode(a as PrerenderedNode)).join(" ");
    const children = elem.children.map((c) => flattenNode(c as PrerenderedNode)).join("");
    const opening = attrs ? `[${elem.name} ${attrs}]` : `[${elem.name}]`;
    return `${opening}${children}[/${elem.name}]`;
  }

  return "";
}

// Helper: Split flattened text into lines with <br>
function flattenWithBreaks(node: PrerenderedNode, key: number): ReactNode {
  const flattened = flattenNode(node);
  const lines = flattened.split(/\r?\n/);
  const result: ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    result.push(line);
    if (lineIdx < lines.length - 1) {
      result.push(<br key={`br-${key}-${lineIdx}`} />);
    }
  });

  return <>{result}</>;
}

// Render a single node
function renderNode(node: PrerenderedNode, key: number, ctx: RenderContext): ReactNode {
  // Text node
  if (isTomText(node)) {
    const result = applyAnchor(node.value, ctx);
    return <span key={key}>{result}</span>;
  }

  // Nested node
  if (node.type === "nested") {
    return (
      <span key={key}>
        {node.children.map((child, i) => renderNode(child, i, ctx))}
      </span>
    );
  }

  // Dice result
  if (isTomDiceResult(node)) {
    const dice = node as TomDiceResult;
    const exp = `[${dice.min}~${dice.max}]`;
    const copy = `[dice ${dice.min} ${dice.max}]`;

    const handleClick = async () => {
      await navigator.clipboard.writeText(copy);
      ctx.onCopy?.(copy);
    };

    return (
      <Calc key={key} $exp={exp} onClick={handleClick}>
        {isNaN(dice.result) ? "NaN" : dice.result}
      </Calc>
    );
  }

  // Calc result
  if (isTomCalcResult(node)) {
    const calc = node as TomCalcResult;
    const copy =
      calc.name === "calc"
        ? `[calc ${calc.expression}][/calc]`
        : `[calcn ${calc.expression}][/calcn]`;

    const handleClick = async () => {
      await navigator.clipboard.writeText(copy);
      ctx.onCopy?.(copy);
    };

    return (
      <Calc key={key} $exp={calc.expression} onClick={handleClick}>
        {isNaN(calc.result) ? "NaN" : calc.result}
      </Calc>
    );
  }

  // Element node
  if (isTomElement(node)) {
    const elem = node as TomElement;

    try {
      switch (elem.name) {
        case "bld": {
          const content = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));
          return <Bold key={key}>{content}</Bold>;
        }

        case "itl": {
          const content = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));
          return <Italic key={key}>{content}</Italic>;
        }

        case "aa": {
          const content = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));
          return <AA key={key}>{content}</AA>;
        }

        case "clr": {
          const content = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));

          if (
            elem.attributes.length < 1 ||
            !isTomText(elem.attributes[0]) ||
            (elem.attributes[1] !== undefined && !isTomText(elem.attributes[1]))
          ) {
            return flattenWithBreaks(node, key);
          }

          const color = elem.attributes[0].value;

          if (elem.attributes.length >= 2 && isTomText(elem.attributes[1])) {
            const shadow = elem.attributes[1].value;
            return (
              <ColorSpan key={key} $color={color} $textShadow={shadow}>
                {content}
              </ColorSpan>
            );
          }

          return (
            <ColorSpan key={key} $color={color}>
              {content}
            </ColorSpan>
          );
        }

        case "ruby": {
          const top = elem.attributes.map((a, i) => renderNode(a as PrerenderedNode, i, ctx));
          const bottom = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));

          return (
            <ruby key={key}>
              {bottom}
              <rt>
                {top.map((item, i) => (i === top.length - 1 ? item : [item, " "]))}
              </rt>
            </ruby>
          );
        }

        case "spo": {
          const content = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));
          return <Spoiler key={key}>{content}</Spoiler>;
        }

        case "sub": {
          const content = elem.children.map((c, i) => renderNode(c as PrerenderedNode, i, ctx));
          return <Sub key={key}>{content}</Sub>;
        }

        case "hr": {
          return <hr key={key} />;
        }

        case "youtube": {
          if (elem.attributes.length !== 1 || !isTomText(elem.attributes[0])) {
            return flattenWithBreaks(node, key);
          }
          const url = elem.attributes[0].value;
          const videoId = extractYouTubeId(url);
          if (!videoId) {
            return flattenWithBreaks(node, key);
          }
          return (
            <YoutubeWrapper key={key}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </YoutubeWrapper>
          );
        }

        default:
          return flattenWithBreaks(node, key);
      }
    } catch {
      return flattenWithBreaks(node, key);
    }
  }

  return flattenWithBreaks(node, key);
}

// Main render function
export function render(root: PrerenderedRoot, ctx: RenderContext): ReactNode[] {
  return root.children.map((node, i) => renderNode(node, i, ctx));
}

// Convenience: parse + prerender + render in one call
export { render as renderTom };
