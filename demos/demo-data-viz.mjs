#!/usr/bin/env node
/**
 * PureLayout Data Viz Gallery — 数据可视化布局展示
 *
 * 展示 PureLayout 在数据可视化场景的布局能力
 */

import { createCanvas } from 'canvas';
import { layout, px, PretextMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1200;
const TOTAL_H = 800;
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
  accent: '#6366f1',
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
  ctx.fillText('Data Visualization Layouts', PAD, 30);

  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillStyle = PAL.textLight;
  ctx.fillText('Dashboard grids and data cards powered by Flexbox', PAD, 55);
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
      const fontSize = Math.max(typeof cs.fontSize === 'number' ? cs.fontSize : 13, 13);
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
    ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
    roundRect(box.x, box.y, box.w, box.h, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
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

// 场景1: 统计卡片
const scene1Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    gap: px(12),
  }, [
    div({
      flex: 1,
      padding: px(16),
    }, [
      p('Revenue'),
      p('$124,563'),
      p('+12.5%'),
    ]),
    div({
      flex: 1,
      padding: px(16),
    }, [
      p('Users'),
      p('8,429'),
      p('+8.2%'),
    ]),
  ]),
]);

// 场景2: 图表容器
const scene2Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    gap: px(12),
  }, [
    div({
      flex: 1,
      padding: px(12),
    }, [
      p('Sales Trend'),
      p('📈 Line chart area'),
    ]),
    div({
      flex: 1,
      padding: px(12),
    }, [
      p('By Source'),
      p('🥧 Pie chart area'),
    ]),
  ]),
]);

// 场景3: 图例
const scene3Tree = div({
  width: px(500),
}, [
  p('Chart Legend'),
  div({
    display: 'flex',
    flexWrap: 'wrap',
    gap: px(16),
  }, [
    div({ padding: px(4) }, [p('● Product A')]),
    div({ padding: px(4) }, [p('● Product B')]),
    div({ padding: px(4) }, [p('● Product C')]),
    div({ padding: px(4) }, [p('● Product D')]),
  ]),
]);

// 场景4: 进度条
const scene4Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: px(8),
  }, [
    div({ padding: px(4) }, [p('Q1 Revenue')]),
    div({ padding: px(4) }, [p('78%')]),
  ]),
  div({
    height: px(8),
  }, []),
  div({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: px(16),
    marginBottom: px(8),
  }, [
    div({ padding: px(4) }, [p('Q2 Revenue')]),
    div({ padding: px(4) }, [p('45%')]),
  ]),
  div({
    height: px(8),
  }, []),
]);

// 场景5: 时间线
const scene5Tree = div({
  width: px(500),
}, [
  p('Activity Timeline'),
  div({
    display: 'flex',
    flexDirection: 'column',
    gap: px(10),
  }, [
    div({
      display: 'flex',
      gap: px(12),
    }, [
      div({ width: px(8), height: px(8) }, []),
      div({ flex: 1 }, [
        p('New sale: $1,249'),
        p('2 minutes ago'),
      ]),
    ]),
    div({
      display: 'flex',
      gap: px(12),
    }, [
      div({ width: px(8), height: px(8) }, []),
      div({ flex: 1 }, [
        p('User registered'),
        p('15 minutes ago'),
      ]),
    ]),
  ]),
]);

// 场景6: 数据表格
const scene6Tree = div({
  width: px(500),
}, [
  div({
    display: 'flex',
    padding: px(10),
  }, [
    div({ flex: 2 }, [p('Product')]),
    div({ flex: 1 }, [p('Sales')]),
    div({ flex: 1 }, [p('Growth')]),
  ]),
  div({
    display: 'flex',
    padding: px(10),
  }, [
    div({ flex: 2 }, [p('Product A')]),
    div({ flex: 1 }, [p('$45.2K')]),
    div({ flex: 1 }, [p('+12%')]),
  ]),
  div({
    display: 'flex',
    padding: px(10),
  }, [
    div({ flex: 2 }, [p('Product B')]),
    div({ flex: 1 }, [p('$38.7K')]),
    div({ flex: 1 }, [p('+8%')]),
  ]),
]);

// ============================================================
//  主渲染流程
// ============================================================

drawBackground();
drawHeader();

const scenes = [
  { tree: scene1Tree, x: PAD, y: HEADER_H + PAD, title: 'Stat Cards' },
  { tree: scene2Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD, title: 'Chart Areas' },
  { tree: scene3Tree, x: PAD, y: HEADER_H + PAD + 180, title: 'Legend' },
  { tree: scene4Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD + 180, title: 'Progress' },
  { tree: scene5Tree, x: PAD, y: HEADER_H + PAD + 360, title: 'Timeline' },
  { tree: scene6Tree, x: TOTAL_W / 2 + PAD / 2, y: HEADER_H + PAD + 360, title: 'Data Table' },
];

scenes.forEach(scene => {
  const { x: sx, y: sy, w: sw } = drawCard(scene.x, scene.y, 550, 170, scene.title);

  const result = layout(scene.tree, { containerWidth: sw, textMeasurer: measurer });
  renderLayout(result.root, sx, sy);
});

// 页脚
ctx.fillStyle = PAL.textLight;
ctx.font = '12px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('PureLayout — Data visualization layouts powered by Flexbox · github.com/peterfei/purelayout', TOTAL_W / 2, TOTAL_H - 25);

// 输出
const outPath = new URL('demo-data-viz.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Data Viz Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
console.log(`  Pretext: ${measurer.isPretextAvailable ? 'Yes ✓' : 'No'}`);
console.log(`  Canvas: ${measurer.isCanvasAvailable ? 'Yes ✓' : 'No'}`);
