/**
 * Block Formatting Context 布局
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ContainingBlock } from '../containing-block.js';
import { resolveWidth, resolveHorizontalMargins } from '../resolver/width-resolver.js';
import { resolveHeight } from '../resolver/height-resolver.js';
import { collapseMargins } from './margin-collapse.js';
import { resolveLength } from '../../css/cascade.js';
import { isBlockLevel } from './block-level.js';
import { layoutInlineRun } from '../inline/inline-formatting.js';
import { layoutFlexFormattingContext } from '../flex/flex-formatting.js';
import { processWhitespace } from '../inline/whitespace.js';

/**
 * 布局一个 BFC
 */
export function layoutBlockFormattingContext(
  node: LayoutNode,
  containingBlock: ContainingBlock,
  options: LayoutOptions,
): void {
  // 1. 解析宽度
  const { width, paddingLeft, paddingRight, borderLeft, borderRight } =
    resolveWidth(node.computedStyle, containingBlock.width);

  const { marginLeft, marginRight } = resolveHorizontalMargins(
    node.computedStyle,
    containingBlock.width,
    width,
    paddingLeft,
    paddingRight,
    borderLeft,
    borderRight,
  );

  const marginTop = resolveLength(node.computedStyle.boxModel.marginTop);
  const marginBottom = resolveLength(node.computedStyle.boxModel.marginBottom);
  const borderTop = resolveLength(node.computedStyle.boxModel.borderTopWidth);
  const borderBottom = resolveLength(node.computedStyle.boxModel.borderBottomWidth);
  const paddingTop = resolveLength(node.computedStyle.boxModel.paddingTop, containingBlock.width);
  const paddingBottom = resolveLength(node.computedStyle.boxModel.paddingBottom, containingBlock.width);

  // 设置 boxModel
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

  // content width
  node.contentRect.width = width;

  // 2. 布局子元素
  const innerWidth = width; // content box width
  // 内容区域的绝对 Y 起始位置（相对于容器）
  const contentOriginX = node.contentRect.x + paddingLeft + borderLeft;
  const contentOriginY = node.contentRect.y + paddingTop + borderTop;
  let currentY = contentOriginY;
  let pendingMarginTop = 0;
  let hasPrecedingContent = false;
  const childContainingBlock: ContainingBlock = { width: innerWidth, height: undefined };

  // 收集内联和块级子元素
  let inlineRun: LayoutNode[] = [];

  // 获取 white-space 模式
  const whiteSpace = node.computedStyle?.inherited?.whiteSpace ?? 'normal';
  const preserveWhitespace = whiteSpace === 'pre' || whiteSpace === 'pre-wrap';

  for (const child of node.children) {
    if (child.type === 'text' && child.textContent?.trim() === '' && !preserveWhitespace) {
      // 空白文本节点，跳过（pre 模式下保留空白）
      continue;
    }

    if (isBlockLevel(child)) {
      // 先处理累积的 inline run
      if (inlineRun.length > 0) {
        const inlineResult = layoutInlineRun(inlineRun, innerWidth, currentY, options, contentOriginX);
        currentY += inlineResult.totalHeight;
        inlineRun = [];
        hasPrecedingContent = true;
      }

      // Block-level child
      const childMarginTop = child.computedStyle ? resolveLength(child.computedStyle.boxModel.marginTop) : 0;

      // Margin collapse: always collapse with pending margin
      pendingMarginTop = collapseMargins(pendingMarginTop, childMarginTop);

      // 递归布局（会计算 child.boxModel.marginLeft，包括 auto margin 居中）
      if (child.type === 'flex') {
        layoutFlexFormattingContext(child, childContainingBlock, options);
      } else {
        layoutBlockFormattingContext(child, childContainingBlock, options);
      }

      // 检查是否是"自折叠"元素（无内容、无 padding、无 border、无 inline 内容）
      const isSelfCollapsing = child.contentRect.height === 0
        && child.boxModel.paddingTop === 0 && child.boxModel.paddingBottom === 0
        && child.boxModel.borderTop === 0 && child.boxModel.borderBottom === 0
        && child.children.filter(c => c.type !== 'text' || (c.textContent?.trim() !== '')).length === 0;

      // 设置子元素位置（绝对坐标）
      child.contentRect.x = contentOriginX + child.boxModel.marginLeft
        + child.boxModel.borderLeft + child.boxModel.paddingLeft;
      child.contentRect.y = currentY + pendingMarginTop
        + child.boxModel.borderTop + child.boxModel.paddingTop;

      if (isSelfCollapsing) {
        // 空元素：margin-top 和 margin-bottom 折叠合并，元素不占空间
        pendingMarginTop = collapseMargins(pendingMarginTop, child.boxModel.marginBottom);
        // 不推进 currentY，不设置 hasPrecedingContent
      } else {
        // 推进 Y（下一个子元素的位置 = 当前子元素的 border-box 底部）
        currentY = child.contentRect.y + child.contentRect.height
          + child.boxModel.paddingBottom + child.boxModel.borderBottom;

        pendingMarginTop = child.boxModel.marginBottom;
        hasPrecedingContent = true;
      }
    } else {
      // Inline-level or text: 收集到 inline run
      inlineRun.push(child);
    }
  }

  // 处理最后的 inline run
  if (inlineRun.length > 0) {
    const inlineResult = layoutInlineRun(inlineRun, innerWidth, currentY, options, contentOriginX);
    currentY += inlineResult.totalHeight;
  }

  // 3. 解析高度
  const contentHeight = currentY - contentOriginY;
  const { height } =
    resolveHeight(node.computedStyle, containingBlock.height, contentHeight);

  node.contentRect.height = height;
}
