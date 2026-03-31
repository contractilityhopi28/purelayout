/**
 * Flexbox 核心算法 — 分配剩余/溢出空间
 *
 * 对应规范 Section 11 "Resolving Flexible Lengths"
 */
import type { FlexItemState, FlexContext } from './types.js';

/**
 * 对一行 flex items 执行弹性长度解析
 */
export function resolveFlexibleLengths(
  items: FlexItemState[],
  containerMainSize: number,
  gapMain: number,
): void {
  if (items.length === 0) return;

  // 计算 gap 占用
  const totalGap = Math.max(0, items.length - 1) * gapMain;

  // 计算 used space = sum of outer hypothetical main sizes
  let usedSpace = totalGap;
  for (const item of items) {
    usedSpace += item.outerHypotheticalMainSize;
  }

  // 初始 free space
  const initialFreeSpace = containerMainSize - usedSpace;

  // 如果容器 main size 不确定（Infinity），不进行 grow/shrink
  if (!isFinite(containerMainSize)) {
    for (const item of items) {
      item.targetMainSize = item.hypotheticalMainSize;
      item.frozen = true;
    }
  } else if (initialFreeSpace > 0) {
    // 有剩余空间 → grow
    // 先处理 margin auto
    const autoMargins = distributeAutoMargins(items, initialFreeSpace);
    const freeSpace = initialFreeSpace - autoMargins;
    if (freeSpace > 0) {
      resolveGrowing(items, freeSpace);
    }
  } else if (initialFreeSpace < 0) {
    // 空间不足 → shrink
    resolveShrinking(items, Math.abs(initialFreeSpace));
  } else {
    // 恰好填满
    for (const item of items) {
      item.targetMainSize = item.hypotheticalMainSize;
      item.frozen = true;
    }
  }

  // 设置最终 main size
  for (const item of items) {
    item.mainSize = clampMainSize(item, item.targetMainSize);
  }
}

function distributeAutoMargins(items: FlexItemState[], freeSpace: number): number {
  let autoStartCount = 0;
  let autoEndCount = 0;

  for (const item of items) {
    if (item.mainAutoMarginStart) autoStartCount++;
    if (item.mainAutoMarginEnd) autoEndCount++;
  }

  if (autoStartCount === 0 && autoEndCount === 0) return 0;

  const autoMargin = freeSpace / (autoStartCount + autoEndCount);

  for (const item of items) {
    if (item.mainAutoMarginStart) {
      item.mainMarginStart = autoMargin;
      item.frozen = true;
    }
    if (item.mainAutoMarginEnd) {
      item.mainMarginEnd = autoMargin;
      item.frozen = true;
    }
  }

  return autoMargin * (autoStartCount + autoEndCount);
}

function resolveGrowing(items: FlexItemState[], freeSpace: number): void {
  // 总 flex-grow
  let totalGrow = 0;
  for (const item of items) {
    if (!item.frozen && item.flexGrow > 0) {
      totalGrow += item.flexGrow;
    }
  }

  if (totalGrow === 0) {
    // 没有 grow → 使用 hypothetical main size
    for (const item of items) {
      if (!item.frozen) {
        item.targetMainSize = item.hypotheticalMainSize;
        item.frozen = true;
      }
    }
    return;
  }

  // 循环冻结
  let iterations = 0;
  const maxIterations = items.length + 1;

  while (iterations < maxIterations) {
    iterations++;
    let remainingGrow = 0;
    let unfrozenCount = 0;

    for (const item of items) {
      if (item.frozen) continue;
      remainingGrow += item.flexGrow;
      unfrozenCount++;
    }

    if (unfrozenCount === 0) break;

    // 分配空间
    let distributed = 0;
    for (const item of items) {
      if (item.frozen) continue;
      const ratio = item.flexGrow / remainingGrow;
      const added = freeSpace * ratio;
      item.targetMainSize = item.flexBaseSize + added;
      distributed += added;
    }

    // 检查 max 约束违规
    let violations = false;
    for (const item of items) {
      if (item.frozen) continue;
      if (item.targetMainSize > item.maxMainSize && item.maxMainSize < Infinity) {
        violations = true;
      }
    }

    if (!violations) {
      // 无违规 → 全部冻结
      for (const item of items) {
        if (!item.frozen) item.frozen = true;
      }
      break;
    }

    // 冻结违规项
    let clampedSpace = 0;
    for (const item of items) {
      if (item.frozen) continue;
      if (item.targetMainSize > item.maxMainSize && item.maxMainSize < Infinity) {
        clampedSpace += item.targetMainSize - item.maxMainSize;
        item.targetMainSize = item.maxMainSize;
        item.frozen = true;
      }
    }
    freeSpace -= clampedSpace;
  }
}

function resolveShrinking(items: FlexItemState[], overflow: number): void {
  // 总 scaled flex-shrink factor
  let totalScaledFactor = 0;
  for (const item of items) {
    if (!item.frozen && item.flexShrink > 0) {
      totalScaledFactor += item.flexShrink * item.flexBaseSize;
    }
  }

  if (totalScaledFactor === 0) {
    for (const item of items) {
      if (!item.frozen) {
        item.targetMainSize = item.hypotheticalMainSize;
        item.frozen = true;
      }
    }
    return;
  }

  let iterations = 0;
  const maxIterations = items.length + 1;

  while (iterations < maxIterations) {
    iterations++;
    let remainingScaledFactor = 0;

    for (const item of items) {
      if (item.frozen) continue;
      remainingScaledFactor += item.flexShrink * item.flexBaseSize;
    }

    if (remainingScaledFactor === 0) break;

    let violations = false;
    for (const item of items) {
      if (item.frozen) continue;
      const ratio = (item.flexShrink * item.flexBaseSize) / remainingScaledFactor;
      const shrunk = overflow * ratio;
      item.targetMainSize = item.flexBaseSize - shrunk;

      if (item.targetMainSize < item.minMainSize) {
        violations = true;
      }
    }

    if (!violations) {
      for (const item of items) {
        if (!item.frozen) item.frozen = true;
      }
      break;
    }

    let clampedOverflow = 0;
    for (const item of items) {
      if (item.frozen) continue;
      if (item.targetMainSize < item.minMainSize) {
        clampedOverflow += item.minMainSize - item.targetMainSize;
        item.targetMainSize = item.minMainSize;
        item.frozen = true;
      }
    }
    overflow -= clampedOverflow;
  }
}

function clampMainSize(item: FlexItemState, size: number): number {
  let clamped = Math.max(size, item.minMainSize);
  if (item.maxMainSize < Infinity) {
    clamped = Math.min(clamped, item.maxMainSize);
  }
  return clamped;
}
