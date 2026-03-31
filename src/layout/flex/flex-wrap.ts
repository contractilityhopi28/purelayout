/**
 * Flex wrap 多行拆分
 */
import type { FlexItemState, FlexLine } from './types.js';

/**
 * 将 flex items 拆分为多行（flex-wrap: wrap / wrap-reverse）
 */
export function collectFlexLines(
  items: FlexItemState[],
  containerMainSize: number,
  gapMain: number,
): FlexLine[] {
  if (items.length === 0) return [];

  const lines: FlexLine[] = [];
  let currentLine: FlexItemState[] = [];
  let currentMainSize = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemOuterSize = item.outerHypotheticalMainSize;
    const neededSpace = currentLine.length === 0
      ? itemOuterSize
      : currentMainSize + gapMain + itemOuterSize;

    if (neededSpace > containerMainSize && currentLine.length > 0) {
      // 换行
      lines.push({ items: currentLine, crossSize: 0, baseline: 0 });
      currentLine = [item];
      currentMainSize = itemOuterSize;
    } else {
      currentLine.push(item);
      currentMainSize = neededSpace;
    }
  }

  if (currentLine.length > 0) {
    lines.push({ items: currentLine, crossSize: 0, baseline: 0 });
  }

  return lines;
}
