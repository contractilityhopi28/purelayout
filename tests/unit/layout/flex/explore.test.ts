import { describe, it, expect } from 'vitest';
import { layout, px, auto, FallbackMeasurer } from '../../../../src/index.js';
import type { StyleNode } from '../../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('explore gap', () => {
  it('gap shorthand with row', () => {
    const tree = div(
      { display: 'flex', width: px(400), gap: px(10) },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('gap=10 c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });

  it('rowGap with row direction', () => {
    const tree = div(
      { display: 'flex', width: px(400), rowGap: px(15) },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('rowGap=15 c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });

  it('columnGap with row direction', () => {
    const tree = div(
      { display: 'flex', width: px(400), columnGap: px(20) },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('columnGap=20 c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });
});

describe('explore padding on flex items', () => {
  it('padding on flex item row', () => {
    const tree = div(
      { display: 'flex', width: px(400) },
      [
        div({ width: px(100), height: px(50), paddingLeft: px(10), paddingTop: px(5) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    console.log('padded item contentRect:', JSON.stringify(c1.contentRect));
    console.log('padded item boxModel:', JSON.stringify(c1.boxModel));
  });

  it('padding on flex container', () => {
    const tree = div(
      { display: 'flex', width: px(400), paddingTop: px(10), paddingLeft: px(20) },
      [
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const root = result.root;
    const c1 = root.children[0];
    console.log('padded container root contentRect:', JSON.stringify(root.contentRect));
    console.log('padded container root boxModel:', JSON.stringify(root.boxModel));
    console.log('padded container c1 contentRect:', JSON.stringify(c1.contentRect));
  });
});

describe('explore flex-grow', () => {
  it('two items equal grow', () => {
    const tree = div(
      { display: 'flex', width: px(400) },
      [
        div({ width: px(100), height: px(50), flexGrow: 1 }),
        div({ width: px(100), height: px(50), flexGrow: 1 }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('grow1 c1 w:', c1.contentRect.width, 'c1 x:', c1.contentRect.x);
    console.log('grow1 c2 w:', c2.contentRect.width, 'c2 x:', c2.contentRect.x);
  });

  it('basis 0 + grow', () => {
    const tree = div(
      { display: 'flex', width: px(300) },
      [
        div({ height: px(50), flexBasis: px(0), flexGrow: 1 }),
        div({ height: px(50), flexBasis: px(0), flexGrow: 2 }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('basis0 c1 w:', c1.contentRect.width, 'c2 w:', c2.contentRect.width);
  });
});

describe('explore shrink', () => {
  it('shrink equal', () => {
    const tree = div(
      { display: 'flex', width: px(200) },
      [
        div({ width: px(200), height: px(50), flexShrink: 1 }),
        div({ width: px(200), height: px(50), flexShrink: 1 }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('shrink c1 w:', c1.contentRect.width, 'c2 w:', c2.contentRect.width);
  });
});

describe('explore justify-content', () => {
  it('center', () => {
    const tree = div(
      { display: 'flex', width: px(400), justifyContent: 'center' },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('center c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });

  it('flex-end', () => {
    const tree = div(
      { display: 'flex', width: px(400), justifyContent: 'flex-end' },
      [
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    console.log('flex-end c1 x:', c1.contentRect.x);
  });

  it('space-between', () => {
    const tree = div(
      { display: 'flex', width: px(400), justifyContent: 'space-between' },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('space-between c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });

  it('space-around', () => {
    const tree = div(
      { display: 'flex', width: px(400), justifyContent: 'space-around' },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('space-around c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });

  it('space-evenly', () => {
    const tree = div(
      { display: 'flex', width: px(400), justifyContent: 'space-evenly' },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('space-evenly c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
  });
});

describe('explore align-items', () => {
  it('stretch', () => {
    const tree = div(
      { display: 'flex', width: px(400), height: px(100), alignItems: 'stretch' },
      [
        div({ width: px(100) }),
        div({ width: px(100) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('stretch c1 h:', c1.contentRect.height, 'c2 h:', c2.contentRect.height);
  });

  it('flex-end align', () => {
    const tree = div(
      { display: 'flex', width: px(400), height: px(100), alignItems: 'flex-end' },
      [
        div({ width: px(100), height: px(30) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    console.log('align-end c1 y:', c1.contentRect.y, 'c1 h:', c1.contentRect.height);
  });

  it('center align', () => {
    const tree = div(
      { display: 'flex', width: px(400), height: px(100), alignItems: 'center' },
      [
        div({ width: px(100), height: px(30) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    console.log('align-center c1 y:', c1.contentRect.y, 'c1 h:', c1.contentRect.height);
  });
});

describe('explore wrap', () => {
  it('wrap', () => {
    const tree = div(
      { display: 'flex', width: px(200), flexWrap: 'wrap' },
      [
        div({ width: px(150), height: px(50) }),
        div({ width: px(150), height: px(50) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('wrap c1:', JSON.stringify(c1.contentRect));
    console.log('wrap c2:', JSON.stringify(c2.contentRect));
  });
});

describe('explore order', () => {
  it('order reorder', () => {
    const tree = div(
      { display: 'flex', width: px(400) },
      [
        div({ width: px(100), height: px(50), order: 2 }),
        div({ width: px(100), height: px(60), order: 1 }),
        div({ width: px(100), height: px(70), order: 3 }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    for (let i = 0; i < 3; i++) {
      const c = result.root.children[i];
      console.log('order c' + i + ':', JSON.stringify(c.contentRect));
    }
  });
});

describe('explore margin auto', () => {
  it('margin auto', () => {
    const tree = div(
      { display: 'flex', width: px(400) },
      [
        div({ width: px(100), height: px(50), marginLeft: auto, marginRight: auto }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    console.log('auto-margin c1 x:', c1.contentRect.x, 'marginLeft:', c1.boxModel.marginLeft, 'marginRight:', c1.boxModel.marginRight);
  });
});

describe('explore align-self', () => {
  it('align-self flex-end', () => {
    const tree = div(
      { display: 'flex', width: px(400), height: px(100), alignItems: 'flex-start' },
      [
        div({ width: px(100), height: px(30) }),
        div({ width: px(100), height: px(40), alignSelf: 'flex-end' }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('align-self c1 y:', c1.contentRect.y, 'c2 y:', c2.contentRect.y);
  });
});

describe('explore row-reverse', () => {
  it('row-reverse', () => {
    const tree = div(
      { display: 'flex', width: px(400), flexDirection: 'row-reverse' },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(200), height: px(60) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('row-reverse c1 x:', c1.contentRect.x, 'c2 x:', c2.contentRect.x);
    console.log('row-reverse c1 w:', c1.contentRect.width, 'c2 w:', c2.contentRect.width);
  });
});

describe('explore column', () => {
  it('column direction', () => {
    const tree = div(
      { display: 'flex', width: px(400), flexDirection: 'column' },
      [
        div({ width: px(100), height: px(50) }),
        div({ width: px(100), height: px(60) }),
      ]
    );
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c1 = result.root.children[0];
    const c2 = result.root.children[1];
    console.log('column c1:', JSON.stringify(c1.contentRect));
    console.log('column c2:', JSON.stringify(c2.contentRect));
    console.log('column root h:', result.root.contentRect.height);
  });
});
