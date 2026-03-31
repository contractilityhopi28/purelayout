/**
 * Flex Formatting Context (FFC) 布局
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ContainingBlock } from '../containing-block.js';
import type { FlexContext, FlexLine, FlexItemState } from './types.js';
import type { AlignItemsValue } from '../../types/style.js';
import { resolveWidth, resolveHorizontalMargins } from '../resolver/width-resolver.js';
import { resolveHeight } from '../resolver/height-resolver.js';
import { resolveLength } from '../../css/cascade.js';
import { collectFlexItems, sortFlexItemsByOrder } from './flex-item.js';
import { resolveFlexBaseSizes } from './flex-size.js';
import { resolveFlexibleLengths } from './flex-algorithm.js';
import { collectFlexLines } from './flex-wrap.js';
import { layoutBlockFormattingContext } from '../block/block-formatting.js';

/**
 * 布局一个 Flex Formatting Context
 */
export function layoutFlexFormattingContext(
  node: LayoutNode,
  containingBlock: ContainingBlock,
  options: LayoutOptions,
): void {
  const style = node.computedStyle;
  const flex = style.flex;

  // 1. 解析容器尺寸
  const { width, paddingLeft, paddingRight, borderLeft, borderRight } =
    resolveWidth(style, containingBlock.width);

  const { marginLeft, marginRight } = resolveHorizontalMargins(
    style, containingBlock.width, width,
    paddingLeft, paddingRight, borderLeft, borderRight,
  );

  const marginTop = resolveLength(style.boxModel.marginTop);
  const marginBottom = resolveLength(style.boxModel.marginBottom);
  const borderTop = resolveLength(style.boxModel.borderTopWidth);
  const borderBottom = resolveLength(style.boxModel.borderBottomWidth);
  const paddingTop = resolveLength(style.boxModel.paddingTop, containingBlock.width);
  const paddingBottom = resolveLength(style.boxModel.paddingBottom, containingBlock.width);

  node.boxModel.marginTop = marginTop;
  node.boxModel.marginRight = marginRight;
  node.boxModel.marginBottom = marginBottom;
  node.boxModel.marginLeft = marginLeft;
  node.boxModel.paddingTop = paddingTop;
  node.boxModel.paddingRight = paddingRight;
  node.boxModel.paddingBottom = paddingBottom;
  node.boxModel.paddingLeft = paddingLeft;
  node.boxModel.borderTop = borderTop;
  node.boxModel.borderRight = borderRight;
  node.boxModel.borderBottom = borderBottom;
  node.boxModel.borderLeft = borderLeft;
  node.contentRect.width = width;

  // 2. 确定轴方向
  const isRow = flex.flexDirection === 'row' || flex.flexDirection === 'row-reverse';
  const isReverse = flex.flexDirection === 'row-reverse' || flex.flexDirection === 'column-reverse';
  const isWrap = flex.flexWrap === 'wrap' || flex.flexWrap === 'wrap-reverse';
  const isWrapReverse = flex.flexWrap === 'wrap-reverse';

  // 主轴/交叉轴尺寸
  // row: main=width, cross=height; column: main=height, cross=width
  const heightValue = style.boxModel.height;
  const hasDefiniteHeight = heightValue.type === 'length';
  const definiteHeight = hasDefiniteHeight ? heightValue.value : 0;

  const containerMainSize = isRow ? width : (hasDefiniteHeight ? definiteHeight : Infinity);
  const containerCrossSize = isRow ? definiteHeight : width;
  const gapMain = resolveGap(flex, isRow, true);
  const gapCross = resolveGap(flex, isRow, false);

  // 3. 构建 context
  const contentOriginX = node.contentRect.x + paddingLeft + borderLeft;
  const contentOriginY = node.contentRect.y + paddingTop + borderTop;

  const ctx: FlexContext = {
    node, isRow, isReverse, isWrap, isWrapReverse,
    containerMainSize, containerCrossSize,
    gapMain, gapCross, lines: [],
    contentOriginX, contentOriginY,
  };

  // 4. 收集 flex items
  const items = collectFlexItems(node, ctx);
  sortFlexItemsByOrder(items);

  // 5. 计算 flex base sizes
  resolveFlexBaseSizes(items, ctx);

  // 6. 拆行并布局
  let lines: FlexLine[];
  if (isWrap) {
    lines = collectFlexLines(items, containerMainSize, gapMain);
  } else {
    lines = [{ items, crossSize: 0, baseline: 0 }];
  }

  // 7. 对每行执行弹性算法 + justify-content + 交叉轴对齐
  const isSingleLine = lines.length === 1;
  for (const line of lines) {
    resolveFlexibleLengths(line.items, containerMainSize, gapMain);
    applyJustifyContent(line, containerMainSize, gapMain, flex.justifyContent);

    // 单行 + 容器有 definite cross size 时，line cross size = container cross size
    // 以便 align-items 在容器空间内对齐
    if (isSingleLine && containerCrossSize > 0) {
      resolveCrossAxisForLine(line, flex.alignItems, isRow, containerCrossSize, true);
    } else {
      resolveCrossAxisForLine(line, flex.alignItems, isRow, containerCrossSize, false);
    }
  }

  // 8. align-content 对齐行
  applyAlignContent(lines, ctx, flex.alignContent, flex.alignItems);

  // wrap-reverse: 不再反转行数组，改为在 applyAbsolutePositions 中从底部开始
  ctx.lines = lines;

  // 9. 递归布局 flex item 内部内容
  for (const item of items) {
    layoutFlexItemContent(item, ctx, options);
  }

  // 重新计算 cross axis（内容布局后 cross size 可能变化）
  // 注意：不要覆盖 align-content: stretch 设置的行高
  if (!isWrap || flex.alignContent !== 'stretch') {
    for (const line of lines) {
      let maxCrossSize = 0;
      for (const item of line.items) {
        const outer = item.crossSize + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
        if (outer > maxCrossSize) maxCrossSize = outer;
      }
      line.crossSize = maxCrossSize;
    }
  }

  // 10. 计算容器高度
  // 对于 row: height 由 cross 方向决定（行累计高度）
  // 对于 column: height 由 main 方向决定（items 累计高度 + gap）
  let contentHeightForResolver: number;
  if (isRow) {
    let totalCrossSize = 0;
    for (const line of lines) {
      totalCrossSize += line.crossSize;
    }
    totalCrossSize += Math.max(0, lines.length - 1) * gapCross;
    contentHeightForResolver = totalCrossSize;
  } else {
    // column: height = sum of items main sizes + gaps
    let totalMainSize = 0;
    for (let i = 0; i < items.length; i++) {
      totalMainSize += items[i].mainSize + items[i].mainPaddingBorder
        + items[i].mainMarginStart + items[i].mainMarginEnd;
    }
    totalMainSize += Math.max(0, items.length - 1) * gapMain;
    contentHeightForResolver = totalMainSize;
  }

  const { height } = resolveHeight(style, containingBlock.height, contentHeightForResolver);
  node.contentRect.height = height;

  // 11. 设置绝对坐标
  applyAbsolutePositions(ctx);

  // 12. 按 order 重排 node.children，使 result.root.children 顺序与视觉一致
  const orderedChildren = items.map(item => item.node);
  node.children = orderedChildren;
}

