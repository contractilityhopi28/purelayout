/**
 * 软换行算法
 */
import type { TextSegment } from '../../types/text.js';
import type { TextStyle } from '../../types/text.js';
import type { LayoutOptions } from '../../types/layout.js';

/**
 * 查找文本片段中的换行断点
 * 返回 segment 索引数组，表示可以在该 segment 之后断行
 */
export function findBreakOpportunities(
  segments: TextSegment[],
  _style: TextStyle,
  _options: LayoutOptions,
): number[] {
  const opportunities: number[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    // 空白 segment 后面可以断行（词间换行）
    if (seg.isWhitespace && i < segments.length - 1) {
      opportunities.push(i);
      continue;
    }

    // CJK 字符 segment 可以在内部断行
    if (!seg.isWhitespace && hasCJKChar(seg.text)) {
      opportunities.push(i);
    }
  }

  return opportunities;
}

/**
 * 检查文本是否包含 CJK 字符
 */
function hasCJKChar(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (isCJKChar(text.charCodeAt(i))) return true;
  }
  return false;
}

function isCJKChar(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

/**
 * 在指定位置拆分片段列表
 */
export function splitAtBreak(
  segments: TextSegment[],
  breakIndex: number,
): { before: TextSegment[]; after: TextSegment[] } {
  return {
    before: segments.slice(0, breakIndex + 1),
    after: segments.slice(breakIndex + 1),
  };
}
