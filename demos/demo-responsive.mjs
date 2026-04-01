#!/usr/bin/env node
/**
 * PureLayout Responsive Gallery — 响应式布局展示
 *
 * 展示 PureLayout 的响应式布局能力
 */

import { createCanvas } from 'canvas';
import { layout, px, PretextMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1200;
const TOTAL_H = 700;
const PAD = 50;
const HEADER_H = 80;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');
const measurer = new PretextMeasurer();

// ============================================================
//  设计系统
// ============================================================
const PAL = {
  bg: '#f1f5f9',
  card: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#1e293b',
  textLight: '#64748b',
  accent: '#3b82f6',
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
  ctx.fillText('Responsive Layouts', PAD, 30);

  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillStyle = PAL.textLight;
  ctx.fillText('Cross-device layouts powered by Flexbox', PAD, 55);
}

function drawDeviceFrame(x, y, w, h, label) {
  const frameW = w + 30;
  const frameH = h + 50;

  ctx.fillStyle = PAL.card;
  roundRect(x, y, frameW, frameH, 12);
  ctx.fill();

  ctx.strokeStyle = PAL.cardBorder;
  ctx.lineWidth = 1;
  roundRect(x, y, frameW, frameH, 12);
  ctx.stroke();

  ctx.fillStyle = PAL.accent;
  ctx.font = 'bold 10px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + frameW / 2, y + 16);

  const screenX = x + 15;
  const screenY = y + 30;
  ctx.fillStyle = '#f8fafc';
  roundRect(screenX, screenY, w, h, 6);
  ctx.fill();

  return { x: screenX, y: screenY };
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
      ctx.font = `${cs.fontStyle || 'normal'} ${cs.fontWeight || 400} ${cs.fontSize || 12}px ${cs.fontFamily || 'sans-serif'}`;
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
//  场景内容生成器
// ============================================================

function createGridScene(containerWidth, columns, gap) {
  const items = [];
  for (let i = 0; i < 6; i++) {
    items.push(div({
      padding: px(12),
      minWidth: px(containerWidth / columns - gap - 10),
    }, [p(`Item ${i + 1}`)]));
  }
  return div({
    width: px(containerWidth),
    display: 'flex',
    flexWrap: 'wrap',
    gap: gap,
  }, items);
}

function createNavScene(containerWidth) {
  return div({
    width: px(containerWidth),
  }, [
    div({
      display: 'flex',
      justifyContent: 'space-between',
      padding: px(10),
    }, [
      div({ width: px(50) }, [p('Logo')]),
      div({
        display: 'flex',
        gap: px(16),
      }, [
        div({ width: px(35) }, [p('Home')]),
        div({ width: px(35) }, [p('Shop')]),
      ]),
    ]),
  ]);
}

function createFlexScene(containerWidth) {
  return div({
    width: px(containerWidth),
    display: 'flex',
    gap: px(8),
  }, [
    div({ flex: 1, padding: px(8) }, [p('1')]),
    div({ flex: 2, padding: px(8) }, [p('2')]),
    div({ flex: 1, padding: px(8) }, [p('1')]),
  ]);
}

// ============================================================
//  主渲染流程
// ============================================================

drawBackground();
drawHeader();

// 场景配置
const scenes = [
  { type: 'mobile', w: 280, label: 'MOBILE', createFn: (w) => createGridScene(w, 2, px(8)) },
  { type: 'tablet', w: 400, label: 'TABLET', createFn: (w) => createGridScene(w, 3, px(10)) },
  { type: 'desktop', w: 520, label: 'DESKTOP', createFn: (w) => createGridScene(w, 4, px(12)) },
  { type: 'mobile', w: 280, label: 'MOBILE', createFn: createNavScene },
  { type: 'tablet', w: 400, label: 'TABLET', createFn: createNavScene },
  { type: 'desktop', w: 520, label: 'DESKTOP', createFn: createNavScene },
  { type: 'mobile', w: 280, label: 'MOBILE', createFn: createFlexScene },
  { type: 'tablet', w: 400, label: 'TABLET', createFn: createFlexScene },
  { type: 'desktop', w: 520, label: 'DESKTOP', createFn: createFlexScene },
];

let offsetX = PAD;
let offsetY = HEADER_H + PAD;

scenes.forEach((scene, index) => {
  const tree = scene.createFn(scene.w);
  const result = layout(tree, { containerWidth: scene.w, textMeasurer: measurer });

  const rootHeight = result.root.contentRect.height +
    result.root.boxModel.paddingTop +
    result.root.boxModel.paddingBottom;

  const { x: sx, y: sy } = drawDeviceFrame(offsetX, offsetY, scene.w, rootHeight, scene.label);

  renderLayout(result.root, sx, sy);

  offsetX += scene.w + 50;
  if (offsetX + scene.w > TOTAL_W - PAD) {
    offsetX = PAD;
    offsetY += 200;
  }
});

// 页脚
ctx.fillStyle = PAL.textLight;
ctx.font = '12px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('PureLayout — Responsive layouts powered by Flexbox · github.com/peterfei/purelayout', TOTAL_W / 2, TOTAL_H - 25);

// 输出
const outPath = new URL('demo-responsive.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Responsive Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
console.log(`  Pretext: ${measurer.isPretextAvailable ? 'Yes ✓' : 'No'}`);
console.log(`  Canvas: ${measurer.isCanvasAvailable ? 'Yes ✓' : 'No'}`);
