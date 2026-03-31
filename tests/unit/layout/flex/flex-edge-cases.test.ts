import { describe, it, expect } from 'vitest';
import { layout, px, getBoundingClientRect, FallbackMeasurer } from '../../../../src/index.js';
import type { StyleNode } from '../../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('Flex: 嵌套 flex 容器', () => {
  it('嵌套 flex 容器', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(200) }, [
      div({ display: 'flex', width: px(200), height: px(100) }, [
        div({ width: px(80), height: px(40) }),
        div({ width: px(80), height: px(40) }),
      ]),
      div({ width: px(100), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const outer = result.root.children;
    expect(outer[0].type).toBe('flex');
    expect(outer[0].contentRect.width).toBe(200);
    expect(outer[1].contentRect.x).toBe(200);
  });

  it('flex item 内部包含 block 子元素', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(200) }, [
      div({ width: px(200), height: px(100) }, [
        div({ width: px(100), height: px(30) }),
        div({ width: px(150), height: px(20) }),
      ]),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const item = result.root.children[0];
    expect(item.children[0].contentRect.y).toBe(0);
    expect(item.children[1].contentRect.y).toBe(30);
  });
});

describe('Flex: padding 和 border', () => {
  it('flex 容器 padding 不影响 items 位置计算', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(100), padding: px(20) }, [
      div({ width: px(100), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children[0];
    // item 应该在 padding 内部
    expect(c.contentRect.x).toBeGreaterThanOrEqual(20);
  });

  it('flex item 有 padding', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(100) }, [
      div({ width: px(100), height: px(50), padding: px(10) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const item = result.root.children[0];
    const rect = getBoundingClientRect(item);
    // border box = content + padding
    expect(rect.width).toBe(120); // 100 + 10*2
  });

  it('flex item 有 border', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(100) }, [
      div({ width: px(100), height: px(50), borderTopWidth: px(5) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const item = result.root.children[0];
    const rect = getBoundingClientRect(item);
    // borderTopWidth 只影响高度方向
    expect(rect.width).toBe(100);
    expect(rect.height).toBe(55); // 50 + 5 border
  });
});

describe('Flex: min/max 约束', () => {
  it('min-width 限制 flex-grow 缩小', () => {
    const tree = div({ display: 'flex', width: px(100) }, [
      div({ minWidth: px(80), height: px(50), flexGrow: 1 }),
      div({ minWidth: px(80), height: px(50), flexGrow: 1 }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    // 两个 item 各至少 80px，总共 160 > 100 → 不缩小
    expect(c[0].contentRect.width).toBe(80);
    expect(c[1].contentRect.width).toBe(80);
  });

  it('max-width 限制 flex-grow 放大', () => {
    const tree = div({ display: 'flex', width: px(400) }, [
      div({ maxWidth: px(100), height: px(50), flexGrow: 1 }),
      div({ maxWidth: px(100), height: px(50), flexGrow: 1 }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    expect(c[0].contentRect.width).toBe(100);
    expect(c[1].contentRect.width).toBe(100);
  });
});

describe('Flex: box-sizing', () => {
  it('box-sizing: border-box 在 flex item 中', () => {
    const tree = div({ display: 'flex', width: px(400) }, [
      div({ width: px(200), boxSizing: 'border-box', padding: px(10), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    // width 200 包含 padding → content width = 180
    const c = result.root.children[0];
    expect(c.contentRect.width).toBe(180);
  });
});

describe('Flex: 混合场景', () => {
  it('固定宽度 + flex-grow 混合', () => {
    const tree = div({ display: 'flex', width: px(400) }, [
      div({ width: px(100), height: px(50) }),
      div({ flexGrow: 1, height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    expect(c[0].contentRect.width).toBe(100);
    expect(c[1].contentRect.width).toBe(300);
  });

  it('flex 容器在 block 容器中', () => {
    const tree = div({ width: px(800) }, [
      div({ display: 'flex', width: px(400), height: px(100) }, [
        div({ width: px(200), height: px(50) }),
      ]),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const flexContainer = result.root.children[0];
    expect(flexContainer.type).toBe('flex');
    expect(flexContainer.contentRect.width).toBe(400);
  });

  it('flex 容器有固定 height + align-content: center', () => {
    const tree = div({ display: 'flex', flexWrap: 'wrap', alignContent: 'center', width: px(150), height: px(200) }, [
      div({ width: px(100), height: px(30) }),
      div({ width: px(100), height: px(40) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    // 100+100=200>150 → 换行，两行总高 30+40=70, 容器高 200, 偏移 (200-70)/2 = 65
    expect(result.root.children[0].contentRect.y).toBe(65);
  });
});
