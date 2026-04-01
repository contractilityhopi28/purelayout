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
  function visit(node, px, py) {
    const cr = node.contentRect;
    const bm = node.boxModel;
    const cs = node.computedStyle;
    const x = px + cr.x - bm.paddingLeft;
    const y = py + cr.y - bm.paddingTop;
    const w = cr.width + bm.paddingLeft + bm.paddingRight;
    const h = cr.height + bm.paddingTop + bm.paddingBottom;

    // 文本
    if (node.lineBoxes && node.lineBoxes.length > 0) {
      ctx.fillStyle = cs.color || '#000';
      ctx.font = `${cs.fontStyle || 'normal'} ${cs.fontWeight || 400} ${cs.fontSize || 14}px ${cs.fontFamily || 'sans-serif'}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const cx = x + bm.paddingLeft;
      const cy = y + bm.paddingTop;

      node.lineBoxes.forEach(line => {
        if (line && line.segments) {
          line.segments.forEach(seg => {
            ctx.fillText(seg.text, cx + seg.x, cy + seg.y + seg.height);
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
    div({ padding: '10px 20px', width: px(80) }, [p('Primary')]),
    div({ padding: '10px 20px', width: px(80) }, [p('Secondary')]),
    div({ padding: '10px 20px', width: px(80) }, [p('Success')]),
    div({ padding: '8px 16px', width: px(70) }, [p('Small')]),
    div({ padding: '12px 24px', width: px(80) }, [p('Medium')]),
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
    div({
      flex: 1,
      padding: px(16),
    }, [
      p('Card 1'),
      p('Content area with flex layout'),
    ]),
    div({
      flex: 1,
      padding: px(16),
    }, [
      p('Card 2'),
      p('Equal width distribution'),
    ]),
  ]),
]);

// 场景3: 导航栏
const scene3Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: px(12),
  }, [
    div({ width: px(60) }, [p('Brand')]),
    div({
      display: 'flex',
      gap: px(24),
    }, [
      div({ width: px(40) }, [p('Home')]),
      div({ width: px(50) }, [p('Shop')]),
      div({ width: px(50) }, [p('About')]),
    ]),
    div({ padding: '6px 16px', width: px(60) }, [p('Sign In')]),
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
      div({ padding: '12px 16px', width: px(200) }, [p('user@example.com')]),
    ]),
    div({}, [
      p('Message'),
      div({ padding: 16, width: px(300), minHeight: px(60) }, [p('Type your message...')]),
    ]),
  ]),
]);

// 场景5: 徽章
const scene5Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    gap: px(8),
    flexWrap: 'wrap',
  }, [
    div({ padding: '4px 10px', width: px(50) }, [p('Active')]),
    div({ padding: '4px 10px', width: px(60) }, [p('Pending')]),
    div({ padding: '4px 10px', width: px(45) }, [p('Error')]),
    div({ padding: '4px 8px', width: px(45) }, [p('Beta')]),
    div({ padding: '4px 8px', width: px(35) }, [p('WIP')]),
  ]),
]);

// 场景6: 模态框
const scene6Tree = div({
  width: px(500),
}, [
  div({
    padding: px(20),
  }, [
    div({
      marginBottom: px(16),
    }, [p('Confirm Action')]),
    div({
      marginBottom: px(16),
    }, [
      p('Are you sure you want to proceed? This action cannot be undone.'),
    ]),
    div({
      display: 'flex',
      justifyContent: 'flex-end',
      gap: px(12),
    }, [
      div({ padding: '8px 16px', width: px(60) }, [p('Cancel')]),
      div({ padding: '8px 16px', width: px(65) }, [p('Confirm')]),
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
  const { x: sx, y: sy, w: sw } = drawCard(scene.x, scene.y, 550, 200, scene.title);

  const result = layout(scene.tree, { containerWidth: sw, textMeasurer: measurer });
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
