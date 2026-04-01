#!/usr/bin/env node
/**
 * PureLayout Flexbox 高级特性 Demo
 *
 * 12 个 Flexbox 布局场景，渲染为精美的展示图。
 * 运行: node demo-flexbox.mjs
 * 依赖: npm install canvas
 */

import { createCanvas } from 'canvas';
import { layout, px, FallbackMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const COLS = 3;
const ROWS = 4;
const CARD_GAP = 20;
const PAD = 36;
const HEADER_H = 80;
const CARD_W = 340;
const CARD_H = 230;
const FOOTER_H = 40;
const TOTAL_W = PAD * 2 + COLS * CARD_W + (COLS - 1) * CARD_GAP;
const TOTAL_H = HEADER_H + PAD + ROWS * CARD_H + (ROWS - 1) * CARD_GAP + FOOTER_H;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');
const measurer = new FallbackMeasurer();

// ============================================================
//  设计系统
// ============================================================
const PAL = {
  bg:         '#0b0b1a',
  card:       '#14142b',
  cardBorder: '#222250',
  title:      '#f0f0ff',
  subtitle:   '#6e6e9a',
  container:  '#0e0e22',
  contBorder: '#1c1c44',
  accent:     '#7c6aff',
  tag:        '#181840',
  tagBorder:  '#2a2a60',
  tagText:    '#9088ff',
  white:      '#ffffff',
  dim:        '#3a3a5c',
  code:       '#50507a',
};

// 渐变色对 — 每个场景 row 有专属配色
const PALETTE = {
  row0: [['#ff6b6b','#c0392b'], ['#ff9f43','#e67e22'], ['#54a0ff','#2e86de']],
  row1: [['#5f27cd','#341f97'], ['#01a3a4','#0abde3'], ['#10ac84','#1dd1a1']],
  row2: [['#ee5a24','#c44569'], ['#f368e0','#be2edd'], ['#0abde3','#48dbfb']],
  row3: [['#6c5ce7','#a29bfe'], ['#00cec9','#55efc4'], ['#fd79a8','#e84393']],
};

// ============================================================
//  工具函数
// ============================================================
function div(style, children = []) {
  return { tagName: 'div', style, children };
}

function createFlexScene({
  containerWidth, containerHeight,
  direction = 'row', wrap = 'nowrap',
  justify = 'flex-start', align = 'stretch', alignContent = 'stretch',
  gap: gapVal, rowGap: rowGapVal, columnGap: columnGapVal,
  items = [], padding: pad,
} = {}) {
  const style = {
    display: 'flex', width: px(containerWidth),
    flexDirection: direction, flexWrap: wrap,
    justifyContent: justify, alignItems: align, alignContent: alignContent,
  };
  if (containerHeight != null) style.height = px(containerHeight);
  if (gapVal != null) style.gap = px(gapVal);
  if (rowGapVal != null) style.rowGap = px(rowGapVal);
  if (columnGapVal != null) style.columnGap = px(columnGapVal);
  if (pad != null) style.padding = px(pad);
  return div(style, items);
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

function cardXY(col, row) {
  return {
    x: PAD + col * (CARD_W + CARD_GAP),
    y: HEADER_H + PAD + row * (CARD_H + CARD_GAP),
  };
}

function drawCardBg(col, row) {
  const {x, y} = cardXY(col, row);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  roundRect(x, y, CARD_W, CARD_H, 16);
  ctx.fillStyle = PAL.card;
  ctx.fill();
  ctx.restore();
  roundRect(x, y, CARD_W, CARD_H, 16);
  ctx.strokeStyle = PAL.cardBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawCardHeader(col, row, title, tag, cssHint) {
  const {x, y} = cardXY(col, row);

  // 标题
  ctx.fillStyle = PAL.title;
  ctx.font = 'bold 14px -apple-system, "SF Pro Display", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, x + 16, y + 14);

  // CSS 代码提示
  if (cssHint) {
    ctx.fillStyle = PAL.code;
    ctx.font = '11px "SF Mono", "Fira Code", monospace';
    ctx.fillText(cssHint, x + 16, y + 34);
  }

  // 标签 pill
  if (tag) {
    ctx.font = '10px -apple-system, sans-serif';
    const tw = ctx.measureText(tag).width + 16;
    const tx = x + CARD_W - tw - 16;
    roundRect(tx, y + 12, tw, 22, 6);
    ctx.fillStyle = PAL.tag;
    ctx.fill();
    ctx.strokeStyle = PAL.tagBorder;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = PAL.tagText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, tx + tw / 2, y + 23);
    ctx.textAlign = 'left';
  }
}

function drawItemBox(bx, by, bw, bh, grad, label) {
  if (bw < 1 || bh < 1) return;
  const [c1, c2] = grad;
  const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
  g.addColorStop(0, hexToRgba(c1, 0.9));
  g.addColorStop(1, hexToRgba(c2, 0.9));
  roundRect(bx, by, bw, bh, 6);
  ctx.fillStyle = g;
  ctx.fill();
  // 亮边
  roundRect(bx, by, bw, bh, 6);
  ctx.strokeStyle = hexToRgba(c1, 0.25);
  ctx.lineWidth = 1;
  ctx.stroke();
  // 尺寸标注
  if (label && bw > 35 && bh > 16) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 10px "SF Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + bw / 2, by + bh / 2);
  }
}

function drawFlexResult(layoutRoot, ox, oy, palette) {
  function visit(node, px2, py2) {
    if (node.type === 'flex') {
      node.children.forEach(c => visit(c, px2, py2));
      return;
    }
    if (node.type === 'text' || node.type === 'anonymous-block') return;
    const cr = node.contentRect;
    const bm = node.boxModel;
    const bx = px2 + cr.x - bm.paddingLeft;
    const by = py2 + cr.y - bm.paddingTop;
    const bw = cr.width + bm.paddingLeft + bm.paddingRight;
    const bh = cr.height + bm.paddingTop + bm.paddingBottom;
    if (bw < 1 || bh < 1) return;
    const grad = palette[node.sourceIndex % palette.length];
    drawItemBox(bx, by, bw, bh, grad, `${Math.round(cr.width)}x${Math.round(cr.height)}`);
  }
  visit(layoutRoot, ox, oy);
}

function renderScene(col, row, {
  title, tag, cssHint,
  containerW = CARD_W - 32,
  containerH = CARD_H - 58,
  items = [],
  palette,
  ...flexOpts
} = {}) {
  drawCardBg(col, row);
  drawCardHeader(col, row, title, tag, cssHint);

  const {x: cx, y: cy} = cardXY(col, row);
  const ox = cx + 16;
  const oy = cy + 52;

  // 容器
  roundRect(ox, oy, containerW, containerH, 8);
  ctx.fillStyle = PAL.container;
  ctx.fill();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = PAL.contBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // 布局
  const tree = createFlexScene({ containerWidth: containerW, containerHeight: containerH, items, ...flexOpts });
  const result = layout(tree, { containerWidth: 800, textMeasurer: measurer });
  drawFlexResult(result.root, ox, oy, palette);
}

// ============================================================
//  背景 & Header & Footer
// ============================================================
function drawBackground() {
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);
  // 微点网格
  ctx.fillStyle = 'rgba(124,106,255,0.025)';
  for (let gx = 0; gx < TOTAL_W; gx += 24) {
    for (let gy = 0; gy < TOTAL_H; gy += 24) {
      ctx.beginPath();
      ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 顶部光晕
  const glow = ctx.createRadialGradient(TOTAL_W / 2, 0, 0, TOTAL_W / 2, 0, 500);
  glow.addColorStop(0, 'rgba(124,106,255,0.06)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, TOTAL_W, 500);
}

function drawHeader() {
  // 左侧装饰条
  const barGrad = ctx.createLinearGradient(PAD, 0, PAD + 80, 0);
  barGrad.addColorStop(0, PAL.accent);
  barGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = barGrad;
  ctx.fillRect(PAD, 22, 80, 3);

  ctx.fillStyle = PAL.white;
  ctx.font = 'bold 28px -apple-system, "SF Pro Display", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('PureLayout', PAD, 32);

  ctx.font = '13px -apple-system, sans-serif';
  ctx.fillStyle = PAL.accent;
  ctx.fillText('v0.2.0', PAD + 145, 40);

  ctx.fillStyle = PAL.subtitle;
  ctx.font = '15px -apple-system, sans-serif';
  ctx.fillText('Flexbox Advanced Features Gallery', PAD + 205, 39);

  ctx.textAlign = 'right';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillStyle = PAL.dim;
  ctx.fillText('Zero Dependencies  ·  100% TypeScript  ·  W3C Spec Compliant  ·  Browser-fidelity: 100%', TOTAL_W - PAD, 40);
  ctx.textAlign = 'left';
}

function drawFooter() {
  const y = TOTAL_H - FOOTER_H + 10;
  // 分隔线
  ctx.strokeStyle = PAL.cardBorder;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(PAD, y - 4);
  ctx.lineTo(TOTAL_W - PAD, y - 4);
  ctx.stroke();

  ctx.fillStyle = PAL.dim;
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('PureLayout — Pure JS/TS CSS Layout Engine  ·  No Browser DOM Required  ·  github.com/peterfei/purelayout', TOTAL_W / 2, y);
}

// ============================================================
//  背景 & Header & Footer (先绘制)
// ============================================================
drawBackground();
drawHeader();

// ============================================================
//  场景定义
// ============================================================

// Row 0 — 方向

renderScene(0, 0, {
  title: 'flex-direction: row',
  tag: 'DIRECTION',
  cssHint: 'display: flex;',
  containerH: 150,
  palette: PALETTE.row0,
  items: [
    div({ width: px(55), height: px(50), flexShrink: 0 }),
    div({ width: px(75), height: px(70), flexShrink: 0 }),
    div({ width: px(45), height: px(40), flexShrink: 0 }),
    div({ width: px(65), height: px(55), flexShrink: 0 }),
  ],
});

renderScene(1, 0, {
  title: 'flex-direction: row-reverse',
  tag: 'DIRECTION',
  cssHint: 'flex-direction: row-reverse;',
  containerH: 150,
  direction: 'row-reverse',
  palette: PALETTE.row0,
  items: [
    div({ width: px(55), height: px(50), flexShrink: 0 }),
    div({ width: px(75), height: px(70), flexShrink: 0 }),
    div({ width: px(45), height: px(40), flexShrink: 0 }),
  ],
});

renderScene(2, 0, {
  title: 'flex-direction: column-reverse',
  tag: 'DIRECTION',
  cssHint: 'flex-direction: column-reverse;',
  containerH: 150,
  direction: 'column-reverse',
  palette: PALETTE.row0,
  items: [
    div({ width: px(110), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(35), flexShrink: 0 }),
    div({ width: px(130), height: px(25), flexShrink: 0 }),
    div({ width: px(100), height: px(40), flexShrink: 0 }),
  ],
});

// Row 1 — 弹性伸缩

renderScene(0, 1, {
  title: 'flex-grow: 1 / 2 / 3',
  tag: 'GROW',
  cssHint: 'flex-basis: 0; flex-grow: N;',
  containerH: 150,
  palette: PALETTE.row1,
  items: [
    div({ width: px(0), height: px(60), flexBasis: px(0), flexGrow: 1, flexShrink: 0 }),
    div({ width: px(0), height: px(60), flexBasis: px(0), flexGrow: 2, flexShrink: 0 }),
    div({ width: px(0), height: px(60), flexBasis: px(0), flexGrow: 3, flexShrink: 0 }),
  ],
});

renderScene(1, 1, {
  title: 'flex-shrink: 1 / 2 / 4',
  tag: 'SHRINK',
  cssHint: 'width: 160px; flex-shrink: N;',
  containerH: 150,
  palette: PALETTE.row1,
  items: [
    div({ width: px(160), height: px(60), flexShrink: 1 }),
    div({ width: px(160), height: px(60), flexShrink: 2 }),
    div({ width: px(160), height: px(60), flexShrink: 4 }),
  ],
});

renderScene(2, 1, {
  title: 'Fixed 60px + flex-grow: 1',
  tag: 'MIXED',
  cssHint: 'width:60px + flex-basis:0; flex-grow:1;',
  containerH: 150,
  palette: PALETTE.row1,
  items: [
    div({ width: px(60), height: px(60), flexShrink: 0 }),
    div({ width: px(0), height: px(60), flexBasis: px(0), flexGrow: 1, flexShrink: 0 }),
    div({ width: px(60), height: px(60), flexShrink: 0 }),
  ],
});

// Row 2 — 对齐

renderScene(0, 2, {
  title: 'justify-content: space-between',
  tag: 'JUSTIFY',
  cssHint: 'justify-content: space-between;',
  containerH: 150,
  justify: 'space-between',
  palette: PALETTE.row2,
  items: [
    div({ width: px(50), height: px(60), flexShrink: 0 }),
    div({ width: px(50), height: px(60), flexShrink: 0 }),
    div({ width: px(50), height: px(60), flexShrink: 0 }),
    div({ width: px(50), height: px(60), flexShrink: 0 }),
  ],
});

renderScene(1, 2, {
  title: 'justify-content: space-evenly',
  tag: 'JUSTIFY',
  cssHint: 'justify-content: space-evenly;',
  containerH: 150,
  justify: 'space-evenly',
  palette: PALETTE.row2,
  items: [
    div({ width: px(60), height: px(60), flexShrink: 0 }),
    div({ width: px(60), height: px(60), flexShrink: 0 }),
    div({ width: px(60), height: px(60), flexShrink: 0 }),
  ],
});

renderScene(2, 2, {
  title: 'align-items: center + align-self',
  tag: 'ALIGN',
  cssHint: 'align-items: center; align-self: flex-end;',
  containerH: 150,
  align: 'center',
  palette: PALETTE.row2,
  items: [
    div({ width: px(55), height: px(30), flexShrink: 0 }),
    div({ width: px(55), height: px(60), flexShrink: 0, alignSelf: 'flex-end' }),
    div({ width: px(55), height: px(45), flexShrink: 0 }),
    div({ width: px(55), height: px(20), flexShrink: 0 }),
  ],
});

// Row 3 — 高级特性

renderScene(0, 3, {
  title: 'flex-wrap: wrap + gap: 10px',
  tag: 'WRAP',
  cssHint: 'flex-wrap: wrap; gap: 10px;',
  containerH: 158,
  wrap: 'wrap',
  gap: 10,
  palette: PALETTE.row3,
  items: [
    div({ width: px(90), height: px(38), flexShrink: 0 }),
    div({ width: px(90), height: px(48), flexShrink: 0 }),
    div({ width: px(90), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(42), flexShrink: 0 }),
    div({ width: px(90), height: px(35), flexShrink: 0 }),
  ],
});

renderScene(1, 3, {
  title: 'order: -1 / 0 / 1 / 2',
  tag: 'ORDER',
  cssHint: 'order property reorders display',
  containerH: 150,
  palette: PALETTE.row3,
  items: [
    div({ width: px(60), height: px(60), flexShrink: 0, order: 2 }),
    div({ width: px(60), height: px(60), flexShrink: 0, order: 0 }),
    div({ width: px(60), height: px(60), flexShrink: 0, order: -1 }),
    div({ width: px(60), height: px(60), flexShrink: 0, order: 1 }),
  ],
});

renderScene(2, 3, {
  title: 'align-content: space-between',
  tag: 'ALIGN-CONTENT',
  cssHint: 'flex-wrap: wrap; align-content: space-between;',
  containerH: 158,
  wrap: 'wrap',
  alignContent: 'space-between',
  gap: 8,
  palette: PALETTE.row3,
  items: [
    div({ width: px(90), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(30), flexShrink: 0 }),
    div({ width: px(90), height: px(30), flexShrink: 0 }),
  ],
});

// ============================================================
//  Footer (最后绘制)
// ============================================================
drawFooter();

const outPath = new URL('demo-flexbox.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Flexbox Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
