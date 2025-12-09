/**
 * Text shortcut rules for input forms
 * Converts shorthand patterns to TOM tags
 */

interface ShortcutRule {
  pattern: RegExp;
  replace: (match: RegExpMatchArray) => string;
}

const shortcutRules: ShortcutRule[] = [
  // .d숫자. → [dice 1 숫자] (1부터 시작하는 주사위)
  {
    pattern: /\.d(\d+)\./g,
    replace: (match) => `[dice 1 ${match[1]}]`,
  },
  // .D숫자. → [dice 0 숫자] (0부터 시작하는 주사위)
  {
    pattern: /\.D(\d+)\./g,
    replace: (match) => `[dice 0 ${match[1]}]`,
  },
];

/**
 * Apply shortcut rules to text
 * @param text - Input text to transform
 * @returns Transformed text with shortcuts replaced by TOM tags
 */
export function applyShortcuts(text: string): string {
  let result = text;
  for (const rule of shortcutRules) {
    result = result.replace(rule.pattern, (...args) => {
      // args: [fullMatch, ...captureGroups, offset, fullString]
      const match = args.slice(0, -2) as RegExpMatchArray;
      return rule.replace(match);
    });
  }
  return result;
}
