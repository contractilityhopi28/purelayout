/**
 * Flexbox 布局内部类型
 */
import type { LayoutNode } from '../../types/layout.js';

/** Flex item 在算法中的中间状态 */
export interface FlexItemState {
  node: LayoutNode;
  order: number;

  // 弹性因子
  flexGrow: number;
  flexShrink: number;
  flexBasis: number; // 解析后的 flex-basis (px), -1 表示 auto

  // 尺寸约束 (px)
  minMainSize: number;
  maxMainSize: number;
  minCrossSize: number;
  maxCrossSize: number;

  // padding + border 在主轴/交叉轴方向的总和
  mainPaddingBorder: number;
  crossPaddingBorder: number;

  // margin
  mainMarginStart: number;
  mainMarginEnd: number;
  crossMarginStart: number;
  crossMarginEnd: number;
  mainAutoMarginStart: boolean;
  mainAutoMarginEnd: boolean;

  // 算法中间值
  flexBaseSize: number;
  hypotheticalMainSize: number;
  outerHypotheticalMainSize: number;
  targetMainSize: number;
  mainSize: number;  // 最终主轴尺寸 (content box)
  crossSize: number; // 最终交叉轴尺寸 (content box)
  frozen: boolean;

  // 位置（相对于容器 content area）
  mainPos: number;
  crossPos: number;
}

/** Flex line */
export interface FlexLine {
  items: FlexItemState[];
  crossSize: number;
  baseline: number;
}

/** Flex 容器计算上下文 */
export interface FlexContext {
  node: LayoutNode;
  isRow: boolean;
  isReverse: boolean;
  isWrap: boolean;
  isWrapReverse: boolean;
  containerMainSize: number;
  containerCrossSize: number;
  gapMain: number;
  gapCross: number;
  lines: FlexLine[];
  contentOriginX: number;
  contentOriginY: number;
}
