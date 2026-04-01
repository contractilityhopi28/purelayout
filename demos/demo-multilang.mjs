#!/usr/bin/env node
/**
 * PureLayout + Pretext 多语言文本测量演示
 *
 * 展示 Pretext 对多种语言的真实文本的精确测量和换行
 */

import { createCanvas } from 'canvas';
import { layout, px, PretextMeasurer } from '../dist/index.js';
import fs from 'fs';

// ============================================================
//  全局配置
// ============================================================
const TOTAL_W = 1200;
const TOTAL_H = 2200;
const PAD = 50;
const HEADER_H = 90;

const canvas = createCanvas(TOTAL_W, TOTAL_H);
const ctx = canvas.getContext('2d');
const measurer = new PretextMeasurer();

// ============================================================
//  设计系统 - 高对比度
// ============================================================
const PAL = {
  bg: '#ffffff',
  card: '#f8f9fa',
  text: '#1a1a1a',
  textLight: '#666666',
  accent: '#2563eb',
  border: '#e5e7eb',
};

// 语言颜色
const LANG_COLORS = {
  'zh': '#dc2626',    // 中文 - 红色
  'en': '#2563eb',    // 英文 - 蓝色
  'ja': '#ea580c',    // 日文 - 橙色
  'ko': '#16a34a',    // 韩文 - 绿色
  'ar': '#7c3aed',    // 阿拉伯 - 紫色
  'ru': '#db2777',    // 俄文 - 粉色
  'mixed': '#0891b2', // 混合 - 青色
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
  ctx.font = 'bold 36px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PureLayout + Pretext', TOTAL_W / 2, 40);

  ctx.fillStyle = PAL.textLight;
  ctx.font = '18px -apple-system, sans-serif';
  ctx.fillText('多语言精确文本测量与自动换行演示', TOTAL_W / 2, 72);
}

function drawCard(x, y, w, h, title, subtitle, langCode) {
  const color = LANG_COLORS[langCode] || LANG_COLORS.mixed;

  // 卡片背景
  ctx.fillStyle = PAL.card;
  roundRect(x, y, w, h, 8);
  ctx.fill();

  // 边框
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(x, y, w, h, 8);
  ctx.stroke();

  // 语言名称
  ctx.fillStyle = color;
  ctx.font = 'bold 16px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, x + 16, y + 24);

  // 副标题
  ctx.fillStyle = PAL.textLight;
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillText(subtitle, x + 16, y + 42);

  return { x: x + 16, y: y + 55, w: w - 32 };
}

