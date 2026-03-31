/**
 * Inline Formatting Context 布局
 */
import type { LayoutNode, LayoutOptions } from '../../types/layout.js';
import type { ComputedStyle } from '../../types/style.js';
import type { TextStyle } from '../../types/text.js';
import type { WhiteSpaceValue } from '../../types/style.js';
import { resolveLength } from '../../css/cascade.js';
import { buildLineBoxes } from './line-box.js';
import { processWhitespace } from './whitespace.js';

export interface InlineRunResult {
  totalHeight: number;
}

/**
 * 布局一段连续的 inline 内容
 */
export function layoutInlineRun(
  nodes: LayoutNode[],
  availableWidth: number,
  startY: number,
  options: LayoutOptions,
  startX: number = 0,
): InlineRunResult {
  // 获取 white-space 模式
  const whiteSpace = getWhiteSpace(nodes);

  // 收集所有内联片段
  const fragments: Array<{
    text: string;
    style: TextStyle;
    sourceIndex: number;
  }> = [];

  const isPreMode = whiteSpace === 'pre' || whiteSpace === 'pre-wrap';

  for (const node of nodes) {
    if (node.type === 'text' && node.textContent) {
      const style = extractTextStyle(node.computedStyle);
      const processedText = processWhitespace(node.textContent, whiteSpace);
      if (processedText.length > 0) {
        if (isPreMode && processedText.includes('\n')) {
          // pre 模式下，按 \n 拆分为多个片段（每个片段对应一行）
          const lines = processedText.split('\n');
          for (let li = 0; li < lines.length; li++) {
            if (li > 0) {
              // 插入换行标记（空文本作为行分隔符）
              fragments.push({
                text: '',
                style,
                sourceIndex: -1, // 特殊标记：换行
              });
            }
            if (lines[li].length > 0) {
              fragments.push({
                text: lines[li],
                style,
                sourceIndex: node.sourceIndex,
              });
            }
          }
        } else {
          fragments.push({
            text: processedText,
            style,
            sourceIndex: node.sourceIndex,
          });
        }
      }
    } else if (node.type === 'inline') {
      // inline 元素：收集其文本子节点
      for (const child of node.children) {
        if (child.type === 'text' && child.textContent) {
          const style = extractTextStyle(child.computedStyle);
          const processedText = processWhitespace(child.textContent, whiteSpace);
          if (processedText.length > 0) {
            fragments.push({
              text: processedText,
              style,
              sourceIndex: child.sourceIndex,
            });
          }
        }
      }
    }
  }

  if (fragments.length === 0) {
    return { totalHeight: 0 };
  }

  // 构建行框
  const lineBoxes = buildLineBoxes(fragments, availableWidth, options, whiteSpace);

  // 计算总高度
  let totalHeight = 0;
  for (const lb of lineBoxes) {
    lb.y = startY + totalHeight;
    // 设置每个 fragment 的绝对 x 位置
    for (const frag of lb.fragments) {
      frag.x += startX;
    }
    totalHeight += lb.height;
  }

  // 计算所有行框的最大宽度
  let maxWidth = 0;
  for (const lb of lineBoxes) {
    maxWidth = Math.max(maxWidth, lb.width);
  }

  // 将 line boxes 关联到第一个节点
  if (nodes.length > 0) {
    const firstNode = nodes[0];
    firstNode.lineBoxes = lineBoxes;
    firstNode.contentRect.x = startX;
    firstNode.contentRect.y = startY;
    firstNode.contentRect.height = totalHeight;
    firstNode.contentRect.width = maxWidth;
  }

  // 设置每个 inline 元素节点的 contentRect
  for (const node of nodes) {
    if (node.type === 'inline') {
      // 计算该 inline 元素包含的片段的 x/y/width
      let nodeMinX = Infinity;
      let nodeMinY = Infinity;
      let nodeMaxY = -Infinity;
      let nodeWidth = 0;
      let foundFirstFragment = false;

      for (const lb of lineBoxes) {
        for (const frag of lb.fragments) {
          // 检查这个 fragment 是否属于该节点或其子节点
          let belongsToNode = false;
          if (frag.nodeIndex === node.sourceIndex) {
            belongsToNode = true;
          } else {
            // 检查是否是子节点
            const checkChild = (n: LayoutNode) => {
              if (n.sourceIndex === frag.nodeIndex) { belongsToNode = true; return true; }
              for (const c of n.children) { if (checkChild(c)) return true; }
              return false;
            };
            checkChild(node);
          }
          if (belongsToNode) {
            const fragAbsX = lb.y !== undefined ? frag.x : frag.x; // relative x within line
            if (!foundFirstFragment) {
              nodeMinX = frag.x;
              nodeMinY = lb.y;
              foundFirstFragment = true;
            }
            nodeMinX = Math.min(nodeMinX, frag.x);
            nodeMinY = Math.min(nodeMinY, lb.y);
            nodeMaxY = Math.max(nodeMaxY, lb.y + lb.height);
            nodeWidth = Math.max(nodeWidth, frag.x + frag.width);
          }
        }
      }

      if (foundFirstFragment) {
        // contentRect 使用绝对坐标
        node.contentRect.x = startX + nodeMinX;
        node.contentRect.y = nodeMinY;
        node.contentRect.height = nodeMaxY - nodeMinY;
        node.contentRect.width = nodeWidth - nodeMinX;
      } else {
        node.contentRect.x = startX;
        node.contentRect.y = startY;
        node.contentRect.height = totalHeight;
        node.contentRect.width = maxWidth;
      }
    }
  }

  return { totalHeight };
}

function getWhiteSpace(nodes: LayoutNode[]): WhiteSpaceValue {
  // 从内联元素或其父级获取 white-space
  for (const node of nodes) {
    if (node.type === 'inline' && node.computedStyle) {
      return node.computedStyle.inherited.whiteSpace as WhiteSpaceValue;
    }
  }
  // 从文本节点的 computedStyle 获取
  for (const node of nodes) {
    if (node.computedStyle) {
      return node.computedStyle.inherited.whiteSpace as WhiteSpaceValue;
    }
  }
  return 'normal';
}

function extractTextStyle(computedStyle: ComputedStyle | undefined): TextStyle {
  if (!computedStyle) {
    return {
      fontFamily: 'serif',
      fontSize: 16,
      fontWeight: 400,
      fontStyle: 'normal',
      letterSpacing: 0,
      wordSpacing: 0,
    };
  }
  return {
    fontFamily: computedStyle.inherited.fontFamily,
    fontSize: resolveLength(computedStyle.inherited.fontSize),
    fontWeight: computedStyle.inherited.fontWeight,
    fontStyle: computedStyle.inherited.fontStyle as 'normal' | 'italic',
    letterSpacing: resolveLength(computedStyle.inherited.letterSpacing),
    wordSpacing: resolveLength(computedStyle.inherited.wordSpacing),
  };
}
