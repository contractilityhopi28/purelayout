/**
 * 差分测试辅助函数
 */
import type { StyleNode } from '../../src/types/style.js';
import { px } from '../../src/index.js';

export function div(
  style: Record<string, unknown> = {},
  children: (StyleNode | string)[] = [],
): StyleNode {
  return { tagName: 'div', style: style as StyleNode['style'], children };
}

export function span(
  style: Record<string, unknown> = {},
  children: (StyleNode | string)[] = [],
): StyleNode {
  return { tagName: 'span', style: style as StyleNode['style'], children };
}

export function p(
  style: Record<string, unknown> = {},
  children: (StyleNode | string)[] = [],
): StyleNode {
  return { tagName: 'p', style: style as StyleNode['style'], children };
}

/**
 * 从 ground truth JSON 文件加载基准数据
 */
export function loadGroundTruth(jsonPath: string): {
  container: { width: number; height?: number };
  elements: Array<{ selector: string; rect: { x: number; y: number; width: number; height: number } }>;
} {
  const fs = require('fs');
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

/**
 * 将 StyleNode 转换为 HTML fixture 字符串
 */
export function styleNodeToHtml(node: StyleNode, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  const styleStr = Object.entries(node.style)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      const cssValue = formatCssValue(value);
      return `${cssKey}: ${cssValue}`;
    })
    .join('; ');

  const styleAttr = styleStr ? ` style="${styleStr}"` : '';

  if (typeof node === 'string') {
    return node;
  }

  const tag = node.tagName;
  const children = node.children.map(c => {
    if (typeof c === 'string') return c;
    return styleNodeToHtml(c, indent + 1);
  }).join('\n');

  return `${pad}<${tag}${styleAttr}>${children}</${tag}>`;
}

function formatCssValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const v = value as { type: string; value?: number; unit?: string };
    if (v.type === 'length') return `${v.value}px`;
    if (v.type === 'percentage') return `${v.value}%`;
    if (v.type === 'keyword') return v.value ?? '';
    if (v.type === 'em') return `${v.value}em`;
    if (v.type === 'rem') return `${v.value}rem`;
    if (v.type === 'color') return v.value ?? '';
  }
  return String(value);
}

export { px };
