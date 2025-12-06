// TOM (Tunaground Object Markup) - Main exports

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

export {
  // Types
  type TomDiceResult,
  type TomCalcResult,
  type PrerenderedNode,
  type PrerenderedRoot,
  type RandomFn,
  // Functions
  prerender,
  // Type guards
  isTomDiceResult,
  isTomCalcResult,
} from "./prerenderer";

export {
  // Types
  type AnchorInfo,
  type RenderContext,
  // Functions
  render,
  renderTom,
} from "./renderer";
