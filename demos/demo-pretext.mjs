#!/usr/bin/env node
/**
 * PureLayout + Pretext 高保真文本测量演示
 *
 * 展示 Pretext 的精确文本测量能力：
 * - 中英文混排精确换行
 * - CJK 字符边界处理
 * - 字符间距测量
 * - 多行文本精确高度计算
 * - 不同字体样式的精确测量
 * - 文本对齐的精确计算
 */

import { createCanvas } from 'canvas';
import { layout, px, PretextMeasurer, FallbackMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1400;
const TOTAL_H = 1100;
const PAD = 60;
const HEADER_H = 100;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');

// 创建两个测量器进行对比
const pretextMeasurer = new PretextMeasurer();
const fallbackMeasurer = new FallbackMeasurer();

// ============================================================
//  设计系统
// ============================================================
const PAL = {
  bg: '#0d1117',
  card: '#161b22',
  cardBorder: '#30363d',
  text: '#c9d1d9',
  textLight: '#8b949e',
  accent: '#58a6ff',
  accent2: '#238636',
  accent3: '#f0883e',
  diff: '#f85149',
  diffBg: 'rgba(248,81,73,0.1)',
  pretext: '#3fb950',
  fallback: '#f85149',
};

// ============================================================
//  工具函数
// ============================================================
function div(style, children = []) {
  return { tagName: 'div', style, children };
}

function p(text) {
  return { tagName: 'p', style: {}, children: [text] };
}

function span(text) {
  return { tagName: 'span', style: {}, children: [text] };
}

function strong(text) {
  return { tagName: 'strong', style: {}, children: [text] };
}

function em(text) {
  return { tagName: 'em', style: {}, children: [text] };
}

function code(text) {
  return { tagName: 'code', style: {}, children: [text] };
}

function roundRect(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ============================================================
//  绘制函数
// ============================================================
function drawBackground() {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);

  // 网格背景
  ctx.strokeStyle = hexToRgba('#58a6ff', 0.03);
  ctx.lineWidth = 1;
  for (let x = 0; x < TOTAL_W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, TOTAL_H);
    ctx.stroke();
  }
}

function drawHeader() {
  // 标题
  ctx.fillStyle = PAL.text;
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PureLayout + Pretext', PAD, 35);

  // 副标题
  ctx.fillStyle = PAL.textLight;
  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillText('High-Fidelity Text Measurement Comparison', PAD, 65);

  // 状态指示器
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillStyle = PAL.pretext;
  ctx.fillText(`● Pretext: ${pretextMeasurer.isPretextAvailable ? 'Available ✓' : 'Not Available'}`, PAD, 90);
  ctx.fillStyle = PAL.fallback;
  ctx.fillText(`● Canvas: ${pretextMeasurer.isCanvasAvailable ? 'Available ✓' : 'Not Available'}`, PAD + 250, 90);
}

function drawCard(x, y, w, h, title, measurerType) {
  const accentColor = measurerType === 'pretext' ? PAL.pretext : PAL.fallback;

  // 卡片背景
  ctx.fillStyle = PAL.card;
  roundRect(x, y, w, h, 12);
  ctx.fill();

  // 边框
  ctx.strokeStyle = PAL.cardBorder;
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, 12);
  ctx.stroke();

  // 顶部色条
  ctx.fillStyle = accentColor;
  ctx.fillRect(x, y, w, 3);

  // 标题
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), x + 16, y + 20);

  // 测量器标签
  ctx.fillStyle = measurerType === 'pretext' ? PAL.pretext : PAL.fallback;
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(measurerType === 'pretext' ? 'PRETEXT' : 'FALLBACK', x + w - 16, y + 20);

  return { x: x + 16, y: y + 35, w: w - 32 };
}

