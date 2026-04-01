# 告别浏览器DOM！PureLayout：纯JS/TS布局引擎，让你的CSS在任何环境“起飞”

大家好，我是你们的老朋友，**peterfei**，一名热衷于探索前端技术前沿的博主。今天，我将为大家带来一个足以颠覆你对前端布局认知的“黑科技”项目——`PureLayout`。它不再满足于在浏览器DOM的“围墙”内施展CSS布局魔法，而是将其核心能力彻底“剥离”出来，让你的CSS布局在任何JavaScript环境中都能精准计算、完美呈现！

## 前端布局的“阿喀琉斯之踵”：浏览器DOM的束缚

长久以来，我们前端开发者习惯了将CSS布局视为浏览器DOM的专属能力。当我们需要进行页面布局时，通常依赖于浏览器引擎的渲染管线：解析HTML和CSS，构建DOM树和CSSOM树，然后进行布局计算，最后绘制到屏幕上。

然而，这种基于浏览器DOM的布局方式，在面对一些新兴场景和性能挑战时，却显得力不从心：

1.  **服务端渲染 (SSR) 的布局难题**：为了优化首屏加载性能和SEO，SSR日益普及。但在Node.js环境中，我们无法直接获得浏览器DOM的布局能力。开发者常常需要依赖`jsdom`等模拟库，或者手动计算样式，不仅性能开销大，还难以保证与浏览器环境的高度一致性。
2.  **Web Worker 的“布局隔离”**：Web Worker的出现，让前端的复杂计算得以在独立线程中运行，避免阻塞主线程。但Worker中无法直接访问DOM，这意味着复杂的布局计算无法在Worker中进行，依旧需要将数据传回主线程处理，失去了Worker的性能优势。
3.  **Canvas、PDF等非DOM渲染目标**：当我们需要将HTML/CSS内容渲染到Canvas画布、生成离线PDF文档，或者在其他非标准渲染环境下展示时，CSS的强大布局能力便无处施展，开发者不得不从头实现一套复杂的布局算法，耗时耗力且容易出错。
4.  **性能瓶颈与“回流重绘”**：即便是在浏览器环境中，频繁的DOM操作和布局计算（即“回流”）也是导致页面卡顿的主要原因之一。如果能将部分布局计算前置或转移到更合适的时机和环境，无疑能大幅提升用户体验。

正是为了解决这些痛点，一个大胆而富有远见的项目应运而生——`PureLayout`。

## `PureLayout` 是什么？前端布局的“瑞士军刀”！

简单来说，`PureLayout` 是一个 **纯 JavaScript/TypeScript 实现的 CSS 布局计算引擎**。它将浏览器中负责 **CSS Block + Inline + Flexbox 布局** 的核心算法和能力，优雅地抽取出来，形成了一个完全独立的、零运行时依赖的库。

这就像是有人把汽车引擎从整车中拆卸出来，并进行了精密的封装，让这个引擎可以在任何需要动力的场景下被灵活运用，而不再受限于必须是“一辆汽车”。

**所以，`PureLayout` 能做什么？**

*   **SSR 环境下的精准布局**：在Node.js中无缝计算CSS布局，生成更精准的HTML结构，提升SSR体验。
*   **Web Worker 里的“无感”布局**：将复杂的布局计算任务转移到Worker线程，释放主线程压力，保持页面流畅。
*   **Canvas、PDF 生成的“福音”**：无需重新造轮子，直接利用`PureLayout`的CSS布局能力，高效准确地在这些非DOM环境中绘制内容。
*   **构建完整的“无浏览器渲染管线”**：正如`Pretext`（另一个优秀项目，将文本测量从DOM中拆出）解决了文本测量问题，`PureLayout`则解决了布局计算问题。两者结合，你可以构建一个完全不依赖浏览器DOM的渲染管线，潜力无限！

## 深入解析 `PureLayout` 的“黑科技”：浏览器级布局算法的完美复刻

`PureLayout` 的核心竞争力，在于它对浏览器CSS布局算法的深度理解和精准复刻。它不仅仅是一个简单的样式计算器，更是一个包含了完整CSS盒模型、级联、继承以及复杂布局规则的微型布局引擎。

### 1. 布局模型全覆盖：Block、Inline、Flexbox 无所不能

`PureLayout` 在布局能力上毫不妥协，涵盖了前端最常用的三大布局模型：

*   **Block 布局的精髓**：
    *   **BFC (块格式化上下文) 创建**：精确模拟了`overflow`非`visible`、`display: inline-block`等条件下的BFC创建机制。
    *   **Normal Flow (常规流)**：块级元素垂直堆叠，自动宽度占据包含块。
    *   **Margin Collapse (外边距合并)**：完美处理了兄弟元素、父子元素、空元素等各种复杂场景下的外边距合并规则（正负值合并、混合合并等）。
    *   **Clearance (清除浮动)**：预留了接口以支持未来更完整的浮动处理。
