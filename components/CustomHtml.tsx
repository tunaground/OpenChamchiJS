'use client';

import { CSSProperties, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: ${(props) => props.theme.responseCard};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.6rem;
  overflow-x: auto;

  & > ins,
  & > iframe {
    max-width: 100% !important;
  }
`;

interface CustomHtmlProps {
  html: string;
  style?: CSSProperties;
}

export default function CustomHtml({ html, style }: CustomHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = html;

    const scripts = container.querySelectorAll('script');
    scripts.forEach((original) => {
      const script = document.createElement('script');
      original.getAttributeNames().forEach((name) => {
        script.setAttribute(name, original.getAttribute(name)!);
      });
      if (original.textContent) {
        script.textContent = original.textContent;
      }
      original.replaceWith(script);
    });
  }, [html]);

  return <Container ref={containerRef} style={style} />;
}
