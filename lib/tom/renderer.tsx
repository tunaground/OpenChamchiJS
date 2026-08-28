"use client";

import { Fragment, ReactNode, useState } from "react";
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

// CSS color validation to prevent injection attacks
const CSS_COLOR_REGEX =
  /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)|hsl\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)|hsla\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)|[a-zA-Z]+)$/;

function sanitizeCssColor(value: string): string | null {
  const trimmed = value.trim();
  if (CSS_COLOR_REGEX.test(trimmed)) {
    return trimmed;
  }
  return null;
}

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
  font-size: 1rem;
  vertical-align: text-bottom;
    line-height: initial;
`;

const Calc = styled.span<{ $exp: string }>`
  font-family: "Google Sans Code", monospace;
  font-weight: bold;
  cursor: pointer;

  &::before {
    content: ${(props) => `"${props.$exp}"`};
    color: ${(props) => props.theme.calcExpColor};
    vertical-align: text-top;
    font-size: 1.2rem;
    margin-right: 0.4rem;
  }
`;

const AA = styled.div.attrs({
  className: "no-swipe",
})`
  display: block;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  font-family: "AAFont", "HeadKasen", "Saitamaar", sans-serif;
  color: black;
  width: 100%;
  background: rgba(255, 255, 255);
  line-height: 1.6rem;

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
  max-width: 64rem;
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

const ImageFigure = styled.figure`
  margin: 0.5rem 0;
`;

// Shrink-wraps to the image so the empty space beside it is not clickable
const ImageLink = styled.a`
  display: inline-block;
  max-width: 100%;
`;

const ExternalImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 30rem;
  object-fit: contain;
`;

const ImageCaption = styled.figcaption`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
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
  sourceResponseId?: string;
}

export interface RenderContext {
  boardId: string;
  threadId: number;
  responseId?: string;
  setAnchorInfo: (a: AnchorInfo) => void;
  t: ReturnType<typeof useTranslations<never>>;
  // TODO: Add toast notification for clipboard copy
  onCopy?: (text: string) => void;
}

const ExternalLink = styled.a`
  color: ${(props) => props.theme.anchorALinkColor};
  text-decoration: underline;
  word-break: break-all;

  &:hover {
    text-decoration: none;
  }
`;

// Helper: Apply URL links to text
function applyLinks(
  text: string,
  keyPrefix: string
): (string | ReactNode)[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
  const result: (string | ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    const [url] = match;
    if (lastIndex < match.index) {
      result.push(text.slice(lastIndex, match.index));
    }
    result.push(
      <ExternalLink
        key={`${keyPrefix}-link-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {url}
      </ExternalLink>
    );
    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
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
      const beforeText = decode(line.slice(lastIndex, match.index));
      // Apply URL links to text before anchor
      result.push(...applyLinks(beforeText, `${lineIdx}-${lastIndex}`));

      if (p2 === "" && p3 === "") {
        result.push(fullMatch);
      } else {
        const anchorBoardId = p1 || ctx.boardId;
        const anchorThreadId = parseInt(p2) || ctx.threadId;
        const anchorStart = parseInt(p3);
        const anchorEnd = parseInt(p4);

        const href = isNaN(anchorStart)
          ? `/trace/${anchorBoardId}/${anchorThreadId}`
          : isNaN(anchorEnd)
            ? `/trace/${anchorBoardId}/${anchorThreadId}/${anchorStart}`
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
                    sourceResponseId: ctx.responseId,
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

    const remainingText = decode(line.slice(lastIndex));
    // Apply URL links to remaining text
    result.push(...applyLinks(remainingText, `${lineIdx}-end`));

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
    if (line) {
      result.push(<span key={`line-${key}-${lineIdx}`}>{line}</span>);
    }
    if (lineIdx < lines.length - 1) {
      result.push(<br key={`br-${key}-${lineIdx}`} />);
    }
  });

  return <Fragment key={key}>{result}</Fragment>;
}

// Helper: Flatten img attribute nodes into a plain string
// (dice results become their numbers; throws on unsupported nodes for fallback)
function flattenAttrToString(node: PrerenderedNode): string {
  if (isTomText(node)) {
    return node.value;
  }
  if (isTomDiceResult(node)) {
    return String((node as TomDiceResult).result);
  }
  if (node.type === "nested") {
    return node.children.map((c) => flattenAttrToString(c as PrerenderedNode)).join("");
  }
  throw new Error("Unsupported node in img attribute");
}

function TomImage({ url, caption }: { url: string; caption?: string }) {
  // Remember WHICH url failed, not just that a failure happened: the component
  // instance can outlive the url (e.g. preview rerolls a dice inside the url
  // at the same tree position), so a bare boolean would stick forever.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const failed = failedUrl === url;

  return (
    <ImageFigure>
      {failed ? (
        <ExternalLink href={url} target="_blank" rel="noopener noreferrer">
          ⚠️ {url}
        </ExternalLink>
      ) : (
        <ImageLink href={url} target="_blank" rel="noopener noreferrer">
          <ExternalImage
            src={url}
            alt={caption ?? url}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(url)}
          />
        </ImageLink>
      )}
      {caption && <ImageCaption>{caption}</ImageCaption>}
    </ImageFigure>
  );
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
    // Use originalExpression for copy (preserves [dice min max] format)
    const copyExpr = calc.originalExpression || calc.expression;
    const copy =
      calc.name === "calc"
        ? `[calc ${copyExpr}][/calc]`
        : `[calcn ${copyExpr}][/calcn]`;

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

          const color = sanitizeCssColor(elem.attributes[0].value);
          if (!color) {
            return flattenWithBreaks(node, key);
          }

          if (elem.attributes.length >= 2 && isTomText(elem.attributes[1])) {
            const shadow = sanitizeCssColor(elem.attributes[1].value);
            if (!shadow) {
              return flattenWithBreaks(node, key);
            }
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

        case "img": {
          if (elem.attributes.length < 1) {
            return flattenWithBreaks(node, key);
          }
          const url = flattenAttrToString(elem.attributes[0] as PrerenderedNode);
          if (!/^https?:\/\//.test(url)) {
            return flattenWithBreaks(node, key);
          }
          const caption =
            elem.attributes
              .slice(1)
              .map((a) => flattenAttrToString(a as PrerenderedNode))
              .join(" ")
              .trim() || undefined;
          return <TomImage key={key} url={url} caption={caption} />;
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