*   **Flexbox 布局的艺术**：
    *   `PureLayout` 完整实现了 **Flex Formatting Context (FFC) 的 11 步算法**，这意味着你可以在非浏览器环境中享受到与CSS Flexbox完全一致的强大布局能力。
    *   支持 `flex-direction` (row/column/reverse)、`flex-wrap` (wrap/wrap-reverse)、`justify-content` (6种对齐模式)、`align-items` / `align-self` / `align-content` (stretch自动拉伸、多行对齐)、`flex-grow` / `flex-shrink` / `flex-basis` (空间分配算法)、`order` 属性重排，以及 `gap` / `row-gap` / `column-gap` 间距控制。
    *   这意味着，无论是复杂的卡片布局、响应式网格，还是动态调整的组件排列，`PureLayout` 都能为你提供精准的Flexbox计算结果。

<p align="center">
  <img src="https://raw.githubusercontent.com/peterfei/purelayout/main/demos/demo-flexbox.png" alt="PureLayout Flexbox 高级特性展示 — 12 个布局场景" width="680" />
</p>

*   **Inline 布局的细腻**：
    *   **Line Box (行框)**：基于`font metrics` (ascent/descent) 精心构建行框，确保文本排版的准确性。
    *   **软换行**：支持中文、日文、韩文（CJK）字符间的自然断点，以及通过`word-break` / `overflow-wrap` 对换行行为的精细控制。
    *   **空白处理**：完整模拟`white-space`的五种模式，包括`normal`、`nowrap`、`pre`、`pre-wrap`、`pre-line`，让文本显示与浏览器无异。

### 2. CSS 级联、继承与盒模型的精妙处理

`PureLayout` 不仅停留在布局算法层面，它还深入模拟了CSS的解析与计算机制：

*   **样式级联与继承**：它实现了一套完整的样式级联算法，确保样式的优先级和继承规则与浏览器一致。
*   **UA 默认样式**：内置了`div`, `p`, `h1`-`h6`, `span`, `ul`, `li`等常见HTML元素的浏览器默认样式，让你的布局从一开始就具备“浏览器基因”。
*   **盒模型精确计算**：`margin`、`padding`、`border`、`box-sizing`（`content-box`和`border-box`）的计算都达到了像素级的准确度。
*   **CSS 值工厂函数**：提供了`px()`、`pct()`、`em()`、`rem()`等便捷函数，简化了在JavaScript中定义CSS样式的繁琐。

### 3. 可插拔的文本测量器：灵活性与精度兼备

文本测量是布局计算中不可或缺的一环。`PureLayout` 设计了可插拔的`TextMeasurer`接口，提供了两种开箱即用的实现：

*   **`FallbackMeasurer`**：基于字符宽度估算，无需额外依赖，轻量快速，适用于对精度要求不那么极致的场景。
*   **`CanvasMeasurer`**：利用Node.js的`canvas`包（需安装），通过实际绘制测量，精度更高，适用于需要精确文本布局的场景。

这种设计确保了`PureLayout`在不同环境下都能找到最佳的文本测量方案。

## 保真度：`PureLayout` 的“质量保证书”

一个脱离浏览器运行的布局引擎，其最重要的指标就是 **保真度**——即与真实浏览器渲染结果的一致性。`PureLayout` 在这方面做得非常出色，它建立了一套严苛的 **差分测试框架** 来持续监控和保障布局结果的准确性。

*   **原理**：`PureLayout` 通过 `Playwright` 工具，在真实的浏览器环境中渲染测试用例，并精确采集其`x`、`y`、`width`、`height`等布局数据作为 **Ground Truth (基准数据)**。随后，`PureLayout` 会对相同的输入数据进行布局计算，并将自己的计算结果与基准数据进行逐像素对比。
*   **惊人的100%保真度**：目前，`PureLayout` 的差分测试覆盖了Block、Inline、Box Model、Flex四大分类共 **48个HTML测试用例**。在这 **336项对比 (x/y/width/height)** 中，`PureLayout` 取得了 **100%的通过率**！这充分证明了它在核心布局算法上与浏览器的高度一致性。
*   **丰富的测试场景**：测试用例涵盖了从`margin-collapse`的各种复杂情况、`flex-grow`/`shrink`的弹性分配、`line-box`的构建，到`box-sizing`的行为等，几乎涵盖了CSS布局中的所有“疑难杂症”。

这种对保真度的极致追求，让`PureLayout`不仅仅是一个概念验证，更是一个可以放心应用于生产环境的可靠工具。

## 快速上手 `PureLayout`：几行代码点亮你的布局引擎！

`PureLayout` 的使用方式非常直观简洁。你只需要定义一个类DOM的样式节点树，然后调用`layout`函数即可获得布局结果。

