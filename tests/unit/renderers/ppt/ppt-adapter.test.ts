import { describe, it, expect } from 'vitest';
import { layout, px, FallbackMeasurer } from '../../../../src/index.js';
import { PPTAdapter } from '../../../../src/renderers/ppt/adapter.js';

const measurer = new FallbackMeasurer();

describe('PPTAdapter: 基础映射 (TDD)', () => {
  it('应该将单位从 px 转换为 PPT Inches', () => {
    const adapter = new PPTAdapter();
    // 假设 96dpi, 96px = 1 inch
    expect(adapter.pxToInches(96)).toBe(1);
    expect(adapter.pxToInches(48)).toBe(0.5);
  });

  it('应该将简单的 div 映射为 PPT Rect', () => {
    const tree = {
      tagName: 'div',
      style: { 
        width: px(96), 
        height: px(96), 
        backgroundColor: { type: 'color', value: '#FF0000' } 
      } as any,
      children: [],
    };

    const result = layout(tree, { containerWidth: 960, textMeasurer: measurer });
    const adapter = new PPTAdapter();
    const slide = adapter.convert(result);

    expect(slide.objects.length).toBe(1);
    const rect = slide.objects[0];
    expect(rect.type).toBe('rect');
    expect(rect.w).toBe(1); // 96px -> 1 inch
    expect(rect.fill).toBe('#FF0000');
  });

  it('应该映射文本框并转换字号 (px -> pt)', () => {
    const tree = {
      tagName: 'div',
      style: { width: px(200) } as any,
      children: ['Hello'],
    };

    const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
    const adapter = new PPTAdapter();
    const slide = adapter.convert(result);

    const textObj = slide.objects.find(o => o.type === 'text');
    expect(textObj).toBeDefined();
    expect(textObj?.text?.content).toBe('Hello');
    // 16px * 0.75 = 12pt
    expect(textObj?.text?.fontSize).toBe(12);
  });
});
