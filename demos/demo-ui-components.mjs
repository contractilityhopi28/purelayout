#!/usr/bin/env node
/**
 * PureLayout UI Components Showcase — UI 组件布局展示
 *
 * 展示 PureLayout 构建 UI 组件布局的能力
 */

import { createCanvas } from 'canvas';
import { layout, px, PretextMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1200;
const TOTAL_H = 900;
const PAD = 50;
const HEADER_H = 80;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');
const measurer = new PretextMeasurer();

// ============================================================
//  设计系统
// ============================================================
const PAL = {
  bg: '#f8fafc',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  accent: '#3b82f6',
  accent2: '#8b5cf6',
  success: '#10b981',
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

// 解析 padding 简写 (例如: "10px 20px" → { paddingTop, paddingRight, paddingBottom, paddingLeft })
function padding(value) {
  if (typeof value === 'string') {
    const parts = value.split(' ').map(v => parseFloat(v.replace('px', '')));
    if (parts.length === 1) {
      return { paddingTop: px(parts[0]), paddingRight: px(parts[0]), paddingBottom: px(parts[0]), paddingLeft: px(parts[0]) };
    } else if (parts.length === 2) {
      return { paddingTop: px(parts[0]), paddingBottom: px(parts[0]), paddingLeft: px(parts[1]), paddingRight: px(parts[1]) };
    } else if (parts.length === 4) {
      return { paddingTop: px(parts[0]), paddingRight: px(parts[1]), paddingBottom: px(parts[2]), paddingLeft: px(parts[3]) };
    }
  }
  return { paddingTop: px(value), paddingRight: px(value), paddingBottom: px(value), paddingLeft: px(value) };
}

// 合并样式的辅助函数
function mergeStyle(base, extra) {
  return { ...base, ...extra };
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
  ctx.font = 'bold 28px -apple-system, sans-serif';
  ctx.fillText('UI Components Layout', PAD, 30);

  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillStyle = PAL.textLight;
  ctx.fillText('Component layouts powered by PureLayout Flexbox', PAD, 55);
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
  ctx.fillText(title.toUpperCase(), x + 16, y + 16);

  return { x: x + 16, y: y + 40, w: w - 32 };
}

function renderLayout(layoutRoot, offsetX, offsetY) {
  const boxes = [];
  const texts = [];

  // px/py 递归累加每个节点的 cr.x/cr.y
  // frag.x 和 line.y 是局部坐标（相对于行）
  function collect(node, px, py) {
    const cr = node.contentRect;
    const bm = node.boxModel;

    if (bm.paddingTop > 0 || bm.paddingRight > 0 || bm.paddingBottom > 0 || bm.paddingLeft > 0) {
      boxes.push({
        x: px + cr.x - bm.paddingLeft,
        y: py + cr.y - bm.paddingTop,
        w: cr.width + bm.paddingLeft + bm.paddingRight,
        h: cr.height + bm.paddingTop + bm.paddingBottom,
      });
    }

    if (node.lineBoxes && node.lineBoxes.length > 0) {
      const cs = node.computedStyle;
      const fontSize = Math.max(typeof cs.fontSize === 'number' ? cs.fontSize : 14, 14);
      node.lineBoxes.forEach(line => {
        if (line && line.fragments) {
          line.fragments.forEach(frag => {
            texts.push({
              text: frag.text,
              x: px + cr.x + frag.x,
              y: py + cr.y + line.y + line.baseline,
              fontSize,
              fontStyle: cs.fontStyle || 'normal',
              fontWeight: cs.fontWeight || 400,
            });
          });
        }
      });
    }

    if (node.children) {
      node.children.forEach(child => collect(child, px + cr.x, py + cr.y));
    }
  }

  collect(layoutRoot, offsetX, offsetY);

  boxes.forEach(box => {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
    roundRect(box.x, box.y, box.w, box.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    roundRect(box.x, box.y, box.w, box.h, 6);
    ctx.stroke();
  });

  texts.forEach(t => {
    ctx.fillStyle = '#1e293b';
    ctx.font = `${t.fontStyle} ${t.fontWeight} ${t.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(t.text, t.x, t.y);
  });
}

// ============================================================
//  场景内容
// ============================================================

// 场景1: 按钮组
const scene1Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    gap: px(12),
    flexWrap: 'wrap',
  }, [
    div({ width: px(100), padding: px(12) }, [p('Primary')]),
    div({ width: px(100), padding: px(12) }, [p('Secondary')]),
    div({ width: px(100), padding: px(12) }, [p('Success')]),
    div({ width: px(80), padding: px(10) }, [p('Small')]),
    div({ width: px(100), padding: px(14) }, [p('Medium')]),
  ]),
]);

// 场景2: 卡片网格
const scene2Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    gap: px(16),
  }, [
    div(mergeStyle({ flex: 1 }, padding(16)), [
      p('Card 1'),
      p('Content area'),
    ]),
    div(mergeStyle({ flex: 1 }, padding(16)), [
      p('Card 2'),
      p('Equal width'),
    ]),
  ]),
]);

// 场景3: 导航栏
const scene3Tree = div({
  width: px(500),
}, [
  div(mergeStyle({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }, padding(12)), [
    div({ width: px(80), padding: px(8) }, [p('Brand')]),
    div({ width: px(60), padding: px(8) }, [p('Home')]),
    div({ width: px(60), padding: px(8) }, [p('Shop')]),
    div({ width: px(60), padding: px(8) }, [p('About')]),
    div({ width: px(80), padding: px(8) }, [p('Sign In')]),
  ]),
]);

// 场景4: 表单
const scene4Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    flexDirection: 'column',
    gap: px(16),
  }, [
    div({}, [
      p('Email'),
      div({ width: px(250), padding: px(12) }, [p('user@example.com')]),
    ]),
    div({}, [
      p('Message'),
      div(mergeStyle({ width: px(300), minHeight: px(60) }, padding(12)), [p('Type your message...')]),
    ]),
  ]),
]);

// 场景5: 徽章
const scene5Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    gap: px(10),
    flexWrap: 'wrap',
  }, [
    div({ width: px(70), padding: px(6) }, [p('Active')]),
    div({ width: px(80), padding: px(6) }, [p('Pending')]),
    div({ width: px(65), padding: px(6) }, [p('Error')]),
    div({ width: px(60), padding: px(6) }, [p('Beta')]),
    div({ width: px(55), padding: px(6) }, [p('WIP')]),
  ]),
]);

// 场景6: 模态框
const scene6Tree = div({
  width: px(500),
}, [
  div(padding(20), [
    div({ marginBottom: px(16) }, [p('Confirm Action')]),
    div({ marginBottom: px(16) }, [
      p('This action cannot be undone.'),
    ]),
    div({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: px(12),
    }, [
      div({ width: px(80), padding: px(10) }, [p('Cancel')]),
      div({ width: px(90), padding: px(10) }, [p('Confirm')]),
    ]),
  ]),
]);

// ============================================================
//  主渲染流程
// ============================================================

drawBackground();
drawHeader();

const scenes = [
  { tree: scene1Tree, x: PAD, y: HEADER_H + PAD, title: 'Buttons' },
  { tree: scene2Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD, title: 'Cards' },
  { tree: scene3Tree, x: PAD, y: HEADER_H + PAD + 220, title: 'Navigation' },
  { tree: scene4Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD + 220, title: 'Forms' },
  { tree: scene5Tree, x: PAD, y: HEADER_H + PAD + 440, title: 'Badges' },
  { tree: scene6Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD + 440, title: 'Modal' },
];

scenes.forEach(scene => {
  const result = layout(scene.tree, { containerWidth: 518, textMeasurer: measurer });
  const contentH = result.root.contentRect.height + result.root.boxModel.paddingTop + result.root.boxModel.paddingBottom;
  const cardH = Math.max(contentH + 45, 120); // 45 = title + padding

  const { x: sx, y: sy, w: sw } = drawCard(scene.x, scene.y, 550, cardH, scene.title);
  renderLayout(result.root, sx, sy);
});

// 页脚
ctx.fillStyle = PAL.textLight;
ctx.font = '12px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('PureLayout — Component layouts powered by Flexbox · github.com/peterfei/purelayout', TOTAL_W / 2, TOTAL_H - 25);

// 输出
const outPath = new URL('demo-ui-components.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`UI Components Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
console.log(`  Pretext: ${measurer.isPretextAvailable ? 'Yes ✓' : 'No'}`);
console.log(`  Canvas: ${measurer.isCanvasAvailable ? 'Yes ✓' : 'No'}`);
