/**
 * PureLayout PPT 导出演示
 * 
 * 展示如何将基于 Grid 和 Flex 的布局导出为可编辑的 PPT 文件
 */
import { layout, px, FallbackMeasurer, PPTAdapter } from '../dist/index.js';
import fs from 'fs';

// 1. 定义一个类似 PPT 页面的布局 (16:9, 960x540)
const tree = {
  tagName: 'div',
  style: {
    width: px(960),
    height: px(540),
    backgroundColor: { type: 'color', value: '#F8FAFC' },
    display: 'grid',
    gridTemplateRows: '80px 1fr 40px',
    padding: px(40),
    gap: px(20),
  },
  children: [
    // 标题区
    {
      tagName: 'div',
      style: { borderBottomWidth: px(2), paddingBottom: px(10) },
      children: [
        {
          tagName: 'span',
          style: { fontSize: px(36), fontWeight: 700, color: { type: 'color', value: '#1E293B' } },
          children: ['PureLayout 季度数据分析报告']
        }
      ]
    },
    // 内容区 (2列网格)
    {
      tagName: 'div',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: px(30),
      },
      children: [
        // 左侧统计卡片
        {
          tagName: 'div',
          style: {
            backgroundColor: { type: 'color', value: '#FFFFFF' },
            padding: px(24),
            borderRadius: px(12),
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          },
          children: [
            { tagName: 'div', style: { fontSize: px(14), color: { type: 'color', value: '#64748B' } }, children: ['总营收'] },
            { tagName: 'div', style: { fontSize: px(48), fontWeight: 700, color: { type: 'color', value: '#6366F1' } }, children: ['$124,563'] },
            { tagName: 'div', style: { fontSize: px(14), color: { type: 'color', value: '#10B981' }, marginTop: px(10) }, children: ['▲ +12.5% 环比增长'] },
          ]
        },
        // 右侧列表
        {
          tagName: 'div',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: px(15),
          },
          children: [
            { tagName: 'div', style: { fontSize: px(18), fontWeight: 600 }, children: ['核心业务亮点'] },
            { tagName: 'div', style: { fontSize: px(14) }, children: ['• 布局引擎保真度达到 100%'] },
            { tagName: 'div', style: { fontSize: px(14) }, children: ['• Grid 布局 MVP 版本正式发布'] },
            { tagName: 'div', style: { fontSize: px(14) }, children: ['• PPT 渲染适配器原型打通'] },
          ]
        }
      ]
    },
    // 页脚
    {
      tagName: 'div',
      style: { textAlign: 'center', color: { type: 'color', value: '#94A3B8' }, fontSize: px(12) },
      children: ['© 2026 PureLayout Rendering Pipeline · 内部机密']
    }
  ]
};

// 2. 执行布局
console.log('正在计算布局...');
const result = layout(tree, {
  containerWidth: 960,
  containerHeight: 540,
  textMeasurer: new FallbackMeasurer(),
});

// 3. 转换为 PPT 模型
console.log('正在转换为 PPT 模型...');
const adapter = new PPTAdapter();
const slideData = adapter.convert(result);

// 4. 尝试导出 (需要安装 pptxgenjs)
const outPath = 'demo-dashboard.pptx';
console.log(`准备导出到: ${outPath}`);

// 动态导出逻辑
async function runExport() {
  try {
    const { exportToPptx } = await import('../dist/index.js');
    await exportToPptx(slideData, outPath);
    console.log('✅ PPT 导出成功！');
  } catch (err) {
    console.warn('❌ 导出失败:', err.message);
    console.log('\n请手动运行以下命令安装依赖后再尝试:');
    console.log('npm install pptxgenjs\n');
    
    // 如果没有库，我们至少输出 JSON 模型供审视
    fs.writeFileSync('ppt-model.json', JSON.stringify(slideData, null, 2));
    console.log('已生成中间模型文件: ppt-model.json');
  }
}

runExport();