```typescript
import { layout, getBoundingClientRect, px, FallbackMeasurer } from 'purelayout';

// 1. 定义你的样式节点树 (类似虚拟DOM结构)
const tree = {
  tagName: 'div', // 标签名用于应用UA默认样式
  style: { width: px(400), backgroundColor: 'red' }, // 内联样式
  children: [
    {
      tagName: 'p',
      style: { marginTop: px(20), fontSize: px(16), color: 'white' },
      children: ['Hello World'], // 文本节点
    },
    {
      tagName: 'p',
      style: { marginTop: px(30), fontSize: px(16), color: 'white' },
      children: ['第二段文字，PureLayout真强大！'],
    },
  ],
};

// 2. 执行布局计算
const result = layout(tree, {
  containerWidth: 800, // 根节点的包含块宽度
  textMeasurer: new FallbackMeasurer(), // 指定文本测量器
});

// 3. 读取布局结果，获取每个节点的精确位置和尺寸
const rootNode = result.root;
console.log('根节点内容区域:', rootNode.contentRect);
// { x: 0, y: 0, width: 400, height: 79.2 } (示例值)

const firstParagraph = rootNode.children[0];
console.log('第一段落内容区域:', firstParagraph.contentRect);
// { x: 0, y: 20, width: 400, height: 19.2 } (示例值)

console.log('第一段落的getBoundingClientRect (包含margin):', getBoundingClientRect(firstParagraph));
// { x: 0, y: 20, width: 400, height: 39.2, top: 20, right: 400, bottom: 59.2, left: 0 } (示例值)

// LayoutNode 结构包含 contentRect (内容区域), boxModel (计算后的盒模型),
// computedStyle (计算后的完整样式), children (子布局节点), lineBoxes (行框),
// 以及 establishesBFC (是否创建BFC) 等丰富信息。
```

通过`layout`函数返回的`LayoutNode`对象，你可以获取到每个元素的`x`、`y`、`width`、`height`，以及完整的盒模型和计算样式。这些纯数据结构不绑定任何渲染目标，你可以轻松地将其应用到Canvas绘图、PDF坐标转换，甚至其他自定义渲染引擎中。

## `PureLayout` vs. `Yoga`：新旧交替，谁主沉浮？

提到非DOM布局引擎，不少人可能会想到Meta的`Yoga`。但通过对比，你会发现`PureLayout`在多个维度上展现出更强大的潜力和优势：

| 维度         | [Yoga (Meta)](https://github.com/facebook/yoga) | `PureLayout`                                    |
| :----------- | :--------------------------------------------- | :---------------------------------------------- |
| **布局模型** | **仅支持 Flexbox**                           | **Block + Inline + Flexbox 全覆盖**               |
| **CSS 解析** | 不解析CSS，需手动设置属性                       | **支持完整的级联、继承、UA默认值**                  |
| **实现语言** | C++主体，JS绑定                                | **纯 TypeScript**，零运行时依赖，易于集成             |
| **文本处理** | 不处理文本                                     | **内置文本测量接口 (Fallback + Canvas)**             |
| **目标场景** | React Native 跨平台 UI                         | SSR / PDF / Canvas / Worker 等多环境无头渲染      |
| **维护状态** | **已停止维护**                               | **活跃开发中**，拥有清晰的路线图                  |

`PureLayout` 的出现，不仅填补了`Yoga`在非Flexbox布局上的空白，还通过原生TypeScript实现提供了更友好的开发体验和更灵活的集成方式。最重要的是，`Yoga`的停止维护让`PureLayout`成为了当下最值得关注和投入的纯JS/TS布局解决方案。

## 未来展望与设计哲学

`PureLayout` 的路线图清晰而宏伟：在已经完善Block、Inline和Flexbox布局的基础上，它将逐步实现Grid布局、定位与浮动等更复杂的CSS特性。更令人期待的是，它计划提供`@purelayout/pdf`和`@purelayout/canvas`等适配器，进一步简化在特定渲染目标下的集成工作。

其设计哲学也值得我们深思：

1.  **不绑定渲染目标**：只输出纯粹的几何数据，让开发者拥有无限的渲染自由。
2.  **渐进式实现**：从核心布局模型逐步扩展，确保每一步的稳定性和高质量。
3.  **浏览器即真理**：通过持续的差分测试，不断向浏览器行为对齐，保证最高保真度。
4.  **零副作用**：不修改输入数据，可在任何JS环境中安全运行，包括Web Worker。

## 结语：开启前端布局新篇章！

`PureLayout` 不仅仅是一个库，它代表了前端在“无头渲染”和“跨环境布局”领域的一次重大突破。它将我们从浏览器DOM的束缚中解放出来，赋予前端开发者前所未有的布局控制力。

如果你正在寻找一个高性能、高保真度、零依赖的CSS布局计算引擎，无论你是要做SSR、生成PDF、在Canvas上绘制，还是在Web Worker中解放主线程，`PureLayout`都绝对值得你深入探索和尝试！

项目地址：https://github.com/peterfei/purelayout

希望这篇文章能帮助大家更好地理解`PureLayout`的价值和潜力。快去尝试一下，和我们一起开启前端布局的全新篇章吧！如果你有任何疑问或想法，欢迎在评论区与我交流。别忘了点赞、收藏和转发，让更多的小伙伴了解这个宝藏项目！