// ===== Gap 解析 =====
// CSS spec: column-gap 控制主轴方向间距，row-gap 控制交叉轴方向间距
function resolveGap(flex: any, isRow: boolean, isMainAxis: boolean): number {
  const gapValue = isMainAxis
    ? (isRow ? flex.columnGap : flex.rowGap)
    : (isRow ? flex.rowGap : flex.columnGap);

  if (!gapValue) return 0;
  if (gapValue.type === 'keyword' && gapValue.value === 'normal') return 0;
  return resolveLength(gapValue);
}

// ===== 主轴对齐 (justify-content) =====

function applyJustifyContent(
  line: FlexLine,
  containerMainSize: number,
  gapMain: number,
  justifyContent: string,
): void {
  const items = line.items;
  if (items.length === 0) return;

  const totalGap = Math.max(0, items.length - 1) * gapMain;
  let itemsSize = 0;
  for (const item of items) {
    itemsSize += item.mainSize + item.mainPaddingBorder + item.mainMarginStart + item.mainMarginEnd;
  }
  const freeSpace = containerMainSize - itemsSize - totalGap;

  switch (justifyContent) {
    case 'flex-start':
      positionFromStart(items, gapMain, 0);
      break;
    case 'flex-end':
      positionFromStart(items, gapMain, freeSpace);
      break;
    case 'center':
      positionFromStart(items, gapMain, freeSpace / 2);
      break;
    case 'space-between':
      positionSpaceBetween(items, gapMain, freeSpace);
      break;
    case 'space-around': {
      const sp = items.length > 0 ? freeSpace / items.length : 0;
      positionWithSpacing(items, sp, sp / 2);
      break;
    }
    case 'space-evenly': {
      const sp = items.length > 0 ? freeSpace / (items.length + 1) : 0;
      positionWithSpacing(items, sp, sp);
      break;
    }
  }
}

