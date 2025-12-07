// TOM (Tunaground Object Markup) - Main exports

// Parser types and functions (read-time, DB data)
export {
  // Types
  type TomText,
  type TomElement,
  type TomNested,
  type TomRoot,
  type TomNode,
  type TagName,
  type SelfClosingTagName,
  // Constants
  TAGS,
  SELF_CLOSING_TAGS,
  // Functions
  parse,
  stringify,
  // Type guards
  isTomText,
  isTomElement,
  isTomNested,
  isTomNode,
  isValidTag,
  isSelfClosingTag,
} from "./parser";

// Preparser (write-time, user input)
export { preparse } from "./preparser";

// Preprocessor (write-time, before DB save)
export {
  // Types
  type TomDiceResult as PreprocessorDiceResult,
  type PreprocessedNode,
  type PreprocessedRoot,
  type RandomFn,
  // Functions
  preprocess,
  stringify as stringifyPreprocessed,
  // Type guards
  isTomDiceResult as isPreprocessorDiceResult,
} from "./preprocessor";

// Prerenderer (read-time, before render)
export {
  // Types
  type TomDiceResult,
  type TomCalcResult,
  type PrerenderedNode,
  type PrerenderedRoot,
  // Functions
  prerender,
  // Type guards
  isTomDiceResult,
  isTomCalcResult,
} from "./prerenderer";

// Renderer (render to React)
export {
  // Types
  type AnchorInfo,
  type RenderContext,
  // Functions
  render,
  renderTom,
} from "./renderer";
