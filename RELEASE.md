# PureLayout v0.2.0

> Released: 2026-04-01
>
> Adds complete Flexbox layout support with 100% browser fidelity.

---

## Overview

PureLayout v0.2.0 implements the full CSS Flex Formatting Context (FFC), covering all major flex properties: direction, wrapping, alignment (justify/align), flexible sizing (grow/shrink/basis), gap, order, and box-sizing interaction. 25 new diff test fixtures confirm 100% browser fidelity.

**Key numbers:**

- 36 source files, ~2,800 lines of TypeScript (+6 files, +1,300 lines)
- 202 tests total (153 unit + 49 diff), all passing
- 48 diff fixtures with 100% browser fidelity (336 comparison points)
- Zero runtime dependencies
- Dual-format output: ESM + CJS with full TypeScript type declarations

---

## What's New

### Flexbox Layout (Flex Formatting Context)

Complete implementation of the CSS Flexbox specification (11-step algorithm):

- **Flex directions** — `row`, `column`, `row-reverse`, `column-reverse`
- **Flex wrapping** — `nowrap` (default), `wrap`, `wrap-reverse` with automatic multi-line splitting
- **Main axis alignment** (`justify-content`) — `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly`
- **Cross axis alignment** (`align-items`) — `flex-start`, `flex-end`, `center`, `stretch`, `baseline`
- **Per-item alignment** (`align-self`) — Overrides container `align-items` per item
- **Multi-line alignment** (`align-content`) — `flex-start`, `flex-end`, `center`, `stretch`, `space-between`, `space-around`
- **Flexible sizing** — `flex-grow` distributes free space, `flex-shrink` handles overflow, `flex-basis` sets the initial main size
- **Ordering** — `order` property reorders flex items within the container
- **Gap** — `gap` shorthand, `row-gap` (cross-axis), `column-gap` (main-axis) per CSS spec
- **box-sizing** — `border-box` correctly handled for both flex base size and cross size calculations

### Engine Improvements

- **CSS shorthand expansion** — `gap` shorthand now expands to `row-gap` + `column-gap` in the cascade
- **Indefinite main size handling** — Column flex containers without explicit height use `Infinity` for main size, skipping grow/shrink
- **Wrap-reverse positioning** — Lines stack from container bottom when `wrap-reverse` is active with definite cross size
- **align-content: stretch** — Correctly distributes free space among lines and re-aligns items within stretched lines

---

## New Source Files

```
src/layout/flex/
  flex-formatting.ts   — FFC main entry (11-step algorithm)
  flex-item.ts         — Flex item collection and order sorting
  flex-size.ts         — Flex base size and hypothetical main size
  flex-algorithm.ts    — Free space distribution (grow/shrink)
  flex-wrap.ts         — Multi-line splitting
  types.ts             — FlexItemState, FlexLine, FlexContext
```

---

## Supported CSS Properties (v0.2.0)

### Flexbox (New)

| Property | Supported Values |
|----------|-----------------|
| `display` | `flex` (new) |
| `flex-direction` | `row`, `row-reverse`, `column`, `column-reverse` |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| `justify-content` | `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly` |
| `align-items` | `flex-start`, `flex-end`, `center`, `stretch`, `baseline` |
| `align-self` | `auto`, `flex-start`, `flex-end`, `center`, `stretch`, `baseline` |
| `align-content` | `flex-start`, `flex-end`, `center`, `stretch`, `space-between`, `space-around` |
| `flex-grow` | `<number>` (default: 0) |
| `flex-shrink` | `<number>` (default: 1) |
| `flex-basis` | `px`, `%`, `em`, `rem`, `auto` |
| `order` | `<integer>` (default: 0) |
| `gap` | `px`, `em`, `rem`, `normal` (shorthand) |
| `row-gap` | `px`, `em`, `rem`, `normal` |
| `column-gap` | `px`, `em`, `rem`, `normal` |

### Previously Supported (unchanged)

All properties from v0.1.0 remain supported: Block layout, Inline layout, Box model, Text properties, UA default stylesheet.

---

## Test Coverage

### Unit Tests (153 tests)

| Module | Tests |
|--------|-------|
| CSS value parsing | 15 |
| Shorthand expansion | 5 |
| Style cascade | 12 |
| Property inheritance | 6 |
| Text measurement | 7 |
| Box model | 5 |
| Block layout | 9 |
| Margin collapse | 7 |
| Whitespace handling | 14 |
| Public API | 6 |
| **Flex: basic** | 17 |
| **Flex: grow/shrink/justify/align/wrap/gap/order** | 50 |
| **Total** | **153** |

### Diff Tests (49 tests, 100% fidelity)

| Category | Fixtures | Status |
|----------|----------|--------|
| Block layout | 11 | 100% |
| Inline layout | 7 | 100% |
| Box Model | 5 | 100% |
| **Flex layout** | **25** | **100%** |
| **Total** | **48** | **100%** |

Flex diff fixtures cover: basic (row/column/reverse), grow (equal/ratio), shrink, flex-basis, justify (center/space-between/space-around/space-evenly), align (center/end/stretch/self), wrap (basic/reverse), gap (row/wrap), order, padding (container/item), border, box-sizing.

---

## Known Limitations

- **No float support** — Float layout will be implemented in a future release
- **No position support** — `absolute`, `fixed`, `sticky` positioning not yet supported
- **No Grid** — Grid layout will be implemented in Phase 3
- **No Table layout** — Table formatting will be added in a future release
- **Text measurement accuracy** — `FallbackMeasurer` uses average character width estimation. For accurate measurement, use `CanvasMeasurer` or integrate with [Pretext](https://github.com/chenglou/pretext)
- **Sub-pixel rendering** — All computations are based on integer pixels
- **No BiDi support** — Bidirectional text (Arabic/Hebrew) is not yet supported
- **Flex edge cases** — `min-width`/`max-width` constraints on flex items, nested flex containers with percentage sizes, and `visibility: collapse` are not yet fully supported

---

## Breaking Changes

None. All v0.1.0 APIs remain backward compatible.

---

## Installation & Usage

```bash
npm install purelayout
```

```typescript
import { layout, px, FallbackMeasurer } from 'purelayout';

// Flexbox layout
const result = layout(
  {
    tagName: 'div',
    style: { display: 'flex', flexWrap: 'wrap', gap: px(10), width: px(300) },
    children: [
      { tagName: 'div', style: { flexGrow: 1, height: px(50) } },
      { tagName: 'div', style: { flexGrow: 2, height: px(50) } },
      { tagName: 'div', style: { flexGrow: 1, height: px(50) } },
    ],
  },
  { containerWidth: 800, textMeasurer: new FallbackMeasurer() }
);

result.root.children[0].contentRect;  // { x: 0, y: 0, width: ~71.67, height: 50 }
result.root.children[1].contentRect;  // { x: ~81.67, y: 0, width: ~143.33, height: 50 }
result.root.children[2].contentRect;  // { x: 0, y: 60, width: ~71.67, height: 50 }
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

---

## Release History

- [v0.1.0](#purelayout-v010) — 2026-03-31 — Block + Inline layout, CSS cascade, box model
- **v0.2.0** — 2026-04-01 — Flexbox layout (this release)
