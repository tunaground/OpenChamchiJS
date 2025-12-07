// TOM (Tunaground Object Markup) Preparser
// Used for parsing user input (write-time)
// dice IS self-closing because user writes [dice 1 3]

import { parseWithConfig, TomRoot } from "./parser-core";

// In preparser (write-time), dice IS self-closing
const PREPARSER_SELF_CLOSING_TAGS = ["youtube", "hr", "dice"] as const;

const PREPARSER_CONFIG = {
  selfClosingTags: PREPARSER_SELF_CLOSING_TAGS,
};

export function preparse(input: string): TomRoot {
  return parseWithConfig(input, PREPARSER_CONFIG);
}
