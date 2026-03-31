# PureLayout v0.1.0

> Released: 2026-03-31
>
> First stable release of the pure JavaScript/TypeScript CSS Block + Inline layout engine.

---

## Overview

PureLayout v0.1.0 implements the core subset of CSS Normal Flow layout, including Block and Inline formatting contexts. It computes element sizes and positions without any browser DOM dependency, making it suitable for server-side rendering, PDF generation, Canvas drawing, and other non-browser environments.

**Key numbers:**

- 30 source files, ~1,500 lines of TypeScript
- 86 unit tests, all passing
- Zero runtime dependencies
- Dual-format output: ESM + CJS with full TypeScript type declarations

---

## What's New

### CSS Parsing Engine

A complete CSS value parsing and cascade system:

- **Value parser** — Supports `px`, `%`, `em`, `rem`, `auto`, `normal`, `none`, color values (`#hex`, `rgb()`, `rgba()`, `hsl()`), and `calc()` expressions
- **Shorthand expansion** — 1/2/3/4-value syntax auto-expands to four edges (`margin`, `padding`, etc.)
- **Style cascade** — Full priority chain: user styles > UA defaults > parent inheritance > initial values
- **Relative value resolution** — `em` resolves against parent `font-size`, `rem` against root `font-size`
- **UA stylesheet** — Built-in browser default styles for 26 HTML elements (`div`, `p`, `h1`-`h6`, `span`, `ul`, `ol`, `pre`, etc.)

### Block Layout

Full implementation of the CSS Block Formatting Context (BFC):

- **BFC creation** — Triggered by `overflow` not `visible`, `display: inline-block`, and other conditions
- **Normal flow** — Block elements stack vertically, `width: auto` fills the containing block
- **Margin collapse** — Adjacent sibling margin collapsing (positive values take max, negative take min, mixed values add)
- **Parent-child margin collapse** — First/last child margins collapse with parent when no `border-top`/`padding-top` barrier exists
- **BFC boundary** — BFC boundaries prevent inside/outside margins from collapsing across them
- **Clearance** — Interface reserved for Phase 2 (float support)

### Inline Layout

Basic implementation of the CSS Inline Formatting Context (IFC):

- **Line box construction** — Builds line boxes based on font metrics (ascent/descent), computes line height and baseline
- **Text placement** — Inline elements and text nodes arranged horizontally within line boxes
- **Soft wrapping** — Natural break opportunities between CJK characters, controlled by `word-break` / `overflow-wrap`
- **Whitespace handling** — Full support for all 5 modes of the `white-space` property:

  | Mode | Collapse spaces | Preserve newlines | Soft wrap |
  |------|----------------|-------------------|-----------|
  | `normal` | Yes | No | Yes |
  | `nowrap` | Yes | No | No |
  | `pre` | No | Yes | No |
  | `pre-wrap` | No | Yes | Yes |
  | `pre-line` | Yes | Yes | Yes |

### Box Model

Complete CSS box model computation:

- **margin** — Independent per-edge settings, supports `auto`
- **padding** — Independent per-edge settings, supports percentages
- **border-width** — Independent per-edge settings
- **box-sizing** — Both `content-box` (default) and `border-box` modes
- **min-width / max-width / min-height / max-height** — Size constraints
- **Horizontal auto margin centering** — `margin-left: auto` + `margin-right: auto` splits remaining space equally

### Text Measurement Abstraction

Pluggable text measurement interface:

- **`TextMeasurer` interface** — Defines `measureTextWidth()`, `getFontMetrics()`, and `measureTextSegments()` methods
- **`FallbackMeasurer`** — Zero-dependency implementation based on average character width estimation (Latin ~0.6em, CJK ~1.0em). Suitable for scenarios that don't require precise text measurement
- **`CanvasMeasurer`** — Uses Node.js `canvas` package's `measureText()` for higher precision. Automatically falls back to Fallback when the `canvas` package is unavailable

---

## Public API

```typescript
// Layout computation
layout(root: StyleNode, options: LayoutOptions): LayoutTree

// Get margin box rectangle (similar to DOM getBoundingClientRect)
getBoundingClientRect(node: LayoutNode): BoundingClientRect

// Find node by source index
findNodeBySourceIndex(root: LayoutNode, sourceIndex: number): LayoutNode | null

// CSS value factory functions
px(value: number): CSSLength
pct(value: number): CSSPercentage
em(value: number): CSSRelativeLength
rem(value: number): CSSRelativeLength
auto: CSSKeyword
normal: CSSKeyword
none: CSSKeyword

// Text measurers
new FallbackMeasurer(): TextMeasurer
new CanvasMeasurer(): TextMeasurer
```