function renderLayout(layoutRoot, offsetX, offsetY, showMetrics = true) {
  function visit(node, px, py) {
    const cr = node.contentRect;
    const bm = node.boxModel;
    const cs = node.computedStyle;
    const x = px + cr.x - bm.paddingLeft;
    const y = py + cr.y - bm.paddingTop;
    const w = cr.width + bm.paddingLeft + bm.paddingRight;
    const h = cr.height + bm.paddingTop + bm.paddingBottom;

    // 绘制内容区域边界（调试用）
    if (showMetrics) {
      ctx.strokeStyle = hexToRgba('#58a6ff', 0.2);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      roundRect(x + bm.paddingLeft, y + bm.paddingTop, cr.width, cr.height, 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 尺寸标注
      ctx.fillStyle = hexToRgba('#8b949e', 0.6);
      ctx.font = '9px "SF Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(cr.width)}×${Math.round(cr.height)}`, x + bm.paddingLeft, y + bm.paddingTop - 4);
    }

    // 文本
    if (node.lineBoxes && node.lineBoxes.length > 0) {
      ctx.fillStyle = cs.color || '#c9d1d9';
      ctx.font = `${cs.fontStyle || 'normal'} ${cs.fontWeight || 400} ${cs.fontSize || 14}px ${cs.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const cx = x + bm.paddingLeft;
      const cy = y + bm.paddingTop;

      node.lineBoxes.forEach((line, lineIndex) => {
        if (line && line.segments) {
          line.segments.forEach(seg => {
            ctx.fillText(seg.text, cx + seg.x, cy + seg.y + seg.height);

            // 显示段落尺寸
            if (showMetrics && lineIndex === 0 && seg.x < 5) {
              ctx.fillStyle = hexToRxa('#8b949e', 0.5);
              ctx.font = '8px "SF Mono", monospace';
              ctx.fillText(`${Math.round(seg.width)}px`, cx + seg.x, cy + seg.y + seg.height + 12);
              ctx.fillStyle = cs.color || '#c9d1d9';
            }
          });
        }
      });
    }

    // 递归子元素
    if (node.children) {
      node.children.forEach(child => {
        visit(child, px + cr.x - bm.paddingLeft, py + cr.y - bm.paddingTop);
      });
    }
  }

  visit(layoutRoot, offsetX, offsetY);
}

function hexToRxa(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ============================================================
//  场景内容
// ============================================================

// 长文本用于测试换行
const longChineseText = 'PureLayout是一个纯JavaScript/TypeScript CSS布局计算引擎，它将浏览器的CSS Block、Inline和Flexbox布局能力从浏览器中拆解出来，变成了一个独立的TypeScript库。这意味着您可以在服务端渲染、PDF生成、Canvas绘图等任何有JavaScript运行时的环境中精确计算CSS布局。';
const longEnglishText = 'PureLayout is a pure JavaScript/TypeScript CSS layout engine that extracts the CSS Block, Inline, and Flexbox layout capabilities from the browser, making it an independent TypeScript library. This means you can precisely calculate CSS layouts in any JavaScript runtime environment, including server-side rendering, PDF generation, and Canvas drawing.';
const mixedText = 'PureLayout是纯JS/TS CSS布局引擎，extracts CSS layout capabilities from browser。它支持Block布局、Inline布局和Flexbox布局，complete with margin collapse, line wrapping, and text alignment。';

// 场景1: 中文长文本换行
const scene1Tree = div({
  width: px(480),
  lineHeight: 1.8,
  fontSize: 14,
}, [
  p(longChineseText),
]);

// 场景2: 英文长文本换行
const scene2Tree = div({
  width: px(480),
  lineHeight: 1.6,
  fontSize: 14,
}, [
  p(longEnglishText),
]);

// 场景3: 中英混排
const scene3Tree = div({
  width: px(480),
  lineHeight: 1.7,
  fontSize: 14,
}, [
  p(mixedText),
]);

// 场景4: 代码与文本混排
const scene4Tree = div({
  width: px(480),
  lineHeight: 1.6,
  fontSize: 13,
}, [
  p('在代码中使用 PureLayout：'),
  div({
    marginTop: px(12),
    padding: px(12),
    fontSize: 12,
    fontFamily: '"Fira Code", monospace',
    lineHeight: 1.5,
  }, [
    p('import { layout, px } from "purelayout";\nconst tree = {\n  tagName: "div",\n  style: { width: px(400) },\n  children: ["Hello"]\n};'),
  ]),
]);

// 场景5: 多种字体样式
const scene5Tree = div({
  width: px(480),
  lineHeight: 1.6,
  fontSize: 14,
}, [
  p('普通文本，然后是'),
  strong('粗体文本'),
  p('，接着是'),
  em('斜体文本'),
  p('，还有'),
  code('code(代码)'),
  p('文本，测试不同样式的精确测量。'),
]);

// 场景6: 字符间距测试
const scene6Tree = div({
  width: px(480),
  fontSize: 14,
}, [
  div({
    marginBottom: px(16),
    letterSpacing: px(0),
  }, [p('默认字符间距')]),
  div({
    marginBottom: px(16),
    letterSpacing: px(2),
  }, [p('增加字符间距 (letter-spacing: 2px)')]),
  div({
    marginBottom: px(16),
    letterSpacing: px(4),
  }, [p('更大字符间距 (letter-spacing: 4px)')]),
  div({
    letterSpacing: px(-1),
  }, [p('紧凑字符间距 (letter-spacing: -1px)')]),
]);

// ============================================================
//  主渲染流程
// ============================================================

drawBackground();
drawHeader();

// 定义场景：每个场景用两个测量器渲染进行对比
const scenarios = [
  { tree: scene1Tree, title: '中文长文本换行', x: PAD, y: HEADER_H + PAD },
  { tree: scene2Tree, title: '英文长文本换行', x: PAD + 610, y: HEADER_H + PAD },
  { tree: scene3Tree, title: '中英混排换行', x: PAD, y: HEADER_H + PAD + 320 },
  { tree: scene4Tree, title: '代码文本测量', x: PAD + 610, y: HEADER_H + PAD + 320 },
  { tree: scene5Tree, title: '多种字体样式', x: PAD, y: HEADER_H + PAD + 640 },
  { tree: scene6Tree, title: '字符间距测试', x: PAD + 610, y: HEADER_H + PAD + 640 },
];

// 渲染所有场景
scenarios.forEach((scenario, index) => {
  const cardW = 590;
  const cardH = 300;

  // Pretext 版本
  const { x: px1, y: py1, w: pw1 } = drawCard(
    scenario.x, scenario.y, cardW, cardH / 2 - 8,
    scenario.title, 'pretext'
  );

  const result1 = layout(scenario.tree, {
    containerWidth: pw1,
    textMeasurer: pretextMeasurer,
  });
  renderLayout(result1.root, px1, py1, true);

  // Fallback 版本（用于对比）
  const { x: px2, y: py2, w: pw2 } = drawCard(
    scenario.x, scenario.y + cardH / 2 + 8, cardW, cardH / 2 - 8,
    scenario.title, 'fallback'
  );

  const result2 = layout(scenario.tree, {
    containerWidth: pw2,
    textMeasurer: fallbackMeasurer,
  });
  renderLayout(result2.root, px2, py2, true);
});

// 说明文字
ctx.fillStyle = PAL.textLight;
ctx.font = '12px -apple-system, sans-serif';
ctx.textAlign = 'left';
ctx.fillText('说明：每个场景展示两种文本测量器的对比结果。Pretext 使用 Canvas 精确测量，Fallback 使用字符宽度估算。',
  PAD, TOTAL_H - 60);

ctx.fillStyle = PAL.pretext;
ctx.fillText('● Pretext (精确)', PAD + 380, TOTAL_H - 60);
ctx.fillStyle = PAL.fallback;
ctx.fillText('● Fallback (估算)', PAD + 520, TOTAL_H - 60);

// 页脚
ctx.fillStyle = PAL.textLight;
ctx.font = '11px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('PureLayout + Pretext — High-Fidelity Text Measurement · github.com/peterfei/purelayout',
  TOTAL_W / 2, TOTAL_H - 30);

// 输出
const outPath = new URL('demo-pretext.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Pretext Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
console.log(`  Pretext Available: ${pretextMeasurer.isPretextAvailable ? 'Yes ✓' : 'No (using fallback)'}`);
console.log(`  Canvas Available: ${pretextMeasurer.isCanvasAvailable ? 'Yes ✓' : 'No (using fallback)'}`);
console.log('');
console.log('文本测量能力对比：');
console.log('  Pretext: Canvas 精确测量（支持多语言、复杂换行）');
console.log('  Fallback: 字符宽度估算（快速但不精确）');
