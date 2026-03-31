/**
 * 文本测量基础逻辑
 */
import type { TextStyle, TextSegment } from '../types/text.js';

/**
 * 将文本拆分为 segments，标记空白和断点
 * CJK 字符拆分为单个字符 segments 以支持任意位置换行
 */
export function segmentText(text: string, style: TextStyle): TextSegment[] {
  if (text.length === 0) return [];

  const segments: TextSegment[] = [];
  let current = '';
  let isWhitespace = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    const chIsWhitespace = isWhitespaceChar(ch);
    const chIsCJK = isCJK(code);

    if (chIsCJK) {
      // CJK 字符单独成段，支持任意位置换行
      if (current.length > 0) {
        segments.push(createSegment(current, isWhitespace, segments.length));
      }
      segments.push(createSegment(ch, false, segments.length));
      current = '';
      isWhitespace = false;
    } else if (chIsWhitespace !== isWhitespace || current.length === 0) {
      if (current.length > 0) {
        segments.push(createSegment(current, isWhitespace, segments.length));
      }
      current = ch;
      isWhitespace = chIsWhitespace;
    } else {
      current += ch;
    }
  }

  if (current.length > 0) {
    segments.push(createSegment(current, isWhitespace, segments.length));
  }

  return segments;
}

function createSegment(text: string, isWhitespace: boolean, _index: number): TextSegment {
  return {
    text,
    width: 0, // 将由 TextMeasurer 填充
    isWhitespace,
    canBreakBefore: !isWhitespace && isCJK(text.charCodeAt(0)),
    canBreakAfter: !isWhitespace && isCJK(text.charCodeAt(text.length - 1)),
  };
}

function isWhitespaceChar(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isCJK(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff) ||
    (code >= 0xac00 && code <= 0xd7af) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

/**
 * 比例字体字符宽度表（基于 Times New Roman，单位：1em = 1000）
 * 覆盖 ASCII 可打印字符，用于 FallbackMeasurer 的文本宽度估算
 */
const CHAR_WIDTHS: Record<string, number> = {
  ' ': 250, '!': 333, '"': 408, '#': 500, '$': 500, '%': 833, '&': 778, "'": 180,
  '(': 333, ')': 333, '*': 500, '+': 564, ',': 250, '-': 333, '.': 250, '/': 278,
  '0': 500, '1': 500, '2': 500, '3': 500, '4': 500, '5': 500, '6': 500, '7': 500,
  '8': 500, '9': 500, ':': 278, ';': 278, '<': 564, '=': 564, '>': 564, '?': 444,
  '@': 921, 'A': 722, 'B': 667, 'C': 667, 'D': 722, 'E': 611, 'F': 556, 'G': 722,
  'H': 722, 'I': 333, 'J': 389, 'K': 722, 'L': 611, 'M': 889, 'N': 722, 'O': 722,
  'P': 556, 'Q': 722, 'R': 667, 'S': 556, 'T': 611, 'U': 722, 'V': 722, 'W': 944,
  'X': 722, 'Y': 722, 'Z': 611, '[': 333, '\\': 278, ']': 333, '^': 469, '_': 500,
  '`': 333, 'a': 444, 'b': 500, 'c': 444, 'd': 500, 'e': 444, 'f': 333, 'g': 500,
  'h': 500, 'i': 278, 'j': 278, 'k': 500, 'l': 278, 'm': 778, 'n': 500, 'o': 500,
  'p': 500, 'q': 500, 'r': 333, 's': 389, 't': 278, 'u': 500, 'v': 500, 'w': 722,
  'x': 500, 'y': 500, 'z': 444, '{': 480, '|': 200, '}': 480, '~': 541,
  '\t': 500, '\n': 0,
};

/** 默认的 Latin 字符宽度（未在表中找到时使用） */
const DEFAULT_LATIN_WIDTH = 500;
/** CJK 字符宽度（浏览器默认 serif 字体中 CJK 约 0.667em） */
const CJK_WIDTH = 667;

/**
 * 获取单个字符的宽度（单位：1/1000 em）
 */
function getCharWidth(code: number): number {
  if (isCJK(code)) return CJK_WIDTH;
  const ch = String.fromCharCode(code);
  return CHAR_WIDTHS[ch] ?? DEFAULT_LATIN_WIDTH;
}

/**
 * 基于比例字体字符宽度表的文本宽度估算
 */
export function estimateTextWidth(text: string, style: TextStyle): number {
  let width = 0;
  for (const ch of text) {
    width += getCharWidth(ch.charCodeAt(0));
  }
  // 将 1/1000 em 单位转换为实际 px
  const emToPx = style.fontSize / 1000;
  return width * emToPx + style.letterSpacing * text.length;
}

/**
 * 默认的字体度量估算
 */
export function estimateFontMetrics(style: TextStyle): {
  ascent: number;
  descent: number;
  lineHeight: number;
  emHeight: number;
  gap: number;
} {
  const emHeight = style.fontSize;
  // 浏览器默认 line-height: normal ≈ 1.125em (对 16px 字体约为 18px)
  const lineHeight = emHeight * 1.125;
  const ascent = lineHeight * 0.8;  // ~14.4px for 16px
  const descent = lineHeight * 0.2; // ~3.6px for 16px
  const gap = 0;

  return { ascent, descent, lineHeight, emHeight, gap };
}
