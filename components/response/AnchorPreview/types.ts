import type { AnchorInfo, PrerenderedRoot } from "@/lib/tom";

export interface AnchorResponseData {
  id: string;
  seq: number;
  username: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface AnchorStackItem {
  info: AnchorInfo;
  responses: AnchorResponseData[];
  loading: boolean;
}

export interface UseAnchorStackReturn {
  anchorStack: AnchorStackItem[];
  handleAnchorClick: (info: AnchorInfo) => void;
  closeAnchorPreview: (sourceResponseId: string) => void;
  anchorPrerenderedContents: Map<string, PrerenderedRoot>;
}

export interface AnchorPreviewProps {
  /** Anchor stack state */
  anchorStack: AnchorStackItem[];
  /** Source key for this preview */
  sourceKey: string;
  /** Pre-rendered contents map */
  prerenderedContents: Map<string, PrerenderedRoot>;
  /** Handler for anchor clicks within preview */
  onAnchorClick: (info: AnchorInfo) => void;
  /** Handler to close this preview */
  onClose: (sourceResponseId: string) => void;
  /** Close button label */
  closeLabel?: string;
  /** Callback when content is copied */
  onCopy?: () => void;
}
