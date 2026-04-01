/**
 * Margin Collapse 算法
 */

/**
 * 计算两个相邻 margin 的折叠值
 *
 * - 正值取 max
 * - 负值取 min（绝对值更大的）
 * - 一正一负相加
 */
export function collapseMargins(a: number, b: number): number {
  if (a >= 0 && b >= 0) return Math.max(a, b);
  if (a < 0 && b < 0) return Math.min(a, b);
  return a + b;
}

/**
 * 检查父子 margin-top 是否可以折叠
 *
 * 不折叠条件：
 * - 父元素有 border-top
 * - 父元素有 padding-top
 * - 父元素不是 block display
 */
export function canCollapseParentChildMarginTop(
  parentBoxModel: Record<string, unknown>,
): boolean {
  // 父元素有 border-top 阻止折叠
  if (
    parentBoxModel.borderTopWidth.type === 'length' &&
    (parentBoxModel.borderTopWidth.value ?? 0) > 0
  ) {
    return false;
  }
  // 父元素有 padding-top 阻止折叠
  const pt = parentBoxModel.paddingTop;
  if (typeof pt === 'number' ? pt > 0 :
    pt.type === 'length' && (pt.value ?? 0) > 0) {
    return false;
  }
  return true;
}

/**
 * 检查父子 margin-bottom 是否可以折叠
 */
export function canCollapseParentChildMarginBottom(
  parentBoxModel: {
    borderBottomWidth: { type: string; value?: number; unit?: string };
    paddingBottom: { type: string; value?: number; unit?: string } | number;
    display?: string;
  },
): boolean {
  if (
    parentBoxModel.borderBottomWidth.type === 'length' &&
    (parentBoxModel.borderBottomWidth.value ?? 0) > 0
  ) {
    return false;
  }
  const pb = parentBoxModel.paddingBottom;
  if (typeof pb === 'number' ? pb > 0 :
    pb.type === 'length' && (pb.value ?? 0) > 0) {
    return false;
  }
  return true;
}