function positionFromStart(items: FlexItemState[], gap: number, offset: number): void {
  let pos = offset;
  for (const item of items) {
    item.mainPos = pos + item.mainMarginStart;
    pos += item.mainSize + item.mainPaddingBorder + item.mainMarginStart + item.mainMarginEnd + gap;
  }
}

function positionSpaceBetween(items: FlexItemState[], gap: number, freeSpace: number): void {
  if (items.length <= 1) { positionFromStart(items, gap, 0); return; }
  const spacing = freeSpace / (items.length - 1) + gap;
  let pos = 0;
  for (const item of items) {
    item.mainPos = pos + item.mainMarginStart;
    pos += item.mainSize + item.mainPaddingBorder + item.mainMarginStart + item.mainMarginEnd + spacing;
  }
}

function positionWithSpacing(items: FlexItemState[], spacing: number, edge: number): void {
  let pos = edge;
  for (const item of items) {
    item.mainPos = pos + item.mainMarginStart;
    pos += item.mainSize + item.mainPaddingBorder + item.mainMarginStart + item.mainMarginEnd + spacing;
  }
}

// ===== 交叉轴对齐 (align-items / align-self) =====

function resolveCrossAxisForLine(
  line: FlexLine,
  alignItems: AlignItemsValue,
  isRow: boolean,
  containerCrossSize: number,
  isSingleLine: boolean,
): void {
  // 行的 cross size = max of items outer cross sizes
  let maxCrossSize = 0;
  for (const item of line.items) {
    const cs = getItemDefiniteCrossSize(item, isRow);
    item.crossSize = cs;
    const outer = cs + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
    if (outer > maxCrossSize) maxCrossSize = outer;
  }
  line.crossSize = maxCrossSize;

  // 单行 + definite container cross size → line cross size = container cross size
  if (isSingleLine && containerCrossSize > 0 && containerCrossSize > maxCrossSize) {
    maxCrossSize = containerCrossSize;
    line.crossSize = maxCrossSize;
  }

  // 对齐每个 item
  for (const item of line.items) {
    const align = getEffectiveAlign(item, alignItems);
    const outer = item.crossSize + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
    const extra = maxCrossSize - outer;

    switch (align) {
      case 'flex-start':
        item.crossPos = item.crossMarginStart;
        break;
      case 'flex-end':
        item.crossPos = item.crossMarginStart + extra;
        break;
      case 'center':
        item.crossPos = item.crossMarginStart + extra / 2;
        break;
      case 'stretch': {
        item.crossPos = item.crossMarginStart;
        // 只拉伸 cross size 为 auto 的 item（无 definite cross size）
        if (hasDefiniteCrossSize(item, isRow)) break;
        const available = maxCrossSize - item.crossPaddingBorder - item.crossMarginStart - item.crossMarginEnd;
        if (available > item.crossSize) {
          item.crossSize = available;
        }
        break;
      }
      case 'baseline':
        item.crossPos = item.crossMarginStart;
        break;
    }
  }
}

function getEffectiveAlign(item: FlexItemState, containerAlign: AlignItemsValue): AlignItemsValue {
  const self = item.node.computedStyle.flex.alignSelf;
  if (self !== 'auto') return self;
  return containerAlign;
}

function getItemDefiniteCrossSize(item: FlexItemState, isRow: boolean): number {
  const bm = item.node.computedStyle.boxModel;
  const sizeValue = isRow ? bm.height : bm.width;

  let value = 0;
  if (sizeValue.type === 'length') value = sizeValue.value;
  else if (sizeValue.type === 'percentage') value = (sizeValue.value / 100) * 400;
  else return 0;

  // box-sizing: border-box → 减去 cross 方向的 padding + border
  if (bm.boxSizing === 'border-box') {
    value = Math.max(0, value - item.crossPaddingBorder);
  }

  return value;
}

