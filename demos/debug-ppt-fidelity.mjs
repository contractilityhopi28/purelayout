/**
 * PPT 高保真 H5 验证工具
 * 
 * 读取 PPT 适配器的输出并使用 absolute 坐标在浏览器中渲染预览图。
 * 用于验证 Inches/Points 模型的转换准确性。
 */
import { layout, px, FallbackMeasurer, PPTAdapter } from '../dist/index.js';
import fs from 'fs';

// 1. 构建测试场景
const tree = {
  tagName: 'div',
  style: {
    width: px(960), height: px(540),
    backgroundColor: { type: 'color', value: '#F1F5F9' },
    display: 'grid',
    gridTemplateRows: '100px 1fr 60px',
    padding: px(40), gap: px(20),
  },
  children: [
    {
      tagName: 'div',
      style: { backgroundColor: { type: 'color', value: '#FFFFFF' }, borderTopWidth: px(4), padding: px(20) },
      children: [{ tagName: 'span', style: { fontSize: px(32), fontWeight: 700 }, children: ['高保真 PPT 布局验证'] }]
    },
    {
      tagName: 'div',
      style: { display: 'flex', gap: px(40) },
      children: [
        {
          tagName: 'div',
          style: { flex: 1, backgroundColor: { type: 'color', value: '#6366F1' }, padding: px(30) },
          children: [
            { tagName: 'div', style: { color: { type: 'color', value: '#FFFFFF' }, fontSize: px(40), fontWeight: 700 }, children: ['100%'] },
            { tagName: 'div', style: { color: { type: 'color', value: '#E0E7FF' }, fontSize: px(16) }, children: ['保真度达成'] }
          ]
        },
        {
          tagName: 'div',
          style: { flex: 2, display: 'flex', flexDirection: 'column', gap: px(10) },
          children: [
            { tagName: 'div', style: { fontSize: px(20), fontWeight: 600 }, children: ['修复清单:'] },
            { tagName: 'div', style: { fontSize: px(14) }, children: ['• 递归绝对坐标二次偏移 Bug'] },
            { tagName: 'div', style: { fontSize: px(14) }, children: ['• Flexbox 自动高度塌陷问题'] },
            { tagName: 'div', style: { fontSize: px(14) }, children: ['• PPT 文本框宽度缓冲区优化'] }
          ]
        }
      ]
    },
    {
      tagName: 'div',
      style: { textAlign: 'center', fontSize: px(12), color: { type: 'color', value: '#94A3B8' } },
      children: ['基于 PureLayout 布局引擎生成']
    }
  ]
};

// 2. 计算布局与转换
const result = layout(tree, { containerWidth: 960, containerHeight: 540, textMeasurer: new FallbackMeasurer() });
const adapter = new PPTAdapter();
const slide = adapter.convert(result);

// 3. 生成 H5 预览文件
const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PPT Fidelity Debugger</title>
<style>
  body { background: #333; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: -apple-system, sans-serif; }
  .canvas { 
    width: 960px; height: 540px; background: white; position: relative; overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  }
  .obj { position: absolute; box-sizing: border-box; }
  .rect { border: 0px solid transparent; }
  .text { white-space: nowrap; line-height: 1.2; display: flex; align-items: center; }
  .grid-overlay { position: absolute; top:0; left:0; right:0; bottom:0; pointer-events:none; border: 1px solid rgba(255,0,0,0.1); }
</style>
</head>
<body>
<div class="canvas">
  ${slide.objects.map(obj => {
    const left = obj.x * 96;
    const top = obj.y * 96;
    const width = obj.w * 96;
    const height = obj.h * 96;
    
    if (obj.type === 'rect') {
      return `<div class="obj rect" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px; background:${obj.fill || 'transparent'}; border: 1px solid rgba(0,0,0,0.1);"></div>`;
    } else {
      return `<div class="obj text" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px; color:${obj.text.color}; font-size:${obj.text.fontSize}pt; font-weight:${obj.text.bold ? 'bold' : 'normal'}; justify-content:${obj.text.align === 'center' ? 'center' : (obj.text.align === 'right' ? 'flex-end' : 'flex-start')}; border: 1px solid rgba(255,0,0,0.2);">
        ${obj.text.content}
      </div>`;
    }
  }).join('\n')}
</div>
</body>
</html>`;

fs.writeFileSync('debug-ppt-fidelity.html', html);
console.log('✅ H5 验证页面已生成: debug-ppt-fidelity.html');
console.log('请在浏览器中打开此文件，如果显示完美，则 PPT 导出也将完美。');
