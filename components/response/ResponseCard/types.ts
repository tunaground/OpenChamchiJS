import type { ReactNode } from "react";

export interface ResponseCardData {
  id: string;
  seq: number;
  username: string;
  authorId: string;
  content: string;
  attachment?: string | null;
  createdAt: string;
}

export interface ResponseCardProps {
  /** Response data to render */
  response: ResponseCardData;
  /** Board ID for context */
  boardId: string;
  /** Thread ID for context */
  threadId: number;
  /** Pre-rendered TOM content (if not provided, shows raw content) */
  prerenderedContent?: ReactNode;
  /** Action buttons to show in header (e.g., raw content toggle) */
  headerActions?: ReactNode;
  /** Custom attachment renderer */
  attachmentRenderer?: (attachment: string) => ReactNode;
  /** Show raw content instead of prerendered */
  showRawContent?: boolean;
  /** Raw content to display when showRawContent is true */
  rawContent?: string;
  /** Card variant - "main" for thread detail, "anchor" for anchor preview */
  variant?: "main" | "anchor";
  /** Callback when anchor text is copied */
  onCopy?: () => void;
}
