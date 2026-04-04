/**
 * Flex base size 和 hypothetical main size 计算
 */
import type { FlexItemState, FlexContext } from './types.js';
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import { resolveLength } from '../../css/cascade.js';
import { layoutBlockFormattingContext } from '../block/block-formatting.js';

/**
 * 确定所有 flex items 的 flex base size 和 hypothetical main size
 *
 * 规范 Section 9
 */
export function resolveFlexBaseSizes(items: FlexItemState[], ctx: FlexContext, options: LayoutOptions): void {
  for (const item of items) {
    // 1. 确定 flex base size
    if (item.flexBasis >= 0) {
      // flex-basis 是 definite
      item.flexBaseSize = item.flexBasis;
    } else {
      // flex-basis: auto → 使用主轴方向的 width/height
      const mainSizeDef = getMainSizeDefinite(item.node, ctx.isRow, ctx.containerMainSize, item.mainPaddingBorder);
      if (mainSizeDef >= 0) {
        item.flexBaseSize = mainSizeDef;
      } else {
        // 无 definite main size → 使用内容尺寸
        item.flexBaseSize = measureItemContentSize(item.node, ctx, options);
      }
    }

    // 2. clamp 到 min-main-size
    item.flexBaseSize = Math.max(item.flexBaseSize, item.minMainSize);
    // 不 clamp 到 max（hypothetical 才 clamp 到 max）

    // 3. hypothetical main size = max(flex-base, min-main), clamped to max-main
    item.hypotheticalMainSize = Math.max(item.flexBaseSize, item.minMainSize);
    if (item.maxMainSize < Infinity) {
      item.hypotheticalMainSize = Math.min(item.hypotheticalMainSize, item.maxMainSize);
    }

    // 4. outer hypothetical main size
    item.outerHypotheticalMainSize = item.hypotheticalMainSize + item.mainPaddingBorder
      + (item.mainAutoMarginStart ? 0 : item.mainMarginStart)
      + (item.mainAutoMarginEnd ? 0 : item.mainMarginEnd);

    // 5. 初始 target = flex base size
    item.targetMainSize = item.flexBaseSize;
  }
}

function getMainSizeDefinite(node: LayoutNode, isRow: boolean, containerMainSize: number, mainPaddingBorder: number): number {
  const bm = node.computedStyle.boxModel;
  const sizeValue = isRow ? bm.width : bm.height;

  let value = -1;
  if (sizeValue.type === 'length') value = sizeValue.value;
  else if (sizeValue.type === 'percentage') value = (sizeValue.value / 100) * containerMainSize;
  else return -1;

  // box-sizing: border-box → 从 width 中减去 padding + border
  if (bm.boxSizing === 'border-box') {
    value = Math.max(0, value - mainPaddingBorder);
  }

  return value;
}

/**
 * 测量 flex item 的内容尺寸（用于 auto flex-basis）
 */
function measureItemContentSize(node: LayoutNode, ctx: FlexContext, options: LayoutOptions): number {
  const containerWidth = ctx.isRow ? ctx.containerMainSize : ctx.containerCrossSize;

  // 递归布局内部内容以获取 content size
  const childContainingBlock = { width: containerWidth, height: undefined };

  // 临时设置一个较大的宽度让内容自然排列
  node.contentRect.width = containerWidth;
  layoutBlockFormattingContext(node, childContainingBlock, options);

  // 返回主轴方向的 content size
  if (ctx.isRow) {
    // 对于 row，内容宽度由 width 决定（可能还是 auto），取子元素的最大宽度
    if (node.children.length === 0) return 0;
    let maxEnd = 0;
    for (const child of node.children) {
      const end = child.contentRect.x + child.contentRect.width + child.boxModel.marginLeft + child.boxModel.marginRight;
      if (end > maxEnd) maxEnd = end;
    }
    return Math.max(0, maxEnd);
  } else {
    // column: content height = 累计子元素高度
    return node.contentRect.height || 0;
  }
}