function renderLayout(layoutRoot, offsetX, offsetY, langCode) {
  function visit(node, px, py) {
    const cr = node.contentRect;
    const bm = node.boxModel;
    const cs = node.computedStyle;
    const x = px + cr.x - bm.paddingLeft;
    const y = py + cr.y - bm.paddingTop;

    // 文本渲染
    if (node.lineBoxes && node.lineBoxes.length > 0) {
      ctx.fillStyle = cs.color || '#1a1a1a';
      const fontSize = Math.max(cs.fontSize || 14, 15);
      ctx.font = `${cs.fontStyle || 'normal'} ${cs.fontWeight || 400} ${fontSize}px -apple-system, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      const cx = x + bm.paddingLeft;
      const cy = y + bm.paddingTop;

      // 绘制每一行文本
      node.lineBoxes.forEach((line, lineIndex) => {
        if (line && line.fragments && line.fragments.length > 0) {
          const baselineY = py + cr.y + line.y + line.baseline;
          const firstFragX = line.fragments[0].x;

          // 行号
          ctx.fillStyle = LANG_COLORS[langCode] || LANG_COLORS.mixed;
          ctx.font = 'bold 11px "SF Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`Line ${lineIndex + 1}`, px + cr.x + firstFragX - 10, baselineY);

          // 文本内容
          ctx.fillStyle = '#1a1a1a';
          ctx.font = `${cs.fontStyle || 'normal'} ${cs.fontWeight || 400} ${fontSize}px -apple-system, "Noto Sans", "PingFang SC", "Microsoft YaHei", sans-serif`;
          ctx.textAlign = 'left';

          line.fragments.forEach(frag => {
            ctx.fillText(frag.text, px + cr.x + frag.x, baselineY);
          });
        }
      });

      // 显示总行数
      ctx.fillStyle = LANG_COLORS[langCode] || LANG_COLORS.mixed;
      ctx.font = 'bold 12px "SF Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${node.lineBoxes.length} lines`, x + cr.width - bm.paddingRight - 10, y + cr.height - 10);
    }

    // 如果没有 lineBoxes，可能是纯文本节点，直接渲染
    if ((!node.lineBoxes || node.lineBoxes.length === 0) && node.type === 'text') {
      // 尝试从原始数据获取文本
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
//  真实多语言文本内容 - 长文本展示换行效果
// ============================================================

const languages = [
  {
    code: 'zh',
    name: '简体中文',
    subtitle: '技术文档长文本',
    content: 'PureLayout 是一个纯 JavaScript/TypeScript CSS 布局计算引擎，它将浏览器的 CSS Block、Inline 和 Flexbox 布局能力从浏览器中拆解出来，变成了一个独立的 TypeScript 库。这意味着您可以在服务端渲染 SSR、PDF 生成、Canvas 绘图、命令行工具等任何有 JavaScript 运行时的环境中精确计算 CSS 布局。PureLayout 完整支持 CSS 盒模型、Margin Collapse、Flexbox 布局、Inline 文本排列、软换行等特性，并且通过 Pretext 可以实现精确的文本测量，支持中文、英文、日文、韩文、阿拉伯文、俄文等多种语言的精确布局计算。PureLayout 的设计理念是不绑定渲染目标，输出纯数据结构，您可以渲染到任何目标。'
  },
  {
    code: 'en',
    name: 'English',
    subtitle: 'Technical Documentation',
    content: 'PureLayout is a pure JavaScript/TypeScript CSS layout engine that extracts the CSS Block, Inline, and Flexbox layout capabilities from the browser, making it an independent TypeScript library. This means you can precisely calculate CSS layouts in any JavaScript runtime environment, including server-side rendering (SSR), PDF generation, Canvas drawing, and command-line tools. PureLayout fully supports the CSS box model, margin collapse, Flexbox layout, inline text arrangement, soft line wrapping, and more. With Pretext integration, it achieves precise text measurement and supports accurate layout calculation for multiple languages including Chinese, English, Japanese, Korean, Arabic, Russian, and many more.'
  },
  {
    code: 'ja',
    name: '日本語',
    subtitle: '技術ドキュメント',
    content: 'PureLayoutは純粋なJavaScript/TypeScript CSSレイアウトエンジンです。ブラウザのCSS Block、Inline、Flexboxのレイアウト機能を抽出し、独立したTypeScriptライブラリにしました。これにより、サーバーサイドレンダリング（SSR）、PDF生成、Canvas描画、コマンドラインツールなど、JavaScriptランタイムが動作する任意の環境で、CSSレイアウトを正確に計算できます。PureLayoutはCSSボックスモデル、マージンの相殺、Flexboxレイアウト、インラインテキスト配置、ソフト改行などを完全にサポートしています。Pretextとの統合により、正確なテキスト測定を実現し、中国語、英語、日本語、韓国語、アラビア語、ロシア語など、多言語の正確なレイアウト計算をサポートします。'
  },
  {
    code: 'ko',
    name: '한국어',
    subtitle: '기술 문서',
    content: 'PureLayout은 순수 JavaScript/TypeScript CSS 레이아웃 엔진입니다. 브라우저의 CSS Block, Inline, Flexbox 레이아웃 기능을 추출하여 독립적인 TypeScript 라이브러리로 만들었습니다. 이를 통해 서버 사이드 렌더링(SSR), PDF 생성, Canvas 그리기, 명령줄 도구 등 JavaScript 런타임이 작동하는 모든 환경에서 CSS 레이아웃을 정확하게 계산할 수 있습니다. PureLayout은 CSS 박스 모델, 마진 축소, Flexbox 레이아웃, 인라인 텍스트 배열, 소프트 줄바꿈 등을 완전히 지원합니다. Pretext와의 통합을 통해 정확한 텍스트 측정을 구현하고, 중국어, 영어, 일본어, 한국어, 아랍어, 러시아어 등 다양한 언어의 정확한 레이아웃 계산을 지원합니다.'
  },
  {
    code: 'ar',
    name: 'العربية',
    subtitle: 'التوثيق التقني',
    content: 'PureLayout هو محرك تخطيط CSS خالص بلغة JavaScript/TypeScript. يستخرج قدرات تخطيط CSS Block و Inline و Flexbox من المتصفح، مما يجعله مكتبة TypeScript مستقلة. هذا يعني أنه يمكنك حساب تخطيط CSS بدقة في أي بيئة تشغيل JavaScript، بما في ذلك عرض جانبي للخادم (SSR)، وإنشاء ملفات PDF، ورسم Canvas، وأدوات سطر الأوامر. يدعم PureLayout نموذج مربع CSS، وتقليل الهوامش، وتخطيط Flexbox، وترتيب النص المضمن، والتفاف الناعم للنصوص، والمزيد. من خلال التكامل مع Pretext، يحقق قياسًا دقيقًا للنصوص ويدعم حساب التخطيط الدقيق للغات المتعددة.'
  },
  {
    code: 'ru',
    name: 'Русский',
    subtitle: 'Техническая документация',
    content: 'PureLayout — это чистый движок CSS-верстки на JavaScript/TypeScript. Он извлекает возможности верстки CSS Block, Inline и Flexbox из браузера, делая их независимой библиотекой TypeScript. Это означает, что вы можете точно рассчитывать CSS-верстку в любой среде выполнения JavaScript, включая серверный рендеринг (SSR), генерацию PDF, рисование на Canvas и инструменты командной строки. PureLayout полностью поддерживает блочную модель CSS, схлопывание полей, Flexbox-верстку, расположение встроенного текста, мягкий перенос строк и многое другое. Благодаря интеграции с Pretext достигается точное измерение текста и поддержка точного расчета верстки для множества языков, включая китайский, английский, японский, корейский, арабский, русский и другие.'
  },
  {
    code: 'mixed',
    name: '混合语言',
    subtitle: 'Multilingual Content',
    content: 'PureLayout是一个pure JS/TS CSS布局引擎，它将浏览器的CSS Block、Inline和Flexbox布局能力从浏览器中拆解出来。PureLayout is a pure JavaScript/TypeScript CSS layout engine that extracts CSS Block, Inline, and Flexbox layout capabilities from the browser. PureLayoutは純粋なJavaScript/TypeScript CSSレイアウトエンジンです。PureLayout은 순수 JavaScript/TypeScript CSS 레이아웃 엔진입니다.这意味着您可以在服务端渲染SSR、PDF生成、Canvas绘图等任何有JavaScript运行时的环境中精确计算CSS布局。This means you can precisely calculate CSS layouts in any JavaScript runtime environment.これにより、サーバーサイドレンダリング、PDF生成、Canvas描画など、JavaScriptランタイムが動作する任意の環境で、CSSレイアウトを正確に計算できます。'
  }
];

// ============================================================
//  主渲染流程
// ============================================================

drawBackground();
drawHeader();

// 场景配置 - 每页2列，3行
const cardW = 550;
const cardH = 550;
const gapX = 40;
const gapY = 40;

const positions = [
  { x: PAD, y: HEADER_H + PAD },
  { x: PAD + cardW + gapX, y: HEADER_H + PAD },
  { x: PAD, y: HEADER_H + PAD + cardH + gapY },
  { x: PAD + cardW + gapX, y: HEADER_H + PAD + cardH + gapY },
  { x: PAD, y: HEADER_H + PAD + (cardH + gapY) * 2 },
  { x: PAD + cardW + gapX, y: HEADER_H + PAD + (cardH + gapY) * 2 },
  { x: PAD, y: HEADER_H + PAD + (cardH + gapY) * 3 },
];

languages.forEach((lang, index) => {
  const pos = positions[index];
  if (!pos) return;

  const { x: sx, y: sy, w: sw } = drawCard(
    pos.x, pos.y, cardW, cardH,
    lang.name, lang.subtitle, lang.code
  );

  const tree = div({
    width: px(sw),
    fontSize: 15,
    lineHeight: 1.8,
  }, [
    p(lang.content),
  ]);

  const result = layout(tree, {
    containerWidth: sw,
    textMeasurer: measurer,
  });

  renderLayout(result.root, sx, sy, lang.code);
});

// 页脚说明
ctx.fillStyle = PAL.textLight;
ctx.font = '14px -apple-system, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('每种语言显示长文本，左侧显示行号，右侧显示总行数，清晰展示自动换行效果',
  TOTAL_W / 2, TOTAL_H - 50);

ctx.fillStyle = PAL.accent;
ctx.font = 'bold 14px -apple-system, sans-serif';
ctx.fillText('Pretext 精确测量文本宽度，实现智能换行，支持中文、英文、日文、韩文、阿拉伯文、俄文等多种语言',
  TOTAL_W / 2, TOTAL_H - 28);

// 输出
const outPath = new URL('demo-multilang.png', import.meta.url).pathname;
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log(`Multilingual Demo rendered: ${outPath} (${TOTAL_W}x${TOTAL_H})`);
console.log(`  Pretext Available: ${measurer.isPretextAvailable ? 'Yes ✓' : 'No (using fallback)'}`);
console.log(`  Canvas Available: ${measurer.isCanvasAvailable ? 'Yes ✓' : 'No (using fallback)'}`);
console.log('');
console.log('支持的语言：');
languages.forEach(lang => {
  console.log(`  ${lang.name} - ${lang.subtitle}`);
});
