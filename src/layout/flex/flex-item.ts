/**
 * Flex item 收集与约束解析
 */
import type { LayoutNode } from '../../types/layout.js';
import type { FlexItemState, FlexContext } from './types.js';
import { resolveLength } from '../../css/cascade.js';

/**
 * 从 flex 容器子节点收集 flex items
 */
export function collectFlexItems(container: LayoutNode, ctx: FlexContext): FlexItemState[] {
  const items: FlexItemState[] = [];

  for (const child of container.children) {
    if (child.type === 'text') {
      // 空文本跳过
      if (!child.textContent || child.textContent.trim() === '') continue;
      // 文本节点作为匿名 flex item（不收集，Phase 2 暂只处理元素节点）
      continue;
    }

    if (child.computedStyle?.boxModel.display === 'none') continue;

    const item = resolveItemConstraints(child, ctx);
    items.push(item);
  }

  return items;
}

/**
 * 按 order 排序（stable sort）
 */
export function sortFlexItemsByOrder(items: FlexItemState[]): void {
  items.sort((a, b) => a.order - b.order);
}

function resolveItemConstraints(node: LayoutNode, ctx: FlexContext): FlexItemState {
  const style = node.computedStyle;
  const flex = style.flex;
  const bm = style.boxModel;

  const isRow = ctx.isRow;

  // 主轴/交叉轴的 margin
  const mainMarginStart = isRow
    ? resolveLength(bm.marginLeft) : resolveLength(bm.marginTop);
  const mainMarginEnd = isRow
    ? resolveLength(bm.marginRight) : resolveLength(bm.marginBottom);
  const crossMarginStart = isRow
    ? resolveLength(bm.marginTop) : resolveLength(bm.marginLeft);
  const crossMarginEnd = isRow
    ? resolveLength(bm.marginBottom) : resolveLength(bm.marginRight);

  const mainAutoMarginStart = isRow
    ? bm.marginLeft.type === 'keyword' : bm.marginTop.type === 'keyword';
  const mainAutoMarginEnd = isRow
    ? bm.marginRight.type === 'keyword' : bm.marginBottom.type === 'keyword';

  // padding + border
  const mainPaddingBorder = isRow
    ? resolveLength(bm.paddingLeft) + resolveLength(bm.paddingRight) +
      resolveLength(bm.borderLeftWidth) + resolveLength(bm.borderRightWidth)
    : resolveLength(bm.paddingTop) + resolveLength(bm.paddingBottom) +
      resolveLength(bm.borderTopWidth) + resolveLength(bm.borderBottomWidth);
  const crossPaddingBorder = isRow
    ? resolveLength(bm.paddingTop) + resolveLength(bm.paddingBottom) +
      resolveLength(bm.borderTopWidth) + resolveLength(bm.borderBottomWidth)
    : resolveLength(bm.paddingLeft) + resolveLength(bm.paddingRight) +
      resolveLength(bm.borderLeftWidth) + resolveLength(bm.borderRightWidth);

  // 主轴尺寸约束
  const minMainSize = isRow
    ? resolveLength(bm.minWidth, ctx.containerMainSize)
    : resolveLength(bm.minHeight, ctx.containerMainSize);
  const maxMainSize = isRow
    ? (bm.maxWidth.type === 'keyword' && bm.maxWidth.value === 'none' ? Infinity : resolveLength(bm.maxWidth, ctx.containerMainSize))
    : (bm.maxHeight.type === 'keyword' && bm.maxHeight.value === 'none' ? Infinity : resolveLength(bm.maxHeight, ctx.containerMainSize));

  // 交叉轴尺寸约束
  const minCrossSize = isRow
    ? resolveLength(bm.minHeight, ctx.containerCrossSize)
    : resolveLength(bm.minWidth, ctx.containerCrossSize);
  const maxCrossSize = isRow
    ? (bm.maxHeight.type === 'keyword' && bm.maxHeight.value === 'none' ? Infinity : resolveLength(bm.maxHeight, ctx.containerCrossSize))
    : (bm.maxWidth.type === 'keyword' && bm.maxWidth.value === 'none' ? Infinity : resolveLength(bm.maxWidth, ctx.containerCrossSize));

  // flex-basis
  let flexBasis = -1; // -1 表示 auto
  const fb = flex.flexBasis;
  if (fb.type === 'length') {
    flexBasis = fb.value;
  } else if (fb.type === 'percentage') {
    flexBasis = (fb.value / 100) * ctx.containerMainSize;
  }
  // keyword 'auto' → -1 (后面用 width/height 替代)

  return {
    node,
    order: flex.order,
    flexGrow: flex.flexGrow,
    flexShrink: flex.flexShrink,
    flexBasis,
    minMainSize,
    maxMainSize,
    minCrossSize,
    maxCrossSize,
    mainPaddingBorder,
    crossPaddingBorder,
    mainMarginStart,
    mainMarginEnd,
    crossMarginStart,
    crossMarginEnd,
    mainAutoMarginStart,
    mainAutoMarginEnd,
    flexBaseSize: 0,
    hypotheticalMainSize: 0,
    outerHypotheticalMainSize: 0,
    targetMainSize: 0,
    mainSize: 0,
    crossSize: 0,
    frozen: false,
    mainPos: 0,
    crossPos: 0,
  };
}
