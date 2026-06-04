# 视口适配与无滚动条规则

生成的大屏必须在当前浏览器视口中居中显示完整内容，不允许出现横向或纵向滚动条。

## 根容器规则

设计画布使用固定逻辑尺寸，例如 `1920x1080`。根容器必须用视口等比缩放居中：

```css
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

.screen-root {
  position: fixed;
  left: 50%;
  top: 50%;
  width: var(--screen-w, 1920px);
  height: var(--screen-h, 1080px);
  transform: translate(-50%, -50%) scale(var(--screen-scale, 1));
  transform-origin: center center;
  overflow: hidden;
}
```

`scale` 必须按以下方式计算：

```text
scale = min(viewportWidth / screenWidth, viewportHeight / screenHeight)
```

## 生成要求

- 所有绝对布局都发生在 `.screen-root` 设计画布内。
- 不要用 body 滚动来显示溢出内容。
- 内容超出时必须回到布局阶段调整：减少首屏模块、合并主题、使用页签/轮播/下钻，而不是允许滚动条。
- 背景、TopNav、Shell、图表和 DOM 列表都必须位于 `.screen-root` 内部。

## 卡片内容适配规则

页面无滚动条不等于卡片内容已适配。每个 CardShell/PanelShell 都必须先读取 `adaptation.contentSlot` 或声明的 content slot，按真实内容区尺寸生成内部内容。

生成前必须计算：

```text
contentWidth = shellWidth - contentSlot.left - contentSlot.right
contentHeight = shellHeight - contentSlot.top - contentSlot.bottom
```

不同内容类型的处理：

- KPI：根据指标数量、行列布局、数字字号和 label 高度估算最小高度；放不下时减少单卡数据项、改用更紧凑 KPI 样式或合并到页签，不得裁切。
- ECharts：图表高度必须小于等于 contentHeight，legend、axisLabel、grid padding 都要计入；饼图/环图/仪表盘必须在 content slot 内居中缩放，不允许被外壳截断。
- 表格/列表/排行/告警：按 `rowHeight`、header 高度和 gap 计算可显示行数；超出时减少首屏行数、分页、页签或轮播，不得用滚动条、裁切或省略作为交付结果。
- 复合模块：先保证主内容完整，再压缩辅助说明、图例、间距和次级文本。

如果内容最小高度超过当前卡片 content slot，必须回到布局阶段处理：

```text
1. 按卡片框缩小图表/列表/KPI 内部高度和间距；
2. 仍不满足时增加该模块高度或减少同区模块数量；
3. 仍不满足时把低优先级内容放入页签、轮播、弹窗或下钻；
4. 禁止通过 overflow:hidden、clip、ellipsis 或页面滚动掩盖问题。
```

## 模块间距与碰撞规则

生成坐标时必须把 layout `canvas.gap` 作为相邻业务模块的最小逻辑间距。1920x1080 默认最小值为 16px；如果所选 Shell 有明显外发光、角标、连接线或视觉外扩，实际观感间距应提高到 20-24px。

硬规则：

- 任意两个可见 `.module` / `.screen-card` 的矩形不得重叠。
- 同一行相邻模块：`next.left - current.right >= gap`。
- 同一列相邻模块：`next.top - current.bottom >= gap`。
- 左右栏与 `PrimarySlot` 之间也必须保留 gap，不允许共用边界。
- 顶部 KPI 或摘要卡不能为了铺满宽度而把相邻卡片写成 `right === next.left`。
- 如果为了满足最小间距导致空间不足，必须先缩小模块宽高、合并低优先级模块、减少首屏模块或改用页签/轮播，不得牺牲模块间距。

## 自检

生成后必须检查：

```js
document.documentElement.scrollWidth <= window.innerWidth
document.documentElement.scrollHeight <= window.innerHeight
document.body.scrollWidth <= window.innerWidth
document.body.scrollHeight <= window.innerHeight
```

如果任一条件失败，必须调整布局或缩放实现，不能交付有滚动条的大屏。

同时必须检查模块几何：

```js
function assertModuleGap(root, gap) {
  const cards = [...root.querySelectorAll(".module, .screen-card")]
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { el, left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    });
  for (let i = 0; i < cards.length; i += 1) {
    for (let j = i + 1; j < cards.length; j += 1) {
      const a = cards[i];
      const b = cards[j];
      const xOverlap = Math.min(a.right, b.right) > Math.max(a.left, b.left);
      const yOverlap = Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top);
      if (xOverlap && yOverlap) return false;
      if (yOverlap) {
        const horizontalGap = Math.max(b.left - a.right, a.left - b.right);
        if (horizontalGap >= 0 && horizontalGap < gap) return false;
      }
      if (xOverlap) {
        const verticalGap = Math.max(b.top - a.bottom, a.top - b.bottom);
        if (verticalGap >= 0 && verticalGap < gap) return false;
      }
    }
  }
  return true;
}
```

如果 `assertModuleGap(root, gap)` 失败，必须调整模块坐标后重新截图验证。

还必须检查卡片内部内容：

```js
function assertCardContentFit(root) {
  const nodes = [
    ...root.querySelectorAll('[data-slot="content"], .panel-body, .card-body, .chart-wrap, .table-wrap, .kpi-card')
  ];
  return nodes.every((el) => {
    const style = getComputedStyle(el);
    const allowVisualOverflow = el.dataset.allowVisualOverflow === "true";
    if (allowVisualOverflow) return true;
    return el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1;
  });
}
```

如果 `assertCardContentFit(root)` 失败，必须调整模块内容、卡片高度或槽位分配后重新验证，不能交付被截断的图表、KPI、列表或文字。