---

## Supported CSS Properties (v0.1.0)

### Box Model

| Property | Supported Values |
|----------|-----------------|
| `display` | `block`, `inline`, `inline-block`, `none` |
| `box-sizing` | `content-box`, `border-box` |
| `width` / `height` | `\<length>`, `\<percentage>`, `em`, `rem`, `auto` |
| `min-*` / `max-*` | `\<length>`, `\<percentage>`, `auto`, `none` |
| `margin-*` | `\<length>`, `\<percentage>`, `em`, `rem`, `auto` |
| `padding-*` | `\<length>`, `\<percentage>`, `em`, `rem` |
| `border-*-width` | `\<length>`, `em`, `rem` |
| `overflow` | `visible`, `hidden`, `scroll`, `auto` |
| `vertical-align` | `baseline`, `top`, `middle`, `bottom` |

### Text

| Property | Supported Values |
|----------|-----------------|
| `font-family` | Font family name string |
| `font-size` | `\<length>`, `em`, `rem` |
| `font-weight` | `100`-`900` |
| `font-style` | `normal`, `italic` |
| `line-height` | `\<length>`, `\<percentage>`, `em`, `rem`, `normal` |
| `color` | `#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()` |
| `text-align` | `left`, `right`, `center`, `justify` |
| `white-space` | `normal`, `nowrap`, `pre`, `pre-wrap`, `pre-line` |
| `word-break` | `normal`, `break-all`, `keep-all` |
| `overflow-wrap` | `normal`, `break-word`, `anywhere` |
| `letter-spacing` / `word-spacing` / `text-indent` | `\<length>`, `em`, `rem` |
| `text-transform` | `none`, `uppercase`, `lowercase`, `capitalize` |

---

## Known Limitations

- **No float support** — Float layout will be implemented in Phase 2
- **No position support** — `absolute`, `fixed`, `sticky` positioning will be implemented in Phase 2
- **No Flexbox** — Flexible box layout will be added as a separate module in Phase 3
- **No Grid** — Grid layout will be implemented in Phase 4
- **No Table layout** — Table formatting will be added in a future release
- **Text measurement accuracy** — `FallbackMeasurer` uses average character width estimation with inherent imprecision. For accurate measurement, use `CanvasMeasurer` or integrate with [Pretext](https://github.com/chenglou/pretext)
- **Sub-pixel rendering** — All computations are based on integer pixels; sub-pixel rounding strategy differences are not handled
- **No BiDi support** — Bidirectional text (Arabic/Hebrew) is not yet supported
- **No Ruby support** — Ruby annotation layout is not yet supported

---

## Test Coverage

86 unit tests across the following modules:

| Module | Test File | Tests |
|--------|-----------|-------|
| CSS value parsing | `parser.test.ts` | 15 |
| Shorthand expansion | `shorthand.test.ts` | 5 |
| Style cascade | `cascade.test.ts` | 12 |
| Property inheritance | `inherit.test.ts` | 6 |
| Text measurement | `canvas-measurer.test.ts` | 7 |
| Box model | `box-model.test.ts` | 5 |
| Block layout | `normal-flow.test.ts` | 9 |
| Margin collapse | `margin-collapse.test.ts` | 7 |
| Whitespace handling | `whitespace.test.ts` | 14 |
| Public API | `api.test.ts` | 6 |
| **Total** | **10 files** | **86** |

---

## Installation & Usage

```bash
npm install purelayout
```

```typescript
import { layout, getBoundingClientRect, px, FallbackMeasurer } from 'purelayout';

const result = layout(
  {
    tagName: 'div',
    style: { width: px(400), paddingTop: px(16) },
    children: [
      { tagName: 'p', style: { marginBottom: px(20) }, children: ['First paragraph'] },
      { tagName: 'p', style: { marginBottom: px(20) }, children: ['Second paragraph'] },
    ],
  },
  { containerWidth: 800, textMeasurer: new FallbackMeasurer() }
);

// Read layout results
result.root.contentRect;              // { x: 0, y: 0, width: 400, height: ... }
result.root.children[0].contentRect;  // First <p> position and size
getBoundingClientRect(result.root);    // Margin box rectangle
```

---

## Contributing

Contributions, bug reports, and feature requests are welcome.

```bash
git clone https://github.com/peterfei/purelayout.git
cd purelayout

npm install
npm test
npm run build
```

---

## License

[MIT](./LICENSE)
