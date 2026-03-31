import { describe, it, expect } from 'vitest';
import { layout, px, getBoundingClientRect, FallbackMeasurer } from '../../../../src/index.js';
import type { StyleNode } from '../../../../src/types/style.js';

const measurer = new FallbackMeasurer();

function div(style: Record<string, unknown>, children: (StyleNode | string)[] = []): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

describe('Flex: 基础布局', () => {
  it('display: flex 创建 flex 容器', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(200) }, [
      div({ width: px(100), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.contentRect.width).toBe(400);
    expect(result.root.type).toBe('flex');
  });

  it('flex-direction: row 子元素水平排列', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(100) }, [
      div({ width: px(100), height: px(50) }),
      div({ width: px(200), height: px(60) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    expect(c[0].contentRect.x).toBe(0);
    expect(c[1].contentRect.x).toBe(100);
    expect(c[0].contentRect.y).toBe(0);
    expect(c[1].contentRect.y).toBe(0);
  });

  it('flex-direction: column 子元素垂直排列', () => {
    const tree = div({ display: 'flex', flexDirection: 'column', width: px(400), height: px(200) }, [
      div({ width: px(100), height: px(50) }),
      div({ width: px(200), height: px(60) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    expect(c[0].contentRect.x).toBe(0);
    expect(c[1].contentRect.x).toBe(0);
    expect(c[0].contentRect.y).toBe(0);
    expect(c[1].contentRect.y).toBe(50);
  });

  it('flex-direction: row-reverse 水平反转', () => {
    const tree = div({ display: 'flex', flexDirection: 'row-reverse', width: px(400), height: px(100) }, [
      div({ width: px(100), height: px(50) }),
      div({ width: px(200), height: px(60) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    // row-reverse: main-start 在右侧，item[0] 先放右侧
    expect(c[0].contentRect.x).toBe(300); // 400 - 100
    expect(c[1].contentRect.x).toBe(100); // 300 - 200
  });

  it('flex-direction: column-reverse 垂直反转', () => {
    const tree = div({ display: 'flex', flexDirection: 'column-reverse', width: px(400), height: px(200) }, [
      div({ width: px(100), height: px(50) }),
      div({ width: px(200), height: px(60) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const c = result.root.children;
    // column-reverse: main-start 在底部，容器 height=200
    // item[0](h=50) 反转: 200 - 0 - 50 = 150
    // item[1](h=60) 反转: 200 - 50 - 60 = 90
    expect(c[0].contentRect.y).toBe(150);
    expect(c[1].contentRect.y).toBe(90);
  });

  it('flex 容器 auto width 占满包含块', () => {
    const tree = div({ display: 'flex' }, [
      div({ width: px(100), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.contentRect.width).toBe(800);
  });

  it('flex 容器 auto height = 内容高度 (row)', () => {
    const tree = div({ display: 'flex', width: px(400) }, [
      div({ width: px(100), height: px(50) }),
      div({ width: px(100), height: px(60) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.contentRect.height).toBe(60);
  });

  it('flex 容器 auto height = 内容高度 (column)', () => {
    const tree = div({ display: 'flex', flexDirection: 'column', width: px(400) }, [
      div({ width: px(100), height: px(50) }),
      div({ width: px(100), height: px(60) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.contentRect.height).toBe(110);
  });

  it('flex 容器固定 height', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(200) }, [
      div({ width: px(100), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.contentRect.height).toBe(200);
  });

  it('空的 flex 容器', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(200) });
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.children.length).toBe(0);
    expect(result.root.contentRect.height).toBe(200);
  });

  it('单个 flex item', () => {
    const tree = div({ display: 'flex', width: px(400), height: px(100) }, [
      div({ width: px(200), height: px(50) }),
    ]);
    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    expect(result.root.children[0].contentRect.width).toBe(200);
  });
});