function hasDefiniteCrossSize(item: FlexItemState, isRow: boolean): boolean {
  const bm = item.node.computedStyle.boxModel;
  const sizeValue = isRow ? bm.height : bm.width;
  return sizeValue.type === 'length' || sizeValue.type === 'percentage';
}

// ===== align-content =====

function applyAlignContent(
  lines: FlexLine[],
  ctx: FlexContext,
  alignContent: string,
  alignItems: AlignItemsValue,
): void {
  if (lines.length <= 1) return;

  let totalCrossSize = 0;
  for (const line of lines) {
    totalCrossSize += line.crossSize;
  }
  totalCrossSize += Math.max(0, lines.length - 1) * ctx.gapCross;

  // 使用容器的 cross size 来计算 freeSpace
  // 对于 row: cross = height, 对于 column: cross = width
  // 注意：容器没有 definite cross size 时（值为0），align-content 不生效
  const containerCrossSize = ctx.containerCrossSize;
  const freeSpace = containerCrossSize - totalCrossSize;

  switch (alignContent) {
    case 'flex-start':
      // 默认：不调整
      break;
    case 'flex-end': {
      const offset = Math.max(0, freeSpace);
      for (const line of lines) {
        for (const item of line.items) {
          item.crossPos += offset;
        }
      }
      break;
    }
    case 'center': {
      const offset = Math.max(0, freeSpace) / 2;
      for (const line of lines) {
        for (const item of line.items) {
          item.crossPos += offset;
        }
      }
      break;
    }
    case 'space-between':
      if (freeSpace > 0 && lines.length > 1) {
        const spacing = freeSpace / (lines.length - 1);
        let offset = 0;
        for (const line of lines) {
          for (const item of line.items) {
            item.crossPos += offset;
          }
          offset += line.crossSize + ctx.gapCross + spacing;
        }
      }
      break;
    case 'space-around':
      if (freeSpace > 0 && lines.length > 0) {
        const spacing = freeSpace / lines.length;
        let offset = spacing / 2;
        for (const line of lines) {
          for (const item of line.items) {
            item.crossPos += offset;
          }
          offset += line.crossSize + ctx.gapCross + spacing;
        }
      }
      break;
    case 'stretch':
      if (freeSpace > 0 && lines.length > 0) {
        const extraPerLine = freeSpace / lines.length;
        for (const line of lines) {
          line.crossSize += extraPerLine;
          // 重新对齐 items（stretch 后行高变了）
          for (const item of line.items) {
            const align = getEffectiveAlign(item, alignItems);
            const outer = item.crossSize + item.crossPaddingBorder + item.crossMarginStart + item.crossMarginEnd;
            const extra = line.crossSize - outer;
            if (align === 'stretch' && !hasDefiniteCrossSize(item, ctx.isRow)) {
              const available = line.crossSize - item.crossPaddingBorder - item.crossMarginStart - item.crossMarginEnd;
              item.crossSize = available;
              item.crossPos = item.crossMarginStart;
            } else {
              // 重新计算位置
              switch (align) {
                case 'flex-start':
                  item.crossPos = item.crossMarginStart;
                  break;
                case 'flex-end':
                  item.crossPos = item.crossMarginStart + extra;
                  break;
                case 'center':
                  item.crossPos = item.crossMarginStart + extra / 2;
                  break;
                default:
                  item.crossPos = item.crossMarginStart;
              }
            }
          }
        }
      }
      break;
  }
}

// ===== 递归布局 flex item 内部内容 =====

function layoutFlexItemContent(item: FlexItemState, ctx: FlexContext, options: LayoutOptions): void {
  const node = item.node;
  if (node.children.length === 0) return;

  const childCB = { width: ctx.isRow ? item.mainSize : item.crossSize, height: ctx.isRow ? item.crossSize : item.mainSize };

  if (node.type === 'flex') {
    layoutFlexFormattingContext(node, childCB, options);
  } else {
    layoutBlockFormattingContext(node, childCB, options);
  }

  // 如果 cross 方向没有 definite size，使用布局后的内容尺寸
  if (item.crossSize === 0 && node.contentRect.height > 0) {
    item.crossSize = ctx.isRow ? node.contentRect.height : node.contentRect.width;
  }
}

