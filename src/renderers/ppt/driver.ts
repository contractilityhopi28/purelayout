/**
 * PptxGenJS 驱动实现
 * 
 * 将 PPTSlide 模型转换为真实的 .pptx 文件
 */
import type { PPTSlide } from './types.js';

export async function exportToPptx(slideData: PPTSlide, outputPath: string) {
  // 动态导入，避免强制依赖
  let PptxGenJS;
  try {
    const module = await import('pptxgenjs');
    PptxGenJS = module.default;
  } catch (err) {
    throw new Error('Please install "pptxgenjs" to use the PPT renderer: npm install pptxgenjs');
  }

  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();

  for (const obj of slideData.objects) {
    if (obj.type === 'rect') {
      slide.addShape(pptx.ShapeType.rect, {
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        fill: { color: obj.fill?.replace('#', '') || 'FFFFFF' },
      });
    } else if (obj.type === 'text' && obj.text) {
      slide.addText(obj.text.content, {
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        fontSize: obj.text.fontSize,
        color: obj.text.color.replace('#', ''),
        bold: obj.text.bold,
        align: obj.text.align,
        valign: 'middle',
        wrap: false, // 禁用自动换行，严格遵循 PureLayout 宽度
      });
    }
  }

  await pptx.writeFile({ fileName: outputPath });
}
