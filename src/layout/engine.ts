/**
 * 布局引擎主入口
 */
import type { StyleNode, ComputedStyle } from '../types/style.js';
import type { LayoutNode, LayoutTree, LayoutOptions } from '../types/layout.js';
import type { ComputedBoxModel, BoundingClientRect } from '../types/box.js';
import { computeStyle, resolveLength } from '../css/cascade.js';
import { resolveWidth, resolveHorizontalMargins } from './resolver/width-resolver.js';
import { resolveHeight } from './resolver/height-resolver.js';
import { determineContainingBlock } from './containing-block.js';
import { layoutBlockFormattingContext } from './block/block-formatting.js';
import { layoutFlexFormattingContext } from './flex/flex-formatting.js';
import { establishesBFC } from './block/bfc.js';
import { canCollapseParentChildMarginTop } from './block/margin-collapse.js';
import { resolveLength } from '../css/cascade.js';

let globalSourceIndex = 0;

function assignSourceIndex(): number {
  return globalSourceIndex++;
}

/**
 * 执行布局计算
 */
export function layout(root: StyleNode, options: LayoutOptions): LayoutTree {
  globalSourceIndex = 0;

  const rootLayout = buildLayoutTree(root, null, options);

  // 执行实际布局计算
  const containingBlock = {
    width: options.containerWidth,
    height: options.containerHeight,
  };
  // 先设置根节点的初始 contentRect 位置
  // 根节点的 border box 从 (0,0) 开始（假设无 margin）
  // 所以 content area 从 (borderLeft + paddingLeft, borderTop + paddingTop) 开始
  rootLayout.contentRect.x = 0;
  rootLayout.contentRect.y = 0;

  // 根据节点类型分发布局
  if (rootLayout.type === 'flex') {
    layoutFlexFormattingContext(rootLayout, containingBlock, options);
  } else {
    layoutBlockFormattingContext(rootLayout, containingBlock, options);
  }

  // layoutBlockFormattingContext 不会修改自身的 contentRect.x/y
  // 需要在之后设置正确的位置
  rootLayout.contentRect.x = rootLayout.boxModel.borderLeft + rootLayout.boxModel.paddingLeft;
  rootLayout.contentRect.y = rootLayout.boxModel.borderTop + rootLayout.boxModel.paddingTop;

  // 处理 parent-child margin-top collapse（仅对根节点）
  // 如果第一个 block 子元素的 margin-top 穿过根节点折叠，
  // 需要调整根节点的 contentRect.y（border box 位置下移）
  if (rootLayout.computedStyle && canCollapseParentChildMarginTop(rootLayout.computedStyle.boxModel)) {
    const firstBlockChild = rootLayout.children.find(c => c.type === 'block');
    if (firstBlockChild && firstBlockChild.computedStyle) {
      const childMarginTop = resolveLength(firstBlockChild.computedStyle.boxModel.marginTop);
      if (childMarginTop > 0) {
        // 根节点的 border box 从 collapsed margin 开始
        rootLayout.contentRect.y += childMarginTop;
        // 从 content height 中减去折叠的 margin
        rootLayout.contentRect.height -= childMarginTop;
      }
    }
  }

  return { root: rootLayout, options };
}

/**
 * 递归构建布局树
 */
function buildLayoutTree(
  node: StyleNode,
  parentComputed: ComputedStyle | null,
  options: LayoutOptions,
): LayoutNode {
  const computedStyle = computeStyle(node, parentComputed, options.rootFontSize);
  const sourceIndex = assignSourceIndex();
  const display = computedStyle.boxModel.display;
  const isFlex = display === 'flex';
  const isBlock = display === 'block' || display === 'inline-block' || isFlex;

  const layoutNode: LayoutNode = {
    sourceIndex,
    type: isFlex ? 'flex' : (isBlock ? 'block' : 'inline'),
    tagName: node.tagName,
    testId: (node.style as Record<string, unknown>)['dataTestId'] as string | undefined,
    computedStyle,
    contentRect: { x: 0, y: 0, width: 0, height: 0 },
    boxModel: createEmptyBoxModel(),
    establishesBFC: establishesBFC(computedStyle),
    children: [],
  };

  // 递归构建子节点
  for (const child of node.children) {
    if (typeof child === 'string') {
      // 文本节点
      layoutNode.children.push({
        sourceIndex: assignSourceIndex(),
        type: 'text',
        tagName: '#text',
        computedStyle,
        contentRect: { x: 0, y: 0, width: 0, height: 0 },
        boxModel: createEmptyBoxModel(),
        establishesBFC: false,
        children: [],
        textContent: child,
      });
    } else {
      layoutNode.children.push(buildLayoutTree(child, computedStyle, options));
    }
  }

  return layoutNode;
}

function createEmptyBoxModel(): ComputedBoxModel {
  return {
    marginTop: 0, marginRight: 0, marginBottom: 0, marginLeft: 0,
    paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
    borderTop: 0, borderRight: 0, borderBottom: 0, borderLeft: 0,
  };
}

/**
 * 获取类似 DOM 的 getBoundingClientRect() 输出 (border box, 不含 margin)
 */
export function getBoundingClientRect(node: LayoutNode): BoundingClientRect {
  const { contentRect, boxModel } = node;
  const x = contentRect.x - boxModel.paddingLeft - boxModel.borderLeft;
  const y = contentRect.y - boxModel.paddingTop - boxModel.borderTop;
  const width = contentRect.width + boxModel.paddingLeft + boxModel.paddingRight
    + boxModel.borderLeft + boxModel.borderRight;
  const height = contentRect.height + boxModel.paddingTop + boxModel.paddingBottom
    + boxModel.borderTop + boxModel.borderBottom;

  return { x, y, width, height, top: y, right: x + width, bottom: y + height, left: x };
}

/**
 * 按源索引查找节点
 */
export function findNodeBySourceIndex(root: LayoutNode, sourceIndex: number): LayoutNode | null {
  if (root.sourceIndex === sourceIndex) return root;
  for (const child of root.children) {
    const found = findNodeBySourceIndex(child, sourceIndex);
    if (found) return found;
  }
  return null;
}