// ===== 绝对坐标设置 =====

function applyAbsolutePositions(ctx: FlexContext): void {
  const { isRow, isReverse, isWrapReverse, lines, gapCross, contentOriginX, contentOriginY, containerCrossSize } = ctx;

  // 计算总 cross size
  let totalCrossSize = 0;
  for (const line of lines) {
    totalCrossSize += line.crossSize;
  }
  totalCrossSize += Math.max(0, lines.length - 1) * gapCross;

  // wrap-reverse: 交叉轴方向反转，行从容器底部向上堆叠
  // 如果容器有 definite cross size，从容器底部开始；否则从内容底部开始
  let crossOffset: number;
  if (isWrapReverse) {
    const base = containerCrossSize > 0 ? containerCrossSize : totalCrossSize;
    crossOffset = base;
  } else {
    crossOffset = 0;
  }

  for (const line of lines) {
    for (const item of line.items) {
      let mainPos = item.mainPos;
      let crossPos: number;

      if (isWrapReverse) {
        crossOffset -= line.crossSize;
        crossPos = crossOffset + item.crossPos;
      } else {
        crossPos = crossOffset + item.crossPos;
      }

      if (isReverse) {
        mainPos = ctx.containerMainSize - mainPos - item.mainSize - item.mainPaddingBorder;
      }

      // 计算 item 的 padding 和 border（用于 contentRect 偏移）
      const bm = item.node.computedStyle.boxModel;

      if (isRow) {
        const padLeft = resolveLength(bm.paddingLeft);
        const padTop = resolveLength(bm.paddingTop);
        const borderLeft = resolveLength(bm.borderLeftWidth);
        const borderTop = resolveLength(bm.borderTopWidth);

        item.node.contentRect.x = contentOriginX + mainPos + padLeft + borderLeft;
        item.node.contentRect.y = contentOriginY + crossPos + padTop + borderTop;
        item.node.contentRect.width = item.mainSize;
        item.node.contentRect.height = item.crossSize;

        item.node.boxModel.paddingLeft = padLeft;
        item.node.boxModel.paddingRight = resolveLength(bm.paddingRight);
        item.node.boxModel.paddingTop = padTop;
        item.node.boxModel.paddingBottom = resolveLength(bm.paddingBottom);
        item.node.boxModel.borderLeft = borderLeft;
        item.node.boxModel.borderRight = resolveLength(bm.borderRightWidth);
        item.node.boxModel.borderTop = borderTop;
        item.node.boxModel.borderBottom = resolveLength(bm.borderBottomWidth);
      } else {
        const padLeft = resolveLength(bm.paddingLeft);
        const padTop = resolveLength(bm.paddingTop);
        const borderLeft = resolveLength(bm.borderLeftWidth);
        const borderTop = resolveLength(bm.borderTopWidth);

        item.node.contentRect.x = contentOriginX + crossPos + padLeft + borderLeft;
        item.node.contentRect.y = contentOriginY + mainPos + padTop + borderTop;
        item.node.contentRect.width = item.crossSize;
        item.node.contentRect.height = item.mainSize;

        item.node.boxModel.paddingLeft = padLeft;
        item.node.boxModel.paddingRight = resolveLength(bm.paddingRight);
        item.node.boxModel.paddingTop = padTop;
        item.node.boxModel.paddingBottom = resolveLength(bm.paddingBottom);
        item.node.boxModel.borderLeft = borderLeft;
        item.node.boxModel.borderRight = resolveLength(bm.borderRightWidth);
        item.node.boxModel.borderTop = borderTop;
        item.node.boxModel.borderBottom = resolveLength(bm.borderBottomWidth);
      }

      // margin
      item.node.boxModel.marginLeft = isRow ? item.mainMarginStart : item.crossMarginStart;
      item.node.boxModel.marginRight = isRow ? item.mainMarginEnd : item.crossMarginEnd;
      item.node.boxModel.marginTop = isRow ? item.crossMarginStart : item.mainMarginStart;
      item.node.boxModel.marginBottom = isRow ? item.crossMarginEnd : item.mainMarginEnd;
    }

    if (isWrapReverse) {
      crossOffset -= gapCross;
    } else {
      crossOffset += line.crossSize + gapCross;
    }
  }
}
