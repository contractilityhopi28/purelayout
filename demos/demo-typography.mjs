#!/usr/bin/env node
/**
 * PureLayout Typography Showcase — 精美排版展示
 *
 * 展示 PureLayout 的文字排版布局能力
 */

import { createCanvas } from 'canvas';
import { layout, px, PretextMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1200;
const TOTAL_H = 1000;
const PAD = 50;
const HEADER_H = 80;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');
const measurer = new PretextMeasurer();

// ============================================================
//  设计系统
// ============================================================
const PAL = {
  bg: '#faf8f5',
  card: '#ffffff',
  cardBorder: '#e8e4df',
  text: '#2c2c2c',
  textLight: '#6b6b6b',
  accent: '#c9a86c',
  accentLight: '#f4eee4',
  quote: '#8b7355',
};

// ============================================================
//  工具函数
// ============================================================
function div(style, children = []) {
  return { tagName: 'div', style, children };
}

function h1(text) {
  return { tagName: 'h1', style: {}, children: [text] };
}

function h2(text) {
  return { tagName: 'h2', style: {}, children: [text] };
}

function p(text) {
  return { tagName: 'p', style: {}, children: [text] };
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

// ============================================================
//  绘制函数
// ============================================================
function drawBackground() {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);
}

function drawHeader() {
  ctx.fillStyle = PAL.text;
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PureLayout Typography', TOTAL_W / 2, 35);

  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillStyle = PAL.textLight;
  ctx.fillText('Powered by Pretext — Precise Text Measurement + Layout Engine', TOTAL_W / 2, 60);
}

function drawCard(x, y, w, h, title) {
  ctx.fillStyle = PAL.card;
  roundRect(x, y, w, h, 12);
  ctx.fill();

  ctx.strokeStyle = PAL.cardBorder;
  ctx.lineWidth = 1;
  roundRect(x, y, w, h, 12);
  ctx.stroke();

  ctx.fillStyle = PAL.accent;
  ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title.toUpperCase(), x + 16, y + 16);

  return { x: x + 16, y: y + 40, w: w - 32 };
}

