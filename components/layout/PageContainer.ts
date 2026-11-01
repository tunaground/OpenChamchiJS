import styled from "styled-components";

/**
 * Centered, width-capped content column shared by every page except thread
 * views (which use the full width for AA). Keep page-specific spacing out of
 * here so all pages line up at the same width.
 */
export const PageContainer = styled.div`
  width: 100%;
  max-width: ${(props) => props.theme.contentMaxWidth};
  margin: 0 auto;
  padding: 1.6rem 2.4rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1.4rem 2.4rem;
  }
`;
