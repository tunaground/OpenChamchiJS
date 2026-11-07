"use client";

import styled from "styled-components";

/** Shown over a drop zone while files are dragged over it; its parent needs position: relative */
export const DropOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border: 2px dashed ${(props) => props.theme.accent};
  border-radius: inherit;
  background: ${(props) => props.theme.accentSoft};
  color: ${(props) => props.theme.accent};
  font-size: 1.4rem;
  font-weight: 500;
  text-align: center;
  /* Let the drag events reach the zone underneath */
  pointer-events: none;
`;