function renderLayout(layoutRoot, offsetX, offsetY) {
  function visit(node, px, py) {
    const cr = node.contentRect;
    const bm = node.boxModel;
    const cs = node.computedStyle;
    const x = px + cr.x - bm.paddingLeft;
    const y = py + cr.y - bm.paddingTop;
    const w = cr.width + bm.paddingLeft + bm.paddingRight;
    const h = cr.height + bm.paddingTop + bm.paddingBottom;

    // 绘制元素边框（对于有 padding 的元素）
    if (bm.paddingTop > 0 || bm.paddingRight > 0 || bm.paddingBottom > 0 || bm.paddingLeft > 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
      roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1;
      roundRect(x, y, w, h, 6);
      ctx.stroke();
    }

    // 文本
    if (node.lineBoxes && node.lineBoxes.length > 0) {
      ctx.fillStyle = '#1e293b';
      const fontSize = Math.max(typeof cs.fontSize === 'number' ? cs.fontSize : 16, 16);
      ctx.font = `${cs.fontStyle || 'normal'} ${cs.fontWeight || 400} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const cx = x + bm.paddingLeft;
      const cy = y + bm.paddingTop;

      node.lineBoxes.forEach(line => {
        if (line && line.fragments) {
          line.fragments.forEach(frag => {
            ctx.fillText(frag.text, px + node.contentRect.x + frag.x, py + node.contentRect.y + line.y + line.baseline);
          });
        }
      });
    }

    // 递归子元素
    if (node.children) {
      node.children.forEach(child => {
        visit(child, px + cr.x, py + cr.y);
      });
    }
  }

  visit(layoutRoot, offsetX, offsetY);
}

// ============================================================
//  场景内容
// ============================================================

// 场景1: 标题层级
const scene1Tree = div({
  width: px(500),
}, [
  h1('Heading Level 1'),
  h2('Heading Level 2'),
  div({
    marginTop: px(12),
  }, [
    p('正文内容展示，标题层级清晰。PureLayout 完整支持 HTML 元素的默认样式继承。'),
  ]),
]);

// 场景2: 多栏布局
const scene2Tree = div({
  width: px(500),
  display: 'flex',
  gap: px(16),
}, [
  div({
    flex: 1,
  }, [
    h2('Column 1'),
    p('第一栏内容展示 Flex 布局的等宽分配能力。'),
  ]),
  div({
    flex: 1,
  }, [
    h2('Column 2'),
    p('第二栏内容，两栏自动平分可用空间。'),
  ]),
]);

// 场景3: 文本对齐
const scene3Tree = div({
  width: px(500),
}, [
  div({
    textAlign: 'left',
    marginBottom: px(12),
    padding: px(8),
  }, [p('Left aligned text — 左对齐示例')]),
  div({
    textAlign: 'center',
    marginBottom: px(12),
    padding: px(8),
  }, [p('Center aligned text — 居中对齐示例')]),
  div({
    textAlign: 'right',
    padding: px(8),
  }, [p('Right aligned text — 右对齐示例')]),
]);

// 场景4: Flex 方向
const scene4Tree = div({
  width: px(500),
}, [
  h2('Flex Direction: Row'),
  div({
    display: 'flex',
    gap: px(12),
    marginBottom: px(16),
  }, [
    div({ padding: px(12), width: px(80) }, [p('Item 1')]),
    div({ padding: px(12), width: px(80) }, [p('Item 2')]),
    div({ padding: px(12), width: px(80) }, [p('Item 3')]),
  ]),
  h2('Flex Direction: Column'),
  div({
    display: 'flex',
    flexDirection: 'column',
    gap: px(8),
  }, [
    div({ padding: px(12) }, [p('Row Item 1')]),
    div({ padding: px(12) }, [p('Row Item 2')]),
    div({ padding: px(12) }, [p('Row Item 3')]),
  ]),
]);

// 场景5: 间距控制
const scene5Tree = div({
  width: px(500),
  display: 'flex',
  flexDirection: 'column',
  gap: px(20),
}, [
  h2('Gap Spacing'),
  div({
    display: 'flex',
    gap: px(16),
  }, [
    div({ padding: px(12), width: px(100) }, [p('Gap 16px')]),
    div({ padding: px(12), width: px(100) }, [p('Auto')]),
    div({ padding: px(12), width: px(100) }, [p('Spacing')]),
  ]),
  div({
    display: 'flex',
    gap: px(8),
  }, [
    div({ padding: px(12), width: px(100) }, [p('Gap 8px')]),
    div({ padding: px(12), width: px(100) }, [p('Smaller')]),
  ]),
]);

// 场景6: 内外边距
const scene6Tree = div({
  width: px(500),
  padding: px(20),
}, [
  h2('Padding & Margin'),
  div({
    marginTop: px(16),
    padding: px(16),
  }, [
    p('这个容器有 20px 的外层 padding 和 16px 的内层 padding。PureLayout 完整支持 CSS 盒模型。'),
  ]),
  div({
    marginTop: px(12),
    display: 'flex',
    gap: px(12),
  }, [
    div({
      padding: px(12),
      marginTop: px(8),
    }, [p('Margin Top')]),
    div({
      padding: px(12),
      marginBottom: px(8),
    }, [p('Margin Bottom')]),
  ]),
]);

// ============================================================
//  主渲染流程
// ============================================================

drawBackground();
drawHeader();

const scenes = [
  { tree: scene1Tree, x: PAD, y: HEADER_H + PAD, title: 'Headings' },
  { tree: scene2Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD, title: 'Columns' },
  { tree: scene3Tree, x: PAD, y: HEADER_H + PAD + 340, title: 'Text Align' },
  { tree: scene4Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD + 340, title: 'Flex Direction' },
  { tree: scene5Tree, x: PAD, y: HEADER_H + PAD + 680, title: 'Gap Spacing' },
  { tree: scene6Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD + 680, title: 'Box Model' },
];

scenes.forEach(scene => {
  const { x: sx, y: sy, w: sw } = drawCard(scene.x, scene.y, 550, 320, scene.title);

  const result = layout(scene.tree, { containerWidth: sw, textMeasurer: measurer });
  renderLayout(result.root, sx, sy);
});

// 页脚
ctx.fillStyle = PAL.textLight;
ctx.font = '12px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('PureLayout — Pure JS/TS CSS Layout Engine · github.com/peterfei/purelayout', TOTAL_W / 2, TOTAL_H - 25);

// 输出
const outPath = new URL('demo-typography.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Typography Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
console.log(`  Pretext: ${measurer.isPretextAvailable ? 'Yes ✓' : 'No'}`);
console.log(`  Canvas: ${measurer.isCanvasAvailable ? 'Yes ✓' : 'No'}`);
